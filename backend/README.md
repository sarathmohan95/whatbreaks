# WhatBreaks Backend

Lambda functions for the WhatBreaks pre-mortem engine.

## Structure

```
backend/
├── premortem-lambda/       # Main pre-mortem generation Lambda
│   ├── index.js           # Lambda handler
│   └── package.json       # Dependencies
└── README.md
```

## Lambda Functions

### premortem-lambda

Generates pre-mortem reports using Amazon Bedrock (Claude 3 Sonnet).

**Input:**
```json
{
  "description": "Infrastructure change description",
  "changeType": "infrastructure|configuration|terraform|code",
  "currentState": "Optional current state description",
  "proposedState": "Optional proposed state description",
  "trafficPatterns": "Optional traffic patterns"
}
```

**Output:**
```json
{
  "id": "pm-1234567890",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "input": { ... },
  "changeSummary": "Brief summary",
  "fullReport": "Complete pre-mortem report in markdown"
}
```

## Local Development

### Testing Lambda Locally

1. **Install dependencies:**
   ```bash
   cd premortem-lambda
   npm install
   ```

2. **Set environment variables:**
   ```bash
   export AWS_REGION=us-east-1
   export AWS_ACCESS_KEY_ID=your-key
   export AWS_SECRET_ACCESS_KEY=your-secret
   ```

3. **Test with sample event:**
   ```bash
   node -e "
   const handler = require('./index').handler;
   handler({
     body: JSON.stringify({
       description: 'Migrating Redis from single node to cluster mode',
       changeType: 'infrastructure'
     })
   }).then(console.log);
   "
   ```

### Using AWS SAM for Local Testing

1. **Install AWS SAM CLI:**
   ```bash
   # macOS
   brew install aws-sam-cli
   
   # Windows
   choco install aws-sam-cli
   ```

2. **Create template.yaml:**
   ```yaml
   AWSTemplateFormatVersion: '2010-09-09'
   Transform: AWS::Serverless-2016-10-31
   
   Resources:
     PreMortemFunction:
       Type: AWS::Serverless::Function
       Properties:
         Handler: index.handler
         Runtime: nodejs20.x
         CodeUri: premortem-lambda/
         Environment:
           Variables:
             AWS_REGION: us-east-1
   ```

3. **Invoke locally:**
   ```bash
   sam local invoke PreMortemFunction -e event.json
   ```

## Deployment

Lambda functions are deployed via Terraform in the `infrastructure/` directory.

See `infrastructure/README.md` for deployment instructions.

## Environment Variables

- `AWS_REGION`: AWS region (default: us-east-1)
- `DYNAMODB_TABLE`: DynamoDB table name (set by Terraform)
- `S3_BUCKET`: S3 bucket name (set by Terraform)

## Dependencies

- `@aws-sdk/client-bedrock-runtime`: Amazon Bedrock SDK

## Adding New Lambda Functions

1. Create new directory: `backend/new-function/`
2. Add `index.js` and `package.json`
3. Update `infrastructure/main.tf` with new Lambda resource
4. Deploy via Terraform

## Monitoring

View Lambda logs in CloudWatch:
```bash
aws logs tail /aws/lambda/whatbreaks-premortem --follow
```

## Cost Optimization

- Lambda memory: 512MB (adjust based on usage)
- Timeout: 60 seconds (Bedrock can take 10-30s)
- Provisioned concurrency: Not enabled (use on-demand)

## Security

- Lambda runs with minimal IAM permissions
- Only has access to:
  - Bedrock model invocation
  - DynamoDB table (read/write)
  - S3 bucket (read/write)
  - CloudWatch Logs
