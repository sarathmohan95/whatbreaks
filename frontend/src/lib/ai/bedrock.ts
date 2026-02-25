import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { InfrastructureChange, PreMortemReport, AssumedOutcome, TriggeringEvent, HiddenDependency, CascadeEvent, MissedDecision, SystemCoupling, PreventiveAction } from '@/types';

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';

interface BedrockResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

async function invokeBedrock(prompt: string, systemPrompt: string): Promise<string> {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 0.9,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    system: systemPrompt,
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as BedrockResponse;
  
  return responseBody.content[0].text;
}

// Stage 1: Context Analysis
async function analyzeContext(input: InfrastructureChange): Promise<any> {
  const systemPrompt = `You are a senior Site Reliability Engineer with 15 years of experience analyzing infrastructure failures. You have deep expertise in distributed systems, cloud architecture, and failure modes.`;

  const prompt = `TASK: Analyze the following infrastructure change and extract key information.

INFRASTRUCTURE CHANGE:
${input.description}

${input.currentState ? `CURRENT STATE:\n${input.currentState}\n` : ''}
${input.proposedState ? `PROPOSED STATE:\n${input.proposedState}\n` : ''}
${input.trafficPatterns ? `TRAFFIC PATTERNS:\n${input.trafficPatterns}\n` : ''}

Extract and structure:
1. Current state (what exists now)
2. Proposed change (what will be different)
3. Key components involved
4. Dependencies (explicit and implicit)
5. Traffic patterns and scale
6. Critical paths
7. Failure domains

Output as JSON with these exact keys: currentState, proposedChange, components, dependencies, trafficPatterns, criticalPaths, failureDomains`;

  const response = await invokeBedrock(prompt, systemPrompt);
  return JSON.parse(response);
}

// Stage 2: Failure Assumption
async function assumeFailure(context: any): Promise<any> {
  const systemPrompt = `You are conducting a pre-mortem analysis. A pre-mortem assumes that a future failure has already occurred and works backwards to understand how.`;

  const deploymentDate = new Date();
  deploymentDate.setDate(deploymentDate.getDate() + 7);
  const incidentDate = new Date(deploymentDate);
  incidentDate.setHours(incidentDate.getHours() + 2);

  const prompt = `CONTEXT:
${JSON.stringify(context, null, 2)}

COUNTERFACTUAL ASSUMPTION:
The infrastructure change described above was deployed to production on ${deploymentDate.toISOString().split('T')[0]} at 14:30 UTC.

Exactly 2 hours later, a COMPLETE SERVICE OUTAGE occurred, lasting 47 minutes and affecting 100% of users.

TASK: Given this assumed failure, determine:
1. What type of failure occurred (cascading, dependency, capacity, configuration, etc.)
2. What was the immediate trigger
3. What hidden dependencies were exposed
4. What assumptions proved incorrect
5. Estimated revenue impact

Output as JSON with these exact keys: failureType, immediateTrigger, hiddenDependencies, incorrectAssumptions, revenueImpact`;

  const response = await invokeBedrock(prompt, systemPrompt);
  return JSON.parse(response);
}

// Stage 3: Timeline Reconstruction
async function reconstructTimeline(context: any, failure: any): Promise<any> {
  const systemPrompt = `You are reconstructing the timeline of a production outage that occurred due to an infrastructure change.`;

  const prompt = `FAILURE CONTEXT:
${JSON.stringify(failure, null, 2)}

INFRASTRUCTURE CONTEXT:
${JSON.stringify(context, null, 2)}

TASK: Create a detailed minute-by-minute timeline showing how the failure unfolded. Work backwards from the complete outage to the initial deployment.

For each event in the timeline:
- Timestamp (relative to deployment, e.g., "T+0", "T+2m", "T+15m")
- What happened
- Why it happened
- What made it worse
- Whether it could have been prevented

Include:
- Initial deployment event (T+0)
- First sign of trouble
- Cascade trigger points
- System responses (auto-scaling, retries, circuit breakers)
- Human intervention attempts
- Point of no return
- Complete failure state
- Recovery initiation

Make this realistic and technically accurate. Include specific metrics, error messages, and system behaviors.

Output as JSON array with these keys for each event: timestamp, event, cause, effect, couldHaveBeenPrevented`;

  const response = await invokeBedrock(prompt, systemPrompt);
  return JSON.parse(response);
}

// Stage 4: Narrative Generation
async function generateNarrative(context: any, failure: any, timeline: any[]): Promise<string> {
  const systemPrompt = `You are writing a pre-mortem report for an engineering team. This report will help them understand how their proposed infrastructure change could lead to a production outage.`;

  const prompt = `CONTEXT:
- Infrastructure change: ${context.proposedChange}
- Failure type: ${failure.failureType}
- Timeline events: ${timeline.length}

TASK: Write a comprehensive pre-mortem report in markdown format with the following structure:

## CHANGE SUMMARY
Brief description of the proposed change

## ASSUMED OUTCOME
The outage that occurred (severity, duration, impact, revenue loss)

## TRIGGERING EVENT
What initiated the failure cascade (be specific with technical details)

## HIDDEN DEPENDENCIES
List each unexpected connection exposed:
### [Component Name]
**Assumption:** [What was assumed]
**Reality:** [What actually happened]
**Impact:** [How this contributed to failure]

## CASCADE TIMELINE
Create a table showing the progression:
| Time | Event | Cause | Effect |
|------|-------|-------|--------|

## MISSED DECISION POINTS
For each decision point:
### [When/Where]
**What Happened:** [Description]
**What Could Have Been Done:** [Alternative]
**Outcome if Done:** [Result]

## SYSTEM COUPLING REVEALED
List fragile assumptions:
### [Coupling Description]
**Assumption:** [What was believed]
**Reality:** [What was discovered]
**Fragility:** High/Medium/Low

## PREVENTIVE ACTIONS
### High Priority
1. [Action] - [Why] - [Effort: Low/Med/High]

### Medium Priority
1. [Action] - [Why] - [Effort: Low/Med/High]

### Low Priority
1. [Action] - [Why] - [Effort: Low/Med/High]

TONE: Professional, technical, realistic. Write as if this actually happened.
Use specific details, metrics, and technical language.

IMPORTANT: Output ONLY the markdown report, no additional commentary.`;

  return await invokeBedrock(prompt, systemPrompt);
}

// Main pre-mortem generation function
export async function generatePreMortem(input: InfrastructureChange): Promise<PreMortemReport> {
  try {
    // Stage 1: Analyze context
    const context = await analyzeContext(input);
    
    // Stage 2: Assume failure
    const failure = await assumeFailure(context);
    
    // Stage 3: Reconstruct timeline
    const timeline = await reconstructTimeline(context, failure);
    
    // Stage 4: Generate narrative
    const narrative = await generateNarrative(context, failure, timeline);
    
    // Build structured report
    const report: PreMortemReport = {
      id: `premortem-${Date.now()}`,
      timestamp: new Date().toISOString(),
      input,
      changeSummary: context.proposedChange || input.description.substring(0, 200),
      assumedOutcome: {
        severity: 'critical',
        duration: '47 minutes',
        impact: '100% of users affected',
        affectedUsers: 'All users',
        revenueImpact: failure.revenueImpact || 'Estimated $250,000',
      },
      triggeringEvent: {
        description: failure.immediateTrigger || 'Configuration mismatch detected',
        timestamp: 'T+2h',
        rootCause: failure.failureType || 'Cascading failure',
      },
      hiddenDependencies: (failure.hiddenDependencies || []).map((dep: any, idx: number) => ({
        component: dep.component || `Component ${idx + 1}`,
        assumption: dep.assumption || 'Unknown assumption',
        reality: dep.reality || 'Unexpected behavior',
        impact: dep.impact || 'Contributed to failure',
      })),
      cascadeTimeline: timeline.map((event: any) => ({
        timestamp: event.timestamp,
        event: event.event,
        cause: event.cause,
        effect: event.effect,
        couldHaveBeenPrevented: event.couldHaveBeenPrevented || false,
      })),
      missedDecisions: [],
      systemCoupling: [],
      preventiveActions: [],
      fullReport: narrative,
    };
    
    return report;
    
  } catch (error: any) {
    console.error('Pre-mortem generation error:', error);
    throw new Error(`Failed to generate pre-mortem: ${error.message}`);
  }
}
