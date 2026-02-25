# Phase 1 Infrastructure Changes Summary

## Overview
These changes add report persistence capabilities to WhatBreaks by enhancing DynamoDB, Lambda, and API Gateway.

## Changes Made

### 1. DynamoDB Table Updates (`aws_dynamodb_table.analyses`)

**Added:**
- New attribute: `userId` (String) - for future multi-user support
- New GSI: `UserIdIndex` - hash_key: userId, range_key: timestamp
- TTL configuration: enabled on `ttl` attribute (90-day retention)

**Impact:**
- Non-breaking change (additive only)
- Existing data remains intact
- New reports will include userId and ttl fields

### 2. Lambda Function Updates (`aws_lambda_function.premortem`)

**Changed:**
- Timeout: 60s → 90s (to accommodate DynamoDB save operation)
- Added environment variable: `ENABLE_SAVE=true`

**Impact:**
- Allows more time for report generation + save
- Feature flag for enabling/disabling save functionality

### 3. API Gateway Routes

**Added:**
- `GET /reports` - List all reports with pagination
- `GET /reports/{id}` - Get single report by ID

**Existing:**
- `POST /premortem` - Generate pre-mortem (unchanged)

**Impact:**
- New endpoints for report retrieval
- Uses same Lambda integration (routing handled in code)
- CORS already configured for GET methods

## Deployment Steps

### Step 1: Review Changes
```powershell
cd infrastructure
terraform plan
```

**Expected Output:**
- DynamoDB table: 1 to modify (add GSI + TTL)
- Lambda function: 1 to modify (timeout + env var)
- API Gateway routes: 2 to add (GET endpoints)

### Step 2: Apply Changes
```powershell
terraform apply
```

**Confirm:** Type `yes` when prompted

### Step 3: Verify Deployment
```powershell
# Test POST endpoint (existing)
Invoke-RestMethod -Uri "https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com/premortem" -Method Post -Body '{"description":"Test change with at least 50 characters to meet minimum requirement"}' -ContentType "application/json"

# Test GET endpoints (new)
Invoke-RestMethod -Uri "https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com/reports" -Method Get

# Test GET single report (replace {id} with actual report ID from above)
Invoke-RestMethod -Uri "https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com/reports/{id}" -Method Get
```

## Rollback Plan

If issues occur:

### Option 1: Disable Save Feature
```powershell
# Update environment variable
# In main.tf, change: ENABLE_SAVE = "false"
terraform apply
```

### Option 2: Full Rollback
```bash
git checkout HEAD~1 infrastructure/main.tf
terraform apply
```

**Note:** DynamoDB GSI and TTL changes are safe to keep even if rolling back other changes.

## Cost Impact

**DynamoDB:**
- GSI: No additional cost (PAY_PER_REQUEST mode)
- TTL: No additional cost (automatic cleanup)

**Lambda:**
- Minimal increase due to longer timeout (only charged for actual execution time)
- Estimated: < $0.01/month additional

**API Gateway:**
- GET requests: Same pricing as POST ($1.00 per million requests)
- Estimated: < $0.10/month for typical usage

**Total Estimated Additional Cost:** < $0.15/month

## Monitoring

After deployment, monitor:
- CloudWatch Logs: `/aws/lambda/whatbreaks-premortem`
- DynamoDB Metrics: Read/Write capacity, throttling
- API Gateway Metrics: 4xx/5xx errors, latency

## Next Steps

After successful deployment:
1. Update Lambda code with save functionality (Backend tasks 4-9)
2. Deploy frontend changes (Frontend tasks 10-15)
3. Test end-to-end flow
4. Set up monitoring dashboards

## Questions?

- DynamoDB GSI creation takes 5-10 minutes
- Lambda updates are immediate
- API Gateway routes are immediate
- No downtime expected during deployment
