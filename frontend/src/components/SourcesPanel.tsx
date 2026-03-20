import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Source } from '../types';
import { getDomain } from '../types';

interface Props {
  sources: Source[];
  idea: string;
}

export function SourcesPanel({ sources, idea }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const seenCountRef = useRef(0);
  const seenCount = seenCountRef.current;

  useEffect(() => {
    seenCountRef.current = sources.length;
  }, [sources.length]);

  if (sources.length === 0) return null;

  return (
    <div
      className={cn(
        "relative h-full border-l border-border bg-[hsl(0,0%,4%)] transition-all duration-400 animate-slide-in-right",
        collapsed ? "w-0 overflow-hidden border-l-0" : "w-[380px] min-w-[320px]",
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-5 h-12 bg-secondary/80 border border-border transition-all duration-200 hover:bg-accent",
          collapsed ? "-left-5" : "-left-[1px]",
        )}
        style={{ borderRadius: 0 }}
      >
        {collapsed ? (
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="h-full overflow-y-auto p-6">
          {/* Idea name */}
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-mono">
            Autopsy Report
          </p>
          <h2 className="font-grotesk text-lg font-semibold text-primary mb-6 leading-tight">
            {idea}
          </h2>

          {/* Sources */}
          <div className="space-y-1">
            {sources.map((source, i) => {
              const isNew = i >= seenCount;
              return (
                <a
                  key={`${source.url}-${i}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "block p-3 border border-transparent hover:border-border hover:bg-accent/40 transition-all duration-200 group",
                    isNew && "animate-fade-in-up",
                  )}
                  style={isNew ? { animationDelay: `${(i - seenCount) * 80}ms` } : undefined}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${source.url}&sz=32`}
                      alt=""
                      className="w-3.5 h-3.5 opacity-50 group-hover:opacity-70"
                    />
                    <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
                      {getDomain(source.url)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed mb-1 font-mono">
                    {source.title}
                  </p>
                  {source.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {source.description}
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
