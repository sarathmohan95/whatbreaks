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
