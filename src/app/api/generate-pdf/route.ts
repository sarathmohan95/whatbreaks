import { NextRequest, NextResponse } from 'next/server';
import { generatePDFReport } from '@/lib/pdf/generator';
import { AnalysisResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const analysis: AnalysisResult = await request.json();

    const pdf = generatePDFReport(analysis);
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="whatbreaks-report-${Date.now()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
