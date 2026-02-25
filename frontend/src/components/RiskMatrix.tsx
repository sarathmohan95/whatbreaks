'use client';

import { useState } from 'react';

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

interface RiskMatrixProps {
  risks: Risk[];
  onRiskClick?: (risk: Risk) => void;
}

export default function RiskMatrix({ risks, onRiskClick }: RiskMatrixProps) {
  const [hoveredRisk, setHoveredRisk] = useState<Risk | null>(null);

  const getRiskColor = (score: number) => {
    if (score >= 76) return 'bg-red-500';
    if (score >= 51) return 'bg-orange-500';
    if (score >= 26) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskSize = (impact: number) => {
    // Size based on impact (larger = higher impact)
    return 8 + impact * 2; // 10px to 28px
  };

  return (
    <div className="relative">
      {/* Matrix Grid */}
      <div className="relative bg-white/5 rounded-lg p-6">
        {/* Y-axis label */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 -rotate-90 text-sm text-gray-400">
          Impact
        </div>

        {/* X-axis label */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-sm text-gray-400">
          Probability
        </div>

        {/* Grid */}
        <div className="grid grid-cols-10 gap-1 aspect-square max-w-md mx-auto">
          {Array.from({ length: 100 }).map((_, idx) => {
            const row = Math.floor(idx / 10);
            const col = idx % 10;
            const probability = col + 1;
            const impact = 10 - row;
            const score = probability * impact;

            // Find risks at this position
            const risksHere = risks.filter(
              r => Math.round(r.probability) === probability && Math.round(r.impact) === impact
            );

            return (
              <div
                key={idx}
                className={`relative border border-white/10 ${
                  score >= 76 ? 'bg-red-500/10' :
                  score >= 51 ? 'bg-orange-500/10' :
                  score >= 26 ? 'bg-yellow-500/10' :
                  'bg-green-500/10'
                }`}
              >
                {risksHere.map((risk, riskIdx) => (
                  <div
                    key={risk.id}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer transition-all hover:scale-125 ${getRiskColor(risk.riskScore)}`}
                    style={{
                      width: `${getRiskSize(risk.impact)}px`,
                      height: `${getRiskSize(risk.impact)}px`,
                      zIndex: 10 + riskIdx
                    }}
                    onMouseEnter={() => setHoveredRisk(risk)}
                    onMouseLeave={() => setHoveredRisk(null)}
                    onClick={() => onRiskClick?.(risk)}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Axis numbers */}
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className="flex flex-col items-end absolute right-0 top-0 bottom-0 justify-between py-6 pr-2 text-xs text-gray-400">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i}>{10 - i}</span>
          ))}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredRisk && (
        <div className="absolute top-0 right-0 w-64 bg-gray-800 border border-white/20 rounded-lg p-4 shadow-xl z-50">
          <h4 className="font-semibold text-white mb-2">{hoveredRisk.title}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Risk Score:</span>
              <span className={`font-bold ${
                hoveredRisk.riskScore >= 76 ? 'text-red-400' :
                hoveredRisk.riskScore >= 51 ? 'text-orange-400' :
                hoveredRisk.riskScore >= 26 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {hoveredRisk.riskScore}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Probability:</span>
              <span className="text-white">{hoveredRisk.probability}/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Impact:</span>
              <span className="text-white">{hoveredRisk.impact}/10</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-gray-300 text-xs">{hoveredRisk.description.substring(0, 100)}...</p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span className="text-gray-400">Low (1-25)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span className="text-gray-400">Moderate (26-50)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500"></div>
          <span className="text-gray-400">High (51-75)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span className="text-gray-400">Critical (76-100)</span>
        </div>
      </div>
    </div>
  );
}
