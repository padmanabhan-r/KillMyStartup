# Changelog

## v1.1.0 — 2026-03-24

### Search improvements

- **Web + news results** — `sources: ["web", "news"]` now always sent as a constant; previously the LLM was omitting it, returning web-only results
- **Past 12 months only** — added `tbs: qdr:y` to filter web results to the last year; stale data gives founders an out, fresh data doesn't
- **Tighter context** — `limit` reduced from 5 to 3; returns 3 web + 3 news = 6 results, enough to land a roast without overloading a conversational agent

### Bug fixes

- **Fixed source parsing** — changed `show_sources` delimiter from `,` to `;;`; descriptions containing commas were being silently truncated, causing sources to display with missing text
- **Fixed source mismatch** — LLM now passes all results from both web and news arrays to `show_sources`; previously it was filtering results independently, causing a mismatch between what the agent said and what appeared in the UI

### System prompt

- Query examples aligned to three attack vectors: existing competitors, funding/scale, startups that failed doing this
- `show_sources` rules updated to reflect `;;` delimiter and full result passing

### Docs

- README updated with How the search works and Design decisions sections
- SETUP_INSTRUCTIONS updated to reflect new tool config (`limit: 3`, `tbs`, `;;` delimiter)

---

## v1.0.0 — 2026-03-22

First public release of KillMyStartup.

### What it does

A voice-native antagonistic AI agent that plays devil's advocate against your startup idea — before investors do. Pitch out loud, get brutally roasted in real time using live web data, and walk away with a written autopsy.

### Features

- **Voice-first conversation** — speak your idea, no typing required
- **Live web research** — Firecrawl Search pulls real competitors, failed clones, and market realities mid-conversation
- **4-state orb UI** — dark / white (listening) / amber (searching) / red (roasting) — designed to feel unsettling, not friendly
- **Sources panel** — cited evidence appears in real time as the agent searches
- **Autopsy Report** — downloadable PDF summary generated at the end of every session
- **Self-aware easter egg** — pitch a startup-roasting app and the agent calls it out immediately

### Stack

- ElevenAgents — STT, LLM, TTS, and tool orchestration
- Firecrawl Search — registered as a Server Tool directly inside ElevenAgents
- Vite + React + TypeScript — frontend deployed to Vercel
- No backend

### Design decisions

- Minimal dark UI is a deliberate choice to create an unsettling, adversarial feeling — this tool is not rooting for you
- The domain `killmystartup.today` is an imperative, not a question
