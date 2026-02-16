# Deployment Guide

## Overview

WhatBreaks can be deployed using multiple strategies. This guide covers the recommended production deployment approach.

## Architecture

```
┌─────────────────────────────────────────┐
│           CloudFront (CDN)              │
│         (Optional, for caching)         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Vercel (Frontend)               │
│    - Next.js App (SSR + API Routes)     │
│    - Automatic scaling                  │
│    - Edge functions                     │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
┌───────▼────┐  ┌────▼─────────┐
│  OpenAI    │  │   AWS        │
│  API       │  │ - DynamoDB   │
│            │  │ - S3         │
└────────────┘  └──────────────┘
```

## Deployment Options

### Option 1: Vercel (Recommended for MVP)

Vercel provides the simplest deployment with automatic scaling and edge functions.

#### Prerequisites
- Vercel account
- GitHub repository
- OpenAI API key
- AWS account (for DynamoDB and S3)

#### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure environment variables:
     ```
     OPENAI_API_KEY=sk-...
     AWS_REGION=us-east-1
     AWS_ACCESS_KEY_ID=...
     AWS_SECRET_ACCESS_KEY=...
     DYNAMODB_TABLE_NAME=whatbreaks-analyses
     S3_BUCKET_NAME=whatbreaks-reports
     ```

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app
   - Your app will be live at `https://your-app.vercel.app`

#### Custom Domain (Optional)
- Go to Project Settings → Domains
- Add your custom domain
- Update DNS records as instructed

### Option 2: AWS Amplify

AWS Amplify provides native AWS integration.

#### Steps

1. **Install Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize Amplify**
   ```bash
   amplify init
   amplify add hosting
   amplify publish
   ```

3. **Configure Environment Variables**
   - Go to AWS Amplify Console
   - Navigate to Environment Variables
   - Add all required variables

### Option 3: Self-Hosted (Docker)

For complete control, deploy using Docker.

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Deploy
```bash
docker build -t whatbreaks .
docker run -p 3000:3000 --env-file .env whatbreaks
```

## AWS Infrastructure Setup

### DynamoDB Table

Create a table for storing analysis history:

```bash
aws dynamodb create-table \
  --table-name whatbreaks-analyses \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### S3 Bucket

Create a bucket for PDF reports:

```bash
aws s3 mb s3://whatbreaks-reports --region us-east-1

aws s3api put-bucket-cors \
  --bucket whatbreaks-reports \
  --cors-configuration file://cors.json
```

cors.json:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://your-domain.com"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### IAM User

Create an IAM user with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/whatbreaks-analyses"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::whatbreaks-reports/*"
    }
  ]
}
```

## Environment Variables

Required environment variables:

```bash
# AI Provider
OPENAI_API_KEY=sk-...

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
DYNAMODB_TABLE_NAME=whatbreaks-analyses
S3_BUCKET_NAME=whatbreaks-reports

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Post-Deployment

### 1. Test the Application
- Visit your deployed URL
- Run a sample analysis
- Download a PDF report
- Check AWS console for DynamoDB entries

### 2. Monitor
- Set up CloudWatch alarms for API errors
- Monitor OpenAI API usage
- Track DynamoDB and S3 costs

### 3. Optimize
- Enable CloudFront for static assets
- Configure caching headers
- Set up rate limiting

## Cost Optimization

### Free Tier Usage
- **Vercel**: Free for personal projects
- **DynamoDB**: 25 GB storage, 25 WCU, 25 RCU free
- **S3**: 5 GB storage, 20,000 GET requests free
- **OpenAI**: Pay per token (estimate $0.01-0.10 per analysis)

### Estimated Monthly Costs
- 100 analyses/month: ~$5-10
- 1,000 analyses/month: ~$50-100

## Troubleshooting

### Build Failures
- Check Node.js version (18+)
- Verify all dependencies are installed
- Check environment variables

### API Errors
- Verify OpenAI API key is valid
- Check AWS credentials
- Ensure DynamoDB table exists

### PDF Generation Issues
- Check jsPDF version compatibility
- Verify browser compatibility
- Test with different PDF viewers

## Security Checklist

- [ ] Environment variables are not committed to Git
- [ ] AWS IAM user has minimal permissions
- [ ] S3 bucket is not publicly accessible
- [ ] API routes have rate limiting
- [ ] CORS is properly configured
- [ ] HTTPS is enforced

## Support

For issues or questions:
- Check GitHub Issues
- Review AWS CloudWatch logs
- Contact support@whatbreaks.ai
