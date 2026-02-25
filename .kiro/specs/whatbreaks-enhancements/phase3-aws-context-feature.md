# Phase 3: AWS Context Integration - Live Infrastructure Analysis

## Feature Overview

Allow users to optionally connect their AWS account to fetch current infrastructure state and compare it with proposed changes for more accurate pre-mortem analysis.

## User Flow

```
┌─────────────────────────────────────┐
│  Analyze Page                       │
├─────────────────────────────────────┤
│  [Upload Terraform Plan]            │
│                                     │
│  ☐ Fetch current AWS infrastructure │
│     for context                     │
│                                     │
│  [Configure AWS Access] (if checked)│
└─────────────────────────────────────┘
       │
       ▼ (if checked)
┌─────────────────────────────────────┐
│  AWS Configuration Modal            │
├─────────────────────────────────────┤
│  How to connect:                    │
│  ○ Temporary Credentials            │
│  ○ IAM Role ARN (AssumeRole)        │
│                                     │
│  Region: [us-east-1 ▼]              │
│                                     │
│  [Connect & Fetch]                  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Fetching Infrastructure...         │
│  ⏳ Scanning resources...           │
│  ✓ Found 47 resources               │
│  ✓ Analyzing dependencies...        │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Enhanced Pre-Mortem Analysis       │
│  With Real AWS Context              │
└─────────────────────────────────────┘
```

## Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Check "Fetch AWS context"
       │ 2. Provide credentials
       ▼
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 3. POST /fetch-aws-context
       ▼
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │ 4. Invoke Lambda
       ▼
┌─────────────────────────────────────┐
│  Lambda (Node.js)                   │
│  ┌───────────────────────────────┐  │
│  │ 1. Assume IAM role (if ARN)   │  │
│  │ 2. Use AWS SDK to query:      │  │
│  │    - EC2 instances            │  │
│  │    - RDS databases            │  │
│  │    - S3 buckets               │  │
│  │    - Lambda functions         │  │
│  │    - Load balancers           │  │
│  │    - VPCs, subnets, SGs       │  │
│  │ 3. Build resource map         │  │
│  │ 4. Identify dependencies      │  │
│  │ 5. Return structured data     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  AWS APIs   │
│  (Read-Only)│
└─────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Enhanced Pre-Mortem with Context   │
│  ┌───────────────────────────────┐  │
│  │ Current State (from AWS)      │  │
│  │ Proposed Changes (from IaC)   │  │
│  │ Impact Analysis (Claude)      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Implementation Details

### 1. Frontend UI

```tsx
// frontend/src/app/analyze/page.tsx

const [fetchAwsContext, setFetchAwsContext] = useState(false);
const [awsConfig, setAwsConfig] = useState({
  method: 'role', // 'role' or 'credentials'
  roleArn: '',
  accessKeyId: '',
  secretAccessKey: '',
  sessionToken: '',
  region: 'us-east-1',
});
const [awsContext, setAwsContext] = useState<any>(null);
const [fetchingContext, setFetchingContext] = useState(false);

// UI Component
<div className="border border-white/10 rounded-lg p-4 mb-6">
  <label className="flex items-center space-x-3 cursor-pointer">
    <input
      type="checkbox"
      checked={fetchAwsContext}
      onChange={(e) => setFetchAwsContext(e.target.checked)}
      className="w-5 h-5 rounded border-white/20"
    />
    <div>
      <span className="text-white font-medium">
        Fetch current AWS infrastructure for context
      </span>
      <p className="text-sm text-gray-400 mt-1">
        Analyze your existing AWS resources to provide more accurate pre-mortem analysis
      </p>
    </div>
  </label>

  {fetchAwsContext && (
    <div className="mt-4 pl-8 space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
        <p className="text-sm text-blue-300">
          ℹ️ We'll fetch read-only information about your AWS resources to understand current state
        </p>
      </div>

      {/* Connection Method */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Connection Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="role"
              checked={awsConfig.method === 'role'}
              onChange={(e) => setAwsConfig({ ...awsConfig, method: 'role' })}
              className="w-4 h-4"
            />
            <span className="text-white">IAM Role ARN (Recommended)</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="credentials"
              checked={awsConfig.method === 'credentials'}
              onChange={(e) => setAwsConfig({ ...awsConfig, method: 'credentials' })}
              className="w-4 h-4"
            />
            <span className="text-white">Temporary Credentials</span>
          </label>
        </div>
      </div>

      {/* IAM Role ARN */}
      {awsConfig.method === 'role' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            IAM Role ARN
          </label>
          <Input
            type="text"
            placeholder="arn:aws:iam::123456789012:role/WhatBreaksReadOnly"
            value={awsConfig.roleArn}
            onChange={(e) => setAwsConfig({ ...awsConfig, roleArn: e.target.value })}
            className="bg-white/5 border-white/20 text-white"
          />
          <p className="text-xs text-gray-400 mt-1">
            Create a read-only role in your AWS account with trust relationship to our Lambda
          </p>
        </div>
      )}

      {/* Temporary Credentials */}
      {awsConfig.method === 'credentials' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Access Key ID
            </label>
            <Input
              type="text"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              value={awsConfig.accessKeyId}
              onChange={(e) => setAwsConfig({ ...awsConfig, accessKeyId: e.target.value })}
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Secret Access Key
            </label>
            <Input
              type="password"
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              value={awsConfig.secretAccessKey}
              onChange={(e) => setAwsConfig({ ...awsConfig, secretAccessKey: e.target.value })}
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Token (Optional)
            </label>
            <Input
              type="password"
              placeholder="For temporary credentials only"
              value={awsConfig.sessionToken}
              onChange={(e) => setAwsConfig({ ...awsConfig, sessionToken: e.target.value })}
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
            <p className="text-xs text-yellow-300">
              ⚠️ Credentials are used once and never stored. Use temporary credentials from AWS STS for security.
            </p>
          </div>
        </div>
      )}

      {/* Region */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          AWS Region
        </label>
        <Select
          value={awsConfig.region}
          onChange={(e) => setAwsConfig({ ...awsConfig, region: e.target.value })}
          className="bg-white/5 border-white/20 text-white"
        >
          <option value="us-east-1">US East (N. Virginia)</option>
          <option value="us-east-2">US East (Ohio)</option>
          <option value="us-west-1">US West (N. California)</option>
          <option value="us-west-2">US West (Oregon)</option>
          <option value="eu-west-1">EU (Ireland)</option>
          <option value="eu-central-1">EU (Frankfurt)</option>
          <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
          <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
        </Select>
      </div>

      {/* Fetch Button */}
      <Button
        type="button"
        onClick={handleFetchAwsContext}
        disabled={fetchingContext || !isAwsConfigValid()}
        className="w-full bg-blue-500 hover:bg-blue-600"
      >
        {fetchingContext ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Fetching AWS Resources...
          </>
        ) : (
          'Fetch AWS Context'
        )}
      </Button>

      {/* Context Summary */}
      {awsContext && (
        <div className="bg-green-500/10 border border-green-500/20 rounded p-4">
          <h4 className="text-green-400 font-semibold mb-2">
            ✓ AWS Context Fetched
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">EC2 Instances:</span>
              <span className="text-white ml-2">{awsContext.ec2?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-400">RDS Databases:</span>
              <span className="text-white ml-2">{awsContext.rds?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-400">S3 Buckets:</span>
              <span className="text-white ml-2">{awsContext.s3?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-400">Lambda Functions:</span>
              <span className="text-white ml-2">{awsContext.lambda?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-400">Load Balancers:</span>
              <span className="text-white ml-2">{awsContext.elb?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-400">VPCs:</span>
              <span className="text-white ml-2">{awsContext.vpc?.length || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )}
</div>

// Handler
const handleFetchAwsContext = async () => {
  setFetchingContext(true);
  try {
    const response = await fetch('/api/fetch-aws-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(awsConfig),
    });

    const context = await response.json();
    setAwsContext(context);
  } catch (error) {
    alert('Failed to fetch AWS context: ' + error.message);
  } finally {
    setFetchingContext(false);
  }
};

const isAwsConfigValid = () => {
  if (awsConfig.method === 'role') {
    return awsConfig.roleArn && awsConfig.region;
  } else {
    return awsConfig.accessKeyId && awsConfig.secretAccessKey && awsConfig.region;
  }
};
```

### 2. Backend Lambda Function

```javascript
// backend/premortem-lambda/index.js

const { 
  EC2Client, DescribeInstancesCommand,
  RDSClient, DescribeDBInstancesCommand,
  S3Client, ListBucketsCommand,
  LambdaClient, ListFunctionsCommand,
  ELBv2Client, DescribeLoadBalancersCommand,
  EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand,
  STSClient, AssumeRoleCommand
} = require('@aws-sdk/client-*');

async function handleFetchAwsContext(event) {
  const body = JSON.parse(event.body);
  const { method, roleArn, accessKeyId, secretAccessKey, sessionToken, region } = body;

  let credentials;

  // Get credentials
  if (method === 'role') {
    // Assume role
    const stsClient = new STSClient({ region });
    const assumeRoleCommand = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: 'WhatBreaksAnalysis',
      DurationSeconds: 900, // 15 minutes
    });
    
    const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
    credentials = {
      accessKeyId: assumeRoleResponse.Credentials.AccessKeyId,
      secretAccessKey: assumeRoleResponse.Credentials.SecretAccessKey,
      sessionToken: assumeRoleResponse.Credentials.SessionToken,
    };
  } else {
    // Use provided credentials
    credentials = {
      accessKeyId,
      secretAccessKey,
      sessionToken: sessionToken || undefined,
    };
  }

  // Fetch AWS resources
  const context = await fetchAwsResources(credentials, region);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
  };
}

async function fetchAwsResources(credentials, region) {
  const config = { credentials, region };
  
  const context = {
    region,
    fetchedAt: new Date().toISOString(),
    ec2: [],
    rds: [],
    s3: [],
    lambda: [],
    elb: [],
    vpc: [],
  };

  try {
    // Fetch EC2 instances
    const ec2Client = new EC2Client(config);
    const ec2Response = await ec2Client.send(new DescribeInstancesCommand({}));
    context.ec2 = ec2Response.Reservations?.flatMap(r => 
      r.Instances?.map(i => ({
        id: i.InstanceId,
        type: i.InstanceType,
        state: i.State.Name,
        vpc: i.VpcId,
        subnet: i.SubnetId,
        securityGroups: i.SecurityGroups?.map(sg => sg.GroupId),
        tags: i.Tags?.reduce((acc, tag) => ({ ...acc, [tag.Key]: tag.Value }), {}),
      }))
    ) || [];

    // Fetch RDS instances
    const rdsClient = new RDSClient(config);
    const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
    context.rds = rdsResponse.DBInstances?.map(db => ({
      id: db.DBInstanceIdentifier,
      engine: db.Engine,
      engineVersion: db.EngineVersion,
      instanceClass: db.DBInstanceClass,
      status: db.DBInstanceStatus,
      multiAZ: db.MultiAZ,
      vpc: db.DBSubnetGroup?.VpcId,
      securityGroups: db.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId),
    })) || [];

    // Fetch S3 buckets
    const s3Client = new S3Client(config);
    const s3Response = await s3Client.send(new ListBucketsCommand({}));
    context.s3 = s3Response.Buckets?.map(b => ({
      name: b.Name,
      creationDate: b.CreationDate,
    })) || [];

    // Fetch Lambda functions
    const lambdaClient = new LambdaClient(config);
    const lambdaResponse = await lambdaClient.send(new ListFunctionsCommand({}));
    context.lambda = lambdaResponse.Functions?.map(f => ({
      name: f.FunctionName,
      runtime: f.Runtime,
      handler: f.Handler,
      memorySize: f.MemorySize,
      timeout: f.Timeout,
      vpc: f.VpcConfig?.VpcId,
    })) || [];

    // Fetch Load Balancers
    const elbClient = new ELBv2Client(config);
    const elbResponse = await elbClient.send(new DescribeLoadBalancersCommand({}));
    context.elb = elbResponse.LoadBalancers?.map(lb => ({
      name: lb.LoadBalancerName,
      type: lb.Type,
      scheme: lb.Scheme,
      vpc: lb.VpcId,
      subnets: lb.AvailabilityZones?.map(az => az.SubnetId),
    })) || [];

    // Fetch VPCs
    const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({}));
    context.vpc = vpcResponse.Vpcs?.map(v => ({
      id: v.VpcId,
      cidr: v.CidrBlock,
      isDefault: v.IsDefault,
      tags: v.Tags?.reduce((acc, tag) => ({ ...acc, [tag.Key]: tag.Value }), {}),
    })) || [];

  } catch (error) {
    console.error('Error fetching AWS resources:', error);
    throw new Error(`Failed to fetch AWS resources: ${error.message}`);
  }

  return context;
}
```

### 3. Enhanced Pre-Mortem Prompt

```javascript
function buildEnhancedPreMortemPrompt(input, iacAnalysis, awsContext) {
  let prompt = `You are a reliability engineering expert performing a pre-mortem analysis.

INFRASTRUCTURE CHANGE:
${input.description}

${iacAnalysis ? `
PROPOSED CHANGES (from IaC):
${JSON.stringify(iacAnalysis, null, 2)}
` : ''}

${awsContext ? `
CURRENT AWS INFRASTRUCTURE:
Region: ${awsContext.region}
Fetched: ${awsContext.fetchedAt}

EC2 Instances (${awsContext.ec2.length}):
${awsContext.ec2.map(i => `- ${i.id} (${i.type}, ${i.state})`).join('\n')}

RDS Databases (${awsContext.rds.length}):
${awsContext.rds.map(db => `- ${db.id} (${db.engine} ${db.engineVersion}, ${db.instanceClass}, MultiAZ: ${db.multiAZ})`).join('\n')}

S3 Buckets (${awsContext.s3.length}):
${awsContext.s3.map(b => `- ${b.name}`).join('\n')}

Lambda Functions (${awsContext.lambda.length}):
${awsContext.lambda.map(f => `- ${f.name} (${f.runtime}, ${f.memorySize}MB, ${f.timeout}s timeout)`).join('\n')}

Load Balancers (${awsContext.elb.length}):
${awsContext.elb.map(lb => `- ${lb.name} (${lb.type}, ${lb.scheme})`).join('\n')}

VPCs (${awsContext.vpc.length}):
${awsContext.vpc.map(v => `- ${v.id} (${v.cidr})`).join('\n')}

CRITICAL: Use this REAL infrastructure context to:
1. Identify actual dependencies between existing and new resources
2. Assess real capacity and scaling limits
3. Detect configuration drift or inconsistencies
4. Evaluate actual blast radius based on current topology
5. Consider real traffic patterns and resource utilization
` : ''}

Generate a detailed pre-mortem report...`;

  return prompt;
}
```

### 4. IAM Role Setup (User's AWS Account)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_WHATBREAKS_ACCOUNT:role/whatbreaks-lambda"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "whatbreaks-analysis"
        }
      }
    }
  ]
}
```

**Permissions Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "rds:Describe*",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "lambda:ListFunctions",
        "lambda:GetFunction",
        "elasticloadbalancing:Describe*",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    }
  ]
}
```

## Security Considerations

### 1. Credentials Handling
- **Never store credentials** - Use once and discard
- **Prefer IAM roles** over access keys
- **Short-lived sessions** - 15 minute maximum
- **Audit logging** - Log all AWS API calls
- **Encryption in transit** - HTTPS only

### 2. Least Privilege
- **Read-only permissions** - No write/delete actions
- **Resource-level permissions** - Limit to specific resources if possible
- **Condition keys** - Add IP restrictions, time windows

### 3. User Education
- **Temporary credentials** - Recommend AWS STS
- **Role assumption** - Preferred method
- **External ID** - Prevent confused deputy problem
- **Credential rotation** - Encourage short-lived tokens

## Benefits of AWS Context

### 1. More Accurate Analysis
- Real resource configurations vs assumptions
- Actual dependencies and relationships
- Current capacity and limits
- Existing security configurations

### 2. Better Risk Assessment
- Identify hidden dependencies
- Assess real blast radius
- Detect configuration drift
- Evaluate actual impact

### 3. Actionable Insights
- Specific resource recommendations
- Real capacity planning
- Actual bottleneck identification
- Concrete mitigation steps

## Example Enhanced Analysis

**Without AWS Context:**
> "Migrating to Redis cluster may cause connection failures if clients don't support cluster mode."

**With AWS Context:**
> "Migrating to Redis cluster will affect 12 Lambda functions currently connecting to redis-prod-001.abc123.0001.use1.cache.amazonaws.com. Analysis shows:
> - 8 functions use redis-py 3.5.3 (does NOT support cluster mode)
> - 4 functions use redis-py 4.1.0 (supports cluster mode)
> - Peak connection count: 450 concurrent connections
> - Current throughput: 8,500 req/sec
> 
> CRITICAL: 8 Lambda functions will fail immediately upon migration. Must upgrade redis-py library first."

## Implementation Timeline

- **Week 1:** Backend AWS SDK integration
- **Week 2:** Frontend UI and credential handling
- **Week 3:** Enhanced prompt and analysis
- **Week 4:** Security hardening and testing

**Total: 4 weeks**
