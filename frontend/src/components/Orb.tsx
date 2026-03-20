import { cn } from "@/lib/utils";
import type { AppState } from "../types";

// Map our AppState to orb visual states
type OrbState = "idle" | "listening" | "pondering" | "roasting";

function toOrbState(state: AppState): OrbState {
  if (state === "searching") return "pondering";
  return state;
}

interface OrbProps {
  state: AppState;
}

const haloGradients: Record<OrbState, string> = {
  idle: "radial-gradient(circle, hsla(0,50%,35%,0.5) 0%, transparent 70%)",
  listening: "radial-gradient(circle, hsla(0,60%,55%,0.35) 0%, transparent 70%)",
  pondering: "radial-gradient(circle, hsla(38,80%,55%,0.35) 0%, transparent 70%)",
  roasting: "radial-gradient(circle, hsla(0,72%,50%,0.55) 0%, transparent 70%)",
};


export function Orb({ state }: OrbProps) {
  const orbState = toOrbState(state);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      {/* Deep ambient glow */}
      <div
        className={cn(
          "absolute rounded-full transition-all duration-2000",
          orbState === "idle" && "bg-kill-red/30",
          orbState === "listening" && "bg-kill-red/40",
          orbState === "pondering" && "bg-kill-amber/40",
          orbState === "roasting" && "bg-kill-red/60",
        )}
        style={{ inset: -60, filter: "blur(70px)" }}
      />

      {/* Secondary pulsing halo */}
      <div
        className="absolute inset-[-30px] rounded-full animate-orb-halo transition-all duration-2000"
        style={{ background: haloGradients[orbState] }}
      />

      {/* Rotating ring (pondering only) */}
      {orbState === "pondering" && (
        <div className="absolute inset-[-12px] animate-orb-ring">
          <svg viewBox="0 0 304 304" className="w-full h-full">
            <circle
              cx="152"
              cy="152"
              r="148"
              fill="none"
              stroke="hsl(15, 70%, 50%)"
              strokeWidth="0.5"
              strokeDasharray="40 260"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        </div>
      )}

      {/* Roasting outer ring */}
      {orbState === "roasting" && (
        <div className="absolute inset-[-6px] rounded-full border border-kill-red/70 animate-orb-pulse-red" />
      )}

      {/* Core orb */}
      <div
        className={cn(
          "relative w-full h-full rounded-full transition-all duration-1500 animate-orb-dark",
          orbState === "idle" && "bg-gradient-to-br from-[hsl(0,45%,28%)] to-[hsl(0,35%,12%)] shadow-[inset_0_-20px_60px_rgba(0,0,0,0.5),inset_0_20px_40px_rgba(180,30,30,0.2),0_0_80px_rgba(180,30,30,0.25)]",
          orbState === "listening" && "bg-gradient-to-br from-[hsl(0,55%,38%)] to-[hsl(0,40%,18%)] shadow-[inset_0_-20px_60px_rgba(0,0,0,0.3),inset_0_20px_40px_rgba(200,40,40,0.25),0_0_120px_rgba(200,40,40,0.3)]",
          orbState === "pondering" && "bg-gradient-to-br from-[hsl(38,70%,35%)] to-[hsl(30,50%,15%)] shadow-[inset_0_-20px_60px_rgba(0,0,0,0.3),inset_0_20px_40px_rgba(200,140,50,0.25),0_0_100px_rgba(200,140,50,0.3)]",
          orbState === "roasting" && "bg-gradient-to-br from-[hsl(0,72%,42%)] to-[hsl(0,55%,18%)] shadow-[inset_0_-20px_60px_rgba(0,0,0,0.2),inset_0_20px_40px_rgba(220,30,30,0.4),0_0_160px_rgba(220,30,30,0.5)] animate-orb-pulse-red",
        )}
      >
        {/* Abstract internal blobs */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div
            className="absolute w-[65%] h-[65%] top-[5%] left-[5%] rounded-full animate-blob-1 transition-colors duration-2000"
            style={{
              background: {
                idle: "radial-gradient(circle, hsla(0,60%,40%,0.7) 0%, transparent 70%)",
                listening: "radial-gradient(circle, hsla(0,70%,55%,0.75) 0%, transparent 70%)",
                pondering: "radial-gradient(circle, hsla(38,80%,55%,0.75) 0%, transparent 70%)",
                roasting: "radial-gradient(circle, hsla(0,80%,50%,0.9) 0%, transparent 70%)",
              }[orbState],
              filter: "blur(28px)",
            }}
          />
          <div
            className="absolute w-[50%] h-[50%] top-[30%] left-[30%] rounded-full animate-blob-2 transition-colors duration-2000"
            style={{
              background: {
                idle: "radial-gradient(circle, hsla(10,50%,30%,0.6) 0%, transparent 70%)",
                listening: "radial-gradient(circle, hsla(350,65%,50%,0.65) 0%, transparent 70%)",
                pondering: "radial-gradient(circle, hsla(25,75%,48%,0.65) 0%, transparent 70%)",
                roasting: "radial-gradient(circle, hsla(15,90%,45%,0.85) 0%, transparent 70%)",
              }[orbState],
              filter: "blur(22px)",
            }}
          />
          <div
            className="absolute w-[40%] h-[40%] top-[15%] left-[40%] rounded-full animate-blob-3 transition-colors duration-2000"
            style={{
              background: {
                idle: "radial-gradient(circle, hsla(355,45%,35%,0.5) 0%, transparent 70%)",
                listening: "radial-gradient(circle, hsla(5,60%,60%,0.6) 0%, transparent 70%)",
                pondering: "radial-gradient(circle, hsla(45,85%,60%,0.6) 0%, transparent 70%)",
                roasting: "radial-gradient(circle, hsla(0,100%,55%,0.8) 0%, transparent 70%)",
              }[orbState],
              filter: "blur(18px)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
