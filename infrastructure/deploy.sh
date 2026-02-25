#!/bin/bash
set -e

echo "🚀 Deploying WhatBreaks Infrastructure..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Build Lambda package
echo "📦 Building Lambda package..."
cd ../backend/premortem-lambda
npm install --production
zip -r ../premortem-lambda.zip . -x "*.git*" "node_modules/.cache/*"
cd ../../infrastructure

# Initialize Terraform
echo "🔧 Initializing Terraform..."
terraform init

# Plan deployment
echo "📋 Planning deployment..."
terraform plan -out=tfplan

# Apply deployment
echo "✅ Applying deployment..."
terraform apply tfplan

# Get outputs
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "API Endpoint:"
terraform output -raw api_invoke_url
echo ""
echo ""
echo "Next steps:"
echo "1. Update frontend/.env.local with the API endpoint above"
echo "2. Deploy frontend to Vercel or AWS Amplify"
echo "3. Update allowed_origins in terraform.tfvars with your frontend URL"
echo "4. Run 'terraform apply' again to update CORS settings"
