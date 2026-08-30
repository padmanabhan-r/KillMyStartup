import { useEffect, useState } from 'react';
import { Orb } from './components/Orb';
import { SourcesPanel } from './components/SourcesPanel';
import { PoweredBy } from './components/PoweredBy';
import { AndroidBanner } from './components/AndroidBanner';
import { useAppConversation } from './hooks/useAppConversation';
import { saveAutopsyReport, saveTranscript } from './lib/report';
import type { SaveResult } from './lib/savePdf';
import type { AppState } from './types';

const stateLabels: Record<AppState, string> = {
  idle: "Kill My Startup",
  listening: "I Quit",
  searching: "I Quit",
  roasting: "I Quit",
};

export default function App() {
  const { appState, connecting, turns, transcript, startSession, endSession, error } = useAppConversation();
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  // On native the file is written silently, so without a line of feedback the
  // button looks like it did nothing at all.
  useEffect(() => {
    if (!saveNote) return;
    const id = setTimeout(() => setSaveNote(null), 6000);
    return () => clearTimeout(id);
  }, [saveNote]);

  const handleSave = async (save: () => Promise<SaveResult>, label: string) => {
    try {
      const result = await save();
      setSaveNote(
        result.kind === 'saved' ? `Saved to ${result.folder}`
        : result.kind === 'unavailable' ? `Couldn't save the ${label} on this device.`
        : null,
      );
    } catch {
      setSaveNote(`Couldn't save the ${label}.`);
    }
  };

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
  const showTranscript = appState === 'idle' && transcript.length > 0;

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
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">KillMyStartup is an antagonistic AI that searches the web as you pitch — surfacing competitors, failed clones, and market realities in real-time. Then delivers the verdict.</p>
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
                onClick={() => handleSave(() => saveAutopsyReport(turns), 'report')}
                className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 font-mono hover:text-foreground transition-colors duration-200"
              >
                Download Autopsy Report
              </button>
            )}

            {showTranscript && (
              <button
                onClick={() => handleSave(() => saveTranscript(transcript), 'transcript')}
                className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 font-mono hover:text-foreground transition-colors duration-200"
              >
                Download Full Transcript
              </button>
            )}

            {saveNote && (
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-mono animate-fade-in-up">
                {saveNote}
              </p>
            )}
          </div>

          {error && (
            <p className="text-[11px] text-red-400/70 font-mono text-center max-w-xs">
              {error}
            </p>
          )}
        </div>

        <AndroidBanner />

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
