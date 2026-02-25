# WhatBreaks Infrastructure

This directory contains Terraform configuration for deploying WhatBreaks to AWS.

## Architecture

- **API Gateway (HTTP)**: REST API endpoint for pre-mortem generation
- **Lambda Function**: Serverless compute running the pre-mortem engine
- **Amazon Bedrock**: Claude 3 Sonnet for AI-powered failure simulation
- **DynamoDB**: Storage for pre-mortem analyses
- **S3**: Storage for PDF reports

## Prerequisites

1. **AWS CLI** configured with credentials
   ```bash
   aws configure
   ```

2. **Terraform** installed (>= 1.0)
   ```bash
   # macOS
   brew install terraform
   
   # Windows
   choco install terraform
   ```

3. **Node.js** (for Lambda packaging)

4. **Bedrock Model Access**
   - Go to AWS Console → Bedrock → Model access
   - Request access to Claude 3 Sonnet
   - Wait for approval (usually instant)

## Deployment

### Option 1: Using deployment script (recommended)

**Linux/macOS:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```powershell
.\deploy.ps1
```

### Option 2: Manual deployment

1. **Build Lambda package:**
   ```bash
   cd ../backend/premortem-lambda
   npm install --production
   zip -r ../premortem-lambda.zip .
   cd ../../infrastructure
   ```

2. **Initialize Terraform:**
   ```bash
   terraform init
   ```

3. **Create terraform.tfvars:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your settings
   ```

4. **Deploy:**
   ```bash
   terraform plan
   terraform apply
   ```

## Configuration

Edit `terraform.tfvars`:

```hcl
aws_region   = "us-east-1"
project_name = "whatbreaks"
environment  = "dev"

allowed_origins = [
  "http://localhost:3000",
  "https://your-frontend-domain.com"
]
```

## Outputs

After deployment, Terraform will output:

- `api_invoke_url`: Full API endpoint URL
- `lambda_function_name`: Lambda function name
- `dynamodb_table_name`: DynamoDB table name
- `s3_bucket_name`: S3 bucket name

## Cost Estimate (AWS Free Tier)

- **Lambda**: 1M requests/month free
- **API Gateway**: 1M requests/month free
- **DynamoDB**: 25GB storage + 25 RCU/WCU free
- **S3**: 5GB storage + 20K GET requests free
- **Bedrock**: Pay per token (~$0.003 per 1K input tokens)

Expected monthly cost: **$5-20** depending on usage

## Updating Infrastructure

After making changes to Terraform files:

```bash
terraform plan
terraform apply
```

## Destroying Infrastructure

To remove all resources:

```bash
terraform destroy
```

⚠️ **Warning**: This will delete all data in DynamoDB and S3!

## Troubleshooting

### Lambda deployment fails
- Ensure `premortem-lambda.zip` exists in `backend/` directory
- Check Lambda function logs in CloudWatch

### Bedrock access denied
- Verify model access is enabled in AWS Console
- Check IAM role has `bedrock:InvokeModel` permission

### CORS errors
- Add your frontend URL to `allowed_origins` in `terraform.tfvars`
- Run `terraform apply` to update API Gateway

## Next Steps

1. Copy the API endpoint from Terraform outputs
2. Update `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
   ```
3. Deploy frontend to Vercel or AWS Amplify
4. Update `allowed_origins` with production frontend URL
