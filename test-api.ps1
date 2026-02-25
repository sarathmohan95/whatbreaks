# Test WhatBreaks API Endpoint

$apiUrl = "https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com/premortem"

Write-Host "Testing WhatBreaks API..." -ForegroundColor Cyan
Write-Host "Endpoint: $apiUrl" -ForegroundColor Yellow
Write-Host ""

$body = @{
    description = "We are migrating our main PostgreSQL database from a single m5.large instance to a multi-AZ RDS cluster with read replicas. The migration involves changing connection strings across 15 microservices, updating the application configuration, and switching DNS records during a maintenance window."
    changeType = "database"
    currentState = "Single m5.large RDS instance in us-east-1a"
    proposedState = "Multi-AZ RDS cluster with 2 read replicas across us-east-1a, us-east-1b, us-east-1c"
    trafficPatterns = "Peak traffic: 10,000 requests/minute during business hours (9 AM - 6 PM EST)"
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json" -TimeoutSec 90
    
    Write-Host ""
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
} catch {
    Write-Host ""
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
