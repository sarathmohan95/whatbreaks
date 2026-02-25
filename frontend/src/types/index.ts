export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ChangeType = 'infrastructure' | 'configuration' | 'terraform' | 'code';

export interface InfrastructureChange {
  description: string;
  changeType: ChangeType;
  currentState?: string;
  proposedState?: string;
  trafficPatterns?: string;
  knownDependencies?: string[];
}

export interface TriggeringEvent {
  description: string;
  timestamp: string; // Relative to deployment
  rootCause: string;
}

export interface HiddenDependency {
  component: string;
  assumption: string;
  reality: string;
  impact: string;
}

export interface CascadeEvent {
  timestamp: string;
  event: string;
  cause: string;
  effect: string;
  couldHaveBeenPrevented: boolean;
}

export interface MissedDecision {
  point: string;
  decision: string;
  consequence: string;
  alternative: string;
}

export interface SystemCoupling {
  assumption: string;
  reality: string;
  fragility: 'low' | 'medium' | 'high';
}

export interface PreventiveAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: string;
}

export interface AssumedOutcome {
  severity: 'minor' | 'major' | 'critical';
  duration: string;
  impact: string;
  affectedUsers: string;
  revenueImpact?: string;
}

export interface PreMortemReport {
  id: string;
  timestamp: string;
  
  // Input reference
  input: InfrastructureChange;
  
  // Analysis results
  changeSummary: string;
  assumedOutcome: AssumedOutcome;
  triggeringEvent: TriggeringEvent;
  hiddenDependencies: HiddenDependency[];
  cascadeTimeline: CascadeEvent[];
  missedDecisions: MissedDecision[];
  systemCoupling: SystemCoupling[];
  preventiveActions: PreventiveAction[];
  
  // Full narrative
  fullReport: string; // Markdown
}

// Legacy types for backward compatibility
export type WorkloadCriticality = 'Low' | 'Medium' | 'High';

export interface ArchitectureInput {
  description: string;
  services: string[];
  region: string;
  criticality: WorkloadCriticality;
}

export interface ReliabilityRisk {
  id: string;
  category: string;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  wellArchitectedPillar: string;
}

export interface ReliabilityScore {
  overall: number;
  faultTolerance: number;
  monitoring: number;
  scalability: number;
  disasterRecovery: number;
  resilience: number;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  input: ArchitectureInput;
  score: ReliabilityScore;
  risks: ReliabilityRisk[];
  summary: string;
}
