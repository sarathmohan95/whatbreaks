# WhatBreaks Enhancement Features - Implementation Tasks

## Phase 1: Report Persistence & History

### Infrastructure Tasks (Deploy First)

- [x] 1. Update DynamoDB Table
  - [x] 1.1 Add GSI for userId queries in main.tf
  - [x] 1.2 Enable TTL attribute in main.tf
  - [x] 1.3 Run terraform plan and review changes
  - [x] 1.4 Run terraform apply

- [x] 2. Update Lambda Configuration
  - [x] 2.1 Increase timeout to 90 seconds in main.tf
  - [x] 2.2 Add ENABLE_SAVE environment variable
  - [x] 2.3 Run terraform plan and review changes
  - [x] 2.4 Run terraform apply

- [x] 3. Add API Gateway Routes
  - [x] 3.1 Create GET /reports route in main.tf
  - [x] 3.2 Create GET /reports/{id} route in main.tf
  - [x] 3.3 Create Lambda integration for GET methods
  - [x] 3.4 Update CORS configuration for GET methods
  - [x] 3.5 Run terraform plan and review changes
  - [x] 3.6 Run terraform apply

### Backend Tasks

- [x] 4. Update Lambda Dependencies
  - [x] 4.1 Add @aws-sdk/client-dynamodb to package.json
  - [x] 4.2 Add @aws-sdk/lib-dynamodb to package.json
  - [x] 4.3 Run npm install in backend/premortem-lambda
  - [x] 4.4 Rebuild Lambda package (zip)

- [-] 5. Implement Report Parsing
  - [x] 5.1 Create parseReport function in index.js
  - [x] 5.2 Extract severity, duration, impact
  - [x] 5.3 Parse timeline events
  - [x] 5.4 Parse preventive actions by priority
  - [x] 5.5 Parse affected systems
  - [ ] 5.6 Add unit tests for parsing

- [ ] 6. Implement DynamoDB Save
  - [x] 6.1 Create DynamoDB client instance
  - [x] 6.2 Implement saveReport function
  - [x] 6.3 Generate unique ID (pm-{timestamp})
  - [x] 6.4 Calculate TTL (90 days from now)
  - [x] 6.5 Handle save errors gracefully
  - [x] 6.6 Add logging for save operations
  - [x] 6.7 Update handler to call saveReport

- [x] 7. Implement List Reports Endpoint
  - [x] 7.1 Create listReports handler function
  - [x] 7.2 Query DynamoDB using TimestampIndex (fixed to use Scan)
  - [x] 7.3 Implement pagination (limit, lastEvaluatedKey)
  - [x] 7.4 Return summary data only (not full report)
  - [x] 7.5 Add error handling
  - [x] 7.6 Update exports.handler to route GET /reports

- [x] 8. Implement Get Report Endpoint
  - [x] 8.1 Create getReport handler function
  - [x] 8.2 Query DynamoDB by ID
  - [x] 8.3 Return full report structure
  - [x] 8.4 Handle not found errors
  - [x] 8.5 Add error handling
  - [x] 8.6 Update exports.handler to route GET /reports/{id}

- [x] 9. Deploy Lambda Updates
  - [x] 9.1 Rebuild Lambda package with new code
  - [x] 9.2 Run terraform apply to deploy
  - [x] 9.3 Test POST /premortem saves to DynamoDB
  - [x] 9.4 Test GET /reports returns list
  - [x] 9.5 Test GET /reports/{id} returns report

### Frontend Tasks

- [x] 10. Create API Client
  - [x] 10.1 Create frontend/src/lib/api/reports.ts
  - [x] 10.2 Define SavedReport interface
  - [x] 10.3 Implement listReports function
  - [x] 10.4 Implement getReport function
  - [x] 10.5 Add error handling and types

- [x] 11. Create History Page
  - [x] 11.1 Create frontend/src/app/history/page.tsx
  - [x] 11.2 Implement report list UI with cards
  - [x] 11.3 Display timestamp, summary, severity, duration
  - [x] 11.4 Add severity badge with color coding
  - [x] 11.5 Implement click to view report
  - [x] 11.6 Add loading state
  - [x] 11.7 Add empty state (no reports)
  - [x] 11.8 Add error handling UI

- [x] 12. Implement Pagination
  - [x] 12.1 Add "Load More" button
  - [x] 12.2 Track lastEvaluatedKey state
  - [x] 12.3 Append new reports to list
  - [x] 12.4 Disable button when no more results
  - [x] 12.5 Add loading indicator

- [x] 13. Update Pre-Mortem Page
  - [x] 13.1 Accept id query parameter
  - [x] 13.2 Fetch from API if id present
  - [x] 13.3 Fall back to localStorage if no id
  - [x] 13.4 Add "Share" button with URL copy
  - [x] 13.5 Show "Saved" indicator
  - [x] 13.6 Update loading states

- [x] 14. Update Analyze Page
  - [x] 14.1 Modify redirect to include report ID
  - [x] 14.2 Update success handling
  - [x] 14.3 Show save confirmation

- [x] 15. Update Navigation
  - [x] 15.1 Add History link to home page
  - [x] 15.2 Add History link to analyze page
  - [x] 15.3 Add History link to premortem page
  - [x] 15.4 Ensure consistent nav bar across pages

### Testing Tasks

- [ ] 16. Backend Testing
  - [ ] 16.1 Test report parsing with various formats
  - [ ] 16.2 Test DynamoDB save success
  - [ ] 16.3 Test DynamoDB save failure handling
  - [ ] 16.4 Test list reports with pagination
  - [ ] 16.5 Test get report by ID
  - [ ] 16.6 Test get report not found

- [ ] 17. Frontend Testing
  - [ ] 17.1 Test history page loads reports
  - [ ] 17.2 Test pagination loads more
  - [ ] 17.3 Test click report navigates correctly
  - [ ] 17.4 Test view saved report by ID
  - [ ] 17.5 Test share URL functionality
  - [ ] 17.6 Test empty state
  - [ ] 17.7 Test error states

- [ ] 18. End-to-End Testing
  - [ ] 18.1 Generate new report and verify saved
  - [ ] 18.2 View in history page
  - [ ] 18.3 Click to view full report
  - [ ] 18.4 Share URL and open in new tab
  - [ ] 18.5 Generate multiple reports and test pagination
  - [ ] 18.6 Verify TTL is set correctly in DynamoDB

### Documentation Tasks

- [ ] 19. Update Documentation
  - [ ] 19.1 Update README with history feature
  - [ ] 19.2 Document API endpoints
  - [ ] 19.3 Update architecture diagram
  - [ ] 19.4 Add troubleshooting guide

### Monitoring Tasks

- [ ] 20. Setup Monitoring
  - [ ] 20.1 Create CloudWatch dashboard
  - [ ] 20.2 Add save success rate metric
  - [ ] 20.3 Add save latency metric
  - [ ] 20.4 Create alarm for save failures
  - [ ] 20.5 Create alarm for DynamoDB throttling

---

## Task Dependencies

```
Infrastructure (1-3) → Backend (4-9) → Frontend (10-15) → Testing (16-18)
                                    ↓
                              Documentation (19)
                                    ↓
                              Monitoring (20)
```

## Estimated Timeline

- Infrastructure: 1 hour
- Backend: 6-8 hours
- Frontend: 6-8 hours
- Testing: 2-3 hours
- Documentation: 1 hour
- Monitoring: 1 hour

**Total: 2-3 days**

## Notes

- Infrastructure tasks MUST be completed first
- Notify user before running terraform apply
- Test each component independently before integration
- Keep localStorage fallback for offline capability


---

## Phase 2: Risk Scoring & Templates

### Part A: Risk Scoring System

#### Backend Tasks

- [x] 21. Enhance AI Prompt for Risk Scoring
  - [x] 21.1 Update buildPreMortemPrompt() to request risk data
  - [x] 21.2 Add JSON structure for risks in prompt
  - [x] 21.3 Request probability and impact scores
  - [x] 21.4 Request risk categories and mitigation
  - [x] 21.5 Test prompt with sample inputs

- [x] 22. Implement Risk Parsing
  - [x] 22.1 Create parseRisks() function in index.js
  - [x] 22.2 Extract risk title and description
  - [x] 22.3 Parse probability and impact scores
  - [x] 22.4 Calculate risk scores (probability × impact)
  - [x] 22.5 Categorize risks by score level
  - [x] 22.6 Link risks to preventive actions
  - [x] 22.7 Calculate overall risk score

- [x] 23. Update Report Data Model
  - [x] 23.1 Add risks array to parsedReport
  - [x] 23.2 Add overallRiskScore field
  - [x] 23.3 Add riskLevel field
  - [x] 23.4 Update saveReport to include risk data
  - [x] 23.5 Test with DynamoDB save

- [x] 24. Deploy Backend Updates
  - [x] 24.1 Rebuild Lambda package
  - [x] 24.2 Run terraform apply
  - [x] 24.3 Test risk scoring with API calls
  - [x] 24.4 Verify risk data in DynamoDB

#### Frontend Tasks

- [x] 25. Create Risk Components
  - [x] 25.1 Create RiskMatrix.tsx component
  - [x] 25.2 Implement 10x10 grid layout
  - [x] 25.3 Plot risks on matrix
  - [x] 25.4 Add color coding by risk level
  - [x] 25.5 Add hover tooltips
  - [x] 25.6 Add click to highlight actions

- [x] 26. Create Risk Card Component
  - [x] 26.1 Create RiskCard.tsx component
  - [x] 26.2 Display risk title and score
  - [x] 26.3 Show probability and impact bars
  - [x] 26.4 Display risk description
  - [x] 26.5 Show mitigation strategies
  - [x] 26.6 Add risk level badge

- [-] 27. Update Pre-Mortem Page with Risks
  - [x] 27.1 Add risk matrix section
  - [x] 27.2 Add risk cards list
  - [x] 27.3 Sort preventive actions by risk score
  - [x] 27.4 Link actions to related risks
  - [x] 27.5 Add overall risk score display
  - [x] 27.6 Update TypeScript interfaces

- [x] 28. Update History Page
  - [x] 28.1 Display risk level badge on cards
  - [x] 28.2 Show overall risk score
  - [ ] 28.3 Add risk level filter
  - [ ] 28.4 Sort by risk score option

### Part B: Built-in Template Library

#### Template Creation Tasks

- [x] 29. Create Template JSON Files
  - [x] 29.1 Create templates directory structure
  - [x] 29.2 Database category (5 templates)
    - [x] 29.2.1 Redis single → cluster migration
    - [x] 29.2.2 PostgreSQL version upgrade
    - [x] 29.2.3 RDS multi-AZ failover
    - [x] 29.2.4 DynamoDB on-demand → provisioned
    - [x] 29.2.5 MongoDB replica set expansion
  - [x] 29.3 Kubernetes category (3 templates)
    - [x] 29.3.1 Cluster version upgrade
    - [x] 29.3.2 Node group scaling
    - [x] 29.3.3 Ingress controller migration
  - [x] 29.4 Networking category (3 templates)
    - [x] 29.4.1 VPC peering setup
    - [x] 29.4.2 Load balancer migration
    - [x] 29.4.3 DNS provider change
  - [x] 29.5 Storage category (2 templates)
    - [x] 29.5.1 S3 bucket replication
    - [x] 29.5.2 EBS volume type change
  - [x] 29.6 Compute category (2 templates)
    - [x] 29.6.1 EC2 instance type change
    - [x] 29.6.2 Lambda runtime upgrade

#### Frontend Tasks

- [x] 30. Create Template Library Page
  - [x] 30.1 Create /templates route
  - [x] 30.2 Create templates/page.tsx
  - [x] 30.3 Load built-in templates from JSON
  - [x] 30.4 Display templates by category
  - [x] 30.5 Add search functionality
  - [x] 30.6 Add category filter
  - [x] 30.7 Add difficulty badges
  - [x] 30.8 Add usage count display

- [ ] 31. Create Template Card Component
  - [ ] 31.1 Create TemplateCard.tsx
  - [ ] 31.2 Display template name and description
  - [ ] 31.3 Show category and difficulty
  - [ ] 31.4 Add "Preview" button
  - [ ] 31.5 Add "Use Template" button
  - [ ] 31.6 Show usage statistics

- [x] 32. Create Template Parameter Form
  - [x] 32.1 Create TemplateParameterForm.tsx
  - [x] 32.2 Render parameter inputs dynamically
  - [x] 32.3 Support text, number, select inputs
  - [x] 32.4 Add validation for required fields
  - [x] 32.5 Implement parameter substitution
  - [x] 32.6 Preview filled template
  - [x] 32.7 Navigate to analyze page with data

- [x] 33. Update Navigation
  - [x] 33.1 Add Templates link to home page
  - [x] 33.2 Add Templates link to analyze page
  - [x] 33.3 Add Templates link to nav bar

### Part C: Custom Templates

#### Infrastructure Tasks

- [x] 34. Create Templates DynamoDB Table
  - [x] 34.1 Add table definition to main.tf
  - [x] 34.2 Define partition key (id) and sort key (userId)
  - [x] 34.3 Add UserIdIndex GSI
  - [x] 34.4 Configure PAY_PER_REQUEST billing
  - [x] 34.5 Add common tags
  - [x] 34.6 Run terraform plan
  - [x] 34.7 Run terraform apply

- [x] 35. Update Lambda Configuration
  - [x] 35.1 Add TEMPLATES_TABLE environment variable
  - [x] 35.2 Update IAM role for templates table access
  - [x] 35.3 Add DynamoDB permissions (CRUD)
  - [x] 35.4 Run terraform plan
  - [x] 35.5 Run terraform apply

- [x] 36. Add API Gateway Routes
  - [x] 36.1 Create POST /templates route
  - [x] 36.2 Create GET /templates route
  - [x] 36.3 Create GET /templates/{id} route
  - [x] 36.4 Create PUT /templates/{id} route
  - [x] 36.5 Create DELETE /templates/{id} route
  - [x] 36.6 Update CORS configuration
  - [x] 36.7 Run terraform apply

#### Backend Tasks

- [-] 37. Implement Template CRUD Operations
  - [ ] 37.1 Create templates.js module
  - [x] 37.2 Implement createTemplate()
  - [x] 37.3 Implement listTemplates()
  - [x] 37.4 Implement getTemplate()
  - [x] 37.5 Implement updateTemplate()
  - [x] 37.6 Implement deleteTemplate()
  - [ ] 37.7 Implement incrementUsageCount()

- [x] 38. Add Template Route Handlers
  - [x] 38.1 Create handleCreateTemplate()
  - [x] 38.2 Create handleListTemplates()
  - [x] 38.3 Create handleGetTemplate()
  - [x] 38.4 Create handleUpdateTemplate()
  - [x] 38.5 Create handleDeleteTemplate()
  - [x] 38.6 Update exports.handler routing
  - [x] 38.7 Add error handling

- [ ] 39. Implement Parameter Substitution
  - [ ] 39.1 Create applyTemplateParameters()
  - [ ] 39.2 Support placeholder replacement
  - [ ] 39.3 Handle missing parameters
  - [ ] 39.4 Validate parameter types
  - [ ] 39.5 Add unit tests

- [ ] 40. Deploy Backend Updates
  - [x] 40.1 Rebuild Lambda package
  - [x] 40.2 Run terraform apply
  - [ ] 40.3 Test template CRUD via API
  - [ ] 40.4 Verify DynamoDB operations

#### Frontend Tasks

- [x] 41. Create Template API Client
  - [x] 41.1 Create templates.ts in lib/api
  - [x] 41.2 Implement createTemplate()
  - [x] 41.3 Implement listTemplates()
  - [x] 41.4 Implement getTemplate()
  - [x] 41.5 Implement updateTemplate()
  - [x] 41.6 Implement deleteTemplate()
  - [x] 41.7 Add TypeScript interfaces

- [x] 42. Add "Save as Template" Feature
  - [x] 42.1 Add button to analyze page
  - [x] 42.2 Create SaveTemplateModal component
  - [x] 42.3 Extract parameters from form
  - [x] 42.4 Suggest parameter names
  - [x] 42.5 Allow parameter customization
  - [x] 42.6 Save template via API
  - [x] 42.7 Show success confirmation

- [ ] 43. Create Template Management Page
  - [ ] 43.1 Create /templates/my-templates route
  - [ ] 43.2 List user's custom templates
  - [ ] 43.3 Add edit template functionality
  - [ ] 43.4 Add delete template functionality
  - [ ] 43.5 Add duplicate template functionality
  - [ ] 43.6 Add export template (JSON download)
  - [ ] 43.7 Add import template (JSON upload)

- [x] 44. Update Template Library Page
  - [x] 44.1 Merge built-in and custom templates
  - [x] 44.2 Add "My Templates" tab
  - [x] 44.3 Show template ownership
  - [x] 44.4 Add edit/delete for custom templates
  - [x] 44.5 Update search to include custom

### Testing Tasks

- [ ] 45. Risk Scoring Tests
  - [ ] 45.1 Test risk parsing with various formats
  - [ ] 45.2 Verify risk score calculation
  - [ ] 45.3 Test risk level categorization
  - [ ] 45.4 Validate risk matrix rendering
  - [ ] 45.5 Test risk-action linking

- [ ] 46. Template Tests
  - [ ] 46.1 Test parameter substitution
  - [ ] 46.2 Test template CRUD operations
  - [ ] 46.3 Verify built-in template loading
  - [ ] 46.4 Test custom template save/load
  - [ ] 46.5 Test template export/import

- [ ] 47. Integration Tests
  - [ ] 47.1 End-to-end template usage flow
  - [ ] 47.2 Risk scoring in generated reports
  - [ ] 47.3 Template parameter edge cases
  - [ ] 47.4 Custom template management flow

### Documentation Tasks

- [ ] 48. Update Documentation
  - [ ] 48.1 Document risk scoring system
  - [ ] 48.2 Document template library usage
  - [ ] 48.3 Document custom template creation
  - [ ] 48.4 Add template JSON schema docs
  - [ ] 48.5 Update API documentation

---

## Phase 2 Task Dependencies

```
Risk Scoring:
Backend (21-24) → Frontend (25-28)

Built-in Templates:
Template Creation (29) → Frontend (30-33)

Custom Templates:
Infrastructure (34-36) → Backend (37-40) → Frontend (41-44)

Testing (45-47) depends on all above
Documentation (48) can be done in parallel
```

## Phase 2 Estimated Timeline

- Risk Scoring: 1.5 days
  - Backend: 0.5 day
  - Frontend: 1 day
- Built-in Templates: 1 day
  - Template creation: 0.5 day
  - Frontend: 0.5 day
- Custom Templates: 1.5 days
  - Infrastructure: 0.25 day
  - Backend: 0.5 day
  - Frontend: 0.75 day
- Testing: 0.5 day
- Documentation: 0.5 day

**Total: 4-5 days**

## Phase 2 Notes

- Risk scoring requires AI prompt changes - test thoroughly
- Create high-quality templates with realistic scenarios
- Custom templates build on Phase 1 DynamoDB patterns
- Consider template versioning for future
- Monitor AI response quality with risk scoring


---

## Phase 3: AWS Infrastructure Integration

### Phase 3.1: IaC Parsing (AI-Powered)

#### Backend Tasks

- [x] 49. Add `/parse-iac` endpoint to Lambda
  - [x] 49.1 Create handleParseIaC function
  - [x] 49.2 Add route handler in main exports.handler
  - [x] 49.3 Create parseIaCFile function
  - [x] 49.4 Create buildIaCParsingPrompt function
  - [x] 49.5 Create parseIaCAnalysis function with robust JSON parsing
  - [x] 49.6 Handle Terraform and CloudFormation file types
  - [x] 49.7 Extract resources, security issues, dependencies
  - [x] 49.8 Generate comprehensive 200+ word descriptions
  - [x] 49.9 Add error handling and validation
  - [x] 49.10 Test with sample files

#### Infrastructure Tasks

- [x] 50. Add API Gateway route
  - [x] 50.1 Create POST /parse-iac route in main.tf
  - [x] 50.2 Deploy via terraform apply

#### Frontend Tasks

- [x] 51. Add file upload component
  - [x] 51.1 Create file upload UI in analyze page
  - [x] 51.2 Support .tf, .tfplan, .json, .yaml, .yml files
  - [x] 51.3 Create handleFileUpload function
  - [x] 51.4 Read file content with file.text()
  - [x] 51.5 Create /api/parse-iac Next.js API route
  - [x] 51.6 Call Lambda via API route
  - [x] 51.7 Display parsing progress with loading spinner
  - [x] 51.8 Show parsed resource summary
  - [x] 51.9 Display security issues with severity badges
  - [x] 51.10 Auto-fill form with description and states
  - [x] 51.11 Add loading states and error handling
  - [x] 51.12 Create generateCurrentState helper
  - [x] 51.13 Create generateProposedState helper

#### Bug Fixes & Improvements

- [x] 52. Fix JSON parsing issues
  - [x] 52.1 Handle control characters in JSON strings
  - [x] 52.2 Extract JSON from code blocks
  - [x] 52.3 Clean newlines and tabs in string values
  - [x] 52.4 Add detailed error logging

- [x] 53. Improve AI prompt quality
  - [x] 53.1 Request 200+ word descriptions
  - [x] 53.2 Specify exact output format
  - [x] 53.3 Request proper JSON escaping
  - [x] 53.4 Add comprehensive analysis requirements

- [x] 54. Fix pre-mortem report parsing
  - [x] 54.1 Update buildPreMortemPrompt with explicit format
  - [x] 54.2 Add clear section markers (##)
  - [x] 54.3 Specify exact "Affected:" format
  - [x] 54.4 Specify timeline format (T+Xh:XXm)
  - [x] 54.5 Specify risk format with blank lines
  - [x] 54.6 Specify numbered preventive actions

**Phase 3.1 Status**: ✅ COMPLETE

**Summary**: Successfully implemented IaC file parsing using Claude AI. Users can now upload Terraform (.tf, .tfplan) or CloudFormation (.json, .yaml, .yml) files, and the system will automatically analyze the infrastructure code, identify security issues, extract resource information, and generate a comprehensive description that auto-fills the pre-mortem form. The feature includes robust JSON parsing, detailed security issue reporting with severity levels, and generates 200+ word descriptions suitable for pre-mortem analysis.

**Key Features Delivered**:
- AI-powered IaC parsing (no external libraries needed)
- Support for Terraform and CloudFormation formats
- Automatic security issue detection with severity levels (HIGH/MEDIUM/LOW)
- Resource extraction with actions (create/update/delete)
- Dependency analysis
- Auto-fill form with parsed data
- Visual feedback with loading states and success indicators
- Comprehensive error handling

**Files Modified**:
- `backend/premortem-lambda/index.js` - Added IaC parsing handlers and improved prompts
- `infrastructure/main.tf` - Added POST /parse-iac route
- `frontend/src/app/analyze/page.tsx` - Added file upload UI and handlers
- `frontend/src/app/api/parse-iac/route.ts` - Created API proxy route
- `frontend/src/app/premortem/page.tsx` - Removed debug logs

**Next Steps**: Phase 3.2 - AWS Context Integration (optional feature to fetch current AWS infrastructure)


---

## Phase 4: Multi-Agent Analysis System

### Backend Tasks - Core Multi-Agent Infrastructure

- [ ] 55. Create Multi-Agent Module Structure
  - [ ] 55.1 Create backend/premortem-lambda/multi-agent.js
  - [ ] 55.2 Define MultiAgentOrchestrator class
  - [ ] 55.3 Define BaseConsultant abstract class
  - [ ] 55.4 Create consultant registry structure
  - [ ] 55.5 Add error handling utilities
  - [ ] 55.6 Add logging utilities for agent tracking

- [ ] 56. Implement Specialist Agent Classes
  - [ ] 56.1 Create SecurityConsultant class
  - [ ] 56.2 Create ReliabilityEngineer class
  - [ ] 56.3 Create PerformanceArchitect class
  - [ ] 56.4 Create CostOptimizer class
  - [ ] 56.5 Create OperationsSpecialist class
  - [ ] 56.6 Implement analyze() method for each specialist
  - [ ] 56.7 Implement parseResponse() for each specialist

- [ ] 57. Build Specialist Prompts
  - [ ] 57.1 Create buildSecurityPrompt() with focus areas
  - [ ] 57.2 Create buildReliabilityPrompt() with focus areas
  - [ ] 57.3 Create buildPerformancePrompt() with focus areas
  - [ ] 57.4 Create buildCostPrompt() with focus areas
  - [ ] 57.5 Create buildOperationsPrompt() with focus areas
  - [ ] 57.6 Add JSON output format specifications
  - [ ] 57.7 Add confidence scoring instructions

- [ ] 58. Implement Parallel Execution
  - [ ] 58.1 Create executeSpecialistsInParallel() method
  - [ ] 58.2 Use Promise.all() for concurrent analysis
  - [ ] 58.3 Add timeout handling per specialist
  - [ ] 58.4 Implement graceful degradation (continue if one fails)
  - [ ] 58.5 Collect and aggregate specialist results
  - [ ] 58.6 Add performance tracking per specialist

- [ ] 59. Implement Synthesis Logic
  - [ ] 59.1 Create synthesize() method in orchestrator
  - [ ] 59.2 Build synthesis prompt with all specialist findings
  - [ ] 59.3 Identify consensus risks (multiple agents agree)
  - [ ] 59.4 Identify dissenting opinions
  - [ ] 59.5 Calculate agreement levels
  - [ ] 59.6 Resolve conflicts and trade-offs
  - [ ] 59.7 Generate executive summary
  - [ ] 59.8 Create unified preventive action plan

- [ ] 60. Update Lambda Handler
  - [ ] 60.1 Add analysisMode parameter (quick/deep)
  - [ ] 60.2 Route to single-agent for quick mode
  - [ ] 60.3 Route to multi-agent for deep mode
  - [ ] 60.4 Update handlePreMortem to support both modes
  - [ ] 60.5 Add multi-agent response formatting
  - [ ] 60.6 Update error handling for multi-agent failures

### Backend Tasks - Data Structures & Parsing

- [ ] 61. Define TypeScript Interfaces
  - [ ] 61.1 Create SpecialistAnalysis interface
  - [ ] 61.2 Create SynthesizedReport interface
  - [ ] 61.3 Create ConsensusRisk interface
  - [ ] 61.4 Create DissentingOpinion interface
  - [ ] 61.5 Create TradeOff interface
  - [ ] 61.6 Add JSDoc comments for JavaScript

- [ ] 62. Implement Response Parsing
  - [ ] 62.1 Create parseSpecialistAnalysis() function
  - [ ] 62.2 Create parseSynthesizedReport() function
  - [ ] 62.3 Handle JSON parsing errors gracefully
  - [ ] 62.4 Validate required fields
  - [ ] 62.5 Add default values for missing data
  - [ ] 62.6 Extract confidence scores

- [ ] 63. Implement Risk Aggregation
  - [ ] 63.1 Create aggregateRisks() function
  - [ ] 63.2 Deduplicate similar risks across specialists
  - [ ] 63.3 Calculate consensus scores
  - [ ] 63.4 Merge risk descriptions
  - [ ] 63.5 Combine mitigation strategies
  - [ ] 63.6 Track which consultant identified each risk

### Infrastructure Tasks

- [ ] 64. Update Lambda Configuration
  - [ ] 64.1 Increase timeout to 180 seconds (3 minutes)
  - [ ] 64.2 Increase memory to 2048 MB
  - [ ] 64.3 Add ENABLE_MULTI_AGENT environment variable
  - [ ] 64.4 Run terraform plan
  - [ ] 64.5 Run terraform apply

- [ ] 65. Update API Gateway
  - [ ] 65.1 Add analysisMode parameter to POST /premortem
  - [ ] 65.2 Update request validation
  - [ ] 65.3 Update CORS configuration
  - [ ] 65.4 Run terraform apply

### Frontend Tasks - UI Components

- [ ] 66. Create Multi-Agent UI Components
  - [ ] 66.1 Create ConsultantCard.tsx component
  - [ ] 66.2 Create ConsensusRiskCard.tsx component
  - [ ] 66.3 Create DissentingOpinionCard.tsx component
  - [ ] 66.4 Create TradeOffCard.tsx component
  - [ ] 66.5 Create AnalysisProgressBar.tsx component
  - [ ] 66.6 Create ConsultantAvatar.tsx component

- [ ] 67. Create Analysis Mode Selector
  - [ ] 67.1 Add mode selector to analyze page
  - [ ] 67.2 Create "Quick Analysis" option (single agent, free)
  - [ ] 67.3 Create "Deep Analysis" option (multi-agent, premium)
  - [ ] 67.4 Add feature comparison tooltip
  - [ ] 67.5 Add pricing information
  - [ ] 67.6 Style with visual differentiation

- [ ] 68. Implement Progress Tracking
  - [ ] 68.1 Add WebSocket or polling for progress updates
  - [ ] 68.2 Show specialist status (pending/analyzing/complete)
  - [ ] 68.3 Display progress percentage per specialist
  - [ ] 68.4 Show synthesis phase indicator
  - [ ] 68.5 Add estimated time remaining
  - [ ] 68.6 Add cancel analysis button

### Frontend Tasks - Report Display

- [ ] 69. Update Pre-Mortem Page for Multi-Agent
  - [ ] 69.1 Detect multi-agent report format
  - [ ] 69.2 Add "By Consultant" section
  - [ ] 69.3 Display consultant cards with findings
  - [ ] 69.4 Show overall scores per consultant
  - [ ] 69.5 Add consultant filter/tabs
  - [ ] 69.6 Update TypeScript interfaces

- [ ] 70. Implement Consensus Risk Display
  - [ ] 70.1 Create "High Consensus Risks" section
  - [ ] 70.2 Show agreement level badges
  - [ ] 70.3 Display which consultants identified each risk
  - [ ] 70.4 Add consensus percentage visualization
  - [ ] 70.5 Sort by agreement level
  - [ ] 70.6 Add "Show All Consultants" expand button

- [ ] 71. Implement Dissenting Opinions Display
  - [ ] 71.1 Create "Dissenting Opinions" section
  - [ ] 71.2 Show minority viewpoints
  - [ ] 71.3 Display reasoning for disagreement
  - [ ] 71.4 Add "Why Others Disagree" explanations
  - [ ] 71.5 Style to differentiate from consensus
  - [ ] 71.6 Add toggle to show/hide dissent

- [ ] 72. Implement Trade-Offs Display
  - [ ] 72.1 Create "Trade-Offs & Decisions" section
  - [ ] 72.2 Display option A vs option B comparison
  - [ ] 72.3 Show pros/cons for each option
  - [ ] 72.4 Display recommendation with reasoning
  - [ ] 72.5 Add visual comparison layout
  - [ ] 72.6 Add "Learn More" expandable details

### Frontend Tasks - API Integration

- [ ] 73. Update API Client
  - [ ] 73.1 Add analysisMode parameter to API calls
  - [ ] 73.2 Update request types for multi-agent
  - [ ] 73.3 Update response types for multi-agent
  - [ ] 73.4 Add progress polling endpoint
  - [ ] 73.5 Add error handling for multi-agent failures
  - [ ] 73.6 Add timeout handling (3 minutes)

- [ ] 74. Update Analyze Page
  - [ ] 74.1 Add mode selection state
  - [ ] 74.2 Pass analysisMode to API
  - [ ] 74.3 Show different loading states per mode
  - [ ] 74.4 Update success handling for multi-agent
  - [ ] 74.5 Add cost estimate display
  - [ ] 74.6 Update redirect with mode parameter

### Testing Tasks

- [ ] 75. Backend Unit Tests
  - [ ] 75.1 Test SecurityConsultant analysis
  - [ ] 75.2 Test ReliabilityEngineer analysis
  - [ ] 75.3 Test PerformanceArchitect analysis
  - [ ] 75.4 Test CostOptimizer analysis
  - [ ] 75.5 Test OperationsSpecialist analysis
  - [ ] 75.6 Test parallel execution
  - [ ] 75.7 Test synthesis logic
  - [ ] 75.8 Test graceful degradation (one specialist fails)

- [ ] 76. Integration Tests
  - [ ] 76.1 Test end-to-end multi-agent flow
  - [ ] 76.2 Test quick vs deep analysis modes
  - [ ] 76.3 Test consensus risk identification
  - [ ] 76.4 Test dissenting opinion handling
  - [ ] 76.5 Test trade-off resolution
  - [ ] 76.6 Verify response format consistency

- [ ] 77. Quality Validation Tests
  - [ ] 77.1 Compare multi-agent vs single-agent results
  - [ ] 77.2 Measure risk identification improvement
  - [ ] 77.3 Validate consensus accuracy
  - [ ] 77.4 Test with good vs bad configurations
  - [ ] 77.5 Measure false positive reduction
  - [ ] 77.6 Validate confidence scoring

- [ ] 78. Performance Tests
  - [ ] 78.1 Measure parallel execution time
  - [ ] 78.2 Test Lambda timeout handling
  - [ ] 78.3 Measure token usage per specialist
  - [ ] 78.4 Calculate cost per analysis
  - [ ] 78.5 Test concurrent multi-agent requests
  - [ ] 78.6 Validate memory usage

### Monitoring & Observability

- [ ] 79. Add CloudWatch Metrics
  - [ ] 79.1 Track multi-agent analysis count
  - [ ] 79.2 Track per-specialist execution time
  - [ ] 79.3 Track synthesis time
  - [ ] 79.4 Track specialist failure rate
  - [ ] 79.5 Track consensus rate
  - [ ] 79.6 Track cost per analysis

- [ ] 80. Add CloudWatch Alarms
  - [ ] 80.1 Alarm for high specialist failure rate
  - [ ] 80.2 Alarm for Lambda timeout
  - [ ] 80.3 Alarm for high cost per analysis
  - [ ] 80.4 Alarm for low consensus rate
  - [ ] 80.5 Alarm for synthesis failures

- [ ] 81. Add Logging
  - [ ] 81.1 Log specialist analysis start/end
  - [ ] 81.2 Log synthesis start/end
  - [ ] 81.3 Log consensus risk identification
  - [ ] 81.4 Log dissenting opinions
  - [ ] 81.5 Log trade-off resolutions
  - [ ] 81.6 Add structured logging with JSON

### Documentation Tasks

- [ ] 82. Update Documentation
  - [ ] 82.1 Document multi-agent architecture
  - [ ] 82.2 Document specialist roles and focus areas
  - [ ] 82.3 Document synthesis algorithm
  - [ ] 82.4 Document quick vs deep analysis modes
  - [ ] 82.5 Add API documentation for new parameters
  - [ ] 82.6 Create troubleshooting guide

- [ ] 83. Create User Guide
  - [ ] 83.1 Explain when to use quick vs deep analysis
  - [ ] 83.2 Explain consensus risks
  - [ ] 83.3 Explain dissenting opinions
  - [ ] 83.4 Explain trade-offs
  - [ ] 83.5 Add screenshots and examples
  - [ ] 83.6 Create FAQ section

### Deployment & Rollout

- [ ] 84. Deploy Backend Updates
  - [ ] 84.1 Rebuild Lambda package with multi-agent code
  - [ ] 84.2 Run terraform plan
  - [ ] 84.3 Run terraform apply
  - [ ] 84.4 Test quick analysis mode
  - [ ] 84.5 Test deep analysis mode
  - [ ] 84.6 Verify all specialists working

- [ ] 85. Deploy Frontend Updates
  - [ ] 85.1 Build frontend with new components
  - [ ] 85.2 Test mode selector
  - [ ] 85.3 Test progress tracking
  - [ ] 85.4 Test multi-agent report display
  - [ ] 85.5 Test on mobile devices
  - [ ] 85.6 Deploy to production

- [ ] 86. A/B Testing Setup
  - [ ] 86.1 Create A/B test configuration
  - [ ] 86.2 Split traffic 50/50 (single vs multi-agent)
  - [ ] 86.3 Track quality metrics
  - [ ] 86.4 Track user satisfaction
  - [ ] 86.5 Track conversion to deep analysis
  - [ ] 86.6 Analyze results after 1 week

### Premium Feature Implementation (Optional)

- [ ] 87. Add Pricing Logic
  - [ ] 87.1 Define pricing tiers (free quick, paid deep)
  - [ ] 87.2 Add usage tracking per user
  - [ ] 87.3 Implement rate limiting for free tier
  - [ ] 87.4 Add payment integration (Stripe)
  - [ ] 87.5 Create subscription management
  - [ ] 87.6 Add billing dashboard

- [ ] 88. Add Usage Analytics
  - [ ] 88.1 Track quick vs deep analysis usage
  - [ ] 88.2 Track conversion rate to paid
  - [ ] 88.3 Track revenue per user
  - [ ] 88.4 Track cost per analysis
  - [ ] 88.5 Calculate profit margins
  - [ ] 88.6 Create analytics dashboard

---

## Phase 4 Task Dependencies

```
Core Infrastructure (55-60) → Data Structures (61-63) → Infrastructure (64-65)
                                                      ↓
                                              Frontend Components (66-68)
                                                      ↓
                                              Report Display (69-72)
                                                      ↓
                                              API Integration (73-74)
                                                      ↓
                                              Testing (75-78)
                                                      ↓
                                              Monitoring (79-81)
                                                      ↓
                                              Documentation (82-83)
                                                      ↓
                                              Deployment (84-86)
                                                      ↓
                                              Premium Feature (87-88) [Optional]
```

## Phase 4 Estimated Timeline

- Core Multi-Agent Infrastructure: 3-4 days
  - Multi-agent module structure: 0.5 day
  - Specialist agent classes: 1 day
  - Specialist prompts: 0.5 day
  - Parallel execution: 0.5 day
  - Synthesis logic: 1 day
  - Lambda handler updates: 0.5 day

- Data Structures & Parsing: 1 day
  - TypeScript interfaces: 0.25 day
  - Response parsing: 0.5 day
  - Risk aggregation: 0.25 day

- Infrastructure: 0.5 day
  - Lambda configuration: 0.25 day
  - API Gateway updates: 0.25 day

- Frontend Components: 2-3 days
  - Multi-agent UI components: 1 day
  - Analysis mode selector: 0.5 day
  - Progress tracking: 0.5-1 day

- Report Display: 2 days
  - Pre-mortem page updates: 0.5 day
  - Consensus risk display: 0.5 day
  - Dissenting opinions display: 0.5 day
  - Trade-offs display: 0.5 day

- API Integration: 1 day
  - API client updates: 0.5 day
  - Analyze page updates: 0.5 day

- Testing: 2-3 days
  - Backend unit tests: 1 day
  - Integration tests: 0.5 day
  - Quality validation: 0.5-1 day
  - Performance tests: 0.5 day

- Monitoring & Observability: 1 day
  - CloudWatch metrics: 0.5 day
  - CloudWatch alarms: 0.25 day
  - Logging: 0.25 day

- Documentation: 1 day
  - Technical documentation: 0.5 day
  - User guide: 0.5 day

- Deployment & Rollout: 1 day
  - Backend deployment: 0.25 day
  - Frontend deployment: 0.25 day
  - A/B testing setup: 0.5 day

- Premium Feature (Optional): 2-3 days
  - Pricing logic: 1-1.5 days
  - Usage analytics: 1-1.5 days

**Total: 14-18 days (without premium feature)**
**Total: 16-21 days (with premium feature)**

## Phase 4 Notes

- Multi-agent analysis is the most complex feature yet
- Requires careful prompt engineering for each specialist
- Synthesis logic is critical for quality
- Performance optimization needed for parallel execution
- Cost monitoring essential (7.5x increase per analysis)
- A/B testing will validate quality improvements
- Premium feature can be added later if MVP successful
- Consider starting with 3 specialists (Security, Reliability, Performance) for MVP
- Add Cost and Operations specialists in Phase 4.1
- Monitor token usage and costs closely during testing
- Graceful degradation is critical - single specialist failure shouldn't break entire analysis
- Consider caching common patterns to reduce costs
- WebSocket or Server-Sent Events for real-time progress updates
- Mobile responsiveness important for consultant cards
- Consensus visualization should be intuitive and clear
- Trade-off display should help users make informed decisions
