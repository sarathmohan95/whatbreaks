# Backfill entityType for all reports

Write-Host "Backfilling entityType for all reports..." -ForegroundColor Cyan

# Get all item IDs
$items = aws dynamodb scan --table-name whatbreaks-analyses --projection-expression "id,entityType" --output json | ConvertFrom-Json

Write-Host "Found $($items.Items.Count) items" -ForegroundColor Yellow

$updated = 0
$skipped = 0

foreach ($item in $items.Items) {
    $id = $item.id.S
    
    # Skip if already has entityType
    if ($item.entityType) {
        $skipped++
        continue
    }
    
    Write-Host "Updating $id..." -ForegroundColor Green
    
    # Use simpler syntax
    aws dynamodb update-item `
        --table-name whatbreaks-analyses `
        --key "{`"id`":{`"S`":`"$id`"}}" `
        --update-expression "SET entityType = :et" `
        --expression-attribute-values "{`":et`":{`"S`":`"report`"}}" `
        --return-values NONE
    
    if ($LASTEXITCODE -eq 0) {
        $updated++
    }
}

Write-Host "`nBackfill complete!" -ForegroundColor Green
Write-Host "  Updated: $updated" -ForegroundColor Green
Write-Host "  Skipped: $skipped" -ForegroundColor Yellow
