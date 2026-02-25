# WhatBreaks Phase 3: AWS Infrastructure Integration - Design Document

## Overview

Phase 3 adds AWS infrastructure integration capabilities to WhatBreaks, enabling users to analyze Terraform plans, CloudFormation templates, and live AWS infrastructure. This phase leverages AWS Labs MCP servers for enhanced IaC analysis.

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│  API Gateway │─────▶│   Lambda    │
│  (Next.js)  │      │              │      │  (Node.js)  │
└─────────────┘      └──────────────┘      └─────────────┘
       │                                            │
       │                                            ▼
       │                                    ┌─────────────┐
       │                                    │   Bedrock   │
       │                                    │   (Claude)  │
       │                                    └─────────────┘
       │                                            │
       │                                            ▼
       │                                    ┌─────────────┐
       │                                    │ MCP Servers │
       │                                    │ (Terraform) │
       │                                    │ (CloudForm) │
       │                                    └─────────────┘
       ▼
┌─────────────┐
│  File Upload│
│  (S3 Temp)  │
└─────────────┘
```

## MCP Server Integration

### 1. AWS Terraform MCP Server

**Source:** [awslabs.terraform-mcp-server](https://awslabs.github.io/mcp/servers/terraform-mcp-server)

**Capabilities:**
- Terraform best practices analysis
- Security scanning with Checkov integration
- AWS Well-Architected guidance
- Terraform workflow execution (init, plan, validate)
- Module analysis from Terraform Registry

**Installation:**
```json
{
  "mcpServers": {
    "awslabs.terraform-mcp-server": {
      "command": "uvx",
      "args": ["awslabs.terraform-mcp-server@latest"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR",
        "AWS_PROFILE": "whatbreaks",
        "AWS_REGION": "us-east-1"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**Use Cases:**
- Parse Terraform plan JSON files
- Extract resource changes (create/modify/destroy)
- Identify security issues with Checkov
- Provide AWS best practices recommendations
- Generate change descriptions from plan

### 2. AWS CloudFormation MCP Server

**Source:** [awslabs.cfn-mcp-server](https://awslabs.github.io/mcp/servers/cfn-mcp-server)

**Capabilities:**
- CloudFormation template parsing
- Resource schema information (1,100+ AWS resources)
- Template validation
- Resource dependency analysis
- Template generation from existing resources

**Installation:**
```json
{
  "mcpServers": {
    "awslabs.cfn-mcp-server": {
      "command": "uvx",
      "args": [
        "awslabs.cfn-mcp-server@latest",
        "--readonly"
      ],
      "env": {
        "AWS_PROFILE": "whatbreaks",
        "AWS_REGION": "us-east-1"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**Use Cases:**
- Parse CloudFormation templates (JSON/YAML)
- Extract resource definitions
- Identify resource dependencies
- Validate template structure
- Generate change descriptions

## Feature Implementation

### Feature 3.1: Terraform Plan Parser

#### User Flow
1. User uploads Terraform plan JSON file on analyze page
2. Frontend uploads file to S3 temporary bucket
3. Lambda downloads file from S3
4. Lambda uses Terraform MCP server to parse plan
5. MCP server extracts:
   - Resources being created/modified/destroyed
   - Resource types and counts
   - Security issues (via Checkov)
   - Best practice violations
6. Lambda generates structured change description
7. Frontend auto-fills analyze form with description
8. User can edit and generate pre-mortem

#### Technical Implementation

**Frontend Changes:**
- Add file upload component to analyze page
- Support `.tfplan` and `.json` file types
- Show upload progress
- Display parsed resource summary
- Auto-fill form fields

**Backend Changes:**
- Add S3 bucket for temporary file storage (1-hour TTL)
- Add Lambda function to parse Terraform plans
- Integrate with Terraform MCP server
- Extract resource changes and security issues
- Generate natural language description

**Data Model:**
```typescript
interface TerraformPlan {
  resourceChanges: {
    create: ResourceChange[];
    update: ResourceChange[];
    delete: ResourceChange[];
  };
  securityIssues: CheckovIssue[];
  bestPractices: Recommendation[];
  summary: {
    totalResources: number;
    resourceTypes: string[];
    estimatedDuration: string;
  };
}

interface ResourceChange {
  type: string;
  name: string;
  action: 'create' | 'update' | 'delete';
  attributes: Record<string, any>;
}
```

### Feature 3.2: CloudFormation Support

#### User Flow
1. User uploads CloudFormation template (JSON/YAML)
2. Frontend uploads file to S3
3. Lambda downloads and parses template
4. Lambda uses CloudFormation MCP server to:
   - Validate template structure
   - Extract resource definitions
   - Identify dependencies
   - Get resource schemas
5. Lambda generates change description
6. Frontend auto-fills form
7. User generates pre-mortem

#### Technical Implementation

**Frontend Changes:**
- Support `.json`, `.yaml`, `.yml` file types
- Show template validation results
- Display resource dependency graph (optional)
- Auto-fill form with extracted info

**Backend Changes:**
- Parse CloudFormation templates (JSON/YAML)
- Integrate with CloudFormation MCP server
- Extract resource definitions
- Identify resource dependencies
- Generate description from template

**Data Model:**
```typescript
interface CloudFormationTemplate {
  resources: CFResource[];
  parameters: CFParameter[];
  outputs: CFOutput[];
  dependencies: ResourceDependency[];
  summary: {
    totalResources: number;
    resourceTypes: string[];
    stackName?: string;
  };
}

interface CFResource {
  logicalId: string;
  type: string;
  properties: Record<string, any>;
  dependsOn?: string[];
}
```

### Feature 3.3: AWS Config Integration (Future)

**Note:** This feature is deferred to a later phase as it requires:
- AWS credentials management
- IAM role configuration
- Real-time AWS API calls
- Security considerations for production access

**Proposed Approach:**
- Use AWS SDK in Lambda to query AWS Config
- Fetch current resource states
- Compare with proposed changes
- Detect configuration drift
- Requires user AWS credentials (IAM role assumption)

## Infrastructure Changes

### S3 Bucket for File Uploads

**Purpose:** Temporary storage for uploaded IaC files

**Configuration:**
- Bucket name: `whatbreaks-iac-uploads-{account-id}`
- Lifecycle policy: Delete objects after 1 hour
- Encryption: AES-256
- Public access: Blocked
- CORS: Allow from frontend domain

**Terraform:**
```hcl
resource "aws_s3_bucket" "iac_uploads" {
  bucket = "${var.project_name}-iac-uploads-${data.aws_caller_identity.current.account_id}"
  
  tags = var.common_tags
}

resource "aws_s3_bucket_lifecycle_configuration" "iac_uploads" {
  bucket = aws_s3_bucket.iac_uploads.id

  rule {
    id     = "delete-after-1-hour"
    status = "Enabled"

    expiration {
      days = 1
    }
  }
}
```

### Lambda Updates

**Changes:**
- Add S3 read permissions to Lambda IAM role
- Increase memory to 512MB (for file parsing)
- Increase timeout to 120 seconds
- Add environment variables:
  - `IAC_UPLOADS_BUCKET`
  - `MCP_TERRAFORM_ENABLED`
  - `MCP_CFN_ENABLED`

### API Gateway Routes

**New Routes:**
```
POST   /parse-terraform     - Parse Terraform plan
POST   /parse-cloudformation - Parse CloudFormation template
GET    /upload-url          - Get presigned S3 upload URL
```

## MCP Server Deployment

### Option 1: Lambda Layer (Recommended)

**Pros:**
- No additional infrastructure
- Scales with Lambda
- Cost-effective

**Cons:**
- Cold start latency
- Limited to Lambda runtime

**Implementation:**
- Package MCP servers as Lambda layer
- Use Python runtime for uvx compatibility
- Configure environment variables

### Option 2: ECS Fargate

**Pros:**
- Always warm
- Better for long-running operations
- More control over environment

**Cons:**
- Higher cost
- More complex setup
- Requires VPC configuration

**Implementation:**
- Deploy MCP servers in ECS containers
- Use Application Load Balancer
- Lambda calls MCP via HTTP

### Option 3: Local Development Only

**Pros:**
- Simplest for MVP
- No production deployment complexity
- Use MCP servers in Kiro IDE only

**Cons:**
- Limited to development environment
- No production IaC parsing

**Implementation:**
- Configure MCP servers in `~/.kiro/settings/mcp.json`
- Use Kiro to analyze IaC files locally
- Generate descriptions manually
- Copy to WhatBreaks web app

**Recommendation:** Start with Option 3 for MVP, then move to Option 1 for production.

## Security Considerations

### File Upload Security
- Validate file types and sizes
- Scan for malicious content
- Use presigned URLs for uploads
- Implement rate limiting
- Delete files after processing

### AWS Credentials
- Never store AWS credentials in frontend
- Use IAM roles for Lambda
- Implement least-privilege permissions
- Audit all AWS API calls
- Use CloudTrail for monitoring

### MCP Server Security
- Run MCP servers in read-only mode
- Validate all inputs
- Sanitize file contents
- Limit resource access
- Monitor for abuse

## User Experience

### Analyze Page Updates

**New Section: "Import from IaC"**
```
┌─────────────────────────────────────┐
│  Import from Infrastructure as Code│
├─────────────────────────────────────┤
│  [Terraform Plan] [CloudFormation]  │
│                                     │
│  Drag & drop or click to upload    │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │     📄 Drop file here       │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Supported formats:                 │
│  • Terraform: .tfplan, .json        │
│  • CloudFormation: .json, .yaml     │
└─────────────────────────────────────┘
```

**After Upload:**
```
┌─────────────────────────────────────┐
│  ✓ Parsed: terraform-plan.json      │
├─────────────────────────────────────┤
│  Resources:                         │
│  • 5 to create                      │
│  • 2 to modify                      │
│  • 1 to destroy                     │
│                                     │
│  Security Issues: 3 warnings        │
│  [View Details]                     │
│                                     │
│  [Use This Analysis]                │
└─────────────────────────────────────┘
```

## Implementation Phases

### Phase 3.1: Terraform Plan Parser (Week 1-2)
- [ ] Set up MCP servers locally
- [ ] Add file upload UI component
- [ ] Create S3 bucket for uploads
- [ ] Implement Terraform plan parsing
- [ ] Generate change descriptions
- [ ] Test with sample plans

### Phase 3.2: CloudFormation Support (Week 3)
- [ ] Add CloudFormation MCP server
- [ ] Implement template parsing
- [ ] Extract resource definitions
- [ ] Generate descriptions
- [ ] Test with sample templates

### Phase 3.3: Production Deployment (Week 4)
- [ ] Deploy MCP servers (choose option)
- [ ] Add API Gateway routes
- [ ] Implement security measures
- [ ] Add monitoring and logging
- [ ] User acceptance testing

### Phase 3.4: AWS Config Integration (Future)
- Deferred to Phase 4 or later
- Requires AWS credentials management
- More complex security model

## Success Criteria

- ✅ Users can upload Terraform plans and get auto-generated descriptions
- ✅ Users can upload CloudFormation templates and get auto-generated descriptions
- ✅ Security issues are identified and highlighted
- ✅ File uploads are secure and temporary
- ✅ Parsing completes in < 10 seconds
- ✅ 90% of common IaC patterns are supported

## Testing Strategy

### Unit Tests
- File upload validation
- Terraform plan parsing
- CloudFormation template parsing
- Description generation

### Integration Tests
- End-to-end file upload flow
- MCP server integration
- S3 upload/download
- API Gateway routes

### Manual Testing
- Upload various Terraform plans
- Upload various CloudFormation templates
- Test error handling
- Verify security scanning
- Check description quality

## Future Enhancements

- Support for Pulumi programs
- Support for AWS CDK apps
- Real-time AWS Config integration
- Terraform state file analysis
- Multi-file upload (modules)
- Diff visualization
- Cost estimation integration
- Compliance checking (CIS, PCI-DSS)

## Open Questions

1. **MCP Server Deployment:** Which option should we use for production?
   - Recommendation: Start with Option 3 (local only), evaluate Option 1 (Lambda layer) later

2. **File Size Limits:** What's the maximum file size we should support?
   - Recommendation: 10MB for Terraform plans, 5MB for CloudFormation templates

3. **AWS Credentials:** How should users provide AWS credentials for Config integration?
   - Recommendation: Defer to Phase 4, use IAM role assumption with user consent

4. **Pricing:** Should we charge for IaC parsing?
   - Recommendation: Free for MVP, consider usage-based pricing later

5. **Rate Limiting:** How many uploads per user per day?
   - Recommendation: 50 uploads per day for anonymous users, 200 for authenticated

## Dependencies

- AWS Labs Terraform MCP Server
- AWS Labs CloudFormation MCP Server
- S3 bucket for file uploads
- Lambda with increased memory/timeout
- Python runtime for MCP servers (if using Lambda layer)

## Estimated Effort

- Infrastructure setup: 1 day
- Terraform parsing: 3 days
- CloudFormation parsing: 2 days
- Frontend UI: 2 days
- Testing & polish: 2 days

**Total: 2 weeks**
