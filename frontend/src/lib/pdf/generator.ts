import jsPDF from 'jspdf';
import { AnalysisResult } from '@/types';

export function generatePDFReport(analysis: AnalysisResult): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(37, 99, 235);
  doc.text('WhatBreaks', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(16);
  doc.setTextColor(100, 100, 100);
  doc.text('Architecture Reliability Report', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date(analysis.timestamp).toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;

  // Overall Score
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Overall Reliability Score', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(32);
  const scoreColor = analysis.score.overall >= 80 ? [34, 197, 94] : 
                     analysis.score.overall >= 60 ? [234, 179, 8] : [239, 68, 68];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${analysis.score.overall}/100`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;

  // Score Breakdown
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Score Breakdown', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  const scores = [
    ['Fault Tolerance', analysis.score.faultTolerance],
    ['Monitoring', analysis.score.monitoring],
    ['Scalability', analysis.score.scalability],
    ['Disaster Recovery', analysis.score.disasterRecovery],
    ['Resilience', analysis.score.resilience],
  ];
  
  scores.forEach(([label, score]) => {
    doc.text(`${label}: ${score}/100`, 25, yPos);
    yPos += 6;
  });
  
  yPos += 10;

  // Summary
  doc.setFontSize(12);
  doc.text('Executive Summary', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(analysis.summary, pageWidth - 40);
  doc.text(summaryLines, 20, yPos);
  yPos += summaryLines.length * 6 + 10;

  // Risks
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(12);
  doc.text('Identified Risks', 20, yPos);
  yPos += 10;

  analysis.risks.forEach((risk, index) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${index + 1}. ${risk.title}`, 20, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Risk Level: ${risk.riskLevel} | Category: ${risk.category}`, 25, yPos);
    yPos += 6;

    const descLines = doc.splitTextToSize(risk.description, pageWidth - 50);
    doc.text(descLines, 25, yPos);
    yPos += descLines.length * 5 + 3;

    doc.setTextColor(37, 99, 235);
    doc.text('Recommendation:', 25, yPos);
    yPos += 5;
    doc.setTextColor(0, 0, 0);
    const recLines = doc.splitTextToSize(risk.recommendation, pageWidth - 50);
    doc.text(recLines, 25, yPos);
    yPos += recLines.length * 5 + 8;
  });

  return doc;
}
