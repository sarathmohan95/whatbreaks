/**
 * WhatBreaks Pre-Mortem Lambda Function
 * 
 * This Lambda function generates pre-mortem reports using Amazon Bedrock
 * and stores them in DynamoDB for history tracking.
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }));

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'whatbreaks-analyses';
const ENABLE_SAVE = process.env.ENABLE_SAVE === 'true';

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const httpMethod = event.requestContext?.http?.method || event.httpMethod;
    const path = event.requestContext?.http?.path || event.path || event.rawPath;

    // Route based on HTTP method and path
    if (httpMethod === 'POST' && path === '/premortem') {
      return await handleGeneratePreMortem(event);
    } else if (httpMethod === 'POST' && path === '/parse-iac') {
      return await handleParseIaC(event);
    } else if (httpMethod === 'GET' && path === '/reports') {
      return await handleListReports(event);
    } else if (httpMethod === 'GET' && path.startsWith('/reports/')) {
      return await handleGetReport(event);
    } else if (httpMethod === 'POST' && path === '/templates') {
      return await handleCreateTemplate(event);
    } else if (httpMethod === 'GET' && path === '/templates') {
      return await handleListTemplates(event);
    } else if (httpMethod === 'GET' && path.startsWith('/templates/')) {
      return await handleGetTemplate(event);
    } else if (httpMethod === 'PUT' && path.startsWith('/templates/')) {
      return await handleUpdateTemplate(event);
    } else if (httpMethod === 'DELETE' && path.startsWith('/templates/')) {
      return await handleDeleteTemplate(event);
    } else {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' }),
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};

async function handleGeneratePreMortem(event) {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  const { description, changeType, currentState, proposedState, trafficPatterns } = body;

  // Validate input
  if (!description || description.length < 50) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Description must be at least 50 characters' }),
    };
  }

  // Generate pre-mortem using Bedrock
  const preMortem = await generatePreMortem({
    description,
    changeType: changeType || 'infrastructure',
    currentState,
    proposedState,
    trafficPatterns,
  });

  // Save to DynamoDB if enabled
  if (ENABLE_SAVE) {
    try {
      await saveReport(preMortem);
      console.log('Report saved to DynamoDB:', preMortem.id);
    } catch (error) {
      console.error('Failed to save report to DynamoDB:', error);
      // Don't fail the request if save fails
      preMortem.saved = false;
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preMortem),
  };
}

async function handleListReports(event) {
  const queryParams = event.queryStringParameters || {};
  const limit = parseInt(queryParams.limit || '20', 10);
  const lastKey = queryParams.lastKey ? JSON.parse(decodeURIComponent(queryParams.lastKey)) : undefined;

  const params = {
    TableName: DYNAMODB_TABLE,
    IndexName: 'TimestampIndex',
    Limit: limit,
  };

  if (lastKey) {
    params.ExclusiveStartKey = lastKey;
  }

  // Use Scan instead of Query since we want all items sorted by timestamp
  const command = new ScanCommand(params);
  const result = await dynamoClient.send(command);

  // Sort by timestamp descending (newest first) since Scan doesn't guarantee order
  const sortedItems = (result.Items || []).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Return summary data only (not full reports)
  const reports = sortedItems.map(item => ({
    id: item.id,
    timestamp: item.timestamp,
    changeSummary: item.changeSummary,
    severity: item.parsedReport?.severity,
    duration: item.parsedReport?.duration,
    impact: item.parsedReport?.impact,
  }));

  const response = {
    reports,
    lastKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
    hasMore: !!result.LastEvaluatedKey,
  };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  };
}

async function handleGetReport(event) {
  const path = event.requestContext?.http?.path || event.path || event.rawPath;
  const id = path.split('/').pop();

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Report ID is required' }),
    };
  }

  const params = {
    TableName: DYNAMODB_TABLE,
    Key: { id },
  };

  const command = new GetCommand(params);
  const result = await dynamoClient.send(command);

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Report not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.Item),
  };
}

async function generatePreMortem(input) {
  const prompt = buildPreMortemPrompt(input);

  const params = {
    modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  };

  const command = new InvokeModelCommand(params);
  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  const fullReport = responseBody.content[0].text;
  const parsedReport = parseReport(fullReport);

  return {
    id: `pm-${Date.now()}`,
    timestamp: new Date().toISOString(),
    input,
    changeSummary: input.description.substring(0, 200),
    fullReport,
    parsedReport,
    metadata: {
      model: 'claude-3-5-sonnet',
      version: '1.0',
    },
  };
}

function parseReport(report) {
  const parsed = {};

  // Parse severity, duration, impact
  const severityMatch = report.match(/Severity:\s*(\w+)/i);
  const durationMatch = report.match(/Duration:\s*([^\n]+)/i);
  const impactMatch = report.match(/Impact:\s*([^\n]+)/i);

  if (severityMatch) parsed.severity = severityMatch[1];
  if (durationMatch) parsed.duration = durationMatch[1];
  if (impactMatch) parsed.impact = impactMatch[1];

  // Parse affected items
  const affectedSection = report.match(/Affected:([^#]*)/s);
  if (affectedSection) {
    parsed.affected = affectedSection[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^[\s-]+/, '').trim());
  }

  // Parse timeline
  const timelineMatches = report.matchAll(/T\+(\d+h:\d+m):\s*([^\n]+)/g);
  parsed.timeline = Array.from(timelineMatches).map(match => ({
    time: match[1],
    event: match[2].trim(),
    critical: match[2].toLowerCase().includes('fail') || match[2].toLowerCase().includes('logged out')
  }));

  // Parse preventive actions
  const highPriority = report.match(/High Priority[^:]*:([^]*?)(?:Medium Priority|Low Priority|Implementation|$)/s);
  const mediumPriority = report.match(/Medium Priority[^:]*:([^]*?)(?:Low Priority|Implementation|$)/s);
  const lowPriority = report.match(/Low Priority[^:]*:([^]*?)(?:Implementation|$)/s);

  parsed.preventiveActions = {
    high: highPriority ? extractListItems(highPriority[1]) : [],
    medium: mediumPriority ? extractListItems(mediumPriority[1]) : [],
    low: lowPriority ? extractListItems(lowPriority[1]) : []
  };

  // Parse risks
  parsed.risks = parseRisks(report);
  
  // Calculate overall risk score
  if (parsed.risks && parsed.risks.length > 0) {
    // Take average of top 3 risks
    const topRisks = parsed.risks
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3);
    parsed.overallRiskScore = Math.round(
      topRisks.reduce((sum, risk) => sum + risk.riskScore, 0) / topRisks.length
    );
    
    // Determine risk level
    if (parsed.overallRiskScore >= 76) {
      parsed.riskLevel = 'CRITICAL';
    } else if (parsed.overallRiskScore >= 51) {
      parsed.riskLevel = 'HIGH';
    } else if (parsed.overallRiskScore >= 26) {
      parsed.riskLevel = 'MODERATE';
    } else {
      parsed.riskLevel = 'LOW';
    }
  }

  return parsed;
}

function parseRisks(report) {
  const risks = [];
  
  console.log('Parsing risks from report...');
  
  // Try multiple patterns to be more flexible
  
  // Pattern 1: Strict format with RISK: prefix
  const strictPattern = /RISK:\s*(.+?)\s*\nDescription:\s*(.+?)\s*\nProbability:\s*(\d+)\s*\nImpact:\s*(\d+)\s*\nCategory:\s*(\w+)\s*\nMitigation:\s*(.+?)(?=\n\nRISK:|$)/gs;
  
  let match;
  let riskId = 1;
  while ((match = strictPattern.exec(report)) !== null) {
    const [, title, description, probability, impact, category, mitigation] = match;
    const prob = parseInt(probability, 10);
    const imp = parseInt(impact, 10);
    
    risks.push({
      id: `risk-${riskId++}`,
      title: title.trim(),
      description: description.trim(),
      probability: prob,
      impact: imp,
      riskScore: prob * imp,
      category: category.trim().toLowerCase(),
      mitigation: mitigation.trim()
    });
  }
  
  console.log(`Found ${risks.length} risks using strict pattern`);
  
  // If no risks found, try a more lenient pattern
  if (risks.length === 0) {
    console.log('Trying lenient pattern...');
    // Look for any section with Probability and Impact scores
    const lenientPattern = /(?:RISK|Risk):\s*(.+?)[\s\S]*?Probability:\s*(\d+)[\s\S]*?Impact:\s*(\d+)[\s\S]*?(?=(?:RISK|Risk):|##\s*\d+\.|$)/gi;
    
    while ((match = lenientPattern.exec(report)) !== null) {
      const [fullMatch, title, probability, impact] = match;
      const prob = parseInt(probability, 10);
      const imp = parseInt(impact, 10);
      
      // Extract description (text between title and Probability)
      const descMatch = fullMatch.match(/(?:RISK|Risk):\s*.+?\s+(.+?)(?=Probability:)/is);
      const description = descMatch ? descMatch[1].trim() : 'No description available';
      
      // Extract mitigation (text after Impact, but stop at next section or double newline)
      const mitigationMatch = fullMatch.match(/Impact:\s*\d+\s+(?:Mitigation[^:]*:)?\s*(.+?)(?=\n\n|##|\d+\.|$)/is);
      const mitigation = mitigationMatch ? mitigationMatch[1].trim() : 'See preventive actions';
      
      risks.push({
        id: `risk-${riskId++}`,
        title: title.trim(),
        description: description.substring(0, 500), // Limit length
        probability: prob,
        impact: imp,
        riskScore: prob * imp,
        category: 'technical',
        mitigation: mitigation.substring(0, 300) // Shorter limit for mitigation
      });
    }
    
    console.log(`Found ${risks.length} risks using lenient pattern`);
  }
  
  return risks;
}

function extractListItems(text) {
  return text
    .split('\n')
    .filter(line => line.trim().match(/^\d+\./))
    .map(line => line.replace(/^\d+\.\s*/, '').trim());
}

async function saveReport(report) {
  const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days from now

  const item = {
    ...report,
    userId: 'anonymous', // Future: get from auth
    ttl,
  };

  const params = {
    TableName: DYNAMODB_TABLE,
    Item: item,
  };

  const command = new PutCommand(params);
  await dynamoClient.send(command);
}

// ============================================================================
// IAC PARSING
// ============================================================================

async function handleParseIaC(event) {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  const { fileContent, fileType } = body;

  // Validate input
  if (!fileContent || !fileType) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields: fileContent, fileType' }),
    };
  }

  if (!['terraform', 'cloudformation'].includes(fileType)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid fileType. Must be "terraform" or "cloudformation"' }),
    };
  }

  try {
    const analysis = await parseIaCFile(fileContent, fileType);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysis),
    };
  } catch (error) {
    console.error('Failed to parse IaC file:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to parse IaC file: ' + error.message }),
    };
  }
}

async function parseIaCFile(fileContent, fileType) {
  const prompt = buildIaCParsingPrompt(fileContent, fileType);

  const params = {
    modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more accurate parsing
    }),
  };

  const command = new InvokeModelCommand(params);
  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  const analysisText = responseBody.content[0].text;
  const parsed = parseIaCAnalysis(analysisText);

  return parsed;
}

function buildIaCParsingPrompt(fileContent, fileType) {
  return `You are an expert infrastructure engineer analyzing ${fileType === 'terraform' ? 'Terraform' : 'CloudFormation'} code.

${fileType === 'terraform' ? 'TERRAFORM PLAN:' : 'CLOUDFORMATION TEMPLATE:'}
\`\`\`json
${fileContent}
\`\`\`

Analyze this infrastructure code and provide a structured analysis.

CRITICAL: Return ONLY valid JSON. Ensure all string values properly escape special characters:
- Use \\n for newlines
- Use \\" for quotes
- Use \\\\ for backslashes

Return this exact JSON structure:

\`\`\`json
{
  "summary": {
    "totalResources": <number>,
    "toCreate": <number>,
    "toModify": <number>,
    "toDestroy": <number>,
    "resourceTypes": ["list", "of", "resource", "types"]
  },
  "resources": [
    {
      "type": "aws_s3_bucket",
      "name": "data-bucket",
      "action": "create",
      "keyAttributes": {
        "bucket": "my-data-bucket",
        "versioning": true
      }
    }
  ],
  "securityIssues": [
    {
      "severity": "HIGH",
      "resource": "aws_s3_bucket.data",
      "issue": "Bucket encryption not enabled",
      "recommendation": "Enable AES-256 or KMS encryption"
    }
  ],
  "dependencies": [
    {
      "from": "aws_lambda_function.processor",
      "to": "aws_s3_bucket.data",
      "type": "reads_from"
    }
  ],
  "description": "A comprehensive description (200+ words) including: CURRENT STATE (what exists now), PROPOSED CHANGES (what will be created/modified/destroyed with specific resource names and types), RESOURCE DETAILS (configurations, sizes, regions, AZs), DEPENDENCIES (how resources relate), TRAFFIC/LOAD (expected patterns), and POTENTIAL RISKS (obvious concerns). Be technical and thorough with specific details."
}
\`\`\`

Focus on:
1. What resources are being created, modified, or destroyed
2. Security concerns (encryption, public access, IAM permissions)
3. Dependencies between resources
4. Potential failure points
5. Impact on existing infrastructure
6. Scale and capacity considerations

IMPORTANT: 
- Return ONLY the JSON, no other text
- Ensure the description field is at least 200 words
- Properly escape all special characters in strings
- Use single-line strings (no actual newlines in JSON values)`;
}

function parseIaCAnalysis(analysisText) {
  // Try to extract JSON from code block first
  let jsonStr = null;
  
  // Look for JSON in code blocks
  const codeBlockMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  } else {
    // Fall back to finding any JSON object
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
  }
  
  if (!jsonStr) {
    throw new Error('Failed to parse IaC analysis - no JSON found in response');
  }

  try {
    // Clean up the JSON string to handle control characters
    // Replace unescaped newlines within strings with escaped newlines
    jsonStr = jsonStr.replace(/"description":\s*"([^"]*(?:\\.[^"]*)*)"/gs, (match, content) => {
      const cleaned = content
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ');
      return `"description": "${cleaned}"`;
    });
    
    // Do the same for other text fields
    jsonStr = jsonStr.replace(/"(issue|recommendation|mitigation)":\s*"([^"]*(?:\\.[^"]*)*)"/gs, (match, field, content) => {
      const cleaned = content
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ');
      return `"${field}": "${cleaned}"`;
    });
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Attempted to parse:', jsonStr.substring(0, 500));
    throw new Error('Failed to parse IaC analysis - invalid JSON: ' + error.message);
  }
}

function buildPreMortemPrompt(input) {
  return `You are a reliability engineering expert performing a pre-mortem analysis. 

CRITICAL INSTRUCTION: Analyze this infrastructure change and assess its actual risk level based on the configuration quality.

- If the configuration follows best practices (Multi-AZ, encryption, monitoring, proper sizing, etc.), assign MODERATE or LOW severity with realistic operational risks
- If the configuration has architectural flaws (single AZ, no encryption, hardcoded secrets, etc.), assign CRITICAL or MAJOR severity with catastrophic failure scenarios
- Be honest about the risk level - not everything will fail catastrophically

INFRASTRUCTURE CHANGE:
${input.description}

${input.currentState ? `CURRENT STATE:\n${input.currentState}\n` : ''}
${input.proposedState ? `PROPOSED STATE:\n${input.proposedState}\n` : ''}
${input.trafficPatterns ? `TRAFFIC PATTERNS:\n${input.trafficPatterns}\n` : ''}

Generate a detailed pre-mortem report with the following sections:

## 1. ASSUMED OUTCOME
Severity: [critical/major/moderate/low - BE REALISTIC based on actual configuration quality]
Duration: [specific duration - scale appropriately to severity]
Impact: [detailed impact description - proportional to actual risks present]

Affected:
- [List each affected system/service on its own line with a dash]
- [Only list systems that would ACTUALLY be affected given the configuration]
- [If well-architected, impact should be limited/contained]

## 2. TRIGGERING EVENT
[Describe a realistic failure scenario appropriate to the configuration quality:
- Well-architected configs: operational edge cases, timing issues, rare conditions
- Poorly-architected configs: common failures like AZ outages, traffic spikes, human errors]

## 3. HIDDEN DEPENDENCIES
[Identify dependencies that could cause issues:
- Well-architected: subtle interactions, configuration tuning needs
- Poorly-architected: obvious missing redundancy, single points of failure]

## 4. CASCADE TIMELINE
Provide a chronological timeline using this exact format:
T+0h:00m: [Event description]
T+0h:15m: [Event description]
T+1h:00m: [Event description]

[Timeline length should match severity - well-architected systems recover faster]

## 5. SYSTEM COUPLING
[Describe couplings and amplification factors - be realistic about actual architecture]

## 6. RISK ANALYSIS
For each major risk (identify 3-5 risks), use this EXACT format and BE REALISTIC with scores:

RISK: [Short descriptive title]
Description: [Detailed explanation of the risk]
Probability: [1-10 - BE HONEST: well-architected = lower probability (2-5), poorly-architected = higher (7-10)]
Impact: [1-10 - BE HONEST: well-architected with redundancy = lower impact (3-6), single points of failure = higher (8-10)]
Category: [technical/operational/business]
Mitigation: [Specific actions - if already mitigated in config, note that]

IMPORTANT FOR RISK SCORING:
- Multi-AZ deployment = lower probability of AZ failure impact (2-3 vs 9-10)
- Encryption enabled = lower security risk (2-3 vs 9-10)
- Monitoring enabled = lower probability of undetected issues (3-4 vs 8-9)
- Auto-scaling configured = lower probability of capacity issues (2-4 vs 8-9)
- Read replicas present = lower probability of read bottleneck (2-3 vs 8-9)
- Proper backup retention = lower impact of data loss (2-3 vs 9-10)

[blank line between risks]

## 7. PREVENTIVE ACTIONS

High Priority (Must Do):
1. [Actions for critical gaps - if config is good, this list should be SHORT or focus on operational improvements]
2. [If well-architected, focus on monitoring, testing, documentation]

Medium Priority:
1. [Nice-to-have improvements]
2. [Operational excellence items]

Low Priority:
1. [Minor optimizations]
2. [Future considerations]

IMPORTANT: Follow the exact format above, especially for:
- Severity must reflect ACTUAL configuration quality (don't always say critical!)
- Risk probability/impact scores must be REALISTIC based on protections in place
- Affected systems should only include what would ACTUALLY be impacted
- Timeline should be proportional to severity and recovery capabilities

EVALUATION CRITERIA:
✅ GOOD indicators (lower severity): Multi-AZ, encryption, secrets management, monitoring, auto-scaling, read replicas, proper backups, deletion protection, private subnets, least-privilege security groups
❌ BAD indicators (higher severity): Single AZ, no encryption, hardcoded passwords, no monitoring, fixed capacity, no replicas, short backup retention, public access, overly permissive security

Be specific, technical, and REALISTIC. A well-architected system should get moderate/low severity, not critical.`;
}


// ============================================================================
// TEMPLATE CRUD OPERATIONS
// ============================================================================

const TEMPLATES_TABLE = process.env.TEMPLATES_TABLE || 'whatbreaks-templates';

async function handleCreateTemplate(event) {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  const { name, category, difficulty, description, parameters, template } = body;

  // Validate required fields
  if (!name || !category || !template) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields: name, category, template' }),
    };
  }

  const templateId = `tmpl-${Date.now()}`;
  const userId = 'anonymous'; // Future: get from auth

  const item = {
    id: templateId,
    userId,
    name,
    category,
    difficulty: difficulty || 'medium',
    description: description || '',
    parameters: parameters || [],
    template,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const params = {
    TableName: TEMPLATES_TABLE,
    Item: item,
  };

  try {
    const command = new PutCommand(params);
    await dynamoClient.send(command);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error('Failed to create template:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create template' }),
    };
  }
}

async function handleListTemplates(event) {
  const queryParams = event.queryStringParameters || {};
  const userId = queryParams.userId || 'anonymous';
  const limit = parseInt(queryParams.limit || '50', 10);

  const params = {
    TableName: TEMPLATES_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    Limit: limit,
    ScanIndexForward: false, // Sort by createdAt descending
  };

  try {
    const command = new QueryCommand(params);
    const result = await dynamoClient.send(command);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templates: result.Items || [],
        count: result.Items?.length || 0,
      }),
    };
  } catch (error) {
    console.error('Failed to list templates:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to list templates' }),
    };
  }
}

async function handleGetTemplate(event) {
  const path = event.requestContext?.http?.path || event.path || event.rawPath;
  const id = path.split('/').pop();

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Template ID is required' }),
    };
  }

  const params = {
    TableName: TEMPLATES_TABLE,
    Key: { id },
  };

  try {
    const command = new GetCommand(params);
    const result = await dynamoClient.send(command);

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Template not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Failed to get template:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get template' }),
    };
  }
}

async function handleUpdateTemplate(event) {
  const path = event.requestContext?.http?.path || event.path || event.rawPath;
  const id = path.split('/').pop();
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Template ID is required' }),
    };
  }

  const { name, category, difficulty, description, parameters, template } = body;

  // Build update expression
  const updateParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  if (name) {
    updateParts.push('#name = :name');
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':name'] = name;
  }
  if (category) {
    updateParts.push('category = :category');
    expressionAttributeValues[':category'] = category;
  }
  if (difficulty) {
    updateParts.push('difficulty = :difficulty');
    expressionAttributeValues[':difficulty'] = difficulty;
  }
  if (description !== undefined) {
    updateParts.push('description = :description');
    expressionAttributeValues[':description'] = description;
  }
  if (parameters) {
    updateParts.push('parameters = :parameters');
    expressionAttributeValues[':parameters'] = parameters;
  }
  if (template) {
    updateParts.push('#template = :template');
    expressionAttributeNames['#template'] = 'template';
    expressionAttributeValues[':template'] = template;
  }

  updateParts.push('updatedAt = :updatedAt');
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  if (updateParts.length === 1) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'No fields to update' }),
    };
  }

  const params = {
    TableName: TEMPLATES_TABLE,
    Key: { id },
    UpdateExpression: `SET ${updateParts.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  };

  if (Object.keys(expressionAttributeNames).length > 0) {
    params.ExpressionAttributeNames = expressionAttributeNames;
  }

  try {
    const command = new UpdateCommand(params);
    const result = await dynamoClient.send(command);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.Attributes),
    };
  } catch (error) {
    console.error('Failed to update template:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to update template' }),
    };
  }
}

async function handleDeleteTemplate(event) {
  const path = event.requestContext?.http?.path || event.path || event.rawPath;
  const id = path.split('/').pop();

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Template ID is required' }),
    };
  }

  const params = {
    TableName: TEMPLATES_TABLE,
    Key: { id },
  };

  try {
    const command = new DeleteCommand(params);
    await dynamoClient.send(command);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Template deleted successfully' }),
    };
  } catch (error) {
    console.error('Failed to delete template:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete template' }),
    };
  }
}
