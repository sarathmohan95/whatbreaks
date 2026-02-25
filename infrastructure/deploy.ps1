# PowerShell deployment script for Windows
$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying WhatBreaks Infrastructure..." -ForegroundColor Cyan

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Build Lambda package
Write-Host "📦 Building Lambda package..." -ForegroundColor Yellow
Set-Location ..\backend\premortem-lambda
npm install --production
Compress-Archive -Path * -DestinationPath ..\premortem-lambda.zip -Force
Set-Location ..\..\infrastructure

# Initialize Terraform
Write-Host "🔧 Initializing Terraform..." -ForegroundColor Yellow
terraform init

# Plan deployment
Write-Host "📋 Planning deployment..." -ForegroundColor Yellow
terraform plan -out=tfplan

# Apply deployment
Write-Host "✅ Applying deployment..." -ForegroundColor Yellow
terraform apply tfplan

# Get outputs
Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "API Endpoint:" -ForegroundColor Cyan
terraform output -raw api_invoke_url
Write-Host ""
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update frontend/.env.local with the API endpoint above"
Write-Host "2. Deploy frontend to Vercel or AWS Amplify"
Write-Host "3. Update allowed_origins in terraform.tfvars with your frontend URL"
Write-Host "4. Run 'terraform apply' again to update CORS settings"
