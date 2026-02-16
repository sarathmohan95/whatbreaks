import { NextRequest, NextResponse } from 'next/server';
import { generatePreMortem } from '@/lib/ai/bedrock';
import { InfrastructureChange } from '@/types';

// Fallback to OpenAI if Bedrock is not configured
import { analyzeArchitecture } from '@/lib/ai/analyzer';

export async function POST(request: NextRequest) {
  try {
    const input: InfrastructureChange = await request.json();

    // Validate input
    if (!input.description || input.description.length < 50) {
      return NextResponse.json(
        { error: 'Description must be at least 50 characters' },
        { status: 400 }
      );
    }

    if (input.description.length > 10000) {
      return NextResponse.json(
        { error: 'Description too long (max 10,000 characters)' },
        { status: 400 }
      );
    }

    // Check if Bedrock is configured
    const usesBedrock = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

    let result;
    
    if (usesBedrock) {
      // Use Amazon Bedrock for pre-mortem generation
      result = await generatePreMortem(input);
    } else {
      // Fallback to OpenAI with adapted prompt
      console.warn('Bedrock not configured, falling back to OpenAI');
      
      // Convert to legacy format for OpenAI
      const legacyInput = {
        description: input.description,
        services: [], // Not used in pre-mortem
        region: 'us-east-1',
        criticality: 'High' as const,
      };
      
      const analysis = await analyzeArchitecture(legacyInput);
      
      // Convert analysis to pre-mortem format
      result = {
        id: analysis.id,
        timestamp: analysis.timestamp,
        input,
        changeSummary: input.description.substring(0, 200),
        assumedOutcome: {
          severity: 'critical' as const,
          duration: '45 minutes',
          impact: 'Service degradation',
          affectedUsers: 'Majority of users',
        },
        triggeringEvent: {
          description: analysis.risks[0]?.description || 'Configuration issue detected',
          timestamp: 'T+2h',
          rootCause: analysis.risks[0]?.title || 'Unknown',
        },
        hiddenDependencies: analysis.risks.slice(0, 3).map(risk => ({
          component: risk.category,
          assumption: 'System would handle change gracefully',
          reality: risk.description,
          impact: risk.impact,
        })),
        cascadeTimeline: [
          {
            timestamp: 'T+0',
            event: 'Change deployed',
            cause: 'Infrastructure modification',
            effect: 'System state changed',
            couldHaveBeenPrevented: true,
          },
          {
            timestamp: 'T+2h',
            event: 'First errors detected',
            cause: analysis.risks[0]?.title || 'Configuration mismatch',
            effect: 'Service degradation begins',
            couldHaveBeenPrevented: true,
          },
        ],
        missedDecisions: [],
        systemCoupling: [],
        preventiveActions: analysis.risks.map(risk => ({
          action: risk.recommendation,
          priority: risk.riskLevel === 'High' ? 'high' as const : 'medium' as const,
          effort: 'medium' as const,
          impact: risk.impact,
        })),
        fullReport: generateFallbackReport(analysis),
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Pre-mortem generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate pre-mortem' },
      { status: 500 }
    );
  }
}

function generateFallbackReport(analysis: any): string {
  return `# Pre-Mortem Report

## CHANGE SUMMARY
${analysis.input.description}

## ASSUMED OUTCOME
**Severity:** Critical  
**Duration:** 45 minutes  
**Impact:** Service degradation affecting majority of users

## IDENTIFIED RISKS

${analysis.risks.map((risk: any, idx: number) => `
### ${idx + 1}. ${risk.title}
**Risk Level:** ${risk.riskLevel}  
**Category:** ${risk.category}

**Description:** ${risk.description}

**Recommendation:** ${risk.recommendation}

**Impact if Ignored:** ${risk.impact}
`).join('\n')}

## PREVENTIVE ACTIONS

${analysis.risks.map((risk: any, idx: number) => `
${idx + 1}. ${risk.recommendation}
`).join('\n')}

---

*Note: This report was generated using fallback mode. For full pre-mortem analysis with counterfactual reasoning, configure Amazon Bedrock.*
`;
}
