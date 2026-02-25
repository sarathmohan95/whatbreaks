# Phase 3: AI-Powered IaC Parsing (Simplest Approach)

## The Simplest Solution: Let Claude Parse It

Instead of complex parsing libraries or MCP servers, we can leverage Claude's ability to understand and analyze Infrastructure as Code directly.

## Architecture

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │ 1. Upload Terraform/CloudFormation file
       ▼
┌─────────────┐
│  Frontend   │
│  (Next.js)  │
└──────┬──────┘
       │ 2. POST /parse-iac (file content in body)
       ▼
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │ 3. Invoke Lambda
       ▼
┌─────────────────────────────────────┐
│  Lambda (Node.js - existing!)       │
│  ┌───────────────────────────────┐  │
│  │ 1. Receive file content       │  │
│  │ 2. Send to Claude with prompt │  │
│  │ 3. Claude analyzes IaC        │  │
│  │ 4. Returns structured JSON    │  │
│  │ 5. Generate description       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Bedrock   │
│  (Claude)   │
└─────────────┘
```

## How It Works

### 1. User Uploads File
- User uploads `.tfplan`, `.json`, `.yaml`, or `.yml` file
- Frontend reads file content (no S3 needed!)
- Frontend sends content directly to API

### 2. Lambda Sends to Claude
```javascript
// backend/premortem-lambda/index.js

async function parseIaCFile(event) {
  const body = JSON.parse(event.body);
  const { fileContent, fileType } = body; // fileType: 'terraform' or 'cloudformation'
  
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
  
  const analysis = responseBody.content[0].text;
  const parsed = parseIaCAnalysis(analysis);
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  };
}

function buildIaCParsingPrompt(fileContent, fileType) {
  return `You are an expert infrastructure engineer analyzing ${fileType === 'terraform' ? 'Terraform' : 'CloudFormation'} code.

${fileType === 'terraform' ? 'TERRAFORM PLAN:' : 'CLOUDFORMATION TEMPLATE:'}
\`\`\`json
${fileContent}
\`\`\`

Analyze this infrastructure code and provide a structured analysis in JSON format:

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
      "action": "create|update|delete",
      "keyAttributes": {
        "bucket": "my-data-bucket",
        "versioning": true
      }
    }
  ],
  "securityIssues": [
    {
      "severity": "HIGH|MEDIUM|LOW",
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
  "description": "A natural language description of what this infrastructure change does, including current state, proposed changes, and potential impact. Be specific about resource types, counts, and relationships."
}

Focus on:
1. What resources are being created, modified, or destroyed
2. Security concerns (encryption, public access, IAM permissions)
3. Dependencies between resources
4. Potential failure points
5. Impact on existing infrastructure

Be thorough but concise. Identify all security issues.`;
}

function parseIaCAnalysis(analysis) {
  // Extract JSON from Claude's response
  const jsonMatch = analysis.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse IaC analysis');
  }
  
  return JSON.parse(jsonMatch[0]);
}
```

### 3. Frontend Integration

```typescript
// frontend/src/app/analyze/page.tsx

const [iacFile, setIacFile] = useState<File | null>(null);
const [parsing, setParsing] = useState(false);

const handleFileUpload = async (file: File) => {
  setIacFile(file);
  setParsing(true);
  
  try {
    // Read file content
    const content = await file.text();
    
    // Determine file type
    const fileType = file.name.endsWith('.tf') || file.name.endsWith('.tfplan') 
      ? 'terraform' 
      : 'cloudformation';
    
    // Send to API
    const response = await fetch('/api/parse-iac', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileContent: content, fileType }),
    });
    
    const result = await response.json();
    
    // Auto-fill form with parsed data
    setFormData({
      description: result.description,
      changeType: 'terraform',
      currentState: generateCurrentState(result),
      proposedState: generateProposedState(result),
      trafficPatterns: '',
    });
    
    // Show security issues
    if (result.securityIssues.length > 0) {
      setSecurityIssues(result.securityIssues);
    }
    
  } catch (error) {
    alert('Failed to parse IaC file: ' + error.message);
  } finally {
    setParsing(false);
  }
};

function generateCurrentState(result: any) {
  const existing = result.resources.filter((r: any) => 
    r.action === 'update' || r.action === 'delete'
  );
  
  if (existing.length === 0) return 'New infrastructure deployment';
  
  return `Existing infrastructure:\n${existing.map((r: any) => 
    `- ${r.type}: ${r.name}`
  ).join('\n')}`;
}

function generateProposedState(result: any) {
  const changes = result.resources.map((r: any) => {
    switch (r.action) {
      case 'create':
        return `+ ${r.type}: ${r.name}`;
      case 'update':
        return `~ ${r.type}: ${r.name}`;
      case 'delete':
        return `- ${r.type}: ${r.name}`;
      default:
        return '';
    }
  }).filter(Boolean);
  
  return `Proposed changes:\n${changes.join('\n')}`;
}
```

### 4. UI Component

```tsx
// File upload component
<div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
  <input
    type="file"
    accept=".tf,.tfplan,.json,.yaml,.yml"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    }}
    className="hidden"
    id="iac-upload"
  />
  <label htmlFor="iac-upload" className="cursor-pointer">
    <div className="text-gray-400 mb-4">
      <FileText className="h-12 w-12 mx-auto mb-2" />
      <p className="text-lg">Upload Terraform or CloudFormation file</p>
      <p className="text-sm mt-2">Supports .tf, .tfplan, .json, .yaml</p>
    </div>
  </label>
  
  {parsing && (
    <div className="mt-4">
      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      <p className="text-sm text-gray-400 mt-2">Analyzing infrastructure...</p>
    </div>
  )}
  
  {iacFile && !parsing && (
    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded">
      <p className="text-green-400">✓ Parsed: {iacFile.name}</p>
      <p className="text-sm text-gray-400 mt-1">Form auto-filled with analysis</p>
    </div>
  )}
</div>

{securityIssues.length > 0 && (
  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded">
    <h3 className="text-red-400 font-semibold mb-2">
      ⚠️ Security Issues Found ({securityIssues.length})
    </h3>
    <ul className="space-y-2">
      {securityIssues.map((issue, i) => (
        <li key={i} className="text-sm">
          <span className={`font-semibold ${
            issue.severity === 'HIGH' ? 'text-red-400' :
            issue.severity === 'MEDIUM' ? 'text-yellow-400' :
            'text-gray-400'
          }`}>
            [{issue.severity}]
          </span>
          <span className="text-gray-300 ml-2">{issue.resource}</span>
          <p className="text-gray-400 ml-6">{issue.issue}</p>
          <p className="text-gray-500 ml-6 text-xs">→ {issue.recommendation}</p>
        </li>
      ))}
    </ul>
  </div>
)}
```

## Advantages of This Approach

### 1. **Simplicity**
- No new Lambda functions
- No Python dependencies
- No S3 buckets needed
- No MCP servers
- Uses existing Node.js Lambda
- Uses existing Bedrock integration

### 2. **Cost**
- Same cost as current pre-mortem generation
- No additional infrastructure
- No storage costs
- ~$0.01 per analysis (Bedrock API call)

### 3. **Flexibility**
- Claude understands ANY IaC format
- Works with Terraform, CloudFormation, Pulumi, CDK
- Can handle custom formats
- Adapts to new AWS services automatically
- No library updates needed

### 4. **Intelligence**
- Claude can identify complex security issues
- Understands resource relationships
- Provides context-aware recommendations
- Can explain WHY something is risky
- Better than rule-based tools

### 5. **Maintenance**
- No parsing libraries to maintain
- No security scanner updates
- Claude improves over time
- Single codebase (Node.js)

## Limitations

### 1. **Accuracy**
- AI might miss edge cases
- Not as precise as dedicated parsers
- May hallucinate minor details

**Mitigation:**
- Use lower temperature (0.3) for accuracy
- Validate critical fields
- Show confidence scores
- Allow manual editing

### 2. **Cost**
- Each parse costs ~$0.01 (vs free with libraries)
- Could add up with high volume

**Mitigation:**
- Cache parsed results
- Rate limit uploads
- Charge for heavy usage

### 3. **Speed**
- Takes 5-10 seconds (vs 1-2 seconds with libraries)

**Mitigation:**
- Show progress indicator
- Parse in background
- Cache results

## Comparison Table

| Approach | Complexity | Cost/Month | Speed | Accuracy | Maintenance |
|----------|-----------|------------|-------|----------|-------------|
| **AI Parsing (Claude)** | ⭐ Very Low | $5-10 | 5-10s | 90-95% | ⭐ Very Low |
| Python Lambda | ⭐⭐ Medium | $5-15 | 1-2s | 95-98% | ⭐⭐ Medium |
| MCP + ECS | ⭐⭐⭐⭐⭐ Very High | $55+ | 3-5s | 98-99% | ⭐⭐⭐⭐ High |

## Implementation Checklist

### Backend (1 day)
- [ ] Add `/parse-iac` endpoint to existing Lambda
- [ ] Create IaC parsing prompt
- [ ] Parse Claude's JSON response
- [ ] Add error handling
- [ ] Test with sample files

### Frontend (1 day)
- [ ] Add file upload component
- [ ] Handle file reading
- [ ] Call parse API
- [ ] Auto-fill form with results
- [ ] Display security issues
- [ ] Add loading states

### Testing (0.5 day)
- [ ] Test with Terraform plans
- [ ] Test with CloudFormation templates
- [ ] Test error cases
- [ ] Verify security issue detection
- [ ] Check description quality

**Total: 2.5 days**

## Example Prompt Output

**Input:** Terraform plan creating S3 bucket

**Claude's Response:**
```json
{
  "summary": {
    "totalResources": 3,
    "toCreate": 3,
    "toModify": 0,
    "toDestroy": 0,
    "resourceTypes": ["aws_s3_bucket", "aws_s3_bucket_versioning", "aws_iam_role"]
  },
  "resources": [
    {
      "type": "aws_s3_bucket",
      "name": "data-bucket",
      "action": "create",
      "keyAttributes": {
        "bucket": "my-company-data-prod",
        "region": "us-east-1"
      }
    }
  ],
  "securityIssues": [
    {
      "severity": "HIGH",
      "resource": "aws_s3_bucket.data-bucket",
      "issue": "Server-side encryption not configured",
      "recommendation": "Add aws_s3_bucket_server_side_encryption_configuration resource with AES256 or aws:kms"
    },
    {
      "severity": "MEDIUM",
      "resource": "aws_s3_bucket.data-bucket",
      "issue": "Public access block not configured",
      "recommendation": "Add aws_s3_bucket_public_access_block resource to prevent accidental public exposure"
    }
  ],
  "dependencies": [
    {
      "from": "aws_iam_role.lambda-role",
      "to": "aws_s3_bucket.data-bucket",
      "type": "can_access"
    }
  ],
  "description": "Creating a new S3 bucket 'my-company-data-prod' in us-east-1 for production data storage. The bucket will have versioning enabled and will be accessed by a Lambda function via an IAM role. Currently missing encryption and public access block configurations, which should be added before deployment."
}
```

## Recommendation

**Use AI Parsing (Claude) for Phase 3 MVP**

Why:
- Simplest to implement (2.5 days)
- Uses existing infrastructure
- Minimal cost increase
- Good enough accuracy for MVP
- Easy to maintain
- Can always add specialized parsers later if needed

This is the pragmatic choice that gets you 90% of the value with 10% of the complexity.
