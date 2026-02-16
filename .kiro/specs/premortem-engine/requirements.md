# WhatBreaks - Pre-Mortem Engine Requirements

## Project Vision

**Category:** Commercial Solutions

**Big Idea:**
'WhatBreaks' is an AI-powered pre-mortem engine that simulates how cloud systems could fail in the future, before any outage occurs. Instead of reacting to incidents, it uses AI-driven counterfactual reasoning to generate realistic reliability failure scenarios from infrastructure changes.

**Core Concept:**
The system assumes a future outage has already occurred due to a proposed infrastructure change, then reconstructs the failure timeline backwards. This counterfactual reasoning approach exposes hidden risks, cascading effects, and fragile assumptions before deployment.

## What This Is NOT

- ❌ Not a monitoring tool
- ❌ Not a validation system
- ❌ Not an incident analysis tool
- ❌ Not a metrics dashboard
- ❌ Not a real-time alerting system

## What This IS

- ✅ A pre-mortem simulation engine
- ✅ A counterfactual reasoning system
- ✅ A failure narrative generator
- ✅ A preventive reliability workflow
- ✅ A structured "what could go wrong" tool

## User Stories

### US-1: Submit Infrastructure Change
**As a** Platform Engineer  
**I want to** submit a proposed infrastructure change (Terraform plan, config update, architecture description)  
**So that** I can see how it might cause a future outage

**Acceptance Criteria:**
- User can paste infrastructure change description in plain text
- User can paste Terraform plan output
- User can describe configuration changes
- System accepts changes up to 10,000 characters
- Input is validated and stored

### US-2: Generate Pre-Mortem Report
**As an** SRE  
**I want to** receive a structured failure narrative  
**So that** I can understand how the proposed change could lead to an outage

**Acceptance Criteria:**
- System assumes the change caused a future outage
- AI generates a realistic failure timeline
- Report includes:
  - Initial change description
  - Triggering event (what started the failure)
  - Hidden dependencies exposed
  - Cascading effects (how failure spread)
  - Missed decision points (where it could have been prevented)
  - Timeline of failure progression
- Output is human-readable narrative, not metrics
- Report is generated within 30 seconds

### US-3: View Failure Narrative
**As a** Cloud Architect  
**I want to** read a clear, structured failure story  
**So that** I can identify weak assumptions and system coupling

**Acceptance Criteria:**
- Report displays in clear sections
- Timeline shows failure progression
- Cascading effects are visualized
- Decision points are highlighted
- Report is downloadable as PDF
- Narrative is realistic and believable

### US-4: Compare Multiple Scenarios
**As a** Platform Engineer  
**I want to** see different possible failure scenarios for the same change  
**So that** I can understand various risk perspectives

**Acceptance Criteria:**
- System can generate multiple failure scenarios
- Each scenario explores different failure modes
- Scenarios are distinct and non-overlapping
- User can compare scenarios side-by-side
- Most likely scenario is highlighted

### US-5: Store Pre-Mortem History
**As an** SRE Team Lead  
**I want to** access past pre-mortem reports  
**So that** I can review decisions and learn from near-misses

**Acceptance Criteria:**
- Reports are stored in DynamoDB
- User can view history of past pre-mortems
- Reports are searchable by date, change type
- Reports can be shared via link
- History shows if predicted failures actually occurred

## Functional Requirements

### FR-1: Input Processing
- Accept infrastructure change descriptions
- Support Terraform plan format
- Support plain English descriptions
- Parse and extract key components
- Validate input completeness

### FR-2: AI Reasoning Engine
- Use Amazon Bedrock (Claude or similar)
- Implement counterfactual reasoning prompts
- Assume future outage occurred
- Reconstruct failure timeline backwards
- Generate realistic failure narratives
- Focus on reliability-specific scenarios

### FR-3: Pre-Mortem Report Structure
**Required Sections:**
1. **Change Summary** - What was proposed
2. **Assumed Outcome** - The outage that occurred
3. **Triggering Event** - What initiated the failure
4. **Hidden Dependencies** - Unexpected connections exposed
5. **Cascade Timeline** - How failure spread over time
6. **Missed Decisions** - Where prevention was possible
7. **System Coupling** - Fragile assumptions revealed
8. **Preventive Actions** - What to do differently

### FR-4: Failure Scenario Types (MVP Focus)
**Phase 1 - Single Scenario:**
- Cascading failure due to resource exhaustion
- Focus on depth and realism
- Detailed timeline reconstruction

**Phase 2 - Multiple Scenarios:**
- Cascading failures
- Hidden dependency failures
- Configuration drift failures
- Capacity/scaling failures
- Network partition failures

### FR-5: Output Format
- Human-readable narrative prose
- Clear section structure
- Timeline visualization
- Decision point highlights
- Downloadable PDF report
- Shareable link

## Non-Functional Requirements

### NFR-1: Performance
- Pre-mortem generation: < 30 seconds
- Page load time: < 2 seconds
- Support 100 concurrent users

### NFR-2: AWS Services
**Required:**
- Amazon Bedrock (AI reasoning)
- AWS Lambda (serverless compute)
- AWS Step Functions (workflow orchestration)
- Amazon S3 (report storage)
- Amazon DynamoDB (history storage)

**Optional:**
- Amazon CloudFront (CDN)
- AWS API Gateway (API management)

### NFR-3: Cost Optimization
- Use AWS Free Tier where possible
- Bedrock on-demand pricing
- DynamoDB on-demand capacity
- S3 lifecycle policies for old reports
- Lambda memory optimization

### NFR-4: User Experience
- Simple, focused interface
- No unnecessary complexity
- Clear value proposition
- Fast feedback loop
- Professional appearance

## Technical Architecture

### Phase 1 MVP
```
User Input → Lambda → Bedrock (Pre-Mortem AI) → DynamoDB + S3 → Display Report
```

### Phase 2 Enhanced
```
User Input → Step Functions → [
  Bedrock (Scenario 1)
  Bedrock (Scenario 2)
  Bedrock (Scenario 3)
] → Aggregate → DynamoDB + S3 → Display Reports
```

## Success Metrics

### User Engagement
- Pre-mortems generated per day
- Report completion rate
- PDF download rate
- Return user rate

### Quality Metrics
- Failure narrative realism score (user feedback)
- Scenario diversity
- Actionable insights per report
- User satisfaction rating

### Business Metrics
- Prevented outages (self-reported)
- Time saved in reliability planning
- Adoption by teams
- Conversion to paid tier (future)

## Out of Scope (Phase 1)

- Real-time monitoring
- Actual incident analysis
- Automated remediation
- Integration with CI/CD
- Multi-user collaboration
- Team workspaces
- Cost analysis
- Security analysis
- Performance analysis

## Sample Input/Output

### Sample Input
```
Change: Migrating user session storage from Redis single node 
to Redis cluster mode with 3 shards across 3 AZs.

Current: Single Redis node in us-east-1a
Proposed: Redis cluster with 3 shards, one per AZ
Traffic: 10,000 req/sec peak
Session TTL: 30 minutes
```

### Sample Output (Abbreviated)
```
PRE-MORTEM REPORT
Generated: 2026-02-16

CHANGE SUMMARY
Migration from single Redis node to cluster mode with 3 shards.

ASSUMED OUTCOME
Complete service outage lasting 47 minutes during peak traffic.
Affected: 100% of users. Revenue impact: $250,000.

TRIGGERING EVENT
At 14:23 UTC, the Redis cluster was deployed. Application code 
still used single-node connection logic. First write operation 
failed with "MOVED" error, triggering retry storm.

HIDDEN DEPENDENCIES
- Application assumed single-node Redis semantics
- Load balancer health checks didn't test Redis writes
- Session middleware had no cluster-aware fallback
- Monitoring only checked node availability, not cluster state

CASCADE TIMELINE
14:23 - Cluster deployed, app still using old connection
14:24 - First write fails, app retries 3x per request
14:25 - Retry storm overwhelms cluster, CPU spikes to 100%
14:27 - All shards become unresponsive
14:28 - Health checks fail, instances marked unhealthy
14:30 - Auto-scaling triggers, new instances also fail
14:35 - Manual rollback initiated
15:10 - Service restored

MISSED DECISIONS
1. No canary deployment testing cluster mode
2. Application code not updated before infrastructure
3. No Redis cluster compatibility testing
4. Health checks didn't validate cluster operations

PREVENTIVE ACTIONS
- Update application to cluster-aware Redis client first
- Deploy cluster in shadow mode for testing
- Add cluster-specific health checks
- Implement gradual traffic migration
- Test failure scenarios in staging
```

## Design Principles

1. **Counterfactual First** - Always assume failure occurred
2. **Narrative Over Metrics** - Tell stories, not show graphs
3. **Realistic Scenarios** - Believable, detailed timelines
4. **Preventive Focus** - What to do differently
5. **Single Purpose** - Pre-mortem only, nothing else
6. **Fast Feedback** - Results in seconds, not minutes
7. **Human Readable** - Engineers, not machines, are the audience

## Implementation Phases

### Phase 1: MVP (Current Sprint)
- Basic web interface
- Single failure scenario generation
- Structured pre-mortem reports
- PDF download
- Local storage

### Phase 2: Enhanced
- Multiple scenario generation
- DynamoDB history storage
- S3 report storage
- Scenario comparison
- Step Functions orchestration

### Phase 3: Advanced
- Terraform plan parsing
- Configurable risk perspectives
- Team collaboration
- Scenario templates
- Learning from actual incidents

## Questions to Resolve

1. Should we support Terraform plan JSON format in Phase 1?
2. How many scenarios should we generate by default?
3. Should we show probability/likelihood for each scenario?
4. Do we need user authentication in Phase 1?
5. Should reports be public or private by default?

## Dependencies

- Amazon Bedrock access (Claude 3 or similar)
- AWS account with Free Tier
- Next.js 14 framework
- TypeScript
- Tailwind CSS

## Risks

1. **AI Quality** - Scenarios may not be realistic enough
2. **Cost** - Bedrock usage could exceed budget
3. **Complexity** - Counterfactual reasoning is hard
4. **Adoption** - Users may not trust AI-generated scenarios
5. **Scope Creep** - Temptation to add monitoring features

## Mitigation Strategies

1. Extensive prompt engineering and testing
2. Set usage limits and optimize prompts
3. Start with single scenario type, iterate
4. Provide transparency about AI reasoning
5. Strict scope discipline, say no to features

---

**Status:** Draft - Ready for Review  
**Next Steps:** Review requirements, refine scope, begin design phase
