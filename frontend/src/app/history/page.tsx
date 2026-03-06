'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cloud, ArrowLeft, Loader2, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { listReports, SavedReport } from '@/lib/api/reports';

export default function HistoryPage() {
  const router = useRouter();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listReports(20);
      console.log('Initial load:', { 
        reportCount: response.reports.length, 
        hasMore: response.hasMore, 
        lastKey: response.lastKey 
      });
      setReports(response.reports);
      setLastKey(response.lastKey);
      setHasMore(response.hasMore);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!lastKey || loadingMore) return;

    try {
      setLoadingMore(true);
      console.log('Loading more with lastKey:', lastKey);
      const response = await listReports(20, lastKey);
      console.log('Load more response:', { 
        reportCount: response.reports.length, 
        hasMore: response.hasMore, 
        lastKey: response.lastKey 
      });
      setReports([...reports, ...response.reports]);
      setLastKey(response.lastKey);
      setHasMore(response.hasMore);
    } catch (err: any) {
      console.error('Load more error:', err);
      setError(err.message || 'Failed to load more reports');
    } finally {
      setLoadingMore(false);
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'MAJOR': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'MODERATE': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  const getRiskLevelColor = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'MODERATE': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'LOW': return 'bg-green-500/10 text-green-500 border-green-500/30';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

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
            <Link href="/analyze">
              <Button variant="ghost" size="sm" className="text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Pre-Mortem History
          </h1>
          <p className="text-gray-300 text-lg">
            View all your previously generated pre-mortem reports
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            <span className="ml-3 text-white">Loading reports...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="bg-red-500/10 border-red-500/30 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button 
                onClick={loadReports} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && reports.length === 0 && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="pt-12 pb-12 text-center">
              <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Reports Yet
              </h3>
              <p className="text-gray-400 mb-6">
                Generate your first pre-mortem report to see it here
              </p>
              <Link href="/analyze">
                <Button>Create Pre-Mortem Report</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        {!loading && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card 
                key={report.id}
                className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => router.push(`/premortem?id=${report.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Timestamp */}
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {new Date(report.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {/* Change Summary */}
                      <p className="text-white text-lg mb-3 line-clamp-2">
                        {report.changeSummary}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3">
                        {report.severity && (
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getSeverityColor(report.severity)}`}>
                            <AlertTriangle className="h-3 w-3" />
                            {report.severity}
                          </div>
                        )}
                        {(report.riskLevel || report.parsedReport?.riskLevel) && (
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getRiskLevelColor(report.riskLevel || report.parsedReport?.riskLevel)}`}>
                            <span className="font-semibold">Risk:</span>
                            {report.riskLevel || report.parsedReport?.riskLevel}
                            {(report.overallRiskScore || report.parsedReport?.overallRiskScore) && (
                              <span className="ml-1">({report.overallRiskScore || report.parsedReport?.overallRiskScore})</span>
                            )}
                          </div>
                        )}
                        {report.duration && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="h-3 w-3" />
                            {report.duration}
                          </div>
                        )}
                        {report.impact && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <TrendingDown className="h-3 w-3" />
                            <span className="line-clamp-1">{report.impact}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="bg-white/10 border-white/20 hover:bg-white/20"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
