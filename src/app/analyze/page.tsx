'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Cloud, ArrowLeft, Loader2 } from 'lucide-react';
import { ArchitectureInput } from '@/types';

const AWS_SERVICES = [
  'EC2', 'RDS', 'S3', 'Lambda', 'DynamoDB', 'ECS', 'EKS',
  'ElastiCache', 'CloudFront', 'Route53', 'ALB', 'NLB',
  'API Gateway', 'SQS', 'SNS', 'EventBridge', 'Step Functions',
  'Aurora', 'Redshift', 'EBS', 'EFS', 'FSx'
];

const AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'
];

export default function AnalyzePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ArchitectureInput>({
    description: '',
    services: [],
    region: 'us-east-1',
    criticality: 'Medium',
  });

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem('latestAnalysis', JSON.stringify(result));
        router.push('/dashboard');
      } else {
        alert('Analysis failed: ' + result.error);
      }
    } catch (error) {
      alert('Failed to analyze architecture');
    } finally {
      setLoading(false);
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
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Generate Pre-Mortem Report
          </h1>
          <p className="text-gray-300 text-lg">
            Describe your infrastructure change and simulate how it could fail
          </p>
        </div>

        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Infrastructure Change Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Change Description *
                </label>
                <Textarea
                  placeholder="Describe your proposed infrastructure change in detail. Include current state, proposed changes, traffic patterns, and any known dependencies...

Example:
Migrating user session storage from Redis single node to Redis cluster mode with 3 shards across 3 AZs.

Current: Single Redis node in us-east-1a, 10,000 req/sec peak
Proposed: Redis cluster with 3 shards, one per AZ"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={10}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Minimum 50 characters. Be specific about technical details.
                </p>
              </div>

              {/* Change Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Change Type
                </label>
                <Select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="bg-white/5 border-white/20 text-white"
                >
                  <option value="infrastructure">Infrastructure Change</option>
                  <option value="configuration">Configuration Update</option>
                  <option value="terraform">Terraform Plan</option>
                  <option value="code">Code Deployment</option>
                </Select>
              </div>

              {/* Optional Context */}
              <div className="border-t border-white/10 pt-6">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-300 mb-4 flex items-center">
                    <span>Optional Context (expand for more details)</span>
                    <svg className="ml-2 h-4 w-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Current State</label>
                      <Textarea
                        placeholder="Describe the current infrastructure state..."
                        rows={3}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Proposed State</label>
                      <Textarea
                        placeholder="Describe the proposed infrastructure state..."
                        rows={3}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Traffic Patterns</label>
                      <Textarea
                        placeholder="Describe traffic patterns, peak loads, etc..."
                        rows={2}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </details>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={loading || !formData.description || formData.description.length < 50}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Simulating Failure Scenario...
                  </>
                ) : (
                  'Generate Pre-Mortem Report'
                )}
              </Button>
              
              {formData.description.length > 0 && formData.description.length < 50 && (
                <p className="text-sm text-yellow-400 text-center">
                  Please provide more detail ({formData.description.length}/50 characters minimum)
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
