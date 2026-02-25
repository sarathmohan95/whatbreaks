import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'High':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'Medium':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'Low':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
