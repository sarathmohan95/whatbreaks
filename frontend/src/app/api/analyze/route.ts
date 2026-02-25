import { NextRequest, NextResponse } from 'next/server';
import { analyzeArchitecture } from '@/lib/ai/analyzer';
import { ArchitectureInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const input: ArchitectureInput = await request.json();

    // Validate input
    if (!input.description || input.services.length === 0) {
      return NextResponse.json(
        { error: 'Description and services are required' },
        { status: 400 }
      );
    }

    // Analyze architecture
    const result = await analyzeArchitecture(input);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze architecture' },
      { status: 500 }
    );
  }
}
