# WhatBreaks Enhancement Features - Requirements

## Overview
Enhance WhatBreaks with advanced features including risk scoring, AWS infrastructure integration, multi-model analysis, dependency mapping, simulation testing, templates, interactive timeline, PDF generation, and report persistence.

## Phase 1: Report Persistence & History (Foundation)

### 1.1 Save Reports to DynamoDB
**As a** user  
**I want** my pre-mortem reports automatically saved to DynamoDB  
**So that** I can access them later and build a history of analyses

**Acceptance Criteria:**
- Reports are saved to DynamoDB immediately after generation
- Each report has a unique ID and timestamp
- Reports include full JSON structure with all parsed data
- Save operation doesn't block the user experience

### 1.2 Report History Page
**As a** user  
**I want** to view all my previously generated reports  
**So that** I can reference past analyses and track patterns

**Acceptance Criteria:**
- New page at `/history` showing list of all reports
- Reports sorted by date (newest first)
- Display: timestamp, change summary, severity, duration
- Click to view full report details
- Pagination for large lists (20 per page)

### 1.3 View Saved Report
**As a** user  
**I want** to view a previously saved report  
**So that** I can review past analyses

**Acceptance Criteria:**
- Click on history item loads full report
- Same interactive UI as current pre-mortem page
- URL includes report ID for sharing
- "Back to History" navigation

---

## Phase 2: Risk Scoring & Templates

### 2.1 Risk Scoring System
**As a** user  
**I want** quantified risk scores for each identified risk  
**So that** I can prioritize preventive actions objectively

**Acceptance Criteria:**
- Each risk has probability score (1-10)
- Each risk has impact score (1-10)
- Overall risk score = probability × impact
- Visual risk matrix (heat map)
- Risks color-coded by score (green/yellow/orange/red)
- Sort preventive actions by risk score

### 2.2 Template Library
**As a** user  
**I want** pre-built templates for common infrastructure changes  
**So that** I can quickly generate analyses without writing descriptions from scratch

**Acceptance Criteria:**
- Template library page at `/templates`
- Categories: Database, Kubernetes, Networking, Storage, Compute
- Each template includes:
  - Pre-filled description
  - Common parameters
  - Example values
- "Use Template" button fills analyze form
- At least 10 templates covering common scenarios

### 2.3 Custom Templates
**As a** user  
**I want** to save my own custom templates  
**So that** I can reuse common change patterns in my organization

**Acceptance Criteria:**
- "Save as Template" button on analyze page
- Template name and description fields
- Templates saved to DynamoDB per user
- Edit/delete custom templates
- Share templates via export/import

---

## Phase 3: AWS Infrastructure Integration

### 3.1 Terraform Plan Parser
**As a** user  
**I want** to upload a Terraform plan file  
**So that** the system auto-generates change descriptions

**Acceptance Criteria:**
- File upload on analyze page (`.tfplan`, `.json`)
- Parse Terraform plan JSON format
- Extract: resources being created/modified/destroyed
- Auto-generate change description from plan
- Show resource count and types
- Support for common AWS resources (EC2, RDS, S3, Lambda, etc.)

### 3.2 AWS Config Integration
**As a** user  
**I want** to analyze my current AWS infrastructure  
**So that** I can assess risks in existing deployments

**Acceptance Criteria:**
- AWS credentials configuration (IAM role or keys)
- Select AWS region
- Fetch current infrastructure state
- Analyze specific resources or entire account
- Compare current vs. proposed state
- Detect configuration drift

### 3.3 CloudFormation Support
**As a** user  
**I want** to analyze CloudFormation templates  
**So that** I can assess risks before stack deployment

**Acceptance Criteria:**
- Upload CloudFormation template (JSON/YAML)
- Parse template resources
- Auto-generate change description
- Identify dependencies between resources
- Highlight high-risk changes

---

## Phase 4: Multi-Model Analysis & Dependency Mapping

### 4.1 Multi-Model Analysis
**As a** user  
**I want** to run analysis with multiple AI models  
**So that** I get diverse perspectives on potential failures

**Acceptance Criteria:**
- Select multiple models: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- Run analyses in parallel
- Compare results side-by-side
- Aggregate common risks across models
- Confidence scoring per prediction
- "Consensus view" highlighting agreement

### 4.2 Dependency Graph Visualization
**As a** user  
**I want** to see a visual dependency graph  
**So that** I can understand system coupling and blast radius

**Acceptance Criteria:**
- Interactive dependency graph using D3.js or similar
- Nodes represent services/components
- Edges represent dependencies
- Color-code by risk level
- Click node to see details
- Highlight cascade paths
- Export graph as image

### 4.3 Blast Radius Analysis
**As a** user  
**I want** to see the potential blast radius of a failure  
**So that** I can understand downstream impact

**Acceptance Criteria:**
- Calculate affected services from dependency graph
- Show percentage of system affected
- List all impacted services
- Estimate user impact
- Suggest isolation strategies

---

## Phase 5: Simulation & Testing

### 5.1 Chaos Engineering Test Plan
**As a** user  
**I want** auto-generated chaos engineering test plans  
**So that** I can validate my system's resilience

**Acceptance Criteria:**
- Generate test scenarios from identified risks
- Specific failure injection steps
- Expected outcomes
- Rollback procedures
- Export to Gremlin/Chaos Toolkit format

### 5.2 Runbook Generation
**As a** user  
**I want** auto-generated runbooks from preventive actions  
**So that** I have step-by-step procedures to follow

**Acceptance Criteria:**
- Convert preventive actions to runbook format
- Include: prerequisites, steps, validation, rollback
- Markdown format
- Export to Confluence/Notion
- Checklist format for execution

### 5.3 Testing Recommendations
**As a** user  
**I want** specific testing recommendations  
**So that** I know what to test before deployment

**Acceptance Criteria:**
- Unit test suggestions
- Integration test scenarios
- Load testing parameters
- Monitoring checks to add
- Alerting thresholds

---

## Phase 6: Interactive Timeline & PDF Export

### 6.1 Animated Timeline
**As a** user  
**I want** an animated visualization of the failure cascade  
**So that** I can better understand the sequence of events

**Acceptance Criteria:**
- Play/pause animation controls
- Speed control (1x, 2x, 4x)
- Highlight current event
- Show time elapsed
- Visual indicators for critical events
- Responsive design

### 6.2 Decision Point Exploration
**As a** user  
**I want** to explore "what if" scenarios at decision points  
**So that** I can understand alternative outcomes

**Acceptance Criteria:**
- Identify decision points in timeline
- Click to explore alternative paths
- Show how different decisions change outcomes
- Compare timelines side-by-side
- Reset to original timeline

### 6.3 PDF Report Generation
**As a** user  
**I want** to export reports as professional PDFs  
**So that** I can share with stakeholders and keep records

**Acceptance Criteria:**
- "Export PDF" button on report page
- Professional formatting with branding
- Include all sections: summary, timeline, risks, actions
- Embedded graphs and visualizations
- Table of contents
- Page numbers and headers
- Multiple formats: Executive Summary, Technical Deep-Dive, Full Report

---

## Technical Requirements

### Data Model
```json
{
  "id": "pm-1234567890",
  "timestamp": "2026-02-23T12:00:00Z",
  "userId": "user-123",
  "input": {
    "description": "...",
    "changeType": "database",
    "currentState": "...",
    "proposedState": "...",
    "trafficPatterns": "..."
  },
  "analysis": {
    "severity": "CRITICAL",
    "duration": "4.5 hours",
    "impact": "...",
    "affected": ["..."],
    "timeline": [...],
    "risks": [
      {
        "id": "risk-1",
        "title": "...",
        "description": "...",
        "probability": 8,
        "impact": 9,
        "score": 72,
        "category": "..."
      }
    ],
    "preventiveActions": {...},
    "dependencies": [...],
    "blastRadius": {...}
  },
  "metadata": {
    "model": "claude-3-5-sonnet",
    "version": "1.0",
    "processingTime": 12.5
  }
}
```

### Infrastructure Updates
- DynamoDB: Add GSI for userId queries
- Lambda: Increase timeout for multi-model analysis
- S3: Store PDF exports and large reports
- API Gateway: Add endpoints for history, templates

### Performance Targets
- Report save: < 500ms
- History page load: < 2s
- Multi-model analysis: < 60s
- PDF generation: < 10s
- Dependency graph render: < 3s

---

## Success Metrics
- 90% of reports successfully saved to DynamoDB
- Users access history page within first week
- 50% of analyses use templates
- Multi-model analysis provides 3+ unique insights
- PDF exports used for 30% of reports
- Average risk score accuracy validated against real incidents

---

## Out of Scope (Future Phases)
- User authentication and multi-tenancy
- Real-time collaboration
- Integration with incident management tools
- Machine learning from historical incidents
- Cost estimation for preventive actions
