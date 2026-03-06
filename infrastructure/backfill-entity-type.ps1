# Backfill entityType field for existing reports in DynamoDB

Write-Host "Backfilling entityType field for existing reports..." -ForegroundColor Cyan

# Scan all items in the table
$items = aws dynamodb scan --table-name whatbreaks-analyses --output json | ConvertFrom-Json

Write-Host "Found $($items.Items.Count) items" -ForegroundColor Yellow

$updated = 0
$skipped = 0

foreach ($item in $items.Items) {
    $id = $item.id.S
    
    # Check if entityType already exists
    if ($item.entityType) {
        Write-Host "  Skipping $id (already has entityType)" -ForegroundColor Gray
        $skipped++
        continue
    }
    
    # Update the item to add entityType
    Write-Host "  Updating $id..." -ForegroundColor Green
    aws dynamodb update-item `
        --table-name whatbreaks-analyses `
        --key "{\"id\":{\"S\":\"$id\"}}" `
        --update-expression "SET entityType = :entityType" `
        --expression-attribute-values '{":entityType":{"S":"report"}}' `
        --output json | Out-Null
    
    $updated++
}

Write-Host "`nBackfill complete!" -ForegroundColor Green
Write-Host "  Updated: $updated" -ForegroundColor Green
Write-Host "  Skipped: $skipped" -ForegroundColor Yellow
