#!/usr/bin/env python3
import boto3
import sys

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('whatbreaks-analyses')

print("Backfilling entityType for all reports...")

# Scan all items
response = table.scan(ProjectionExpression='id,entityType')
items = response['Items']

# Handle pagination
while 'LastEvaluatedKey' in response:
    response = table.scan(
        ProjectionExpression='id,entityType',
        ExclusiveStartKey=response['LastEvaluatedKey']
    )
    items.extend(response['Items'])

print(f"Found {len(items)} items")

updated = 0
skipped = 0

for item in items:
    item_id = item['id']
    
    # Skip if already has entityType
    if 'entityType' in item:
        skipped += 1
        continue
    
    print(f"Updating {item_id}...")
    
    try:
        table.update_item(
            Key={'id': item_id},
            UpdateExpression='SET entityType = :et',
            ExpressionAttributeValues={':et': 'report'}
        )
        updated += 1
    except Exception as e:
        print(f"  Error: {e}")

print(f"\nBackfill complete!")
print(f"  Updated: {updated}")
print(f"  Skipped: {skipped}")
