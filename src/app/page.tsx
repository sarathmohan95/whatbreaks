'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Zap, FileCheck, TrendingUp, Cloud, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Cloud className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">WhatBreaks</span>
            </div>
            <Link href="/analyze">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-300">AWS Well-Architected Framework</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Simulate Failure
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Before It Happens
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            AI-powered pre-mortem engine that simulates how your infrastructure changes could fail.
            Get realistic failure scenarios before deployment, not after the outage.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg" className="text-lg px-8 py-6">
                Generate Pre-Mortem
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10">
              See Example
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
            How WhatBreaks Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Counterfactual Reasoning"
              description="AI assumes your change caused an outage, then reconstructs how it happened"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Realistic Failure Scenarios"
              description="Get detailed timelines showing triggering events, cascades, and hidden dependencies"
            />
            <FeatureCard
              icon={<FileCheck className="h-8 w-8" />}
              title="Preventive Actions"
              description="Receive specific recommendations to prevent the simulated failure"
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Before Deployment"
              description="Identify risks during planning, not during incidents"
            />
            <FeatureCard
              icon={<CheckCircle className="h-8 w-8" />}
              title="Narrative Reports"
              description="Human-readable failure stories, not metrics or alerts"
            />
            <FeatureCard
              icon={<Cloud className="h-8 w-8" />}
              title="Infrastructure Changes"
              description="Analyze Terraform plans, config updates, and architecture modifications"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to simulate failure?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Start your free pre-mortem analysis today
          </p>
          <Link href="/analyze">
            <Button size="lg" className="text-lg px-8 py-6">
              Generate Pre-Mortem
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2026 WhatBreaks. Simulate failure before it happens.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
      <div className="text-blue-400 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
