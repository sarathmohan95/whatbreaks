# WhatBreaks - Pre-Mortem Engine Design

## Design Overview

This document describes the technical design for WhatBreaks, an AI-powered pre-mortem engine that uses counterfactual reasoning to simulate infrastructure failures before they occur.

## Architecture Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                         │
│                      (Next.js Frontend)                       │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                     API Layer (Next.js)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /api/premortem                                  │   │
│  │  - Validate input                                     │   │
│  │  - Invoke AI engine                                   │   │
│  │  - Store results                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                   AI Reasoning Engine                          │
│                   (Amazon Bedrock)                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Counterfactual Reasoning Workflow:                   │   │
│  │                                                        │   │
│  │  1. Context Analysis                                  │   │
│  │     - Parse infrastructure change                     │   │
│  │     - Extract key components                          │   │
│  │     - Identify system boundaries                      │   │
│  │                                                        │   │
│  │  2. Failure Assumption                                │   │
│  │     - Assume outage occurred                          │   │
│  │     - Set failure context                             │   │
│  │     - Define severity                                 │   │
│  │                                                        │   │
│  │  3. Timeline Reconstruction                           │   │
│  │     - Work backwards from failure                     │   │
│  │     - Identify triggering event                       │   │
│  │     - Map cascade progression                         │   │
│  │     - Find decision points                            │   │
│  │                                                        │   │
│  │  4. Narrative Generation                              │   │
│  │     - Create structured report                        │   │
│  │     - Write realistic timeline                        │   │
│  │     - Generate preventive actions                     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         │
        ┌────────────────┴────────────────┐
        │                                  │
┌───────▼────────┐              ┌─────────▼────────┐
│   DynamoDB     │              │       S3         │
│                │              │                  │
│ - Pre-mortem   │              │ - PDF reports    │
│   history      │              │ - Archived       │
│ - Metadata     │              │   scenarios      │
│ - User data    │              │                  │
└────────────────┘              └──────────────────┘
```

## AI Prompting Strategy

### Core Principle: Counterfactual Reasoning

Instead of asking "what could go wrong?", we use a counterfactual stance:

**"Assume this infrastructure change was deployed on [date] and caused a complete service outage on [date+time]. Working backwards from this failure, reconstruct the timeline of events that led to the outage."**

### Multi-Stage Prompting Workflow

#### Stage 1: Context Analysis Prompt

```
You are a senior Site Reliability Engineer with 15 years of experience 
analyzing infrastructure failures. You have deep expertise in distributed 
systems, cloud architecture, and failure modes.

TASK: Analyze the following infrastructure change and extract key information.

INFRASTRUCTURE CHANGE:
{user_input}

Extract and structure:
1. Current state (what exists now)
2. Proposed change (what will be different)
3. Key components involved
4. Dependencies (explicit and implicit)
5. Traffic patterns and scale
6. Critical paths
7. Failure domains

Output as structured JSON.
```

#### Stage 2: Failure Assumption Prompt

```
You are conducting a pre-mortem analysis. A pre-mortem assumes that a 
future failure has already occurred and works backwards to understand how.

CONTEXT:
{structured_context_from_stage_1}

COUNTERFACTUAL ASSUMPTION:
The infrastructure change described above was deployed to production on 
{deployment_date} at {deployment_time} UTC. 

Exactly {incident_delay} later, a COMPLETE SERVICE OUTAGE occurred, lasting 
{outage_duration} and affecting {impact_scope}.

TASK: Given this assumed failure, determine:
1. What type of failure occurred (cascading, dependency, capacity, etc.)
2. What was the immediate trigger
3. What hidden dependencies were exposed
4. What assumptions proved incorrect

Output as structured JSON with high realism and technical accuracy.
```

#### Stage 3: Timeline Reconstruction Prompt

```
You are reconstructing the timeline of a production outage that occurred 
due to an infrastructure change.

FAILURE CONTEXT:
{failure_context_from_stage_2}

TASK: Create a detailed minute-by-minute timeline showing how the failure 
unfolded. Work backwards from the complete outage to the initial deployment.

For each event in the timeline:
- Timestamp (relative to deployment)
- What happened
- Why it happened
- What made it worse
- What could have stopped it

Include:
- Initial deployment event
- First sign of trouble
- Cascade trigger points
- System responses (auto-scaling, retries, etc.)
- Human intervention attempts
- Point of no return
- Complete failure state

Make this realistic and technically accurate. Include specific metrics, 
error messages, and system behaviors.

Output as structured timeline JSON.
```

#### Stage 4: Narrative Generation Prompt

```
You are writing a pre-mortem report for an engineering team. This report 
will help them understand how their proposed infrastructure change could 
lead to a production outage.

CONTEXT:
- Infrastructure change: {change_summary}
- Failure type: {failure_type}
- Timeline: {timeline_from_stage_3}

TASK: Write a comprehensive pre-mortem report in the following structure:

## CHANGE SUMMARY
Brief description of the proposed change

## ASSUMED OUTCOME
The outage that occurred (severity, duration, impact)

## TRIGGERING EVENT
What initiated the failure cascade

## HIDDEN DEPENDENCIES
Unexpected connections and assumptions that were exposed

## CASCADE TIMELINE
Detailed progression of the failure with timestamps

## MISSED DECISION POINTS
Where the failure could have been prevented

## SYSTEM COUPLING REVEALED
Fragile assumptions and tight coupling exposed by the failure

## PREVENTIVE ACTIONS
Specific, actionable steps to prevent this scenario

TONE: Professional, technical, realistic. Write as if this actually happened.
Use specific details, metrics, and technical language.

Output as markdown-formatted report.
```

### Prompt Engineering Techniques

#### 1. Role Assignment
- Assign expert persona (Senior SRE, 15 years experience)
- Establishes authority and expertise
- Improves response quality

#### 2. Counterfactual Framing
- "Assume this already happened"
- Forces concrete thinking
- Prevents vague "could happen" language

#### 3. Structured Output
- Request JSON for intermediate stages
- Request Markdown for final report
- Enables parsing and validation

#### 4. Specificity Requirements
- "Include specific metrics"
- "Use technical language"
- "Provide timestamps"
- Prevents generic responses

#### 5. Realism Constraints
- "Make this realistic"
- "Technically accurate"
- "As if this actually happened"
- Improves believability

### Amazon Bedrock Integration

#### Model Selection

**Primary: Claude 3 Sonnet**
- Best balance of quality and cost
- Excellent at reasoning tasks
- Strong technical knowledge
- Good at structured output

**Alternative: Claude 3 Opus**
- Highest quality
- Best for complex scenarios
- Higher cost
- Use for premium tier

**Fallback: Claude 3 Haiku**
- Fastest response
- Lower cost
- Good for simple scenarios
- Use for free tier

#### Bedrock Configuration

```typescript
const bedrockConfig = {
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  region: 'us-east-1',
  
  inferenceConfig: {
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
  },
  
  // For structured output
  additionalModelRequestFields: {
    system: [
      {
        type: 'text',
        text: 'You are a senior SRE conducting pre-mortem analysis...'
      }
    ]
  }
};
```

### Prompt Templates

#### Template Variables

```typescript
interface PromptVariables {
  user_input: string;
  deployment_date: string;
  deployment_time: string;
  incident_delay: string; // "2 hours", "30 minutes"
  outage_duration: string; // "47 minutes", "3 hours"
  impact_scope: string; // "100% of users", "US region"
  change_summary: string;
  failure_type: string;
  timeline: TimelineEvent[];
}
```

#### Dynamic Variable Generation

```typescript
function generateFailureContext(changeType: string): PromptVariables {
  const now = new Date();
  const deploymentDate = addDays(now, 7); // Future deployment
  
  // Vary incident timing based on change type
  const incidentDelay = selectIncidentDelay(changeType);
  const outageDuration = selectOutageDuration(changeType);
  const impactScope = selectImpactScope(changeType);
  
  return {
    deployment_date: format(deploymentDate, 'yyyy-MM-dd'),
    deployment_time: '14:30', // Peak traffic time
    incident_delay: incidentDelay,
    outage_duration: outageDuration,
    impact_scope: impactScope,
  };
}
```

## Data Models

### Input Model

```typescript
interface PreMortemInput {
  // User-provided
  changeDescription: string;
  changeType: 'infrastructure' | 'configuration' | 'code' | 'terraform';
  currentState?: string;
  proposedState?: string;
  
  // Optional context
  trafficPatterns?: string;
  criticalPaths?: string;
  knownDependencies?: string[];
  
  // Metadata
  submittedBy?: string;
  submittedAt: Date;
}
```

### Output Model

```typescript
interface PreMortemReport {
  id: string;
  timestamp: Date;
  
  // Input reference
  input: PreMortemInput;
  
  // Analysis results
  changeSummary: string;
  assumedOutcome: {
    severity: 'minor' | 'major' | 'critical';
    duration: string;
    impact: string;
    affectedUsers: string;
  };
  
  triggeringEvent: {
    description: string;
    timestamp: string; // Relative to deployment
    rootCause: string;
  };
  
  hiddenDependencies: Array<{
    component: string;
    assumption: string;
    reality: string;
    impact: string;
  }>;
  
  cascadeTimeline: Array<{
    timestamp: string;
    event: string;
    cause: string;
    effect: string;
    couldHaveBeenPrevented: boolean;
  }>;
  
  missedDecisions: Array<{
    point: string;
    decision: string;
    consequence: string;
    alternative: string;
  }>;
  
  systemCoupling: Array<{
    assumption: string;
    reality: string;
    fragility: 'low' | 'medium' | 'high';
  }>;
  
  preventiveActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    impact: string;
  }>;
  
  // Full narrative
  fullReport: string; // Markdown
}
```

### Storage Model (DynamoDB)

```typescript
interface PreMortemRecord {
  // Primary key
  id: string; // UUID
  
  // Sort key
  timestamp: number; // Unix timestamp
  
  // User identification (Phase 2)
  userId?: string;
  teamId?: string;
  
  // Input data
  changeDescription: string;
  changeType: string;
  
  // Results
  report: PreMortemReport;
  
  // Metadata
  modelUsed: string; // 'claude-3-sonnet'
  tokensUsed: number;
  processingTime: number; // milliseconds
  
  // Status
  status: 'processing' | 'completed' | 'failed';
  
  // Feedback (Phase 2)
  userRating?: number; // 1-5
  wasAccurate?: boolean;
  actuallyHappened?: boolean;
  
  // TTL for cleanup
  expiresAt?: number;
}
```

## API Design

### POST /api/premortem

**Request:**
```typescript
{
  changeDescription: string;
  changeType?: string;
  currentState?: string;
  proposedState?: string;
  options?: {
    generateMultiple?: boolean; // Phase 2
    scenarioCount?: number; // Phase 2
  }
}
```

**Response:**
```typescript
{
  id: string;
  status: 'processing' | 'completed';
  report?: PreMortemReport;
  estimatedTime?: number; // seconds
}
```

**Error Response:**
```typescript
{
  error: string;
  code: 'INVALID_INPUT' | 'AI_ERROR' | 'RATE_LIMIT' | 'SERVER_ERROR';
  details?: string;
}
```

### GET /api/premortem/:id

**Response:**
```typescript
{
  id: string;
  status: 'processing' | 'completed' | 'failed';
  report?: PreMortemReport;
  error?: string;
}
```

### POST /api/premortem/:id/pdf

**Response:**
Binary PDF file

## UI/UX Design

### Page Flow

```
Landing Page
    ↓
    [Start Pre-Mortem]
    ↓
Input Page
    ↓
    [Submit Change]
    ↓
Processing Page (10-30s)
    ↓
Report Page
    ↓
    [Download PDF] or [New Pre-Mortem]
```

### Input Page Design

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  WhatBreaks                          [Home]     │
├─────────────────────────────────────────────────┤
│                                                  │
│  Simulate Infrastructure Failure                │
│  Describe your proposed change below            │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │ Change Description                     │    │
│  │                                        │    │
│  │ [Large textarea for change input]     │    │
│  │                                        │    │
│  │                                        │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  Change Type: [Dropdown]                        │
│  ○ Infrastructure  ○ Configuration              │
│  ○ Code           ○ Terraform Plan              │
│                                                  │
│  Optional Context (expand)                      │
│  ┌────────────────────────────────────────┐    │
│  │ Current State:                         │    │
│  │ Proposed State:                        │    │
│  │ Traffic Patterns:                      │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  [Generate Pre-Mortem Report]                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Report Page Design

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  WhatBreaks              [Download PDF] [New]   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Pre-Mortem Report                              │
│  Generated: Feb 16, 2026 14:30 UTC              │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │ ⚠️  ASSUMED OUTCOME                    │    │
│  │                                        │    │
│  │ Complete service outage                │    │
│  │ Duration: 47 minutes                   │    │
│  │ Impact: 100% of users                  │    │
│  │ Revenue loss: $250,000                 │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  📋 Change Summary                              │
│  [Change description]                           │
│                                                  │
│  🔥 Triggering Event                            │
│  [What started the failure]                     │
│                                                  │
│  🔗 Hidden Dependencies                         │
│  [Unexpected connections exposed]               │
│                                                  │
│  ⏱️  Cascade Timeline                           │
│  14:23 - Deployment completed                   │
│  14:24 - First errors detected                  │
│  14:25 - Retry storm begins                     │
│  14:27 - Complete service failure               │
│  [...]                                          │
│                                                  │
│  ❌ Missed Decision Points                      │
│  [Where prevention was possible]                │
│                                                  │
│  🛡️  Preventive Actions                         │
│  [What to do differently]                       │
│                                                  │
└─────────────────────────────────────────────────┘
```

## PDF Report Design

### Report Structure

```markdown
# Pre-Mortem Report
**Generated:** [Date/Time]  
**Report ID:** [UUID]

---

## Executive Summary

[2-3 sentence overview of the simulated failure]

---

## Change Summary

**Current State:**
[Description]

**Proposed Change:**
[Description]

**Change Type:** [Infrastructure/Configuration/etc.]

---

## Assumed Outcome

**Severity:** Critical  
**Duration:** 47 minutes  
**Impact:** 100% of users affected  
**Revenue Impact:** $250,000 estimated loss  
**Time to Detection:** 2 minutes  
**Time to Resolution:** 45 minutes  

---

## Triggering Event

[Detailed description of what initiated the failure]

**Root Cause:** [Technical explanation]

---

## Hidden Dependencies

### Dependency 1: [Component Name]
**Assumption:** [What was assumed]  
**Reality:** [What actually happened]  
**Impact:** [How this contributed to failure]

[Repeat for each dependency]

---

## Cascade Timeline

| Time | Event | Cause | Effect |
|------|-------|-------|--------|
| T+0  | Deployment | Change applied | Initial state |
| T+2m | First error | Connection failed | Retry initiated |
| T+5m | Retry storm | Exponential backoff | CPU spike |
| ... | ... | ... | ... |

---

## Missed Decision Points

### Decision Point 1: [When]
**What Happened:** [Description]  
**What Could Have Been Done:** [Alternative]  
**Outcome if Done:** [Result]

[Repeat for each decision point]

---

## System Coupling Revealed

### Coupling 1: [Components]
**Assumption:** [What was believed]  
**Reality:** [What was discovered]  
**Fragility:** High/Medium/Low

[Repeat for each coupling]

---

## Preventive Actions

### High Priority
1. [Action] - [Why] - [Effort: Low/Med/High]
2. [Action] - [Why] - [Effort: Low/Med/High]

### Medium Priority
1. [Action] - [Why] - [Effort: Low/Med/High]

### Low Priority
1. [Action] - [Why] - [Effort: Low/Med/High]

---

## Recommendations

[Summary of key takeaways and next steps]

---

**Disclaimer:** This is a simulated pre-mortem analysis generated by AI. 
Actual outcomes may differ. Use this as a tool for proactive thinking, 
not as a definitive prediction.

---

*Generated by WhatBreaks - AI-Powered Pre-Mortem Engine*  
*Report ID: [UUID]*  
*Model: Claude 3 Sonnet*
```

## Error Handling

### Input Validation

```typescript
function validateInput(input: PreMortemInput): ValidationResult {
  const errors: string[] = [];
  
  // Check description length
  if (input.changeDescription.length < 50) {
    errors.push('Change description too short (min 50 characters)');
  }
  
  if (input.changeDescription.length > 10000) {
    errors.push('Change description too long (max 10,000 characters)');
  }
  
  // Check for meaningful content
  if (!containsTechnicalTerms(input.changeDescription)) {
    errors.push('Description should include technical details');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### AI Error Handling

```typescript
async function generatePreMortem(input: PreMortemInput): Promise<PreMortemReport> {
  try {
    // Stage 1: Context Analysis
    const context = await invokeBedrockWithRetry(
      contextAnalysisPrompt(input),
      { maxRetries: 3 }
    );
    
    // Stage 2: Failure Assumption
    const failure = await invokeBedrockWithRetry(
      failureAssumptionPrompt(context),
      { maxRetries: 3 }
    );
    
    // Stage 3: Timeline Reconstruction
    const timeline = await invokeBedrockWithRetry(
      timelineReconstructionPrompt(failure),
      { maxRetries: 3 }
    );
    
    // Stage 4: Narrative Generation
    const narrative = await invokeBedrockWithRetry(
      narrativeGenerationPrompt(timeline),
      { maxRetries: 3 }
    );
    
    return buildReport(context, failure, timeline, narrative);
    
  } catch (error) {
    if (error instanceof BedrockThrottlingError) {
      throw new AppError('Rate limit exceeded. Please try again in a moment.', 'RATE_LIMIT');
    }
    
    if (error instanceof BedrockValidationError) {
      throw new AppError('Invalid input for AI processing.', 'INVALID_INPUT');
    }
    
    throw new AppError('Failed to generate pre-mortem. Please try again.', 'AI_ERROR');
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
// Cache common change patterns
const promptCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
});

function getCachedPrompt(key: string): string | undefined {
  return promptCache.get(key);
}
```

### Token Optimization

- Use concise system prompts
- Request structured output (JSON) for intermediate stages
- Only generate full narrative in final stage
- Estimated tokens per pre-mortem: 3,000-5,000

### Response Time Targets

- Input validation: < 100ms
- Context analysis: < 5s
- Failure assumption: < 5s
- Timeline reconstruction: < 8s
- Narrative generation: < 10s
- **Total: < 30s**

## Security Considerations

### Input Sanitization

```typescript
function sanitizeInput(input: string): string {
  // Remove potential injection attempts
  return input
    .replace(/<script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}
```

### Rate Limiting

```typescript
const rateLimiter = {
  free: {
    requests: 10,
    window: '1h',
  },
  authenticated: {
    requests: 100,
    window: '1h',
  }
};
```

### Data Privacy

- No PII in change descriptions
- Reports stored with encryption at rest
- TTL on DynamoDB records (90 days)
- Optional anonymous mode

## Monitoring & Observability

### Key Metrics

```typescript
interface Metrics {
  // Performance
  averageProcessingTime: number;
  p95ProcessingTime: number;
  p99ProcessingTime: number;
  
  // Quality
  averageReportLength: number;
  averageTokensUsed: number;
  
  // Business
  reportsGenerated: number;
  pdfDownloads: number;
  userSatisfaction: number;
  
  // Errors
  errorRate: number;
  aiFailureRate: number;
  timeoutRate: number;
}
```

### Logging

```typescript
logger.info('Pre-mortem generation started', {
  requestId,
  changeType,
  inputLength: input.changeDescription.length,
});

logger.info('Pre-mortem generation completed', {
  requestId,
  processingTime,
  tokensUsed,
  reportLength: report.fullReport.length,
});
```

## Testing Strategy

### Unit Tests
- Prompt template generation
- Input validation
- Output parsing
- Error handling

### Integration Tests
- Bedrock API integration
- DynamoDB operations
- S3 storage
- PDF generation

### End-to-End Tests
- Full pre-mortem workflow
- Sample inputs with expected outputs
- Performance benchmarks

### AI Quality Tests
- Realism scoring (manual review)
- Technical accuracy validation
- Narrative coherence checks
- Scenario diversity assessment

---

**Design Status:** Complete  
**Next Step:** Implementation (tasks.md)
