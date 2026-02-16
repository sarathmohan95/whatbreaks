# AI Analysis Prompt Documentation

## Overview

WhatBreaks uses a structured prompt to analyze AWS architectures through OpenAI's GPT-4 model. This document explains the prompt design and how to customize it.

## Core Prompt Structure

The analysis prompt is located in `src/lib/ai/analyzer.ts` and consists of:

1. **System Context**: Establishes the AI as an AWS Well-Architected expert
2. **Architecture Input**: User-provided details
3. **Output Format**: Structured JSON response
4. **Analysis Focus**: Key reliability areas to evaluate

## Full Prompt Template

```
You are an AWS Well-Architected Framework expert specializing in the Reliability Pillar.

Analyze the following AWS architecture and provide a comprehensive reliability assessment.

Architecture Details:
- Description: {description}
- Services: {services}
- Region: {region}
- Criticality: {criticality}

Provide your analysis in the following JSON format:
{
  "summary": "Brief 2-3 sentence overview of the architecture's reliability posture",
  "score": {
    "overall": 0-100,
    "faultTolerance": 0-100,
    "monitoring": 0-100,
    "scalability": 0-100,
    "disasterRecovery": 0-100,
    "resilience": 0-100
  },
  "risks": [
    {
      "category": "Fault Tolerance|Monitoring|Scalability|Disaster Recovery|Resilience",
      "riskLevel": "Low|Medium|High",
      "title": "Short risk title",
      "description": "Detailed explanation of the risk",
      "recommendation": "Specific actionable fix",
      "impact": "What happens if this is ignored",
      "wellArchitectedPillar": "REL.X reference from AWS Well-Architected"
    }
  ]
}

Focus on:
- Single points of failure
- Multi-AZ/region deployment
- Backup and recovery strategies
- Monitoring and alerting gaps
- Scalability bottlenecks
- Data durability concerns

Be specific and actionable. Reference AWS Well-Architected Framework best practices.
```

## Prompt Components Explained

### 1. System Role
```
You are an AWS Well-Architected Framework expert specializing in the Reliability Pillar.
```
- Establishes expertise domain
- Focuses on reliability (not security, cost, etc.)
- Ensures responses align with AWS best practices

### 2. Input Variables

- `{description}`: User's architecture description in plain English
- `{services}`: List of AWS services used
- `{region}`: Primary AWS region
- `{criticality}`: Workload importance (Low/Medium/High)

### 3. Output Structure

The JSON format ensures:
- Consistent parsing
- Structured data for UI display
- Predictable response format

### 4. Scoring System

Each score (0-100) represents:
- **80-100**: Excellent - Well-architected with minor improvements
- **60-79**: Good - Solid foundation with some gaps
- **40-59**: Fair - Significant improvements needed
- **0-39**: Poor - Critical issues present

### 5. Risk Categories

- **Fault Tolerance**: Ability to handle component failures
- **Monitoring**: Observability and alerting capabilities
- **Scalability**: Ability to handle load changes
- **Disaster Recovery**: Backup and recovery capabilities
- **Resilience**: Overall system robustness

## Customization Guide

### Adjusting Severity

To make the AI more/less strict, modify the focus areas:

**More Strict:**
```typescript
Focus on:
- ANY single points of failure (critical)
- MUST have Multi-AZ for production workloads
- REQUIRED automated backups with tested recovery
- MANDATORY monitoring for all critical components
- MUST implement auto-scaling for variable loads
```

**More Lenient:**
```typescript
Focus on:
- Critical single points of failure
- Consider Multi-AZ for high-criticality workloads
- Recommend backup strategies
- Suggest monitoring improvements
- Evaluate scaling capabilities
```

### Adding New Categories

To add a new analysis category (e.g., "Security"):

1. Update the prompt:
```typescript
"score": {
  "overall": 0-100,
  "faultTolerance": 0-100,
  "monitoring": 0-100,
  "scalability": 0-100,
  "disasterRecovery": 0-100,
  "resilience": 0-100,
  "security": 0-100  // New category
}
```

2. Update TypeScript types in `src/types/index.ts`:
```typescript
export interface ReliabilityScore {
  overall: number;
  faultTolerance: number;
  monitoring: number;
  scalability: number;
  disasterRecovery: number;
  resilience: number;
  security: number;  // Add here
}
```

3. Update UI components to display the new score

### Service-Specific Analysis

To add deep analysis for specific services:

```typescript
const SERVICE_SPECIFIC_CHECKS = {
  RDS: `
    - Check for Multi-AZ deployment
    - Verify automated backups enabled
    - Confirm backup retention period
    - Check for read replicas
  `,
  Lambda: `
    - Verify DLQ configuration
    - Check timeout settings
    - Confirm retry logic
    - Review memory allocation
  `,
  // Add more services...
};
```

Then append to the main prompt based on detected services.

## Model Configuration

Current settings in `analyzer.ts`:

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  response_format: { type: 'json_object' },
});
```

### Model Selection

- **gpt-4-turbo-preview**: Best quality, higher cost
- **gpt-4**: Reliable, good balance
- **gpt-3.5-turbo**: Faster, lower cost, less detailed

### Temperature

- **0.3-0.5**: More consistent, conservative recommendations
- **0.7**: Balanced (current)
- **0.8-1.0**: More creative, varied responses

## Alternative AI Providers

### Anthropic Claude

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: prompt,
    },
  ],
});
```

### AWS Bedrock

```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

const command = new InvokeModelCommand({
  modelId: 'anthropic.claude-v2',
  body: JSON.stringify({
    prompt: prompt,
    max_tokens_to_sample: 4096,
  }),
});
```

## Testing Prompts

Use the sample inputs in `docs/SAMPLE_INPUT.md` to test prompt changes:

```bash
# Test with sample architecture
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d @sample-input.json
```

## Best Practices

1. **Be Specific**: Clear instructions yield better results
2. **Use Examples**: Show the AI what good output looks like
3. **Iterate**: Test with various architectures and refine
4. **Version Control**: Track prompt changes in Git
5. **A/B Test**: Compare different prompts with same inputs

## Troubleshooting

### Inconsistent Responses
- Lower temperature (0.3-0.5)
- Add more specific instructions
- Use stricter output format

### Missing Details
- Add explicit focus areas
- Request specific Well-Architected references
- Increase max_tokens

### Incorrect Scoring
- Provide scoring rubric in prompt
- Add example scores for reference architectures
- Clarify severity levels

## Future Enhancements

1. **Multi-Pillar Analysis**: Expand beyond reliability
2. **Cost Estimation**: Add cost impact for recommendations
3. **Priority Ranking**: Order fixes by impact/effort
4. **Compliance Checks**: Add regulatory requirements
5. **Automated Fixes**: Generate IaC code for recommendations
