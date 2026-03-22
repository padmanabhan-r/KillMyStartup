# Changelog

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
