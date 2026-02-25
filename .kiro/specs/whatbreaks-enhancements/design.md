# WhatBreaks Enhancement Features - Design Document

## Phase 1: Report Persistence & History (Foundation)

### Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│  API Gateway │─────▶│   Lambda    │
│  (Next.js)  │      │              │      │  (Node.js)  │
└─────────────┘      └──────────────┘      └─────────────┘
                                                    │
                                                    ▼
                                            ┌─────────────┐
                                            │  DynamoDB   │
                                            │  (Reports)  │
                                            └─────────────┘
```

### 1. DynamoDB Schema Design

#### Table: `whatbreaks-analyses` (Already exists)
**Current Schema:**
- Partition Key: `id` (String)
- GSI: `TimestampIndex` on `timestamp`

**Enhancement Required:**
Add GSI for user-based queries (future-proofing for multi-user support)

**Item Structure:**
```json
{
  "id": "pm-1708704000000",
  "timestamp": "2026-02-23T12:00:00.000Z",
  "userId": "anonymous",
  "input": {
    "description": "...",
    "changeType": "database",
    "currentState": "...",
    "proposedState": "...",
    "trafficPatterns": "..."
  },
  "parsedReport": {
    "severity": "CRITICAL",
    "duration": "4.5 hours",
    "impact": "Complete authentication failure",
    "affected": ["100% of authenticated users", "..."],
    "timeline": [
      {
        "time": "2h:00m",
        "event": "Peak traffic begins",
        "critical": false
      }
    ],
    "preventiveActions": {
      "high": ["..."],
      "medium": ["..."],
      "low": ["..."]
    }
  },
  "fullReport": "# Pre-Mortem Analysis...",
  "metadata": {
    "model": "claude-3-5-sonnet",
    "version": "1.0",
    "processingTimeMs": 12500
  },
  "ttl": 1739836800
}
```

**TTL Strategy:**
- Reports expire after 90 days (configurable)
- TTL attribute: `ttl` (Unix timestamp)

### 2. Lambda Function Updates

#### 2.1 Save Report to DynamoDB

**File:** `backend/premortem-lambda/index.js`

**New Dependencies:**
```json
{
  "@aws-sdk/client-dynamodb": "^3.700.0",
  "@aws-sdk/lib-dynamodb": "^3.700.0"
}
```

**Function Flow:**
1. Generate pre-mortem (existing)
2. Parse report into structured format
3. Save to DynamoDB
4. Return response with saved ID

**Error Handling:**
- If DynamoDB save fails, still return report to user
- Log error for monitoring
- Include `saved: false` in response

#### 2.2 New Lambda Functions

**GET /reports** - List all reports
- Query DynamoDB TimestampIndex
- Pagination support (limit, lastEvaluatedKey)
- Return: id, timestamp, changeSummary, severity, duration

**GET /reports/{id}** - Get single report
- Query by partition key
- Return full report structure

### 3. API Gateway Routes

**New Routes:**
```
POST   /premortem          (existing - enhanced with save)
GET    /reports            (new - list reports)
GET    /reports/{id}       (new - get single report)
```

**CORS Configuration:**
- Allow GET methods
- Same origins as existing

### 4. Frontend Implementation

#### 4.1 API Client

**File:** `frontend/src/lib/api/reports.ts` (new)

```typescript
export interface SavedReport {
  id: string;
  timestamp: string;
  changeSummary: string;
  severity?: string;
  duration?: string;
  input: InfrastructureChange;
  parsedReport: ParsedReport;
  fullReport: string;
}

export async function listReports(limit = 20, lastKey?: string) {
  // Fetch from API Gateway
}

export async function getReport(id: string) {
  // Fetch single report
}
```

#### 4.2 History Page

**File:** `frontend/src/app/history/page.tsx` (new)

**Components:**
- Report list with cards
- Severity badges
- Date formatting
- Pagination controls
- Search/filter (future)

**Layout:**
```
┌─────────────────────────────────────┐
│  Navigation Bar                     │
├─────────────────────────────────────┤
│  Pre-Mortem History                 │
│  ┌─────────────────────────────┐   │
│  │ Report Card                 │   │
│  │ - Timestamp                 │   │
│  │ - Change Summary            │   │
│  │ - Severity Badge            │   │
│  │ - Duration                  │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Report Card                 │   │
│  └─────────────────────────────┘   │
│  [Load More]                        │
└─────────────────────────────────────┘
```

#### 4.3 Enhanced Pre-Mortem Page

**File:** `frontend/src/app/premortem/page.tsx` (modify)

**Changes:**
- Accept `id` query parameter
- If `id` present, fetch from API instead of localStorage
- Add "Share" button with copyable URL
- Show "Saved" indicator

#### 4.4 Navigation Updates

**Files to modify:**
- `frontend/src/app/page.tsx` - Add History link
- `frontend/src/app/analyze/page.tsx` - Add History link
- All pages - Consistent nav bar

### 5. Data Flow

#### 5.1 Generate & Save Flow
```
User submits form
    ↓
Frontend → API Gateway → Lambda
    ↓
Lambda generates report
    ↓
Lambda parses report
    ↓
Lambda saves to DynamoDB
    ↓
Lambda returns report + ID
    ↓
Frontend redirects to /premortem?id={id}
```

#### 5.2 View History Flow
```
User visits /history
    ↓
Frontend → API Gateway → Lambda
    ↓
Lambda queries DynamoDB (TimestampIndex)
    ↓
Lambda returns list
    ↓
Frontend displays cards
```

#### 5.3 View Saved Report Flow
```
User clicks report card
    ↓
Frontend → /premortem?id={id}
    ↓
Frontend → API Gateway → Lambda
    ↓
Lambda gets item from DynamoDB
    ↓
Lambda returns full report
    ↓
Frontend displays interactive report
```

### 6. Infrastructure Changes Required

⚠️ **INFRASTRUCTURE DEPLOYMENT NEEDED**

#### 6.1 DynamoDB Updates
**File:** `infrastructure/main.tf`

**Changes:**
- Add GSI for `userId` (future-proofing)
- Enable TTL on `ttl` attribute
- No breaking changes to existing table

#### 6.2 Lambda Updates
**File:** `infrastructure/main.tf`

**Changes:**
- Update Lambda package with new dependencies
- Increase timeout to 90 seconds (for save operation)
- Add environment variable: `ENABLE_SAVE=true`

#### 6.3 API Gateway Updates
**File:** `infrastructure/main.tf`

**New Resources:**
- `aws_apigatewayv2_route.list_reports` (GET /reports)
- `aws_apigatewayv2_route.get_report` (GET /reports/{id})
- `aws_apigatewayv2_integration.lambda_get` (for GET methods)

#### 6.4 IAM Permissions
**Already configured** - Lambda already has DynamoDB permissions

### 7. Testing Strategy

#### 7.1 Unit Tests
- Parse report function
- DynamoDB save logic
- Error handling

#### 7.2 Integration Tests
- End-to-end report generation and save
- List reports pagination
- Get single report

#### 7.3 Manual Testing Checklist
- [ ] Generate report and verify saved to DynamoDB
- [ ] View history page with multiple reports
- [ ] Click report card and view full report
- [ ] Share URL and verify it loads
- [ ] Test pagination with 20+ reports
- [ ] Verify TTL is set correctly
- [ ] Test error handling (DynamoDB unavailable)

### 8. Monitoring & Observability

**CloudWatch Metrics:**
- Report save success rate
- Report save latency
- DynamoDB read/write capacity
- API Gateway 4xx/5xx errors

**CloudWatch Alarms:**
- Report save failure rate > 5%
- DynamoDB throttling
- Lambda errors

**Logs:**
- Log every save operation
- Log DynamoDB errors
- Log report ID for tracing

### 9. Performance Considerations

**DynamoDB:**
- Use PAY_PER_REQUEST billing (already configured)
- GSI for efficient queries
- Batch operations for future bulk operations

**Lambda:**
- Async save to DynamoDB (don't block response)
- Connection pooling for DynamoDB client
- Reuse client across invocations

**Frontend:**
- Lazy load history page
- Virtual scrolling for large lists (future)
- Cache reports in memory

### 10. Security Considerations

**Data Privacy:**
- No PII in reports (user responsibility)
- Reports accessible by anyone with ID (no auth yet)
- Consider signed URLs for future

**Input Validation:**
- Validate report ID format
- Sanitize user inputs
- Rate limiting on API Gateway

### 11. Migration Strategy

**Phase 1.1: Deploy Infrastructure**
1. Update DynamoDB table (add GSI, enable TTL)
2. Deploy updated Lambda with save logic
3. Deploy new API Gateway routes
4. Test with Postman/curl

**Phase 1.2: Deploy Frontend**
1. Deploy history page
2. Update navigation
3. Test end-to-end flow

**Phase 1.3: Rollout**
1. Monitor CloudWatch metrics
2. Verify reports being saved
3. Check for errors

**Rollback Plan:**
- Frontend: Revert to localStorage only
- Backend: Disable save with feature flag
- Infrastructure: No rollback needed (additive changes)

### 12. Future Enhancements (Phase 2+)

**From saved reports:**
- Risk scoring analysis
- Template generation from reports
- Trend analysis across reports
- Compare multiple reports
- Export to various formats

### 13. Open Questions

1. **User Authentication:** When to add? (Defer to later phase)
2. **Report Retention:** 90 days sufficient? (Configurable via env var)
3. **Search/Filter:** Include in Phase 1? (Defer to Phase 2)
4. **Report Sharing:** Public vs. private? (Public for now, no auth)

### 14. Success Criteria

- ✅ 100% of reports saved to DynamoDB
- ✅ History page loads in < 2 seconds
- ✅ No data loss during save failures
- ✅ Users can access reports via URL
- ✅ Pagination works with 100+ reports

---

## Implementation Notes

**Estimated Effort:** 2-3 days
- Backend: 1 day
- Frontend: 1 day
- Testing & deployment: 0.5 day

**Dependencies:**
- None (foundational phase)

**Risks:**
- DynamoDB throttling with high volume (mitigated by PAY_PER_REQUEST)
- Large reports exceeding item size limit (400KB) - monitor and add S3 fallback if needed


---

## Phase 2: Risk Scoring & Templates

### Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│  API Gateway │─────▶│   Lambda    │
│  (Next.js)  │      │              │      │  (Node.js)  │
└─────────────┘      └──────────────┘      └─────────────┘
       │                                            │
       │                                            ▼
       │                                    ┌─────────────┐
       │                                    │  DynamoDB   │
       │                                    │  Templates  │
       │                                    └─────────────┘
       │
       ▼
┌─────────────┐
│  Templates  │
│  (Static)   │
└─────────────┘
```

### 1. Risk Scoring System

#### 1.1 Enhanced AI Prompt

**Modification:** Update the Bedrock prompt to request risk scoring

**New Prompt Section:**
```
For each identified risk, provide:
- Risk Title (short, descriptive)
- Risk Description (detailed explanation)
- Probability Score (1-10): How likely is this to occur?
- Impact Score (1-10): How severe would the impact be?
- Category (technical/operational/business)
- Mitigation Strategy

Format as JSON within the report for parsing.
```

#### 1.2 Risk Data Model

**Enhanced Report Structure:**
```json
{
  "parsedReport": {
    "risks": [
      {
        "id": "risk-1",
        "title": "Redis cluster mode incompatibility",
        "description": "redis-py client doesn't support cluster operations",
        "probability": 8,
        "impact": 9,
        "riskScore": 72,
        "category": "technical",
        "mitigation": "Switch to RedisCluster() client class",
        "relatedActions": ["high-1", "high-2"]
      }
    ],
    "overallRiskScore": 72,
    "riskLevel": "CRITICAL"
  }
}
```

**Risk Score Calculation:**
- Risk Score = Probability × Impact (1-100)
- Overall Risk Score = Weighted average of top 3 risks
- Risk Level: 
  - 1-25: LOW (green)
  - 26-50: MODERATE (yellow)
  - 51-75: HIGH (orange)
  - 76-100: CRITICAL (red)

#### 1.3 Risk Matrix Visualization

**Component:** `frontend/src/components/RiskMatrix.tsx`

**Visual Design:**
```
Impact (10)  │ [M] [H] [C]
             │ [L] [M] [H]
             │ [L] [L] [M]
             └─────────────
                Probability (10)

Legend:
[L] = Low (1-25)
[M] = Moderate (26-50)
[H] = High (51-75)
[C] = Critical (76-100)
```

**Implementation:**
- 10x10 grid using CSS Grid
- Plot risks as circles sized by impact
- Color-coded by risk level
- Hover shows risk details
- Click to highlight related preventive actions

#### 1.4 Risk-Sorted Preventive Actions

**Enhancement:** Sort preventive actions by associated risk scores

**Display:**
```
High Priority Actions (Risk Score: 72)
├─ Switch to RedisCluster() client [Risk: 72]
├─ Modify flask-session for cluster mode [Risk: 68]
└─ Rewrite rate limiting [Risk: 65]

Medium Priority Actions (Risk Score: 45)
└─ Separate session storage [Risk: 45]
```

### 2. Template Library

#### 2.1 Template Data Model

**Storage:** Static JSON files + DynamoDB for custom templates

**Template Structure:**
```json
{
  "id": "template-redis-migration",
  "name": "Redis Single Node to Cluster Migration",
  "category": "database",
  "description": "Template for migrating from single Redis node to cluster mode",
  "tags": ["redis", "database", "migration", "clustering"],
  "difficulty": "advanced",
  "estimatedTime": "4-6 hours",
  "template": {
    "description": "Migrating user session storage from Redis single node to Redis cluster mode with {shardCount} shards across {azCount} availability zones.\n\nCurrent: Single Redis node in {currentAZ}, {currentThroughput} req/sec peak\nProposed: Redis cluster with {shardCount} shards, one per AZ",
    "changeType": "infrastructure",
    "currentState": "Single Redis {version} node\n- Instance type: {instanceType}\n- AZ: {currentAZ}\n- Peak throughput: {currentThroughput} req/sec\n- Data size: {dataSize}",
    "proposedState": "Redis cluster mode\n- {shardCount} shards\n- {azCount} availability zones\n- Replication factor: {replicationFactor}\n- Same instance type: {instanceType}",
    "trafficPatterns": "Peak traffic: {peakTraffic} req/sec\nAverage: {avgTraffic} req/sec\nDaily pattern: {trafficPattern}"
  },
  "parameters": [
    {
      "key": "shardCount",
      "label": "Number of Shards",
      "type": "number",
      "default": 3,
      "min": 2,
      "max": 10
    },
    {
      "key": "azCount",
      "label": "Availability Zones",
      "type": "number",
      "default": 3,
      "min": 2,
      "max": 6
    },
    {
      "key": "currentAZ",
      "label": "Current AZ",
      "type": "select",
      "options": ["us-east-1a", "us-east-1b", "us-east-1c"],
      "default": "us-east-1a"
    },
    {
      "key": "currentThroughput",
      "label": "Current Throughput (req/sec)",
      "type": "number",
      "default": 10000
    },
    {
      "key": "version",
      "label": "Redis Version",
      "type": "text",
      "default": "7.0"
    },
    {
      "key": "instanceType",
      "label": "Instance Type",
      "type": "select",
      "options": ["cache.r6g.large", "cache.r6g.xlarge", "cache.r6g.2xlarge"],
      "default": "cache.r6g.large"
    }
  ],
  "relatedTemplates": ["template-redis-failover", "template-elasticache-upgrade"],
  "metadata": {
    "author": "WhatBreaks",
    "version": "1.0",
    "createdAt": "2026-02-24T00:00:00Z",
    "usageCount": 0
  }
}
```

#### 2.2 Built-in Templates

**Categories:**
1. **Database** (5 templates)
   - Redis single → cluster migration
   - PostgreSQL version upgrade
   - RDS multi-AZ failover
   - DynamoDB on-demand → provisioned
   - MongoDB replica set expansion

2. **Kubernetes** (3 templates)
   - Cluster version upgrade
   - Node group scaling
   - Ingress controller migration

3. **Networking** (3 templates)
   - VPC peering setup
   - Load balancer migration (ALB → NLB)
   - DNS provider change

4. **Storage** (2 templates)
   - S3 bucket replication
   - EBS volume type change

5. **Compute** (2 templates)
   - EC2 instance type change
   - Lambda runtime upgrade

**Storage Location:** `frontend/public/templates/` (static JSON files)

#### 2.3 Template Library Page

**Route:** `/templates`

**File:** `frontend/src/app/templates/page.tsx`

**Layout:**
```
┌─────────────────────────────────────────┐
│  Template Library                       │
├─────────────────────────────────────────┤
│  [Search] [Filter by Category ▼]       │
├─────────────────────────────────────────┤
│  Database (5)                           │
│  ┌───────────────────────────────┐     │
│  │ Redis Migration               │     │
│  │ Single node → Cluster         │     │
│  │ Difficulty: Advanced          │     │
│  │ [Use Template]                │     │
│  └───────────────────────────────┘     │
│  ┌───────────────────────────────┐     │
│  │ PostgreSQL Upgrade            │     │
│  └───────────────────────────────┘     │
│                                         │
│  Kubernetes (3)                         │
│  ...                                    │
└─────────────────────────────────────────┘
```

**Features:**
- Category filtering
- Search by name/tags
- Difficulty badges
- Usage count
- Preview template
- "Use Template" button → navigate to analyze page with pre-filled form

#### 2.4 Template Parameter Form

**Component:** `frontend/src/components/TemplateParameterForm.tsx`

**Flow:**
1. User clicks "Use Template"
2. Modal/page shows parameter form
3. User fills in parameters
4. System replaces placeholders in template
5. Navigate to analyze page with filled form

**Example:**
```
Template: Redis Migration
─────────────────────────
Number of Shards: [3]
Availability Zones: [3]
Current AZ: [us-east-1a ▼]
Current Throughput: [10000] req/sec
Redis Version: [7.0]
Instance Type: [cache.r6g.large ▼]

[Generate Analysis]
```

### 3. Custom Templates

#### 3.1 DynamoDB Schema

**Table:** `whatbreaks-templates` (new)

**Schema:**
```
Partition Key: id (String)
Sort Key: userId (String)
GSI: UserIdIndex on userId

Attributes:
- id: "template-{timestamp}"
- userId: "anonymous" (or actual user ID when auth added)
- name: "My Custom Redis Template"
- category: "database"
- description: "..."
- template: { ... }
- parameters: [ ... ]
- isPublic: false
- createdAt: "2026-02-24T..."
- updatedAt: "2026-02-24T..."
- usageCount: 0
```

#### 3.2 API Endpoints

**New Routes:**
```
POST   /templates              - Create custom template
GET    /templates              - List all templates (built-in + custom)
GET    /templates/{id}         - Get single template
PUT    /templates/{id}         - Update custom template
DELETE /templates/{id}         - Delete custom template
POST   /templates/{id}/use     - Increment usage count
```

#### 3.3 Save as Template Feature

**Location:** Analyze page

**Flow:**
1. User fills out analyze form
2. Clicks "Save as Template" button
3. Modal appears:
   ```
   Save as Template
   ────────────────
   Template Name: [_____________]
   Category: [Database ▼]
   Description: [_____________]
   
   Parameters to extract:
   ☑ Shard count (found: 3)
   ☑ AZ count (found: 3)
   ☑ Throughput (found: 10000)
   
   [Save Template]
   ```
4. System analyzes form content
5. Suggests parameters based on numbers/values
6. User confirms and saves
7. Template saved to DynamoDB

#### 3.4 Template Management Page

**Route:** `/templates/my-templates`

**Features:**
- List user's custom templates
- Edit template
- Delete template
- Duplicate template
- Export template (JSON download)
- Import template (JSON upload)

### 4. Frontend Components

#### 4.1 Risk Matrix Component

**File:** `frontend/src/components/RiskMatrix.tsx`

**Props:**
```typescript
interface RiskMatrixProps {
  risks: Risk[];
  onRiskClick?: (risk: Risk) => void;
}
```

**Features:**
- Interactive grid
- Hover tooltips
- Click to highlight
- Responsive design

#### 4.2 Risk Card Component

**File:** `frontend/src/components/RiskCard.tsx`

**Display:**
```
┌─────────────────────────────────┐
│ ⚠️ Redis Cluster Incompatibility│
│ Risk Score: 72 (CRITICAL)       │
├─────────────────────────────────┤
│ Probability: ████████░░ 8/10    │
│ Impact:      █████████░ 9/10    │
├─────────────────────────────────┤
│ redis-py client doesn't support │
│ cluster operations...           │
├─────────────────────────────────┤
│ Mitigation:                     │
│ • Switch to RedisCluster()      │
│ • Test in staging first         │
└─────────────────────────────────┘
```

#### 4.3 Template Card Component

**File:** `frontend/src/components/TemplateCard.tsx`

**Display:**
```
┌─────────────────────────────────┐
│ 🗄️ Redis Migration              │
│ Single node → Cluster           │
├─────────────────────────────────┤
│ Category: Database              │
│ Difficulty: ⭐⭐⭐ Advanced      │
│ Used: 127 times                 │
├─────────────────────────────────┤
│ [Preview] [Use Template]        │
└─────────────────────────────────┘
```

### 5. Backend Implementation

#### 5.1 Enhanced Report Parsing

**File:** `backend/premortem-lambda/index.js`

**New Function:** `parseRisks(report)`

```javascript
function parseRisks(report) {
  // Extract risk information from AI response
  // Parse probability and impact scores
  // Calculate risk scores
  // Categorize risks
  // Link to preventive actions
  return risks;
}
```

**Enhanced Prompt:**
Add risk scoring section to AI prompt requesting structured risk data.

#### 5.2 Template CRUD Operations

**File:** `backend/premortem-lambda/templates.js` (new)

**Functions:**
- `createTemplate(userId, template)`
- `listTemplates(userId, includeBuiltIn)`
- `getTemplate(id)`
- `updateTemplate(id, userId, updates)`
- `deleteTemplate(id, userId)`
- `incrementUsageCount(id)`

#### 5.3 Template Parameter Substitution

**Function:** `applyTemplateParameters(template, parameters)`

```javascript
function applyTemplateParameters(template, parameters) {
  let result = template.description;
  for (const [key, value] of Object.entries(parameters)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}
```

### 6. Infrastructure Changes

#### 6.1 New DynamoDB Table

**File:** `infrastructure/main.tf`

**Resource:** `aws_dynamodb_table.templates`

```hcl
resource "aws_dynamodb_table" "templates" {
  name           = "${var.project_name}-templates"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  range_key      = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  tags = var.common_tags
}
```

#### 6.2 Lambda Environment Variables

**Add:**
- `TEMPLATES_TABLE=whatbreaks-templates`

#### 6.3 IAM Permissions

**Update Lambda role to include:**
- `dynamodb:PutItem` on templates table
- `dynamodb:GetItem` on templates table
- `dynamodb:Query` on templates table
- `dynamodb:UpdateItem` on templates table
- `dynamodb:DeleteItem` on templates table

### 7. Data Flow

#### 7.1 Risk Scoring Flow

```
User submits analysis
    ↓
Lambda generates report with risk scoring
    ↓
Lambda parses risks from AI response
    ↓
Lambda calculates risk scores
    ↓
Lambda returns enhanced report
    ↓
Frontend displays risk matrix + cards
```

#### 7.2 Template Usage Flow

```
User browses templates
    ↓
User selects template
    ↓
User fills parameter form
    ↓
Frontend substitutes parameters
    ↓
Frontend navigates to analyze page
    ↓
Form pre-filled with template content
    ↓
User generates analysis
```

#### 7.3 Save Custom Template Flow

```
User fills analyze form
    ↓
User clicks "Save as Template"
    ↓
Frontend extracts parameters
    ↓
User confirms template details
    ↓
Frontend → API Gateway → Lambda
    ↓
Lambda saves to DynamoDB
    ↓
Template available in library
```

### 8. Testing Strategy

#### 8.1 Risk Scoring Tests
- Verify risk score calculation
- Test risk level categorization
- Validate risk matrix rendering
- Test risk-action linking

#### 8.2 Template Tests
- Test parameter substitution
- Verify template CRUD operations
- Test built-in template loading
- Validate custom template save/load

#### 8.3 Integration Tests
- End-to-end template usage
- Risk scoring in generated reports
- Template parameter edge cases

### 9. Performance Considerations

**Risk Matrix:**
- Render only visible risks (virtual scrolling)
- Debounce hover events
- Cache risk calculations

**Templates:**
- Load built-in templates from static files (fast)
- Cache template list in memory
- Lazy load template details

**DynamoDB:**
- Use batch operations for template lists
- Cache frequently used templates

### 10. Migration Strategy

**Phase 2.1: Risk Scoring**
1. Update AI prompt
2. Deploy enhanced parsing logic
3. Update frontend to display risks
4. Test with existing reports

**Phase 2.2: Built-in Templates**
1. Create template JSON files
2. Deploy template library page
3. Test template usage flow

**Phase 2.3: Custom Templates**
1. Deploy DynamoDB table
2. Deploy template CRUD APIs
3. Deploy template management UI
4. Test save/load/edit flow

### 11. Success Criteria

- ✅ Risk scores displayed for all new reports
- ✅ Risk matrix renders correctly
- ✅ 15+ built-in templates available
- ✅ Users can create custom templates
- ✅ Template usage reduces form fill time by 50%
- ✅ Risk-sorted actions improve prioritization

### 12. Future Enhancements

**Risk Scoring:**
- Historical risk accuracy tracking
- Machine learning risk prediction
- Risk trend analysis

**Templates:**
- Community template sharing
- Template versioning
- Template recommendations based on usage
- AI-generated templates from reports

---

## Implementation Notes

**Estimated Effort:** 4-5 days
- Risk Scoring: 1.5 days
- Built-in Templates: 1 day
- Custom Templates: 1.5 days
- Testing & polish: 1 day

**Dependencies:**
- Phase 1 must be complete
- DynamoDB table for templates

**Risks:**
- AI prompt changes may affect report quality
- Template parameter extraction complexity
- Risk score accuracy validation
