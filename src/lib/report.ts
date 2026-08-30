import { jsPDF } from 'jspdf';
import { savePdf } from './savePdf';
import type { TranscriptEntry, Turn } from '../types';

const W = 210;
const MARGIN = 20;
const CONTENT_W = W - MARGIN * 2;
// Below this the next block would run off the page.
const PAGE_BOTTOM = 277;

// The dark band both documents open with.
function drawHeader(doc: jsPDF, title: string) {
  doc.setFillColor(8, 8, 8);
  doc.rect(0, 0, W, 28, 'F');

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('KILLMYSTARTUP', MARGIN, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(220, 220, 220);
  doc.text(title, MARGIN, 21);

  const date = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text(date, W - MARGIN, 21, { align: 'right' });
}

function drawFooter(doc: jsPDF, y: number) {
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, W - MARGIN, y);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text('Powered by ElevenLabs & Firecrawl', MARGIN, y + 6);
  doc.text('killmystartup.today', W - MARGIN, y + 6, { align: 'right' });
}

export function saveAutopsyReport(turns: Turn[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = MARGIN;
  const contentW = CONTENT_W;
  let y = 38;

  const addPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkY = (needed: number) => {
    if (y + needed > PAGE_BOTTOM) addPage();
  };

  drawHeader(doc, 'AUTOPSY REPORT');

  turns.forEach((turn, turnIndex) => {
    // Turn divider (except first)
    if (turnIndex > 0) {
      checkY(16);
      doc.setDrawColor(220, 50, 50);
      doc.setLineWidth(0.3);
      doc.line(margin, y, W - margin, y);
      y += 10;
    }

    // Idea title
    checkY(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    const ideaLines = doc.splitTextToSize(turn.idea, contentW);
    doc.text(ideaLines, margin, y);
    y += ideaLines.length * 6 + 6;

    // Sources
    turn.sources.forEach((source) => {
      checkY(22);

      // Source card background
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(margin, y - 3, contentW, 22, 1, 1, 'F');

      // Domain
      let domain = source.url;
      try { domain = new URL(source.url).hostname.replace('www.', ''); } catch { /* ignore */ }
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 50, 50);
      doc.text(domain.toUpperCase(), margin + 3, y + 3);

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      const titleLines = doc.splitTextToSize(source.title, contentW - 6);
      doc.text(titleLines.slice(0, 2), margin + 3, y + 8);

      // Description
      if (source.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const descLines = doc.splitTextToSize(source.description, contentW - 6);
        doc.text(descLines.slice(0, 2), margin + 3, y + 15);
      }

      // Clickable link
      doc.link(margin, y - 3, contentW, 22, { url: source.url });

      y += 26;
    });

    y += 4;
  });

  checkY(12);
  drawFooter(doc, y);

  return savePdf(doc, `autopsy-report-${Date.now()}.pdf`);
}

const SPEAKERS: Record<TranscriptEntry['role'], string> = {
  user: 'YOU',
  agent: 'KILLMYSTARTUP',
};

export function saveTranscript(transcript: TranscriptEntry[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 38;

  drawHeader(doc, 'TRANSCRIPT');

  transcript.forEach((entry) => {
    const isAgent = entry.role === 'agent';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines: string[] = doc.splitTextToSize(entry.message, CONTENT_W - 4);

    // Keep the speaker label with at least the first line of what they said;
    // a label stranded alone at the foot of a page reads as a missing reply.
    if (y + 5 + Math.min(lines.length, 2) * 5 > PAGE_BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    if (isAgent) doc.setTextColor(150, 50, 50);
    else doc.setTextColor(120, 120, 120);
    doc.text(SPEAKERS[entry.role], MARGIN, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(isAgent ? 30 : 90, isAgent ? 30 : 90, isAgent ? 30 : 90);

    // Long answers are split across pages a line at a time rather than being
    // pushed whole onto the next one, which would leave large blank gaps.
    lines.forEach((line) => {
      if (y > PAGE_BOTTOM) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(line, MARGIN + 4, y);
      y += 5;
    });

    y += 5;
  });

  if (y + 12 > PAGE_BOTTOM) {
    doc.addPage();
    y = MARGIN;
  }
  drawFooter(doc, y);

  return savePdf(doc, `transcript-${Date.now()}.pdf`);
}
