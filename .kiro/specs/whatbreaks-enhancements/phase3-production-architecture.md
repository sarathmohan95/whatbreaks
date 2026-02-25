# Phase 3: Production Architecture for IaC Parsing

## Problem Statement

MCP servers are designed for local IDE use with stdio communication. We need to adapt them for production web application use where:
- Users upload files through a web interface
- Processing happens server-side
- No local IDE environment available
- Must scale to multiple concurrent users

## Production Architecture Options

### Option A: Lambda with Python Runtime (Recommended)

**Architecture:**
```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │ 1. Upload file
       ▼
┌─────────────┐
│  Frontend   │
│  (Next.js)  │
└──────┬──────┘
       │ 2. POST /parse-terraform
       ▼
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │ 3. Invoke Lambda
       ▼
┌─────────────────────────────────┐
│  Lambda (Python 3.11)           │
│  ┌───────────────────────────┐  │
│  │ Main Handler              │  │
│  │ - Download file from S3   │  │
│  │ - Parse with Python libs  │  │
│  │ - Run Checkov for security│  │
│  │ - Generate description    │  │
│  └───────────────────────────┘  │
│                                 │
│  Dependencies:                  │
│  - python-hcl2 (Terraform)     │
│  - pyyaml (CloudFormation)     │
│  - checkov (Security scanning) │
│  - boto3 (AWS SDK)             │
└─────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  S3 Bucket  │
│  (Temp)     │
└─────────────┘
```

**How It Works:**

1. **File Upload Flow:**
   - User uploads Terraform/CloudFormation file in browser
   - Frontend gets presigned S3 URL from API
   - Frontend uploads file directly to S3
   - Frontend calls `/parse-terraform` or `/parse-cloudformation` with S3 key

2. **Lambda Processing:**
   - Lambda downloads file from S3
   - Uses native Python libraries to parse:
     - `python-hcl2` for Terraform JSON plans
     - `pyyaml` + `cfn-lint` for CloudFormation
   - Runs `checkov` for security scanning
   - Extracts resource changes
   - Generates natural language description
   - Returns structured JSON response

3. **Response:**
   ```json
   {
     "success": true,
     "summary": {
       "totalResources": 8,
       "toCreate": 5,
       "toModify": 2,
       "toDestroy": 1,
       "resourceTypes": ["aws_s3_bucket", "aws_lambda_function"]
     },
     "description": "Migrating from single S3 bucket to multi-region setup...",
     "securityIssues": [
       {
         "severity": "HIGH",
         "resource": "aws_s3_bucket.data",
         "issue": "Bucket encryption not enabled",
         "recommendation": "Enable AES-256 encryption"
       }
     ],
     "resources": [...]
   }
   ```

**Pros:**
- No MCP server complexity
- Native Python libraries are mature and well-tested
- Scales automatically with Lambda
- Cost-effective (pay per invocation)
- Easy to deploy and maintain

**Cons:**
- Doesn't use MCP servers (but that's actually fine!)
- Need to implement parsing logic ourselves
- Limited to what Python libraries support

**Implementation:**

```python
# backend/iac-parser-lambda/handler.py
import json
import boto3
import hcl2
import yaml
from checkov.main import Checkov

s3 = boto3.client('s3')

def parse_terraform_plan(event, context):
    # Get S3 key from request
    body = json.loads(event['body'])
    s3_key = body['s3Key']
    bucket = os.environ['IAC_UPLOADS_BUCKET']
    
    # Download file from S3
    response = s3.get_object(Bucket=bucket, Key=s3_key)
    plan_content = response['Body'].read().decode('utf-8')
    
    # Parse Terraform plan JSON
    plan = json.loads(plan_content)
    
    # Extract resource changes
    changes = extract_resource_changes(plan)
    
    # Run Checkov security scan
    security_issues = run_checkov_scan(plan_content)
    
    # Generate description
    description = generate_description(changes, security_issues)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'summary': changes['summary'],
            'description': description,
            'securityIssues': security_issues,
            'resources': changes['resources']
        })
    }

def extract_resource_changes(plan):
    """Extract resource changes from Terraform plan"""
    changes = {
        'toCreate': [],
        'toModify': [],
        'toDestroy': [],
        'summary': {}
    }
    
    for resource_change in plan.get('resource_changes', []):
        action = resource_change['change']['actions'][0]
        resource = {
            'type': resource_change['type'],
            'name': resource_change['name'],
            'action': action,
            'attributes': resource_change['change'].get('after', {})
        }
        
        if action == 'create':
            changes['toCreate'].append(resource)
        elif action == 'update':
            changes['toModify'].append(resource)
        elif action == 'delete':
            changes['toDestroy'].append(resource)
    
    changes['summary'] = {
        'totalResources': len(changes['toCreate']) + len(changes['toModify']) + len(changes['toDestroy']),
        'toCreate': len(changes['toCreate']),
        'toModify': len(changes['toModify']),
        'toDestroy': len(changes['toDestroy']),
        'resourceTypes': list(set([r['type'] for r in changes['toCreate'] + changes['toModify'] + changes['toDestroy']]))
    }
    
    return changes

def run_checkov_scan(plan_content):
    """Run Checkov security scan on Terraform plan"""
    # Write plan to temp file
    with open('/tmp/plan.json', 'w') as f:
        f.write(plan_content)
    
    # Run Checkov
    checkov = Checkov()
    results = checkov.run(['/tmp/plan.json'])
    
    # Extract issues
    issues = []
    for check in results.get('failed_checks', []):
        issues.append({
            'severity': check['severity'],
            'resource': check['resource'],
            'issue': check['check_name'],
            'recommendation': check['guideline']
        })
    
    return issues

def generate_description(changes, security_issues):
    """Generate natural language description"""
    parts = []
    
    # Summary
    summary = changes['summary']
    parts.append(f"Infrastructure change affecting {summary['totalResources']} resources:")
    
    # Creates
    if summary['toCreate'] > 0:
        resource_types = [r['type'] for r in changes['toCreate']]
        parts.append(f"- Creating {summary['toCreate']} new resources: {', '.join(set(resource_types))}")
    
    # Modifies
    if summary['toModify'] > 0:
        resource_types = [r['type'] for r in changes['toModify']]
        parts.append(f"- Modifying {summary['toModify']} existing resources: {', '.join(set(resource_types))}")
    
    # Destroys
    if summary['toDestroy'] > 0:
        resource_types = [r['type'] for r in changes['toDestroy']]
        parts.append(f"- Destroying {summary['toDestroy']} resources: {', '.join(set(resource_types))}")
    
    # Security issues
    if security_issues:
        high_severity = [i for i in security_issues if i['severity'] == 'HIGH']
        if high_severity:
            parts.append(f"\n⚠️ Security Issues: {len(high_severity)} high-severity issues detected")
    
    return '\n'.join(parts)
```

**Deployment:**

```hcl
# infrastructure/iac-parser-lambda.tf

resource "aws_lambda_function" "iac_parser" {
  filename         = "iac-parser-lambda.zip"
  function_name    = "${var.project_name}-iac-parser"
  role            = aws_iam_role.iac_parser_lambda.arn
  handler         = "handler.parse_terraform_plan"
  runtime         = "python3.11"
  timeout         = 120
  memory_size     = 1024

  environment {
    variables = {
      IAC_UPLOADS_BUCKET = aws_s3_bucket.iac_uploads.id
    }
  }

  tags = var.common_tags
}

resource "aws_iam_role" "iac_parser_lambda" {
  name = "${var.project_name}-iac-parser-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "iac_parser_lambda_basic" {
  role       = aws_iam_role.iac_parser_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "iac_parser_s3" {
  name = "s3-access"
  role = aws_iam_role.iac_parser_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:DeleteObject"
      ]
      Resource = "${aws_s3_bucket.iac_uploads.arn}/*"
    }]
  })
}
```

---

### Option B: ECS Fargate with MCP Server Containers

**Architecture:**
```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Lambda    │
│  (Proxy)    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  ECS Fargate Cluster            │
│  ┌───────────────────────────┐  │
│  │ MCP Server Container      │  │
│  │ - Terraform MCP Server    │  │
│  │ - HTTP API wrapper        │  │
│  │ - Checkov integration     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ CloudFormation MCP Server │  │
│  │ - CFN MCP Server          │  │
│  │ - HTTP API wrapper        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**How It Works:**

1. **MCP Server Wrapper:**
   - Create HTTP API wrapper around MCP servers
   - Convert HTTP requests to MCP stdio protocol
   - Run MCP servers as background processes
   - Return JSON responses

2. **Container Setup:**
   ```dockerfile
   # Dockerfile for Terraform MCP Server
   FROM python:3.11-slim
   
   # Install uv and MCP server
   RUN pip install uv
   RUN uv tool install awslabs.terraform-mcp-server
   
   # Install HTTP wrapper
   COPY mcp_http_wrapper.py /app/
   
   # Expose port
   EXPOSE 8080
   
   CMD ["python", "/app/mcp_http_wrapper.py"]
   ```

3. **HTTP Wrapper:**
   ```python
   # mcp_http_wrapper.py
   from fastapi import FastAPI, UploadFile
   import subprocess
   import json
   
   app = FastAPI()
   
   @app.post("/parse-terraform")
   async def parse_terraform(file: UploadFile):
       # Save uploaded file
       content = await file.read()
       
       # Call MCP server via subprocess
       process = subprocess.Popen(
           ['uvx', 'awslabs.terraform-mcp-server'],
           stdin=subprocess.PIPE,
           stdout=subprocess.PIPE,
           stderr=subprocess.PIPE
       )
       
       # Send MCP protocol message
       mcp_request = {
           "jsonrpc": "2.0",
           "method": "tools/call",
           "params": {
               "name": "parse_terraform_plan",
               "arguments": {
                   "plan_content": content.decode('utf-8')
               }
           },
           "id": 1
       }
       
       stdout, stderr = process.communicate(
           input=json.dumps(mcp_request).encode()
       )
       
       # Parse response
       response = json.loads(stdout.decode())
       
       return response['result']
   ```

**Pros:**
- Uses actual MCP servers
- Can leverage all MCP server features
- Isolated environment per container
- Can scale horizontally

**Cons:**
- Much more complex
- Higher cost (always-running containers)
- Requires VPC, ALB, ECS cluster
- Slower cold starts
- MCP servers not designed for HTTP

**Cost Estimate:**
- 2 Fargate tasks (512 CPU, 1GB RAM): ~$30/month
- Application Load Balancer: ~$20/month
- Data transfer: ~$5/month
- **Total: ~$55/month** (vs Lambda: ~$5/month)

---

### Option C: Hybrid Approach

**Architecture:**
```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Lambda     │   │  Step Func  │
│  (Simple)   │   │  (Complex)  │
└─────────────┘   └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ ECS Fargate │
                  │ (MCP Server)│
                  └─────────────┘
```

**How It Works:**
- Simple parsing: Use Lambda with Python libraries
- Complex analysis: Use Step Functions + ECS with MCP servers
- User chooses "Quick Parse" or "Deep Analysis"

**Pros:**
- Best of both worlds
- Cost-effective for most users
- Advanced features available when needed

**Cons:**
- More complex to maintain
- Two code paths to test

---

## Recommendation: Option A (Lambda with Python)

**Why:**
1. **Simplicity:** No MCP server complexity
2. **Cost:** ~$5/month vs ~$55/month
3. **Performance:** Faster cold starts
4. **Reliability:** Fewer moving parts
5. **Maintenance:** Easier to debug and update

**What We Lose:**
- MCP server features (but we can implement what we need)
- Checkov integration (but we can run it directly)
- Best practices guidance (but we can add our own)

**What We Gain:**
- Production-ready architecture
- Scalable and cost-effective
- Easy to deploy and maintain
- Full control over parsing logic

## Implementation Plan

### Week 1: Lambda Parser Setup
- Create Python Lambda function
- Add Terraform plan parsing with `python-hcl2`
- Add CloudFormation parsing with `pyyaml`
- Integrate Checkov for security scanning
- Test with sample files

### Week 2: Frontend Integration
- Add file upload UI
- Create S3 presigned URL endpoint
- Call parser Lambda
- Display parsed results
- Auto-fill analyze form

### Week 3: Polish & Deploy
- Add error handling
- Implement rate limiting
- Add monitoring and logging
- Deploy to production
- User acceptance testing

## Future: MCP Server Integration

If we later want MCP server features:
1. Deploy Option B (ECS Fargate) alongside Lambda
2. Add "Advanced Analysis" button
3. Route complex requests to MCP servers
4. Keep simple parsing in Lambda

This gives us a migration path without blocking MVP.
