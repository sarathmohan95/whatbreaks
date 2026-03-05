# Bedrock Agents Multi-Agent System

## Overview

We've implemented a multi-agent pre-mortem analysis system using AWS Bedrock Agents. The system consists of 6 specialized agents that work together to analyze infrastructure changes.

## Architecture

### Agents Created

1. **Supervisor Agent** (Lead Consultant)
   - Agent ID: `AXVEOQ9BRY`
   - Alias ID: `VTJ3VKN31A`
   - Model: Claude 3.5 Sonnet v2
   - Role: Coordinates analysis and synthesizes findings

2. **Security Consultant**
   - Agent ID: `UEW7F0MBMX`
   - Model: Claude 3.5 Sonnet v2
   - Focus: Encryption, IAM, compliance, network security

3. **Reliability Engineer**
   - Agent ID: `GWXGR2W65B`
   - Model: Claude 3 Haiku
   - Focus: Multi-AZ, failover, backups, disaster recovery

4. **Performance Architect**
   - Agent ID: `1TYUNCE1CP`
   - Model: Claude 3.5 Sonnet v2
   - Focus: Scaling, capacity, optimization, bottlenecks

5. **Cost Optimizer**
   - Agent ID: `GTFYE0DBVB`
   - Model: Claude 3.5 Sonnet v2
   - Focus: Pricing, waste reduction, cost efficiency

6. **Operations Specialist**
   - Agent ID: `9FTFB7I8KQ`
   - Model: Claude 3 Haiku
   - Focus: Monitoring, alerting, operational excellence

## Current Implementation Status

### ✅ Completed
- All 6 Bedrock Agents created with specialized instructions
- Agent aliases created for version management
- IAM roles and policies configured
- Lambda updated to invoke supervisor agent
- Environment variables configured

### 🚧 Next Steps Required

**Important Note**: AWS Bedrock Agents don't natively support agent-to-agent collaboration yet. The supervisor agent cannot directly invoke other agents. We have two options:

#### Option 1: Lambda Orchestration (Recommended for MVP)
Modify the Lambda to:
1. Invoke all 5 specialist agents in parallel
2. Collect their responses
3. Pass all findings to the supervisor agent for synthesis

```javascript
// Pseudo-code
const specialists = [security, reliability, performance, cost, operations];
const findings = await Promise.all(
  specialists.map(agent => invokeAgent(agent, prompt))
);
const finalReport = await invokeAgent(supervisor, {
  prompt: infrastructureChange,
  specialistFindings: findings
});
```

#### Option 2: Single Agent with Role-Playing (Simpler)
Use the supervisor agent with a prompt that asks it to analyze from multiple perspectives:

```javascript
const prompt = `Analyze this infrastructure change from 5 perspectives:
1. Security Consultant perspective
2. Reliability Engineer perspective  
3. Performance Architect perspective
4. Cost Optimizer perspective
5. Operations Specialist perspective

Then synthesize all perspectives into a unified report.`;
```

## Recommendation

For the MVP, I recommend **Option 2** (single agent with role-playing) because:
- Simpler implementation
- Faster response time (one agent call vs 6)
- Lower cost
- Still provides diverse analysis
- Can upgrade to Option 1 later if needed

The agents we created are still valuable - they have specialized instructions that can be used individually or we can implement Option 1 for true multi-agent collaboration.

## Testing

To test the current implementation:

```bash
curl -X POST https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com/premortem \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Migrating PostgreSQL from single instance to Multi-AZ RDS",
    "changeType": "database",
    "analysisMode": "deep"
  }'
```

## Cost Considerations

- **Quick Analysis** (single agent): ~$0.02 per analysis
- **Deep Analysis** (6 agents): ~$0.12 per analysis
- Bedrock Agents have no additional cost beyond model invocation

## Next Actions

1. **Decide on approach**: Option 1 (parallel agents) or Option 2 (role-playing)
2. **Update Lambda code** based on chosen approach
3. **Test with sample infrastructure changes**
4. **Validate quality** of multi-perspective analysis
5. **Update frontend** to display specialist findings

Would you like me to implement Option 1 (parallel agent invocation) or Option 2 (single agent role-playing)?
