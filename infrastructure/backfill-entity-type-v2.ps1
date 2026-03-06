# Backfill entityType field for existing reports in DynamoDB (with pagination)

Write-Host "Backfilling entityType field for existing reports..." -ForegroundColor Cyan

$updated = 0
$skipped = 0
$lastKey = $null
$hasMore = $true

while ($hasMore) {
    # Build scan command with pagination
    if ($lastKey) {
        $scanCmd = "aws dynamodb scan --table-name whatbreaks-analyses --projection-expression `"id,entityType`" --starting-token `"$lastKey`" --max-items 25"
    } else {
        $scanCmd = "aws dynamodb scan --table-name whatbreaks-analyses --projection-expression `"id,entityType`" --max-items 25"
    }
    
    Write-Host "Scanning batch..." -ForegroundColor Yellow
    $result = Invoke-Expression $scanCmd | ConvertFrom-Json
    
    foreach ($item in $result.Items) {
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
            --key "{`"id`":{`"S`":`"$id`"}}" `
            --update-expression "SET entityType = :entityType" `
            --expression-attribute-values '{":entityType":{"S":"report"}}' `
            --output json | Out-Null
        
        $updated++
    }
    
    # Check if there are more items
    if ($result.NextToken) {
        $lastKey = $result.NextToken
        Write-Host "More items to process..." -ForegroundColor Cyan
    } else {
        $hasMore = $false
    }
}

Write-Host "`nBackfill complete!" -ForegroundColor Green
Write-Host "  Updated: $updated" -ForegroundColor Green
Write-Host "  Skipped: $skipped" -ForegroundColor Yellow
