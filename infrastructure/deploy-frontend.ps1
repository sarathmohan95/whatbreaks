# Deploy Frontend to S3 and Invalidate CloudFront Cache
# This script builds the Next.js app and deploys it to S3

param(
    [string]$Environment = "dev",
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"

Write-Host "Deploying WhatBreaks Frontend to CloudFront" -ForegroundColor Cyan
Write-Host ""

# Get the S3 bucket name and CloudFront distribution ID from Terraform outputs
Write-Host "Getting infrastructure details from Terraform..." -ForegroundColor Yellow
Push-Location $PSScriptRoot

$bucketName = terraform output -raw frontend_s3_bucket
$distributionId = terraform output -raw cloudfront_distribution_id

Pop-Location

if ([string]::IsNullOrEmpty($bucketName) -or [string]::IsNullOrEmpty($distributionId)) {
    Write-Host "Error: Could not get S3 bucket or CloudFront distribution from Terraform outputs" -ForegroundColor Red
    Write-Host "Make sure you have run terraform apply first" -ForegroundColor Red
    exit 1
}

Write-Host "S3 Bucket: $bucketName" -ForegroundColor Green
Write-Host "CloudFront Distribution: $distributionId" -ForegroundColor Green
Write-Host ""

# Build the Next.js app
if (-not $SkipBuild) {
    Write-Host "Building Next.js application..." -ForegroundColor Yellow
    Push-Location ../frontend
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Build for static export
    Write-Host "Building static export..." -ForegroundColor Yellow
    npm run build
    
    Pop-Location
    Write-Host "Build complete" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Skipping build (using existing build)" -ForegroundColor Yellow
    Write-Host ""
}

# Check if build output exists
if (-not (Test-Path "../frontend/out")) {
    Write-Host "Error: Build output not found at ../frontend/out" -ForegroundColor Red
    Write-Host "Run without -SkipBuild flag to build first" -ForegroundColor Red
    exit 1
}

# Sync to S3
Write-Host "Uploading to S3..." -ForegroundColor Yellow
aws s3 sync ../frontend/out s3://$bucketName/ --delete --cache-control "public,max-age=31536000,immutable" --exclude "*.html"
aws s3 sync ../frontend/out s3://$bucketName/ --delete --cache-control "public,max-age=0,must-revalidate" --exclude "*" --include "*.html"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error uploading to S3" -ForegroundColor Red
    exit 1
}

Write-Host "Upload complete" -ForegroundColor Green
Write-Host ""

# Invalidate CloudFront cache
Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
$invalidation = aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error creating CloudFront invalidation" -ForegroundColor Red
    exit 1
}

Write-Host "Invalidation created: $($invalidation.Invalidation.Id)" -ForegroundColor Green
Write-Host ""

# Get CloudFront domain
$domain = terraform output -raw cloudfront_domain_name

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your site is available at:" -ForegroundColor Cyan
Write-Host "  https://$domain" -ForegroundColor White
Write-Host ""
Write-Host "Note: CloudFront invalidation may take a few minutes to complete" -ForegroundColor Yellow
Write-Host "You can check status with:" -ForegroundColor Yellow
Write-Host "aws cloudfront get-invalidation --distribution-id $distributionId --id $($invalidation.Invalidation.Id)" -ForegroundColor Gray
