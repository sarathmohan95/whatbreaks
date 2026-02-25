'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Download, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { AnalysisResult } from '@/types';
import { getRiskColor, getScoreColor } from '@/lib/utils';

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('latestAnalysis');
    if (stored) {
      setAnalysis(JSON.parse(stored));
    }
  }, []);

  const handleDownloadReport = async () => {
    if (!analysis) return;
    
    setDownloading(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysis),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whatbreaks-report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">No analysis found</p>
          <Link href="/analyze">
            <Button>Start Analysis</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Cloud className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">WhatBreaks</span>
            </Link>
            <div className="flex gap-2">
              <Link href="/analyze">
                <Button variant="ghost" size="sm" className="text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  New Analysis
                </Button>
              </Link>
              <Button onClick={handleDownloadReport} disabled={downloading} size="sm">
                <Download className="h-4 w-4 mr-2" />
                {downloading ? 'Generating...' : 'Download Report'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Reliability Assessment
          </h1>
          <p className="text-gray-300">
            {new Date(analysis.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Overall Score */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-300 text-lg mb-4">Overall Reliability Score</p>
              <div className={`text-7xl font-bold ${getScoreColor(analysis.score.overall)}`}>
                {analysis.score.overall}
                <span className="text-3xl">/100</span>
              </div>
              <p className="text-gray-400 mt-6 max-w-2xl mx-auto">
                {analysis.summary}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <ScoreCard title="Fault Tolerance" score={analysis.score.faultTolerance} />
          <ScoreCard title="Monitoring" score={analysis.score.monitoring} />
          <ScoreCard title="Scalability" score={analysis.score.scalability} />
          <ScoreCard title="Disaster Recovery" score={analysis.score.disasterRecovery} />
          <ScoreCard title="Resilience" score={analysis.score.resilience} />
        </div>

        {/* Risks */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Identified Risks</h2>
          <div className="space-y-4">
            {analysis.risks.map((risk) => (
              <Card key={risk.id} className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColor(risk.riskLevel)}`}>
                          {risk.riskLevel} Risk
                        </span>
                        <span className="text-sm text-gray-400">{risk.category}</span>
                      </div>
                      <CardTitle className="text-white text-xl">{risk.title}</CardTitle>
                    </div>
                    {risk.riskLevel === 'High' ? (
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-yellow-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-1">Description</p>
                      <p className="text-gray-400">{risk.description}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-400 mb-1">Recommendation</p>
                      <p className="text-gray-300">{risk.recommendation}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-1">Impact if Ignored</p>
                      <p className="text-gray-400">{risk.impact}</p>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-xs text-gray-500">
                        AWS Well-Architected: {risk.wellArchitectedPillar}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ title, score }: { title: string; score: number }) {
  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardContent className="pt-6 text-center">
        <p className="text-gray-400 text-sm mb-2">{title}</p>
        <p className={`text-3xl font-bold ${getScoreColor(score)}`}>
          {score}
        </p>
      </CardContent>
    </Card>
  );
}
