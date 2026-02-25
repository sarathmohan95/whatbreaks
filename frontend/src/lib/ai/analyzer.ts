import OpenAI from 'openai';
import { ArchitectureInput, AnalysisResult, ReliabilityRisk, ReliabilityScore } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPT = `You are an AWS Well-Architected Framework expert specializing in the Reliability Pillar.

Analyze the following AWS architecture and provide a comprehensive reliability assessment.

Architecture Details:
- Description: {description}
- Services: {services}
- Region: {region}
- Criticality: {criticality}

Provide your analysis in the following JSON format:
{
  "summary": "Brief 2-3 sentence overview of the architecture's reliability posture",
  "score": {
    "overall": 0-100,
    "faultTolerance": 0-100,
    "monitoring": 0-100,
    "scalability": 0-100,
    "disasterRecovery": 0-100,
    "resilience": 0-100
  },
  "risks": [
    {
      "category": "Fault Tolerance|Monitoring|Scalability|Disaster Recovery|Resilience",
      "riskLevel": "Low|Medium|High",
      "title": "Short risk title",
      "description": "Detailed explanation of the risk",
      "recommendation": "Specific actionable fix",
      "impact": "What happens if this is ignored",
      "wellArchitectedPillar": "REL.X reference from AWS Well-Architected"
    }
  ]
}

Focus on:
- Single points of failure
- Multi-AZ/region deployment
- Backup and recovery strategies
- Monitoring and alerting gaps
- Scalability bottlenecks
- Data durability concerns

Be specific and actionable. Reference AWS Well-Architected Framework best practices.`;

export async function analyzeArchitecture(input: ArchitectureInput): Promise<AnalysisResult> {
  const prompt = ANALYSIS_PROMPT
    .replace('{description}', input.description)
    .replace('{services}', input.services.join(', '))
    .replace('{region}', input.region)
    .replace('{criticality}', input.criticality);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an AWS reliability expert. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const analysis = JSON.parse(completion.choices[0].message.content || '{}');

  const risks: ReliabilityRisk[] = analysis.risks.map((risk: any, index: number) => ({
    id: `risk-${index + 1}`,
    ...risk,
  }));

  return {
    id: `analysis-${Date.now()}`,
    timestamp: new Date().toISOString(),
    input,
    score: analysis.score,
    risks,
    summary: analysis.summary,
  };
}
