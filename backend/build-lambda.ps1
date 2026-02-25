# Build Lambda deployment package for premortem function

Write-Host "=== Building Lambda Deployment Package ===" -ForegroundColor Cyan
Write-Host ""

$lambdaDir = "$PSScriptRoot\premortem-lambda"
$outputZip = "$PSScriptRoot\premortem-lambda.zip"

# Check if lambda directory exists
if (!(Test-Path $lambdaDir)) {
    Write-Host "ERROR: Lambda directory not found at $lambdaDir" -ForegroundColor Red
    exit 1
}

# Navigate to lambda directory
Push-Location $lambdaDir

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install --production

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Creating deployment package..." -ForegroundColor Yellow

# Remove old zip if exists
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

# Create zip file with all contents
Compress-Archive -Path * -DestinationPath $outputZip -Force

Pop-Location

if (Test-Path $outputZip) {
    $size = (Get-Item $outputZip).Length / 1MB
    Write-Host ""
    Write-Host "SUCCESS: Lambda package created!" -ForegroundColor Green
    Write-Host "Location: $outputZip" -ForegroundColor White
    Write-Host "Size: $([math]::Round($size, 2)) MB" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now run: terraform plan" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Failed to create deployment package" -ForegroundColor Red
    exit 1
}
