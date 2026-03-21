import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Orb } from './components/Orb';
import { SourcesPanel } from './components/SourcesPanel';
import { PoweredBy } from './components/PoweredBy';
import { useAppConversation } from './hooks/useAppConversation';
import type { AppState, Turn } from './types';

const stateLabels: Record<AppState, string> = {
  idle: "Kill My Startup",
  listening: "I Quit",
  searching: "I Quit",
  roasting: "I Quit",
};

function downloadReport(turns: Turn[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 20;
  const contentW = W - margin * 2;
  let y = 0;

  const addPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkY = (needed: number) => {
    if (y + needed > 277) addPage();
  };

  // --- Dark header band ---
  doc.setFillColor(8, 8, 8);
  doc.rect(0, 0, W, 28, 'F');

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('KILLMYSTARTUP', margin, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(220, 220, 220);
  doc.text('AUTOPSY REPORT', margin, 21);

  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text(date, W - margin, 21, { align: 'right' });

  y = 38;

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

  // Footer
  checkY(12);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(margin, y, W - margin, y);
  y += 6;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text('Powered by ElevenLabs & Firecrawl', margin, y);
  doc.text('killmystartup.today', W - margin, y, { align: 'right' });

  doc.save(`autopsy-report-${Date.now()}.pdf`);
}

export default function App() {
  const { appState, connecting, turns, startSession, endSession, error } = useAppConversation();
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleClick = () => {
    if (appState === 'idle') {
      setPanelCollapsed(false);
      startSession();
    } else {
      setPanelCollapsed(true);
      endSession();
    }
  };

  const showDownload = appState === 'idle' && turns.length > 0;

  return (
    <div
      className="flex h-screen w-full overflow-hidden transition-colors duration-1000"
      style={{
        backgroundColor: appState === "roasting" ? "hsl(0, 15%, 4%)" : "hsl(0, 0%, 3.1%)",
      }}
    >
      {/* Left panel */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Help button */}
        <button
          onClick={() => setShowHelp((v) => !v)}
          className="absolute top-6 left-6 z-20 w-8 h-8 flex items-center justify-center border border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-muted-foreground font-mono text-sm transition-colors duration-200"
          style={{ borderRadius: 0 }}
        >
          ?
        </button>

        {/* Help panel */}
        {showHelp && (
          <div className="absolute top-14 left-6 z-20 w-72 border border-border bg-[hsl(0,0%,4%)] p-5 animate-fade-in-up">
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">Think you've got the next big thing?</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">KillMyStartup searches the web as you pitch — surfacing competitors, failed clones, and market realities in real-time. Then delivers the verdict.</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">A dead end found early saves you everything.</p>
            <div className="h-px bg-border mb-4" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-4">How it works</p>
            <ul className="space-y-3">
              {[
                "Hit Kill My Startup and allow mic access.",
                "Pitch your idea out loud — the AI listens in real-time.",
                "As you speak, it searches the live web for competitors, failed clones, and market reality.",
                "Sources are cited in the right panel as it finds them.",
                "Then it tells you exactly why you're cooked.",
                "Download the Autopsy Report when you're done.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground/40 mt-0.5 shrink-0">{i + 1}.</span>
                  <span className="text-[11px] text-muted-foreground leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Center — Orb + Button */}
        <div className="flex-1 flex flex-col items-center justify-center gap-20 -mt-16">
          <Orb state={appState} />

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleClick}
              disabled={connecting}
              className={`kill-button ${
                connecting ? "opacity-50 cursor-not-allowed" :
                appState === "listening" || appState === "searching" ? "kill-button--listening" :
                appState === "roasting" ? "kill-button--roasting" : ""
              }`}
            >
              {connecting ? "Connecting..." : stateLabels[appState]}
            </button>

            {showDownload && (
              <button
                onClick={() => downloadReport(turns)}
                className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 font-mono hover:text-foreground transition-colors duration-200"
              >
                Download Autopsy Report
              </button>
            )}
          </div>

          {error && (
            <p className="text-[11px] text-red-400/70 font-mono text-center max-w-xs">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 font-mono select-none">
            KillMyStartup
          </span>
          <span className="text-muted-foreground/30 font-mono text-[10px]">|</span>
          <PoweredBy />
        </div>
      </div>

      {/* Right panel */}
      <SourcesPanel turns={turns} collapsed={panelCollapsed} onCollapsedChange={setPanelCollapsed} />
    </div>
  );
}
