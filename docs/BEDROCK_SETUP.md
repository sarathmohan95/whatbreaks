# Amazon Bedrock Setup Guide

This guide explains how to set up Amazon Bedrock for WhatBreaks pre-mortem generation.

## Why Amazon Bedrock?

Amazon Bedrock provides:
- **Claude 3 models** - Excellent at reasoning and technical analysis
- **AWS-native** - Seamless integration with other AWS services
- **Cost-effective** - Pay only for what you use
- **Scalable** - Handles production workloads
- **Secure** - Enterprise-grade security and compliance

## Prerequisites

1. **AWS Account** - Active AWS account
2. **AWS CLI** - Installed and configured
3. **IAM Permissions** - Ability to create IAM users/roles
4. **Bedrock Access** - Model access enabled in your region

## Step 1: Enable Bedrock Model Access

### Via AWS Console

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock)
2. Navigate to **Model access** in the left sidebar
3. Click **Manage model access**
4. Find **Anthropic** section
5. Enable **Claude 3 Sonnet**
6. Click **Save changes**
7. Wait for access to be granted (usually instant)

### Via AWS CLI

```bash
aws bedrock list-foundation-models --region us-east-1
```

Check if `anthropic.claude-3-sonnet-20240229-v1:0` is available.

## Step 2: Create IAM User for WhatBreaks

### Create IAM Policy

Create a file `whatbreaks-bedrock-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeModel",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
      ]
    }
  ]
}
```

### Create Policy

```bash
aws iam create-policy \
  --policy-name WhatBreaksBedrockPolicy \
  --policy-document file://whatbreaks-bedrock-policy.json
```

### Create IAM User

```bash
# Create user
aws iam create-user --user-name whatbreaks-app

# Attach policy (replace ACCOUNT_ID with your AWS account ID)
aws iam attach-user-policy \
  --user-name whatbreaks-app \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/WhatBreaksBedrockPolicy

# Create access key
aws iam create-access-key --user-name whatbreaks-app
```

**Save the output!** You'll need:
- `AccessKeyId`
- `SecretAccessKey`

## Step 3: Configure WhatBreaks

### Update .env.local

```bash
# Amazon Bedrock Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...  # From Step 2
AWS_SECRET_ACCESS_KEY=...  # From Step 2

# Optional: OpenAI fallback
OPENAI_API_KEY=sk-...  # For development/fallback
```

### Test Configuration

Create a test file `test-bedrock.js`:

```javascript
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function test() {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: 'Say "Bedrock is working!" if you can read this.',
      },
    ],
  };

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  console.log('Response:', responseBody.content[0].text);
}

test().catch(console.error);
```

Run test:

```bash
node test-bedrock.js
```

Expected output: `Bedrock is working!`

## Step 4: Verify in Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000/analyze

3. Submit a test pre-mortem:
   ```
   Change: Migrating from single Redis node to Redis cluster

   Current: Single node in us-east-1a
   Proposed: 3-shard cluster across 3 AZs
   ```

4. Check the console for Bedrock API calls

5. Verify the pre-mortem report is generated

## Troubleshooting

### Error: "Access Denied"

**Cause:** IAM permissions not configured correctly

**Solution:**
1. Verify IAM policy is attached to user
2. Check policy allows `bedrock:InvokeModel`
3. Verify model ARN in policy matches region

### Error: "Model not found"

**Cause:** Model access not enabled

**Solution:**
1. Go to Bedrock Console
2. Enable Claude 3 Sonnet model access
3. Wait for access to be granted

### Error: "Throttling Exception"

**Cause:** Too many requests

**Solution:**
1. Implement rate limiting in application
2. Add retry logic with exponential backoff
3. Consider upgrading to higher quota

### Error: "Invalid credentials"

**Cause:** AWS credentials not configured

**Solution:**
1. Verify `AWS_ACCESS_KEY_ID` in `.env.local`
2. Verify `AWS_SECRET_ACCESS_KEY` in `.env.local`
3. Check credentials are not expired
4. Restart development server

## Cost Estimation

### Claude 3 Sonnet Pricing (as of 2024)

- **Input tokens:** $0.003 per 1K tokens
- **Output tokens:** $0.015 per 1K tokens

### Typical Pre-Mortem Cost

**Per pre-mortem report:**
- Input: ~2,000 tokens (user input + prompts)
- Output: ~3,000 tokens (report)
- **Cost per report:** ~$0.05

**Monthly estimates:**
- 100 reports: ~$5
- 1,000 reports: ~$50
- 10,000 reports: ~$500

### Cost Optimization Tips

1. **Use Claude 3 Haiku for simple scenarios** - 5x cheaper
2. **Cache common prompts** - Reduce input tokens
3. **Implement rate limiting** - Prevent abuse
4. **Set usage quotas** - Control costs
5. **Monitor token usage** - Track and optimize

## Production Deployment

### Use IAM Roles (Recommended)

Instead of access keys, use IAM roles:

```typescript
// For Lambda
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  // Credentials automatically from Lambda execution role
});

// For ECS/EC2
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  // Credentials automatically from instance profile
});
```

### Set Up CloudWatch Monitoring

```bash
# Create CloudWatch alarm for high costs
aws cloudwatch put-metric-alarm \
  --alarm-name whatbreaks-bedrock-cost \
  --alarm-description "Alert when Bedrock costs exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold
```

### Enable AWS CloudTrail

Track all Bedrock API calls:

```bash
aws cloudtrail create-trail \
  --name whatbreaks-bedrock-trail \
  --s3-bucket-name my-cloudtrail-bucket
```

## Alternative: OpenAI Fallback

If Bedrock is not available, WhatBreaks automatically falls back to OpenAI:

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

The application will:
1. Try Bedrock first
2. Fall back to OpenAI if Bedrock not configured
3. Log a warning about using fallback mode

**Note:** OpenAI fallback provides basic analysis but not full counterfactual reasoning.

## Security Best Practices

1. **Never commit credentials** - Use `.env.local`, not `.env`
2. **Rotate keys regularly** - Every 90 days minimum
3. **Use least privilege** - Only grant necessary permissions
4. **Enable MFA** - For IAM users with console access
5. **Monitor usage** - Set up CloudWatch alarms
6. **Use VPC endpoints** - For private Bedrock access (production)

## Support

### AWS Support
- [Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [AWS Support Center](https://console.aws.amazon.com/support/)

### WhatBreaks Support
- Check `docs/` folder for guides
- Review `VISION.md` for project overview
- See `docs/PREMORTEM_SAMPLES.md` for examples

---

**Setup Complete!** You're now ready to generate pre-mortem reports using Amazon Bedrock.
