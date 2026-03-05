# Test script to generate a report with resource dependencies

$apiEndpoint = "https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com/premortem"

$description = "I'm migrating our static website from a single S3 bucket to a CloudFront distribution for better performance.

Current Setup:
- S3 bucket serving static website directly
- Public bucket with website hosting enabled
- Route53 pointing directly to S3 website endpoint
- No CDN or caching layer

Proposed Change:
- Create CloudFront distribution
- Point CloudFront origin to S3 bucket
- Create ACM certificate for HTTPS
- Update Route53 to point to CloudFront
- Make S3 bucket private with OAI access

This is a simple change to add CloudFront in front of our S3 bucket for better global performance."

$testInput = @{
    description = $description
    currentState = "S3 bucket with public website hosting"
    proposedState = "CloudFront + S3 with OAI"
    trafficPatterns = "10,000 requests/day, mostly static HTML/CSS/JS files"
    deepMode = $false
}

Write-Host "Generating pre-mortem report with resource dependencies..." -ForegroundColor Cyan
Write-Host ""

$body = $testInput | ConvertTo-Json -Depth 10
$response = Invoke-RestMethod -Uri $apiEndpoint -Method POST -Body $body -ContentType "application/json"

Write-Host "Report generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Report ID: $($response.id)" -ForegroundColor Yellow
Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Yellow
Write-Host ""

# Check if resource dependencies were found
if ($response.parsedReport.resourceDependencies -and $response.parsedReport.resourceDependencies.Count -gt 0) {
    Write-Host "Resource Dependencies Found: $($response.parsedReport.resourceDependencies.Count) resources" -ForegroundColor Green
    foreach ($resource in $response.parsedReport.resourceDependencies) {
        Write-Host "   - $($resource.name) ($($resource.type))" -ForegroundColor Gray
    }
} else {
    Write-Host "No resource dependencies found in response" -ForegroundColor Yellow
}

Write-Host ""
$reportId = $response.id
Write-Host "View report at: http://localhost:3000/premortem?id=$reportId" -ForegroundColor Cyan
