export function PoweredBy() {
  return (
    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-mono select-none">
      <span>Powered by</span>
      <a
        href="https://elevenlabs.io"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground/70 hover:text-muted-foreground/90 transition-colors duration-200"
      >
        ElevenLabs
      </a>
      <span className="text-muted-foreground/40">&</span>
      <a
        href="https://firecrawl.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground/70 hover:text-muted-foreground/90 transition-colors duration-200"
      >
        Firecrawl
      </a>
    </div>
  );
}
