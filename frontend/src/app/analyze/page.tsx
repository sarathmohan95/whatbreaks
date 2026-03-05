'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Cloud, ArrowLeft, Loader2, FileText, Save, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { InfrastructureChange } from '@/types';
import { createTemplate } from '@/lib/api/templates';

interface Template {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  description: string;
  parameters: Array<{
    name: string;
    label: string;
    type: string;
    options?: string[];
    default: string;
    required: boolean;
  }>;
  template: {
    description: string;
    changeType: string;
    currentState: string;
    proposedState: string;
    trafficPatterns: string;
  };
}

function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<InfrastructureChange>({
    description: '',
    changeType: 'infrastructure',
    currentState: '',
    proposedState: '',
    trafficPatterns: '',
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTemplateData, setSaveTemplateData] = useState({
    name: '',
    category: 'database',
    description: '',
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
  
  // IaC parsing state
  const [iacFile, setIacFile] = useState<File | null>(null);
  const [parsingIaC, setParsingIaC] = useState(false);
  const [iacAnalysis, setIacAnalysis] = useState<any>(null);
  const [securityIssues, setSecurityIssues] = useState<any[]>([]);

  useEffect(() => {
    // Check if template is selected
    const templateId = searchParams.get('template');
    if (templateId) {
      const storedTemplate = sessionStorage.getItem('selectedTemplate');
      if (storedTemplate) {
        const tmpl = JSON.parse(storedTemplate);
        setTemplate(tmpl);
        
        // Initialize parameter values with defaults
        const defaults: Record<string, string> = {};
        tmpl.parameters.forEach((param: any) => {
          defaults[param.name] = param.default || '';
        });
        setParameterValues(defaults);
      }
    }
  }, [searchParams]);

  const applyTemplate = () => {
    if (!template) return;

    // Replace placeholders in template with parameter values
    const replacePlaceholders = (text: string) => {
      let result = text;
      Object.entries(parameterValues).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      return result;
    };

    setFormData({
      description: replacePlaceholders(template.template.description),
      changeType: template.template.changeType as any,
      currentState: replacePlaceholders(template.template.currentState),
      proposedState: replacePlaceholders(template.template.proposedState),
      trafficPatterns: replacePlaceholders(template.template.trafficPatterns),
    });
  };

  const handleFileUpload = async (file: File) => {
    setIacFile(file);
    setParsingIaC(true);
    setSecurityIssues([]);
    setIacAnalysis(null);

    try {
      // Read file content
      const content = await file.text();

      // Determine file type
      const fileName = file.name.toLowerCase();
      const fileType = fileName.endsWith('.tf') || fileName.endsWith('.tfplan') || fileName.includes('terraform')
        ? 'terraform'
        : 'cloudformation';

      // Send to API
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com';
      const response = await fetch(`${API_URL}/parse-iac`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileContent: content, fileType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse IaC file');
      }

      const result = await response.json();
      setIacAnalysis(result);

      // Auto-fill form with parsed data
      setFormData({
        description: result.description || '',
        changeType: 'terraform',
        currentState: generateCurrentState(result),
        proposedState: generateProposedState(result),
        trafficPatterns: '',
      });

      // Show security issues
      if (result.securityIssues && result.securityIssues.length > 0) {
        setSecurityIssues(result.securityIssues);
      }
    } catch (error) {
      alert('Failed to parse IaC file: ' + (error as Error).message);
      setIacFile(null);
    } finally {
      setParsingIaC(false);
    }
  };

  const generateCurrentState = (analysis: any) => {
    const existing = analysis.resources?.filter((r: any) =>
      r.action === 'update' || r.action === 'delete'
    ) || [];

    if (existing.length === 0) return 'New infrastructure deployment';

    return `Existing infrastructure:\n${existing.map((r: any) =>
      `- ${r.type}: ${r.name}`
    ).join('\n')}`;
  };

  const generateProposedState = (analysis: any) => {
    const changes = (analysis.resources || []).map((r: any) => {
      switch (r.action) {
        case 'create':
          return `+ ${r.type}: ${r.name}`;
        case 'update':
          return `~ ${r.type}: ${r.name}`;
        case 'delete':
          return `- ${r.type}: ${r.name}`;
        default:
          return '';
      }
    }).filter(Boolean);

    return `Proposed changes:\n${changes.join('\n')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com';
      const response = await fetch(`${API_URL}/premortem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Save to localStorage as fallback
        localStorage.setItem('latestAnalysis', JSON.stringify(result));
        
        // Redirect with report ID if available
        if (result.reportId) {
          router.push(`/premortem?id=${result.reportId}`);
        } else {
          router.push('/premortem');
        }
      } else {
        alert('Pre-mortem generation failed: ' + result.error);
      }
    } catch (error) {
      alert('Failed to generate pre-mortem');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!saveTemplateData.name || !saveTemplateData.description) {
      alert('Please provide a name and description for the template');
      return;
    }

    setSavingTemplate(true);
    try {
      await createTemplate({
        userId: 'anonymous',
        name: saveTemplateData.name,
        category: saveTemplateData.category,
        description: saveTemplateData.description,
        template: {
          description: formData.description,
          changeType: formData.changeType,
          currentState: formData.currentState || '',
          proposedState: formData.proposedState || '',
          trafficPatterns: formData.trafficPatterns || '',
        },
        parameters: [],
        isPublic: false,
        usageCount: 0,
      });

      alert('Template saved successfully!');
      setShowSaveModal(false);
      setSaveTemplateData({ name: '', category: 'database', description: '' });
    } catch (error) {
      alert('Failed to save template: ' + (error as Error).message);
    } finally {
      setSavingTemplate(false);
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
            <div className="flex gap-2">
              <Link href="/templates">
                <Button variant="ghost" size="sm" className="text-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-white">
                  History
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
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

        {/* IaC File Upload Section */}
        {!template && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-blue-400/50 transition-colors">
                <input
                  type="file"
                  accept=".tf,.tfplan,.json,.yaml,.yml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                  id="iac-upload"
                  disabled={parsingIaC}
                />
                <label htmlFor="iac-upload" className="cursor-pointer">
                  <div className="text-gray-400 mb-4">
                    <Upload className="h-12 w-12 mx-auto mb-2 text-blue-400" />
                    <p className="text-lg text-white font-semibold">Upload Terraform or CloudFormation file</p>
                    <p className="text-sm mt-2">Supports .tf, .tfplan, .json, .yaml files</p>
                    <p className="text-xs mt-1 text-gray-500">AI will analyze your infrastructure and auto-fill the form</p>
                  </div>
                </label>

                {parsingIaC && (
                  <div className="mt-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-400" />
                    <p className="text-sm text-gray-400 mt-2">Analyzing infrastructure...</p>
                  </div>
                )}

                {iacFile && !parsingIaC && iacAnalysis && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded">
                    <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="font-semibold">Parsed: {iacFile.name}</p>
                    </div>
                    <p className="text-sm text-gray-400">
                      Found {iacAnalysis.summary?.totalResources || 0} resources
                      {iacAnalysis.summary?.toCreate > 0 && ` (${iacAnalysis.summary.toCreate} to create)`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Form auto-filled with analysis</p>
                  </div>
                )}
              </div>

              {/* Security Issues */}
              {securityIssues.length > 0 && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded">
                  <div className="flex items-center gap-2 text-red-400 font-semibold mb-3">
                    <AlertTriangle className="h-5 w-5" />
                    <h3>Security Issues Found ({securityIssues.length})</h3>
                  </div>
                  <ul className="space-y-3">
                    {securityIssues.map((issue, i) => (
                      <li key={i} className="text-sm border-l-2 border-red-500/30 pl-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                            issue.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                            issue.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className="text-gray-300">{issue.resource}</span>
                        </div>
                        <p className="text-gray-400">{issue.issue}</p>
                        <p className="text-gray-500 text-xs mt-1">→ {issue.recommendation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              {template ? `Template: ${template.name}` : 'Infrastructure Change Details'}
            </CardTitle>
            {template && (
              <p className="text-gray-400 text-sm mt-2">{template.description}</p>
            )}
          </CardHeader>
          <CardContent>
            {template ? (
              /* Template Parameter Form */
              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Configure Template Parameters</h3>
                  <p className="text-gray-400 text-sm">
                    Fill in the parameters below to customize this template for your use case.
                  </p>
                </div>

                {template.parameters.map((param) => (
                  <div key={param.name}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {param.label} {param.required && '*'}
                    </label>
                    {param.type === 'select' ? (
                      <Select
                        value={parameterValues[param.name] || param.default}
                        onChange={(e) => setParameterValues({
                          ...parameterValues,
                          [param.name]: e.target.value
                        })}
                        className="bg-white/5 border-white/20 text-white"
                      >
                        {param.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </Select>
                    ) : param.type === 'number' ? (
                      <Input
                        type="number"
                        value={parameterValues[param.name] || param.default}
                        onChange={(e) => setParameterValues({
                          ...parameterValues,
                          [param.name]: e.target.value
                        })}
                        required={param.required}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    ) : (
                      <Input
                        type="text"
                        value={parameterValues[param.name] || param.default}
                        onChange={(e) => setParameterValues({
                          ...parameterValues,
                          [param.name]: e.target.value
                        })}
                        required={param.required}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    )}
                  </div>
                ))}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={applyTemplate}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    Apply Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTemplate(null);
                      sessionStorage.removeItem('selectedTemplate');
                      router.push('/analyze');
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Clear Template
                  </Button>
                </div>

                {formData.description && (
                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-white font-semibold mb-4">Generated Configuration</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Description</label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Current State</label>
                        <Textarea
                          value={formData.currentState}
                          onChange={(e) => setFormData({ ...formData, currentState: e.target.value })}
                          rows={3}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Proposed State</label>
                        <Textarea
                          value={formData.proposedState}
                          onChange={(e) => setFormData({ ...formData, proposedState: e.target.value })}
                          rows={3}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={loading}
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
                    </form>
                  </div>
                )}
              </div>
            ) : (
              /* Regular Form */
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
                  value={formData.changeType}
                  onChange={(e) => setFormData({ ...formData, changeType: e.target.value as any })}
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
                        value={formData.currentState}
                        onChange={(e) => setFormData({ ...formData, currentState: e.target.value })}
                        rows={3}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Proposed State</label>
                      <Textarea
                        placeholder="Describe the proposed infrastructure state..."
                        value={formData.proposedState}
                        onChange={(e) => setFormData({ ...formData, proposedState: e.target.value })}
                        rows={3}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Traffic Patterns</label>
                      <Textarea
                        placeholder="Describe traffic patterns, peak loads, etc..."
                        value={formData.trafficPatterns}
                        onChange={(e) => setFormData({ ...formData, trafficPatterns: e.target.value })}
                        rows={2}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </details>
              </div>

              {/* Analysis Mode Selector */}
              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSaveModal(true)}
                  disabled={!formData.description || formData.description.length < 50}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Template
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !formData.description || formData.description.length < 50}
                  className="flex-1"
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
              </div>
              
              {formData.description.length > 0 && formData.description.length < 50 && (
                <p className="text-sm text-yellow-400 text-center">
                  Please provide more detail ({formData.description.length}/50 characters minimum)
                </p>
              )}
            </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save as Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-900 border-white/20 max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-white">Save as Template</CardTitle>
              <p className="text-gray-400 text-sm mt-2">
                Create a reusable template from this configuration
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Redis Cluster Migration"
                  value={saveTemplateData.name}
                  onChange={(e) => setSaveTemplateData({ ...saveTemplateData, name: e.target.value })}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <Select
                  value={saveTemplateData.category}
                  onChange={(e) => setSaveTemplateData({ ...saveTemplateData, category: e.target.value })}
                  className="bg-white/5 border-white/20 text-white"
                >
                  <option value="database">Database</option>
                  <option value="kubernetes">Kubernetes</option>
                  <option value="networking">Networking</option>
                  <option value="storage">Storage</option>
                  <option value="compute">Compute</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <Textarea
                  placeholder="Brief description of what this template is for..."
                  value={saveTemplateData.description}
                  onChange={(e) => setSaveTemplateData({ ...saveTemplateData, description: e.target.value })}
                  rows={3}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSaveModal(false);
                    setSaveTemplateData({ name: '', category: 'database', description: '' });
                  }}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAsTemplate}
                  disabled={savingTemplate || !saveTemplateData.name || !saveTemplateData.description}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  {savingTemplate ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Template'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}
