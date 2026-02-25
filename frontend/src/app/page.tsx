'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Zap, FileCheck, TrendingUp, Cloud, CheckCircle, AlertTriangle, Clock, Activity } from 'lucide-react';

export default function LandingPage() {
  const [stats, setStats] = useState({
    totalReports: 0,
    criticalRisks: 0,
    avgAnalysisTime: 0
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Fetch stats from history
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`);
        if (response.ok) {
          const data = await response.json();
          const reports = data.reports || [];
          
          const criticalCount = reports.filter((r: any) => 
            r.severity?.toLowerCase() === 'critical'
          ).length;
          
          setStats({
            totalReports: reports.length,
            criticalRisks: criticalCount,
            avgAnalysisTime: 45 // seconds - could calculate from actual data
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
      setIsLoaded(true);
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Cloud className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">WhatBreaks</span>
            </div>
            <div className="flex gap-2">
              <Link href="/templates">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  Templates
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  History
                </Button>
              </Link>
              <Link href="/analyze">
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-12 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Stats Bar */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <StatCard
              icon={<Activity className="h-6 w-6" />}
              label="Reports Generated"
              value={stats.totalReports}
              color="blue"
              delay={0}
            />
            <StatCard
              icon={<AlertTriangle className="h-6 w-6" />}
              label="Critical Risks Found"
              value={stats.criticalRisks}
              color="red"
              delay={100}
            />
            <StatCard
              icon={<Clock className="h-6 w-6" />}
              label="Avg Analysis Time"
              value={`${stats.avgAnalysisTime}s`}
              color="green"
              delay={200}
            />
          </div>

          {/* Hero Content */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8 hover:bg-blue-500/20 transition-colors">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-300">AWS Well-Architected Framework</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in">
              Simulate Failure
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Before It Happens
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              AI-powered pre-mortem engine that simulates how your infrastructure changes could fail.
              Get realistic failure scenarios before deployment, not after the outage.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/analyze">
                <Button size="lg" className="text-lg px-8 py-6 bg-blue-500 hover:bg-blue-600 hover:scale-105 transition-transform">
                  Generate Pre-Mortem
                </Button>
              </Link>
              <Link href="/history">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10 hover:scale-105 transition-transform">
                  View History
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How WhatBreaks Works
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Powered by AI to identify risks before they become incidents
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Counterfactual Reasoning"
              description="AI assumes your change caused an outage, then reconstructs how it happened"
              delay={0}
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Realistic Failure Scenarios"
              description="Get detailed timelines showing triggering events, cascades, and hidden dependencies"
              delay={100}
            />
            <FeatureCard
              icon={<FileCheck className="h-8 w-8" />}
              title="Preventive Actions"
              description="Receive specific recommendations to prevent the simulated failure"
              delay={200}
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Before Deployment"
              description="Identify risks during planning, not during incidents"
              delay={300}
            />
            <FeatureCard
              icon={<CheckCircle className="h-8 w-8" />}
              title="Narrative Reports"
              description="Human-readable failure stories, not metrics or alerts"
              delay={400}
            />
            <FeatureCard
              icon={<Cloud className="h-8 w-8" />}
              title="Infrastructure Changes"
              description="Analyze Terraform plans, config updates, and architecture modifications"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-12 text-center backdrop-blur-sm hover:border-blue-500/40 transition-colors">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to simulate failure?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start your free pre-mortem analysis today
            </p>
            <Link href="/analyze">
              <Button size="lg" className="text-lg px-8 py-6 bg-blue-500 hover:bg-blue-600 hover:scale-105 transition-transform">
                Generate Pre-Mortem
              </Button>
            </Link>
          </div>
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

function StatCard({ icon, label, value, color, delay }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number | string; 
  color: 'blue' | 'red' | 'green';
  delay: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      if (typeof value === 'number') {
        let current = 0;
        const increment = value / 30;
        const interval = setInterval(() => {
          current += increment;
          if (current >= value) {
            setDisplayValue(value);
            clearInterval(interval);
          } else {
            setDisplayValue(Math.floor(current));
          }
        }, 30);
        return () => clearInterval(interval);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm rounded-xl p-6 hover:scale-105 transition-all duration-300 ${isAnimating ? 'animate-fade-in' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={colorClasses[color]}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">
        {typeof value === 'number' ? displayValue : value}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="text-blue-400 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
