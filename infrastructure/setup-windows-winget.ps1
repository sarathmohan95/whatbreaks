# Setup script for Windows using winget (no admin required)
# Run this script in PowerShell (regular, not admin)

Write-Host "=== WhatBreaks Infrastructure Setup (winget) ===" -ForegroundColor Cyan
Write-Host ""

# Check if winget is available
if (!(Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: winget is not available on this system" -ForegroundColor Red
    Write-Host "Please use setup-windows.ps1 instead (requires admin)" -ForegroundColor Yellow
    exit 1
}

# Install AWS CLI
Write-Host "Checking for AWS CLI..." -ForegroundColor Yellow
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "Installing AWS CLI..." -ForegroundColor Green
    winget install Amazon.AWSCLI --silent
    Write-Host "AWS CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "AWS CLI already installed" -ForegroundColor Green
}

# Install Terraform
Write-Host ""
Write-Host "Checking for Terraform..." -ForegroundColor Yellow
if (!(Get-Command terraform -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Terraform..." -ForegroundColor Green
    winget install HashiCorp.Terraform --silent
    Write-Host "Terraform installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Terraform already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Close and reopen your terminal for changes to take effect" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close and reopen your terminal (Git Bash or PowerShell)" -ForegroundColor White
Write-Host "2. Configure AWS credentials: aws configure" -ForegroundColor White
Write-Host "3. Navigate to infrastructure folder: cd infrastructure" -ForegroundColor White
Write-Host "4. Initialize Terraform: terraform init" -ForegroundColor White
Write-Host "5. Deploy infrastructure: terraform apply" -ForegroundColor White
Write-Host ""
