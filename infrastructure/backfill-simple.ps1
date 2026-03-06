# Simple backfill using AWS CLI batch-write-item

Write-Host "Backfilling entityType for all reports..." -ForegroundColor Cyan

# Get all item IDs
$items = aws dynamodb scan --table-name whatbreaks-analyses --projection-expression "id" --output json | ConvertFrom-Json

Write-Host "Found $($items.Items.Count) items to update" -ForegroundColor Yellow

$count = 0
foreach ($item in $items.Items) {
    $id = $item.id.S
    $count++
    
    Write-Host "[$count/$($items.Items.Count)] Updating $id..." -ForegroundColor Green
    
    # Use proper JSON escaping
    $keyJson = @{
        id = @{ S = $id }
    } | ConvertTo-Json -Compress -Depth 10
    
    $attrJson = @{
        ":entityType" = @{ S = "report" }
    } | ConvertTo-Json -Compress -Depth 10
    
    aws dynamodb update-item `
        --table-name whatbreaks-analyses `
        --key $keyJson `
        --update-expression "SET entityType = :entityType" `
        --expression-attribute-values $attrJson `
        --return-values NONE 2>&1 | Out-Null
}

Write-Host "`nBackfill complete! Updated $count items" -ForegroundColor Green
