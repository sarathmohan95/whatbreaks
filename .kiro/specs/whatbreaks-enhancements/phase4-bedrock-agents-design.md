# Phase 4: Multi-Agent Analysis with AWS Bedrock Agents
## Using Bedrock's Native Multi-Agent Orchestration

## Overview

Use AWS Bedrock Agents to create a team of specialized consultant agents that collaborate to analyze infrastructure changes. Bedrock Agents provides native multi-agent orchestration, collaboration, and tool usage without manual model invocation.

## Architecture

### Bedrock Agents Approach

Instead of manually invoking multiple models and synthesizing results, we'll use:

1. **Supervisor Agent** (Lead Consultant) - Orchestrates the analysis
2. **Specialist Agents** - Each focuses on a specific domain
3. **Agent Collaboration** - Bedrock handles communication between agents
4. **Action Groups** - Define tools/capabilities for each agent

### Agent Definitions

```
┌─────────────────────────────────────────────────────────┐
│           Supervisor Agent (Lead Consultant)            │
│  - Receives infrastructure change request               │
│  - Delegates to specialist agents                       │
│  - Synthesizes findings                                 │
│  - Generates final report                               │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Security   │  │ Reliability  │  │ Performance  │
│  Consultant  │  │   Engineer   │  │  Architect   │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐
│     Cost     │  │  Operations  │
│  Optimizer   │  │  Specialist  │
└──────────────┘  └──────────────┘
```

## Implementation Options

### Option 1: Bedrock Agents for Multi-Agent Collaboration (Recommended)

**Pros:**
- Native multi-agent orchestration
- Automatic collaboration and communication
- Built-in memory and context management
- Action groups for tool usage
- Managed infrastructure

**Cons:**
- Requires Bedrock Agents setup (Terraform or Console)
- More complex initial configuration
- Additional AWS service costs

### Option 2: Multi-Agent Collaboration (Current Implementation)

**Pros:**
- Full control over orchestration
- Simpler to understand and debug
- No additional AWS services needed

**Cons:**
- Manual orchestration logic
- Manual result synthesis
- More Lambda code to maintain

## Recommended Approach: Bedrock Agents

### Step 1: Create Bedrock Agents (Terraform)

```hcl
# Supervisor Agent
resource "aws_bedrockagent_agent" "supervisor" {
  agent_name              = "whatbreaks-supervisor"
  agent_resource_role_arn = aws_iam_role.bedrock_agent_role.arn
  foundation_model        = "anthropic.claude-3-5-sonnet-20241022-v2:0"
  
  instruction = <<-EOT
    You are the Lead Consultant for infrastructure pre-mortem analysis.
    
    Your role:
    1. Receive infrastructure change descriptions
    2. Delegate analysis to specialist consultants
    3. Synthesize their findings
    4. Generate comprehensive pre-mortem report
    
    Available specialists:
    - Security Consultant: encryption, IAM, compliance
    - Reliability Engineer: availability, failover, backups
    - Performance Architect: scaling, capacity, bottlenecks
    - Cost Optimizer: pricing, waste, optimization
    - Operations Specialist: monitoring, alerting, runbooks
    
    Coordinate with specialists to get diverse perspectives, then create
    a unified report highlighting consensus risks and trade-offs.
  EOT
}

# Security Consultant Agent
resource "aws_bedrockagent_agent" "security" {
  agent_name              = "whatbreaks-security"
  agent_resource_role_arn = aws_iam_role.bedrock_agent_role.arn
  foundation_model        = "anthropic.claude-3-5-sonnet-20241022-v2:0"
  
  instruction = <<-EOT
    You are a Security Consultant specializing in AWS security.
    
    Focus areas:
    - Encryption (at rest, in transit)
    - IAM roles and policies
    - Secrets management
    - Network security
    - Compliance (PCI-DSS, HIPAA, SOC2)
    - Audit logging
    
    Analyze infrastructure changes for security risks and provide
    specific, actionable recommendations.
  EOT
}

# Similar definitions for other specialist agents...
```

### Step 2: Configure Agent Collaboration

```hcl
# Allow supervisor to invoke specialist agents
resource "aws_bedrockagent_agent_collaboration" "supervisor_to_specialists" {
  source_agent_id = aws_bedrockagent_agent.supervisor.id
  
  target_agents = [
    aws_bedrockagent_agent.security.id,
    aws_bedrockagent_agent.reliability.id,
    aws_bedrockagent_agent.performance.id,
    aws_bedrockagent_agent.cost.id,
    aws_bedrockagent_agent.operations.id
  ]
}
```

### Step 3: Invoke from Lambda

```javascript
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

async function analyzeWithBedrockAgents(infrastructureChange) {
  const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });
  
  const prompt = `Analyze this infrastructure change:
  
Description: ${infrastructureChange.description}
Change Type: ${infrastructureChange.changeType}
Current State: ${infrastructureChange.currentState}
Proposed State: ${infrastructureChange.proposedState}
Traffic Patterns: ${infrastructureChange.trafficPatterns}

Coordinate with all specialist consultants to perform a comprehensive
pre-mortem analysis. Generate a report with:
1. Consensus risks (multiple specialists agree)
2. Dissenting opinions (specialists disagree)
3. Trade-offs and recommendations
4. Preventive actions prioritized by risk`;

  const command = new InvokeAgentCommand({
    agentId: process.env.SUPERVISOR_AGENT_ID,
    agentAliasId: process.env.SUPERVISOR_AGENT_ALIAS_ID,
    sessionId: `session-${Date.now()}`,
    inputText: prompt
  });

  const response = await client.send(command);
  
  // Stream response chunks
  let fullResponse = '';
  for await (const chunk of response.completion) {
    if (chunk.chunk?.bytes) {
      fullResponse += new TextDecoder().decode(chunk.chunk.bytes);
    }
  }
  
  return fullResponse;
}
```

## Simplified Alternative: Single Agent with Multi-Perspective Prompting

If Bedrock Agents setup is too complex, we can use a simpler approach:

### Single Agent with Role-Playing

```javascript
async function analyzeWithMultiplePerspectives(infrastructureChange) {
  const prompt = `You are a team of 5 cloud infrastructure consultants analyzing this change.

INFRASTRUCTURE CHANGE:
${infrastructureChange.description}

Analyze from 5 different perspectives:

1. SECURITY CONSULTANT:
   Focus: encryption, IAM, secrets, compliance, network security
   [Provide security analysis]

2. RELIABILITY ENGINEER:
   Focus: Multi-AZ, failover, backups, disaster recovery
   [Provide reliability analysis]

3. PERFORMANCE ARCHITECT:
   Focus: sizing, scaling, bottlenecks, capacity, latency
   [Provide performance analysis]

4. COST OPTIMIZER:
   Focus: pricing, waste, rightsizing, savings opportunities
   [Provide cost analysis]

5. OPERATIONS SPECIALIST:
   Focus: monitoring, alerting, logging, runbooks, maintenance
   [Provide operations analysis]

SYNTHESIS:
As the lead consultant, synthesize all perspectives into a unified
pre-mortem report with consensus risks, dissenting opinions, and
trade-off recommendations.`;

  // Single model invocation with multi-perspective prompt
  const response = await invokeModel('claude-3-5-sonnet', prompt);
  return response;
}
```

## Recommendation

**For MVP: Use Single Agent with Multi-Perspective Prompting**
- Simpler to implement
- No additional AWS services
- Still provides diverse analysis
- Can upgrade to Bedrock Agents later

**For Production: Migrate to Bedrock Agents**
- Better separation of concerns
- True multi-agent collaboration
- More scalable and maintainable
- Leverages AWS managed service

## Next Steps

1. Implement single-agent multi-perspective approach first
2. Test quality of analysis
3. If quality is good, ship MVP
4. Plan migration to Bedrock Agents for v2

Would you like me to:
A) Implement single-agent multi-perspective (simpler, faster)
B) Set up full Bedrock Agents infrastructure (more complex, better long-term)
