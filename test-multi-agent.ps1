# Test Multi-Agent Bedrock Analysis
$ErrorActionPreference = "Stop"

$apiEndpoint = "https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com"

$testPayload = @{
    description = "Migrating PostgreSQL RDS database from db.t3.medium to db.r6g.xlarge with Multi-AZ enabled"
    changeType = "database-upgrade"
    currentState = "Single-AZ RDS PostgreSQL 14 on db.t3.medium (2 vCPU, 4GB RAM), gp2 storage, no read replicas"
    proposedState = "Multi-AZ RDS PostgreSQL 14 on db.r6g.xlarge (4 vCPU, 32GB RAM), gp3 storage with 3000 IOPS, 1 read replica"
    trafficPatterns = "Peak: 500 concurrent connections, 10K queries/sec. Average: 200 connections, 3K queries/sec. 24/7 operation with batch jobs at 2 AM UTC"
    analysisMode = "deep"
} | ConvertTo-Json

Write-Host "Testing Multi-Agent Pre-Mortem Analysis..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Payload:" -ForegroundColor Yellow
Write-Host $testPayload
Write-Host ""
Write-Host "Sending request to API..." -ForegroundColor Yellow
Write-Host "This may take 60-120 seconds for multi-agent collaboration..." -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$apiEndpoint/premortem" -Method POST -Body $testPayload -ContentType "application/json" -TimeoutSec 180
    
    Write-Host "Analysis Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Report ID: $($response.reportId)" -ForegroundColor Cyan
    Write-Host "Analysis Type: $($response.metadata.analysis_type)" -ForegroundColor Cyan
    Write-Host "Duration: $($response.metadata.duration_seconds)s" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Full Report:" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Gray
    Write-Host $response.fullReport
    Write-Host "============================================" -ForegroundColor Gray
    Write-Host ""
    
    if ($response.risks) {
        Write-Host "Identified Risks: $($response.risks.Count)" -ForegroundColor Yellow
        foreach ($risk in $response.risks) {
            $color = "Gray"
            if ($risk.severity -eq "critical") { $color = "Red" }
            elseif ($risk.severity -eq "major") { $color = "Yellow" }
            elseif ($risk.severity -eq "moderate") { $color = "Cyan" }
            
            Write-Host "  - [$($risk.severity)] $($risk.title) (P:$($risk.probability) I:$($risk.impact))" -ForegroundColor $color
        }
    }
    
    Write-Host ""
    Write-Host "View full report at: $apiEndpoint/reports/$($response.reportId)" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error occurred" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
