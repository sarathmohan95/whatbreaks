'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Risk {
  id: string;
  title: string;
  description: string;
  probability: number;
  impact: number;
  riskScore: number;
  category: string;
  mitigation: string;
}

interface RiskCardProps {
  risk: Risk;
  highlighted?: boolean;
}

export default function RiskCard({ risk, highlighted }: RiskCardProps) {
  const getRiskColor = (score: number) => {
    if (score >= 76) return {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-400',
      bar: 'bg-red-400'
    };
    if (score >= 51) return {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      badge: 'bg-orange-500/20 text-orange-400',
      bar: 'bg-orange-400'
    };
    if (score >= 26) return {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      badge: 'bg-yellow-500/20 text-yellow-400',
      bar: 'bg-yellow-400'
    };
    return {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      badge: 'bg-green-500/20 text-green-400',
      bar: 'bg-green-400'
    };
  };

  const getRiskLevel = (score: number) => {
    if (score >= 76) return 'CRITICAL';
    if (score >= 51) return 'HIGH';
    if (score >= 26) return 'MODERATE';
    return 'LOW';
  };

  const colors = getRiskColor(risk.riskScore);
  const level = getRiskLevel(risk.riskScore);

  return (
    <Card className={`${colors.bg} border-2 ${colors.border} ${highlighted ? 'ring-2 ring-white/50' : ''} transition-all`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className={`h-5 w-5 ${colors.text} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <CardTitle className="text-lg text-white">{risk.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${colors.badge} font-semibold`}>
                  {level}
                </span>
                <span className="text-xs text-gray-400 capitalize">
                  {risk.category}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${colors.text}`}>
              {risk.riskScore}
            </div>
            <div className="text-xs text-gray-400">Risk Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Probability and Impact Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Probability</span>
              <span className="text-white font-semibold">{risk.probability}/10</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.bar} transition-all`}
                style={{ width: `${risk.probability * 10}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Impact</span>
              <span className="text-white font-semibold">{risk.impact}/10</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.bar} transition-all`}
                style={{ width: `${risk.impact * 10}%` }}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-sm text-gray-300 leading-relaxed">
            {risk.description}
          </p>
        </div>

        {/* Mitigation */}
        <div className="pt-3 border-t border-white/10">
          <h4 className="text-sm font-semibold text-white mb-2">Mitigation Strategy:</h4>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
            {risk.mitigation}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
