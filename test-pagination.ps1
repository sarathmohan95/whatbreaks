# Test pagination for reports API

Write-Host "Testing Reports Pagination..." -ForegroundColor Cyan

# First page
Write-Host "`n=== Page 1 ===" -ForegroundColor Yellow
$page1 = Invoke-RestMethod -Uri "https://dk4zys2azrj6g.cloudfront.net/api/reports?limit=20"
Write-Host "Reports: $($page1.reports.Count)"
Write-Host "Has More: $($page1.hasMore)"
Write-Host "Last Key: $($page1.lastKey)"

if ($page1.hasMore -and $page1.lastKey) {
    # Second page
    Write-Host "`n=== Page 2 ===" -ForegroundColor Yellow
    $page2 = Invoke-RestMethod -Uri "https://dk4zys2azrj6g.cloudfront.net/api/reports?limit=20&lastKey=$($page1.lastKey)"
    Write-Host "Reports: $($page2.reports.Count)"
    Write-Host "Has More: $($page2.hasMore)"
    Write-Host "Last Key: $($page2.lastKey)"
    
    if ($page2.hasMore -and $page2.lastKey) {
        # Third page
        Write-Host "`n=== Page 3 ===" -ForegroundColor Yellow
        $page3 = Invoke-RestMethod -Uri "https://dk4zys2azrj6g.cloudfront.net/api/reports?limit=20&lastKey=$($page2.lastKey)"
        Write-Host "Reports: $($page3.reports.Count)"
        Write-Host "Has More: $($page3.hasMore)"
        Write-Host "Last Key: $($page3.lastKey)"
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Green
$totalShown = $page1.reports.Count
if ($page2) { $totalShown += $page2.reports.Count }
if ($page3) { $totalShown += $page3.reports.Count }
Write-Host "Total reports retrieved: $totalShown"
Write-Host "More pages available: $(if ($page3.hasMore) { 'Yes' } else { 'No' })"
