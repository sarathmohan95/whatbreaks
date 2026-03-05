# Simple test for resource dependencies

$apiEndpoint = "https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com/premortem"

$testInput = @{
    description = "Adding CloudFront CDN in front of S3 bucket for static website"
    deepMode = $false
}

Write-Host "Generating report..." -ForegroundColor Cyan
$body = $testInput | ConvertTo-Json
$response = Invoke-RestMethod -Uri $apiEndpoint -Method POST -Body $body -ContentType "application/json"

Write-Host "Report ID: $($response.id)" -ForegroundColor Green
Write-Host "URL: http://localhost:3000/premortem?id=$($response.id)" -ForegroundColor Yellow

if ($response.parsedReport.resourceDependencies) {
    Write-Host "Dependencies found: $($response.parsedReport.resourceDependencies.Count)" -ForegroundColor Green
} else {
    Write-Host "No dependencies in response" -ForegroundColor Red
}
