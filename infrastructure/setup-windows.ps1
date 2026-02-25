# Setup script for Windows - Install prerequisites for infrastructure deployment
# Run this script in PowerShell as Administrator

Write-Host "=== WhatBreaks Infrastructure Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Install Chocolatey
Write-Host "Checking for Chocolatey..." -ForegroundColor Yellow
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Green
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "Chocolatey installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Chocolatey already installed" -ForegroundColor Green
}

# Install AWS CLI
Write-Host ""
Write-Host "Checking for AWS CLI..." -ForegroundColor Yellow
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "Installing AWS CLI..." -ForegroundColor Green
    choco install awscli -y
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "AWS CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "AWS CLI already installed" -ForegroundColor Green
}

# Install Terraform
Write-Host ""
Write-Host "Checking for Terraform..." -ForegroundColor Yellow
if (!(Get-Command terraform -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Terraform..." -ForegroundColor Green
    choco install terraform -y
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "Terraform installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Terraform already installed" -ForegroundColor Green
}

# Verify installations
Write-Host ""
Write-Host "=== Verifying Installations ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "AWS CLI version:" -ForegroundColor Yellow
aws --version

Write-Host ""
Write-Host "Terraform version:" -ForegroundColor Yellow
terraform version

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close and reopen your terminal (Git Bash or PowerShell)" -ForegroundColor White
Write-Host "2. Configure AWS credentials: aws configure" -ForegroundColor White
Write-Host "3. Navigate to infrastructure folder: cd infrastructure" -ForegroundColor White
Write-Host "4. Initialize Terraform: terraform init" -ForegroundColor White
Write-Host "5. Deploy infrastructure: terraform apply" -ForegroundColor White
Write-Host ""
