/**
 * Bedrock Agents Integration
 * Uses AWS Bedrock Agents for multi-agent pre-mortem analysis
 */

const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

/**
 * Bedrock Agents Orchestrator
 * Invokes the supervisor agent which coordinates with specialist agents
 */
class BedrockAgentsOrchestrator {
  constructor() {
    this.client = new BedrockAgentRuntimeClient({ 
      region: process.env.AWS_REGION || 'us-east-1' 
    });
    
    this.supervisorAgentId = process.env.SUPERVISOR_AGENT_ID;
    this.supervisorAgentAliasId = process.env.SUPERVISOR_AGENT_ALIAS_ID;
    
    if (!this.supervisorAgentId || !this.supervisorAgentAliasId) {
      console.warn('⚠️ Bedrock Agents not configured. Set SUPERVISOR_AGENT_ID and SUPERVISOR_AGENT_ALIAS_ID');
    }
  }

  /**
   * Run multi-agent analysis using Bedrock Agents
   */
  async analyze(infrastructureChange) {
    console.log('🎯 Starting Bedrock Agents multi-agent analysis...');
    const startTime = Date.now();

    if (!this.supervisorAgentId || !this.supervisorAgentAliasId) {
      throw new Error('Bedrock Agents not configured');
    }

    try {
      // Build the prompt for the supervisor agent
      const prompt = this.buildAnalysisPrompt(infrastructureChange);
      
      // Generate unique session ID
      const sessionId = `premortem-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      console.log(`📡 Invoking supervisor agent: ${this.supervisorAgentId}`);
      console.log(`📝 Session ID: ${sessionId}`);
      
      // Invoke the supervisor agent using prod alias
      const command = new InvokeAgentCommand({
        agentId: this.supervisorAgentId,
        agentAliasId: this.supervisorAgentAliasId, // Use the prod alias
        sessionId: sessionId,
        inputText: prompt,
        enableTrace: true, // Enable tracing to see agent collaboration
        endSession: false // Keep session open for potential follow-ups
      });

      const response = await this.client.send(command);
      
      // Stream and collect response
      const result = await this.processAgentResponse(response);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Bedrock Agents analysis complete in ${totalTime}s`);
      
      return {
        fullReport: result.text,
        sessionId: sessionId,
        traces: result.traces,
        metadata: {
          analysis_type: 'bedrock-agents',
          duration_seconds: parseFloat(totalTime),
          agent_id: this.supervisorAgentId,
          session_id: sessionId
        }
      };
    } catch (error) {
      console.error('❌ Bedrock Agents analysis failed:', error);
      throw error;
    }
  }

  /**
   * Build analysis prompt for supervisor agent
   */
  buildAnalysisPrompt(change) {
    return `Please perform a comprehensive pre-mortem analysis of this infrastructure change.

INFRASTRUCTURE CHANGE DETAILS:

Description:
${change.description}

Change Type: ${change.changeType}

Current State:
${change.currentState || 'Not specified'}

Proposed State:
${change.proposedState || 'Not specified'}

Traffic Patterns:
${change.trafficPatterns || 'Not specified'}

INSTRUCTIONS:

1. Coordinate with ALL your specialist consultants:
   - Security Consultant
   - Reliability Engineer
   - Performance Architect
   - Cost Optimizer
   - Operations Specialist

2. Have each specialist analyze this change from their perspective

3. Synthesize all findings into a comprehensive pre-mortem report

4. Include:
   - Consensus risks (where multiple specialists agree)
   - Individual specialist findings
   - Trade-offs and conflicting recommendations
   - Prioritized preventive actions

5. For each risk, provide:
   - Risk title and description
   - Severity (critical/major/moderate/low)
   - Probability (1-10)
   - Impact (1-10)
   - Category (security/reliability/performance/cost/operations)
   - Mitigation strategy

Please generate a detailed pre-mortem report following the format in your instructions.`;
  }

  /**
   * Process agent response stream
   */
  async processAgentResponse(response) {
    let fullText = '';
    const traces = [];
    const chunks = [];

    try {
      // Process the completion stream
      for await (const event of response.completion) {
        // Handle different event types
        if (event.chunk) {
          // Text chunk from agent
          if (event.chunk.bytes) {
            const text = new TextDecoder().decode(event.chunk.bytes);
            fullText += text;
            chunks.push({
              type: 'text',
              content: text,
              timestamp: Date.now()
            });
          }
        } else if (event.trace) {
          // Trace information (agent collaboration, tool usage, etc.)
          traces.push(event.trace);
          
          // Log trace for debugging
          if (event.trace.trace) {
            const traceData = event.trace.trace;
            
            if (traceData.orchestrationTrace) {
              const orch = traceData.orchestrationTrace;
              
              if (orch.modelInvocationInput) {
                console.log('🤖 Agent thinking...');
              }
              
              if (orch.observation) {
                console.log('👁️ Agent observation received');
              }
              
              if (orch.rationale) {
                console.log('💭 Agent rationale:', orch.rationale.text?.substring(0, 100));
              }
            }
          }
        } else if (event.returnControl) {
          // Agent is returning control (e.g., asking for user input)
          console.log('🔄 Agent returning control');
        } else if (event.files) {
          // File attachments (if any)
          console.log('📎 Agent returned files');
        }
      }

      return {
        text: fullText,
        traces: traces,
        chunks: chunks
      };
    } catch (error) {
      console.error('❌ Error processing agent response:', error);
      throw error;
    }
  }

  /**
   * Extract structured data from agent response
   * (Optional: parse the text response into structured format)
   */
  parseAgentReport(reportText) {
    // The agent should return a well-formatted report
    // We can parse it if needed, or use it as-is
    return {
      rawReport: reportText,
      // Add parsing logic here if needed
    };
  }
}

/**
 * Check if Bedrock Agents are configured
 */
function isBedrockAgentsEnabled() {
  return !!(process.env.SUPERVISOR_AGENT_ID && process.env.SUPERVISOR_AGENT_ALIAS_ID);
}

module.exports = {
  BedrockAgentsOrchestrator,
  isBedrockAgentsEnabled
};
