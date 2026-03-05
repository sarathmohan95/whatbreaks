# Fetch the latest report to see the actual format
Write-Host "Fetching latest report..."

$result = aws dynamodb scan `
    --table-name whatbreaks-analyses `
    --region us-east-1 `
    --limit 1 `
    --output json | ConvertFrom-Json

if ($result.Items -and $result.Items.Count -gt 0) {
    $item = $result.Items[0]
    Write-Host "`n=== REPORT ID: $($item.id.S) ===" -ForegroundColor Green
    Write-Host "`n=== FULL REPORT ===" -ForegroundColor Green
    Write-Host $item.fullReport.S
    
    # Save to file for easier inspection
    $item.fullReport.S | Out-File -FilePath "latest-report.txt" -Encoding UTF8
    Write-Host "`nReport saved to latest-report.txt" -ForegroundColor Cyan
} else {
    Write-Host "No reports found" -ForegroundColor Red
}
