// API client for custom template operations

const API_BASE_URL = '/api';

export interface TemplateParameter {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  default?: string | number;
  min?: number;
  max?: number;
  options?: string[];
}

export interface Template {
  id: string;
  userId?: string;
  name: string;
  category: string;
  description: string;
  tags?: string[];
  difficulty?: string;
  estimatedTime?: string;
  template: {
    description: string;
    changeType: string;
    currentState: string;
    proposedState: string;
    trafficPatterns: string;
  };
  parameters: TemplateParameter[];
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  usageCount?: number;
  metadata?: {
    author?: string;
    version?: string;
  };
}

export async function createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> {
  const response = await fetch(`${API_BASE_URL}/templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(template),
  });

  if (!response.ok) {
    throw new Error(`Failed to create template: ${response.statusText}`);
  }

  return response.json();
}

export async function listTemplates(userId?: string): Promise<Template[]> {
  let url = `${API_BASE_URL}/templates`;
  if (userId) {
    url += `?userId=${encodeURIComponent(userId)}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to list templates: ${response.statusText}`);
  }

  const data = await response.json();
  return data.templates || [];
}

export async function getTemplate(id: string): Promise<Template> {
  const response = await fetch(`${API_BASE_URL}/templates/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to get template: ${response.statusText}`);
  }

  return response.json();
}

export async function updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
  const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update template: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete template: ${response.statusText}`);
  }
}
