# Test script to generate a new report and verify dependency parsing

$apiUrl = "https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com"

$body = @{
    description = "Migrating from ALB to NLB for WebSocket support.

Current Setup:
- Application Load Balancer (ALB) with WebSocket support
- Auto-scaling group with 5 EC2 instances
- Route 53 DNS pointing to ALB
- CloudWatch monitoring and alarms
- Security groups for application layer protection

Proposed Change:
- Replace ALB with Network Load Balancer (NLB)
- Update Route 53 DNS to point to NLB
- Reconfigure auto-scaling to use NLB target groups

Planning to migrate during low-traffic window."
    changeType = "infrastructure"
    currentState = ""
    proposedState = ""
    trafficPatterns = ""
    deepMode = $false
} | ConvertTo-Json

Write-Host "Generating new pre-mortem report..." -ForegroundColor Cyan
Write-Host ""

$response = Invoke-WebRequest -Uri "$apiUrl/premortem" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing

$result = $response.Content | ConvertFrom-Json

Write-Host "✅ Report generated successfully!" -ForegroundColor Green
Write-Host "Report ID: $($result.reportId)" -ForegroundColor Yellow
Write-Host ""

# Check if resource dependencies were parsed
if ($result.parsedReport.resourceDependencies) {
    $depCount = $result.parsedReport.resourceDependencies.Count
    Write-Host "✅ Resource dependencies parsed: $depCount resources" -ForegroundColor Green
    
    if ($depCount -gt 0) {
        Write-Host ""
        Write-Host "Resources:" -ForegroundColor Cyan
        foreach ($resource in $result.parsedReport.resourceDependencies) {
            $deps = $resource.dependencies -join ", "
            if ($deps) {
                Write-Host "  - $($resource.id): $($resource.name) ($($resource.type)) -> depends on: [$deps]" -ForegroundColor White
            } else {
                Write-Host "  - $($resource.id): $($resource.name) ($($resource.type)) -> no dependencies" -ForegroundColor Gray
            }
        }
    }
} else {
    Write-Host "⚠️ No resource dependencies found in parsed report" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "View report at: http://localhost:3000/premortem?id=$($result.reportId)" -ForegroundColor Cyan
