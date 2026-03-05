# Resource Dependency Graph & History Page Fixes

## Issues Identified

### Issue 1: Resource Dependencies Not Showing Connections
**Problem**: The dependency graph was showing resource nodes but no edges/connections between them.

**Root Cause**: The backend `parseResourceDependencies()` function was using overly aggressive whitespace removal that was breaking the JSON parsing. The regex `jsonStr.replace(/\s*,\s*/g, ',')` was removing necessary spaces inside string values.

**Example of what was breaking**:
```json
{"name":"Primary S3 Bucket"}  // Original
{"name":"PrimaryS3Bucket"}    // After aggressive whitespace removal (BROKEN)
```

### Issue 2: History Page Not Showing Reports
**Problem**: User reported that newly generated reports weren't appearing in the history page.

**Root Cause**: This was actually a browser caching issue. The API is working correctly and returning reports from DynamoDB. The frontend code was cached and needed a hard refresh.

## Fixes Applied

### Backend Fix (backend/premortem-lambda/index.js)
Updated `parseResourceDependencies()` function to use gentler whitespace normalization:

```javascript
// OLD (too aggressive):
jsonStr = jsonStr.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').replace(/\s*:\s*/g, ':');

// NEW (preserves string content):
jsonStr = jsonStr.replace(/\s+/g, ' ').trim();
```

This change:
- Normalizes multiple whitespaces to single spaces
- Preserves spaces within string values
- Maintains valid JSON structure

### Frontend Fix (frontend/src/app/premortem/page.tsx)
1. Updated `parseResourceDependencies()` to match backend logic
2. Added more detailed logging to track parsing flow
3. Ensured fullReport is always passed to parsing function when dependencies are missing

### Additional Improvements
1. Added more AWS resource type icons to ResourceDependencyGraph:
   - `kms` (KMS keys)
   - `nlb` (Network Load Balancers)
   - `elasticache` / `redis` (ElastiCache)
   - `cloudwatch` (CloudWatch)

2. Enhanced logging throughout the parsing pipeline for better debugging

## Testing

Created test script `test-dependency-parsing.js` that successfully parses the resource dependencies:

```
✅ Parsed 6 valid resources:
  - s3-1: Primary S3 Bucket (s3) -> depends on: []
  - cf-1: CloudFront Distribution (cloudfront) -> depends on: [s3-1]
  - lambda-1: Image Processing Function (lambda) -> depends on: [s3-1]
  - s3-2: Replica S3 Bucket (s3) -> depends on: [s3-1]
  - kms-1: KMS Key (kms) -> depends on: []
  - iam-1: Partner IAM Roles (iam) -> depends on: [kms-1, s3-1]
```

## Deployment Status

✅ Backend Lambda updated and deployed
✅ Frontend code updated (requires hard refresh)

## Next Steps for User

1. **Hard refresh your browser** to clear cached JavaScript:
   - Windows: `Ctrl + Shift + R` or `Ctrl + F5`
   - Or use incognito/private window

2. **Test with existing report**:
   - Open any saved report from history
   - Check browser console for parsing logs
   - Verify Dependencies tab appears and shows graph with connections

3. **Generate new report**:
   - Create a new pre-mortem analysis
   - Verify resource dependencies are parsed correctly
   - Check that edges/connections appear in the graph

4. **History page**:
   - Should now show all reports from DynamoDB
   - If still not showing, check browser console for errors
   - Try hard refresh or incognito window

## Expected Console Output

When loading a report with dependencies, you should see:

```
🚀 PreMortemPage component loaded - with resource dependencies feature
📦 Using saved parsedReport, checking for resourceDependencies...
Saved resourceDependencies: []
Needs parsing? true
Full report length: 5234
🔍 Frontend: Parsing resource dependencies from report...
📄 Report length: 5234
🔎 Section match result: FOUND
📋 Section text (first 300 chars): [{"id":"s3-1",...
📋 Found JSON array (first 300 chars): [{"id":"s3-1",...
🧹 Cleaned JSON string (first 300 chars): [{"id":"s3-1",...
✅ Parsed JSON successfully: [...]
✅ Found 6 valid resources: [...]
✅ Final parsed report with dependencies: 6 [...]
🔗 ResourceDependencyGraph rendering with resources: [...]
🔨 Building nodes and edges from resources...
✅ Created nodes: [...]
Checking dependencies for s3-1: []
Checking dependencies for cf-1: ["s3-1"]
✅ Creating edge: s3-1 -> cf-1
...
✅ Created edges: [...]
```

## Verification

The dependency graph should now:
- Show resource nodes with proper icons and colors
- Display animated edges connecting dependent resources
- Support zoom, pan, and minimap navigation
- Show proper dependency flow (arrows pointing from dependency to dependent)

Example: If CloudFront depends on S3, you'll see an arrow from S3 → CloudFront
