import { NextRequest, NextResponse } from 'next/server';
import { InfrastructureChange } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const input: InfrastructureChange = await request.json();

    // Validate input
    if (!input.description || input.description.length < 50) {
      return NextResponse.json(
        { error: 'Description must be at least 50 characters' },
        { status: 400 }
      );
    }

    if (input.description.length > 10000) {
      return NextResponse.json(
        { error: 'Description too long (max 10,000 characters)' },
        { status: 400 }
      );
    }

    // Call Lambda via API Gateway
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com';
    const lambdaEndpoint = `${apiUrl}/premortem`;

    console.log('Calling Lambda at:', lambdaEndpoint);

    const response = await fetch(lambdaEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lambda error:', errorText);
      throw new Error(`Lambda returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Pre-mortem generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate pre-mortem' },
      { status: 500 }
    );
  }
}

// Fallback function removed - now using Lambda exclusively
function generateFallbackForOldCode() {
  // Old fallback code kept for reference
  const oldCode = `
    // Fallback to OpenAI if Lambda is not available
    import { analyzeArchitecture } from '@/lib/ai/analyzer';
    
    if (false) {
      const analysis = await analyzeArchitecture(legacyInput);
    }
  `;
  return oldCode;
}
