# Phase 3: AWS Infrastructure Integration - Implementation Plan

## Overview

Phase 3 adds three powerful features to WhatBreaks:
1. **IaC Parsing** - Upload Terraform/CloudFormation files for auto-generated descriptions
2. **AWS Context** - Fetch current AWS infrastructure for real-world analysis
3. **Enhanced Analysis** - Claude analyzes proposed changes against actual infrastructure

## Complete Feature Set

### Feature 3.1: IaC File Parsing (AI-Powered)
- Upload Terraform plans (`.tfplan`, `.json`)
- Upload CloudFormation templates (`.json`, `.yaml`, `.yml`)
- Claude parses and extracts:
  - Resources to create/modify/destroy
  - Security issues and recommendations
  - Resource dependencies
  - Natural language description
- Auto-fills analyze form

### Feature 3.2: AWS Context Integration (Optional)
- Checkbox to enable AWS context fetching
- Two authentication methods:
  - IAM Role ARN (recommended)
  - Temporary credentials
- Fetches current infrastructure:
  - EC2, RDS, S3, Lambda, ELB, VPC
  - Resource configurations
  - Dependencies and relationships
- Read-only, secure, never stores credentials

### Feature 3.3: Enhanced Pre-Mortem Analysis
- Combines IaC changes + AWS context
- Claude analyzes:
  - Real dependencies vs proposed changes
  - Actual capacity and limits
  - Specific affected resources
  - Concrete blast radius
  - Actionable recommendations

## Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend (Next.js)                 │
│  ┌───────────────────────────────┐  │
│  │ 1. Upload IaC file            │  │
│  │ 2. ☐ Fetch AWS context        │  │
│  │ 3. Configure AWS access       │  │
│  │ 4. Generate pre-mortem        │  │
│  └───────────────────────────────┘  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  API Gateway                        │
│  - POST /parse-iac                  │
│  - POST /fetch-aws-context          │
│  - POST /premortem (enhanced)       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Lambda (Node.js - existing!)       │
│  ┌───────────────────────────────┐  │
│  │ IaC Parsing:                  │  │
│  │ - Send file to Claude         │  │
│  │ - Parse structured response   │  │
│  │ - Return analysis             │  │
│  │                               │  │
│  │ AWS Context:                  │  │
│  │ - Assume role / use creds     │  │
│  │ - Query AWS APIs (read-only)  │  │
│  │ - Build resource map          │  │
│  │ - Return context              │  │
│  │                               │  │
│  │ Enhanced Pre-Mortem:          │  │
│  │ - Combine IaC + AWS context   │  │
│  │ - Send to Claude              │  │
│  │ - Generate detailed report    │  │
│  └───────────────────────────────┘  │
└──────┬──────────────────────────────┘
       │
       ├──────────────┬────────────────┐
       ▼              ▼                ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Bedrock    │ │  AWS APIs   │ │  DynamoDB   │
│  (Claude)   │ │  (Read)     │ │  (Save)     │
└─────────────┘ └─────────────┘ └─────────────┘
```

## Implementation Phases

### Phase 3.1: IaC Parsing (Week 1-2)

#### Backend Tasks
- [ ] Add `/parse-iac` endpoint to existing Lambda
- [ ] Create IaC parsing prompt for Claude
- [ ] Handle Terraform plan JSON parsing
- [ ] Handle CloudFormation template parsing (JSON/YAML)
- [ ] Parse Claude's structured response
- [ ] Extract resources, security issues, dependencies
- [ ] Generate natural language description
- [ ] Add error handling and validation
- [ ] Test with sample files

#### Frontend Tasks
- [ ] Add file upload component to analyze page
- [ ] Support `.tf`, `.tfplan`, `.json`, `.yaml`, `.yml` files
- [ ] Read file content with `file.text()`
- [ ] Call `/parse-iac` API
- [ ] Display parsing progress
- [ ] Show parsed resource summary
- [ ] Display security issues with severity
- [ ] Auto-fill form with description
- [ ] Add loading states and error handling

**Estimated Time:** 2.5 days

### Phase 3.2: AWS Context Integration (Week 3-4)

#### Backend Tasks
- [ ] Add AWS SDK dependencies to Lambda
- [ ] Add `/fetch-aws-context` endpoint
- [ ] Implement IAM role assumption (STS)
- [ ] Implement credential-based auth
- [ ] Query EC2 instances
- [ ] Query RDS databases
- [ ] Query S3 buckets
- [ ] Query Lambda functions
- [ ] Query Load Balancers
- [ ] Query VPCs, subnets, security groups
- [ ] Build structured resource map
- [ ] Add error handling for AWS API failures
- [ ] Implement 15-minute session timeout
- [ ] Add CloudWatch logging for security audit

#### Frontend Tasks
- [ ] Add "Fetch AWS context" checkbox
- [ ] Create AWS configuration modal
- [ ] Add IAM role ARN input
- [ ] Add temporary credentials inputs
- [ ] Add region selector
- [ ] Implement credential validation
- [ ] Call `/fetch-aws-context` API
- [ ] Display fetching progress
- [ ] Show resource count summary
- [ ] Add security warnings and best practices
- [ ] Handle errors gracefully

#### Infrastructure Tasks
- [ ] Update Lambda IAM role for STS AssumeRole
- [ ] Add AWS SDK packages to Lambda
- [ ] Increase Lambda timeout to 120 seconds
- [ ] Increase Lambda memory to 512MB
- [ ] Add environment variables for configuration
- [ ] Create documentation for user IAM role setup

**Estimated Time:** 4 days

### Phase 3.3: Enhanced Pre-Mortem (Week 5)

#### Backend Tasks
- [ ] Update pre-mortem prompt to include IaC analysis
- [ ] Update pre-mortem prompt to include AWS context
- [ ] Enhance prompt with specific instructions for context-aware analysis
- [ ] Parse enhanced response
- [ ] Test with various combinations:
  - Manual description only
  - IaC parsing only
  - AWS context only
  - IaC + AWS context
- [ ] Optimize prompt for accuracy

#### Frontend Tasks
- [ ] Update analyze form to pass IaC analysis
- [ ] Update analyze form to pass AWS context
- [ ] Show enhanced analysis indicators
- [ ] Display context-aware insights
- [ ] Add "Powered by AWS Context" badge
- [ ] Update UI to show data sources used

**Estimated Time:** 2 days

### Phase 3.4: Testing & Polish (Week 6)

#### Testing Tasks
- [ ] Test IaC parsing with various Terraform plans
- [ ] Test IaC parsing with various CloudFormation templates
- [ ] Test AWS context with different account configurations
- [ ] Test IAM role assumption flow
- [ ] Test temporary credentials flow
- [ ] Test error scenarios (invalid credentials, API failures)
- [ ] Test security: ensure credentials not logged/stored
- [ ] Test enhanced pre-mortem quality
- [ ] Load testing for concurrent users
- [ ] Security audit of credential handling

#### Documentation Tasks
- [ ] Create user guide for IaC parsing
- [ ] Create user guide for AWS context setup
- [ ] Document IAM role creation steps
- [ ] Document security best practices
- [ ] Add troubleshooting guide
- [ ] Update API documentation
- [ ] Create video tutorial (optional)

#### Polish Tasks
- [ ] Improve error messages
- [ ] Add helpful tooltips
- [ ] Optimize loading states
- [ ] Add analytics tracking
- [ ] Performance optimization
- [ ] UI/UX improvements based on testing

**Estimated Time:** 3 days

## Total Timeline: 6 weeks

- Week 1-2: IaC Parsing
- Week 3-4: AWS Context Integration
- Week 5: Enhanced Pre-Mortem
- Week 6: Testing & Polish

## Infrastructure Requirements

### Lambda Updates
```javascript
// package.json additions
{
  "dependencies": {
    "@aws-sdk/client-ec2": "^3.700.0",
    "@aws-sdk/client-rds": "^3.700.0",
    "@aws-sdk/client-s3": "^3.700.0",
    "@aws-sdk/client-lambda": "^3.700.0",
    "@aws-sdk/client-elastic-load-balancing-v2": "^3.700.0",
    "@aws-sdk/client-sts": "^3.700.0"
  }
}
```

### Terraform Changes
```hcl
# infrastructure/main.tf

# Update Lambda configuration
resource "aws_lambda_function" "premortem" {
  # ... existing config ...
  
  timeout     = 120  # Increased for AWS API calls
  memory_size = 512  # Increased for processing
  
  environment {
    variables = {
      # ... existing vars ...
      ENABLE_IAC_PARSING    = "true"
      ENABLE_AWS_CONTEXT    = "true"
      MAX_AWS_RESOURCES     = "1000"
      AWS_CONTEXT_TIMEOUT   = "900"  # 15 minutes
    }
  }
}

# Add STS permissions
resource "aws_iam_role_policy" "lambda_sts" {
  name = "sts-assume-role"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "sts:AssumeRole"
      ]
      Resource = "*"  # Users provide their own role ARNs
    }]
  })
}
```

## Security Checklist

- [ ] Credentials never logged
- [ ] Credentials never stored in database
- [ ] Credentials never sent to frontend
- [ ] Use HTTPS for all API calls
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Sanitize all inputs
- [ ] Use least-privilege IAM permissions
- [ ] Implement session timeouts
- [ ] Add CloudWatch alarms for suspicious activity
- [ ] Encrypt sensitive data in transit
- [ ] Add external ID for role assumption
- [ ] Document security best practices for users
- [ ] Regular security audits

## Success Metrics

- [ ] 80% of users try IaC parsing feature
- [ ] 30% of users enable AWS context
- [ ] Average parsing time < 10 seconds
- [ ] AWS context fetch time < 30 seconds
- [ ] 95% parsing accuracy for common IaC patterns
- [ ] Zero credential leaks or security incidents
- [ ] User satisfaction score > 4.5/5
- [ ] Enhanced pre-mortem quality improvement > 40%

## Rollout Strategy

### Phase 1: Beta (Week 7)
- Enable for internal testing
- Invite 10 beta users
- Collect feedback
- Fix critical issues

### Phase 2: Limited Release (Week 8)
- Enable for 100 users
- Monitor usage and errors
- Optimize based on real usage
- Improve documentation

### Phase 3: General Availability (Week 9)
- Enable for all users
- Announce feature launch
- Create marketing materials
- Monitor adoption

## Future Enhancements (Phase 4+)

- [ ] Support for Pulumi programs
- [ ] Support for AWS CDK apps
- [ ] Support for Kubernetes manifests
- [ ] Real-time AWS Config integration
- [ ] Terraform state file analysis
- [ ] Cost estimation integration
- [ ] Compliance checking (CIS, PCI-DSS)
- [ ] Multi-account support
- [ ] Saved AWS configurations
- [ ] Scheduled infrastructure scans
- [ ] Drift detection alerts
- [ ] Integration with CI/CD pipelines

## Risk Mitigation

### Technical Risks
- **Risk:** Claude parsing accuracy < 90%
  - **Mitigation:** Extensive testing, prompt optimization, fallback to manual entry
  
- **Risk:** AWS API rate limiting
  - **Mitigation:** Implement exponential backoff, cache results, batch requests

- **Risk:** Lambda timeout with large AWS accounts
  - **Mitigation:** Implement pagination, parallel queries, increase timeout

### Security Risks
- **Risk:** Credential leakage
  - **Mitigation:** Never log/store credentials, security audit, penetration testing

- **Risk:** Unauthorized AWS access
  - **Mitigation:** Require external ID, implement rate limiting, monitor for abuse

### Business Risks
- **Risk:** Low adoption rate
  - **Mitigation:** User education, clear value proposition, easy onboarding

- **Risk:** High AWS API costs
  - **Mitigation:** Implement caching, rate limiting, usage-based pricing

## Cost Estimate

### Development
- Engineering: 6 weeks × $10k/week = $60k
- Testing: 1 week × $8k/week = $8k
- **Total Development:** $68k

### Operational (Monthly)
- Lambda executions: ~$10
- AWS SDK API calls: ~$5
- Bedrock API calls: ~$20
- Data transfer: ~$5
- **Total Monthly:** ~$40

### ROI
- Increased user engagement: +40%
- Premium feature for paid tier: +$50/user/month
- Break-even: ~2 paid users

## Conclusion

Phase 3 transforms WhatBreaks from a theoretical analysis tool to a practical, context-aware infrastructure risk assessment platform. By combining IaC parsing with real AWS infrastructure context, we provide users with actionable insights grounded in their actual environment.

The implementation is straightforward, leveraging existing infrastructure and Claude's intelligence for parsing. The AWS context integration adds significant value while maintaining security through read-only access and temporary credentials.

**Ready to start implementation!**
