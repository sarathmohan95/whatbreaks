'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, AlertTriangle, Clock, TrendingDown, Shield, Zap, CheckCircle2, XCircle, ChevronDown, ChevronUp, Share2, Check, Target } from 'lucide-react';
import { getReport } from '@/lib/api/reports';
import RiskMatrix from '@/components/RiskMatrix';
import RiskCard from '@/components/RiskCard';
import ResourceDependencyGraph from '@/components/ResourceDependencyGraph';

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

interface Resource {
  id: string;
  name: string;
  type: string;
  dependencies?: string[];
}

interface ParsedReport {
  severity?: string;
  duration?: string;
  impact?: string;
  affected?: string[];
  triggeringEvent?: {
    time: string;
    rootCause: string;
    description: string;
  };
  hiddenDependencies?: {
    assumptions: string[];
    dependencies: string[];
  };
  timeline?: Array<{
    time: string;
    event: string;
    critical?: boolean;
  }>;
  preventiveActions?: {
    high: string[];
    medium: string[];
    low: string[];
  };
  risks?: Risk[];
  overallRiskScore?: number;
  riskLevel?: string;
  resourceDependencies?: Resource[];
  rawReport: string;
}

export default function PreMortemPage() {
  console.log('🚀 PreMortemPage component loaded - with resource dependencies feature');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [parsedReport, setParsedReport] = useState<ParsedReport | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'risks' | 'timeline' | 'actions' | 'dependencies' | 'report'>('overview');

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);

        // If ID is provided, fetch from API
        if (reportId) {
          const savedReport = await getReport(reportId);
          if (!savedReport.fullReport) {
            throw new Error('Report data is incomplete');
          }
          setAnalysis({
            fullReport: savedReport.fullReport,
            reportId: savedReport.id,
            timestamp: savedReport.timestamp,
          });
          // Use the parsedReport from the saved report if available
          if (savedReport.parsedReport) {
            console.log('📦 Using saved parsedReport, checking for resourceDependencies...');
            console.log('Saved resourceDependencies:', (savedReport.parsedReport as any).resourceDependencies);
            
            // Always try to parse from fullReport if dependencies are missing or empty
            const savedDeps = (savedReport.parsedReport as any).resourceDependencies;
            const needsParsing = !savedDeps || savedDeps.length === 0;
            
            console.log('Needs parsing?', needsParsing);
            console.log('Full report length:', savedReport.fullReport?.length || 0);
            
            const parsed: ParsedReport = {
              ...savedReport.parsedReport,
              rawReport: savedReport.fullReport,
              resourceDependencies: needsParsing ? parseResourceDependencies(savedReport.fullReport) : savedDeps
            };
            console.log('✅ Final parsed report with dependencies:', parsed.resourceDependencies?.length || 0, parsed.resourceDependencies);
            setParsedReport(parsed);
          } else {
            console.log('📝 No saved parsedReport, parsing from fullReport...');
            setParsedReport(parseReport(savedReport.fullReport));
          }
        } else {
          // Fall back to localStorage
          const stored = localStorage.getItem('latestAnalysis');
          if (stored) {
            const data = JSON.parse(stored);
            setAnalysis(data);
            // Use the parsedReport from the API response if available, otherwise parse the fullReport
            if (data.parsedReport) {
              const parsed: ParsedReport = {
                ...data.parsedReport,
                rawReport: data.fullReport,
                resourceDependencies: (data.parsedReport as any).resourceDependencies || parseResourceDependencies(data.fullReport)
              };
              setParsedReport(parsed);
            } else {
              setParsedReport(parseReport(data.fullReport));
            }
          } else {
            router.push('/analyze');
            return;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId, router]);

  const parseReport = (report: string): ParsedReport => {
    const parsed: ParsedReport = { rawReport: report };

    // Parse severity, duration, impact
    const severityMatch = report.match(/Severity:\s*(\w+)/i);
    const durationMatch = report.match(/Duration:\s*([^\n]+)/i);
    const impactMatch = report.match(/Impact:\s*([^\n]+)/i);

    if (severityMatch) parsed.severity = severityMatch[1];
    if (durationMatch) parsed.duration = durationMatch[1];
    if (impactMatch) parsed.impact = impactMatch[1];

    // Parse affected items
    const affectedSection = report.match(/Affected:([^#]*)/s);
    if (affectedSection) {
      parsed.affected = affectedSection[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^[\s-]+/, '').trim());
    }

    // Parse timeline
    const timelineMatches = report.matchAll(/T\+(\d+h:\d+m):\s*([^\n]+)/g);
    parsed.timeline = Array.from(timelineMatches).map(match => ({
      time: match[1],
      event: match[2].trim(),
      critical: match[2].toLowerCase().includes('fail') || match[2].toLowerCase().includes('logged out')
    }));

    // Parse preventive actions
    const highPriority = report.match(/High Priority[^:]*:([^]*?)(?:Medium Priority|Low Priority|Implementation|$)/s);
    const mediumPriority = report.match(/Medium Priority[^:]*:([^]*?)(?:Low Priority|Implementation|$)/s);
    const lowPriority = report.match(/Low Priority[^:]*:([^]*?)(?:Implementation|$)/s);

    parsed.preventiveActions = {
      high: highPriority ? extractListItems(highPriority[1]) : [],
      medium: mediumPriority ? extractListItems(mediumPriority[1]) : [],
      low: lowPriority ? extractListItems(lowPriority[1]) : []
    };

    // Parse resource dependencies
    parsed.resourceDependencies = parseResourceDependencies(report);

    return parsed;
  };

  const extractListItems = (text: string): string[] => {
    return text
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
  };

  const parseResourceDependencies = (report: string): Resource[] => {
    console.log('🔍 Frontend: Parsing resource dependencies from report...');
    console.log('📄 Report length:', report.length);
    
    try {
      // Look for RESOURCE_DEPENDENCIES: section with more flexible matching
      // Match everything between RESOURCE_DEPENDENCIES: and the next ## or end of string
      const sectionMatch = report.match(/RESOURCE_DEPENDENCIES:\s*([\s\S]*?)(?=\n\s*##|$)/);
      
      console.log('🔎 Section match result:', sectionMatch ? 'FOUND' : 'NOT FOUND');
      
      if (sectionMatch) {
        const sectionText = sectionMatch[1].trim();
        console.log('📋 Section text (first 300 chars):', sectionText.substring(0, 300));
        
        // Find the JSON array - use greedy matching to get the complete array
        // Start from [ and match everything until the last ]
        const jsonMatch = sectionText.match(/\[([\s\S]*)\]/);
        
        if (jsonMatch) {
          let jsonStr = '[' + jsonMatch[1] + ']';
          console.log('📋 Found JSON array (first 300 chars):', jsonStr.substring(0, 300));
          
          // Clean up the JSON string - normalize whitespace but preserve structure
          jsonStr = jsonStr.replace(/\s+/g, ' ').trim();
          console.log('🧹 Cleaned JSON string (first 300 chars):', jsonStr.substring(0, 300));
          
          const resources = JSON.parse(jsonStr);
          console.log('✅ Parsed JSON successfully:', resources);
          
          // Validate structure
          if (Array.isArray(resources)) {
            const validResources = resources.filter((r: any) => 
              r.id && r.name && r.type && Array.isArray(r.dependencies)
            );
            
            console.log(`✅ Found ${validResources.length} valid resources:`, validResources);
            return validResources;
          } else {
            console.error('❌ Parsed data is not an array:', resources);
          }
        } else {
          console.log('⚠️ No JSON array found in RESOURCE_DEPENDENCIES section');
          console.log('Section text:', sectionText);
        }
      } else {
        console.log('⚠️ RESOURCE_DEPENDENCIES section not found in report');
      }
    } catch (error) {
      console.error('❌ Error parsing resource dependencies in frontend:', error);
    }
    
    console.log('⚠️ Returning empty array - no dependencies found');
    return [];
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'MAJOR': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'MODERATE': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const handleShare = async () => {
    if (!analysis?.reportId) return;
    
    const url = `${window.location.origin}/premortem?id=${analysis.reportId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy URL');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/analyze">
            <Button>Generate New Report</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!analysis || !parsedReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2">
            <Link href="/analyze">
              <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
                History
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold">Pre-Mortem Report</h1>
            {analysis.reportId && (
              <p className="text-sm text-green-400 mt-1">✓ Saved</p>
            )}
          </div>
          <div className="flex gap-2">
            {analysis.reportId && (
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 hover:bg-white/20"
                onClick={handleShare}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className={`border-2 ${getSeverityColor(parsedReport.severity)}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm font-medium text-gray-300">Severity</span>
              </div>
              <div className="text-3xl font-bold">{parsedReport.severity || 'Unknown'}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-6 w-6 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Duration</span>
              </div>
              <div className="text-3xl font-bold">{parsedReport.duration || 'Unknown'}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="h-6 w-6 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Impact</span>
              </div>
              <div className="text-lg font-semibold line-clamp-2">{parsedReport.impact || 'Unknown'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          {parsedReport.risks && parsedReport.risks.length > 0 && (
            <button
              onClick={() => setActiveTab('risks')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'risks'
                  ? 'text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Risks ({parsedReport.risks.length})
            </button>
          )}
          {parsedReport.timeline && parsedReport.timeline.length > 0 && (
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Timeline
            </button>
          )}
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'actions'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Preventive Actions
          </button>
          {parsedReport.resourceDependencies && parsedReport.resourceDependencies.length > 0 && (
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'dependencies'
                  ? 'text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Dependencies
            </button>
          )}
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'report'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Full Report
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Affected Systems */}
            {parsedReport.affected && parsedReport.affected.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-400" />
                    Affected Systems
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedReport.affected.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'risks' && parsedReport.risks && parsedReport.risks.length > 0 && (
          <div className="space-y-6">
            {/* Overall Risk Score */}
            {parsedReport.overallRiskScore && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Target className="h-8 w-8 text-purple-400" />
                      <div>
                        <p className="text-sm text-gray-400">Overall Risk Assessment</p>
                        <p className="text-2xl font-bold text-white">{parsedReport.riskLevel || 'UNKNOWN'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-purple-400">{parsedReport.overallRiskScore}</p>
                      <p className="text-sm text-gray-400">Risk Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk Matrix */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  Risk Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RiskMatrix risks={parsedReport.risks} />
              </CardContent>
            </Card>

            {/* Risk Cards */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                Identified Risks
              </h2>
              <div className="space-y-4">
                {parsedReport.risks
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map((risk) => (
                    <RiskCard key={risk.id} risk={risk} />
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && parsedReport.timeline && parsedReport.timeline.length > 0 && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Cascade Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parsedReport.timeline.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${item.critical ? 'bg-red-500' : 'bg-blue-500'}`} />
                      {idx < parsedReport.timeline!.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-600 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-mono text-blue-400">{item.time}</span>
                        {item.critical && (
                          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">Critical</span>
                        )}
                      </div>
                      <p className="text-gray-300">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'actions' && parsedReport.preventiveActions && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Preventive Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {parsedReport.preventiveActions.high.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    High Priority (Must Do)
                  </h3>
                  <div className="space-y-2">
                    {parsedReport.preventiveActions.high.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedReport.preventiveActions.medium.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">Medium Priority</h3>
                  <div className="space-y-2">
                    {parsedReport.preventiveActions.medium.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedReport.preventiveActions.low.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">Low Priority</h3>
                  <div className="space-y-2">
                    {parsedReport.preventiveActions.low.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'dependencies' && parsedReport.resourceDependencies && parsedReport.resourceDependencies.length > 0 && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                Resource Dependencies
              </CardTitle>
              <p className="text-sm text-gray-400 mt-2">
                Interactive visualization showing how infrastructure resources are connected and depend on each other
              </p>
            </CardHeader>
            <CardContent>
              <ResourceDependencyGraph resources={parsedReport.resourceDependencies} />
            </CardContent>
          </Card>
        )}

        {activeTab === 'report' && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader 
              className="cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setShowFullReport(!showFullReport)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Full Analysis Report
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  {showFullReport ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {showFullReport && (
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">
                    {parsedReport.rawReport}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
