/**
 * API client for WhatBreaks reports
 */

export interface ParsedReport {
  severity?: string;
  duration?: string;
  impact?: string;
  affected?: string[];
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
}

export interface SavedReport {
  id: string;
  timestamp: string;
  changeSummary: string;
  severity?: string;
  duration?: string;
  impact?: string;
  input?: {
    description: string;
    changeType: string;
    currentState?: string;
    proposedState?: string;
    trafficPatterns?: string;
  };
  parsedReport?: ParsedReport & {
    overallRiskScore?: number;
    riskLevel?: string;
  };
  fullReport?: string;
  metadata?: {
    model: string;
    version: string;
  };
  overallRiskScore?: number;
  riskLevel?: string;
}

export interface ListReportsResponse {
  reports: SavedReport[];
  lastKey: string | null;
  hasMore: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com';

/**
 * List all reports with pagination
 */
export async function listReports(limit = 20, lastKey?: string): Promise<ListReportsResponse> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (lastKey) {
    params.append('lastKey', lastKey);
  }

  const response = await fetch(`${API_URL}/reports?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch reports' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get a single report by ID
 */
export async function getReport(id: string): Promise<SavedReport> {
  const response = await fetch(`${API_URL}/reports/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Report not found');
    }
    const error = await response.json().catch(() => ({ error: 'Failed to fetch report' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
