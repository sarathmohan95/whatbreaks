'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Box, Network, HardDrive, Cpu, Search, ArrowLeft, Trash2, Edit, Cloud } from 'lucide-react';
import { listTemplates, deleteTemplate, Template as CustomTemplate } from '@/lib/api/templates';

interface Template {
  id: string;
  name: string;
  category: string;
  difficulty: 'low' | 'medium' | 'high';
  description: string;
  usageCount: number;
  parameters: any[];
  template: any;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const categoryIcons: Record<string, any> = {
  database: Database,
  kubernetes: Box,
  networking: Network,
  storage: HardDrive,
  compute: Cpu,
};

const difficultyColors = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'built-in' | 'custom'>('built-in');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
    loadCustomTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // Load index
      const indexRes = await fetch('/templates/index.json');
      const index = await indexRes.json();
      
      setCategories(index.categories);

      // Load all templates
      const templatePromises = index.templates.map(async (item: any) => {
        const res = await fetch(item.path);
        return res.json();
      });

      const loadedTemplates = await Promise.all(templatePromises);
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomTemplates = async () => {
    try {
      const templates = await listTemplates('anonymous');
      setCustomTemplates(templates);
    } catch (error) {
      console.error('Failed to load custom templates:', error);
      setCustomTemplates([]); // Set empty array on error
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteTemplate(id);
      setCustomTemplates(customTemplates.filter(t => t.id !== id));
    } catch (error) {
      alert('Failed to delete template: ' + (error as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredCustomTemplates = customTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: Template) => {
    // Store template in sessionStorage and navigate to analyze page
    sessionStorage.setItem('selectedTemplate', JSON.stringify(template));
    router.push('/analyze?template=' + template.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-white">Template Library</h1>
              <p className="text-gray-400 mt-2">
                Pre-configured scenarios for common infrastructure changes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-4">
            <Button
              variant={activeTab === 'built-in' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('built-in')}
              className={activeTab === 'built-in' ? '' : 'text-white hover:bg-white/10'}
            >
              Built-in Templates ({templates.length})
            </Button>
            <Button
              variant={activeTab === 'custom' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('custom')}
              className={activeTab === 'custom' ? '' : 'text-white hover:bg-white/10'}
            >
              My Templates ({customTemplates.length})
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? '' : 'border-white/20 text-white hover:bg-white/10'}
            >
              All Categories
            </Button>
            {categories.map((category) => {
              const Icon = categoryIcons[category.id];
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? '' : 'border-white/20 text-white hover:bg-white/10'}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        {activeTab === 'built-in' ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const Icon = categoryIcons[template.category];
                return (
                  <Card
                    key={template.id}
                    className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Icon className="h-6 w-6 text-blue-400" />
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border ${difficultyColors[template.difficulty]}`}>
                          {template.difficulty}
                        </span>
                      </div>
                      <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          {template.parameters.length} parameters
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No templates found matching your criteria</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomTemplates.map((template) => {
                const Icon = categoryIcons[template.category] || Box;
                return (
                  <Card
                    key={template.id}
                    className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Icon className="h-6 w-6 text-purple-400" />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={deletingId === template.id}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          Custom template
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template as any)}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredCustomTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  {customTemplates.length === 0 
                    ? 'No custom templates yet. Create one from the analyze page!'
                    : 'No templates found matching your criteria'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
