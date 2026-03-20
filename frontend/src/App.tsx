import { Orb } from './components/Orb';
import { SourcesPanel } from './components/SourcesPanel';
import { PoweredBy } from './components/PoweredBy';
import { useAppConversation } from './hooks/useAppConversation';
import type { AppState } from './types';

const stateLabels: Record<AppState, string> = {
  idle: "Kill My Startup",
  listening: "I Quit",
  searching: "I Quit",
  roasting: "I Quit",
};

export default function App() {
  const { appState, sources, idea, startSession, endSession, error } = useAppConversation();

  const handleClick = () => {
    if (appState === 'idle') startSession();
    else endSession();
  };

  return (
    <div
      className="flex h-screen w-full overflow-hidden transition-colors duration-1000"
      style={{
        backgroundColor: appState === "roasting" ? "hsl(0, 15%, 4%)" : "hsl(0, 0%, 3.1%)",
      }}
    >
      {/* Left panel */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Watermark */}
        <div className="absolute top-6 left-6 z-10">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/30 font-mono select-none">
            KillMyStartup
          </span>
        </div>

        {/* Center — Orb + Button */}
        <div className="flex-1 flex flex-col items-center justify-center gap-20">
          <Orb state={appState} />

          <button
            onClick={handleClick}
            className={`kill-button ${
              appState === "listening" || appState === "searching" ? "kill-button--listening" :
              appState === "roasting" ? "kill-button--roasting" : ""
            }`}
          >
            {stateLabels[appState]}
          </button>

          {error && (
            <p className="text-[11px] text-red-400/70 font-mono text-center max-w-xs">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-6">
          <PoweredBy />
        </div>
      </div>

      {/* Right panel */}
      <SourcesPanel sources={sources} idea={idea} />
    </div>
  );
}
