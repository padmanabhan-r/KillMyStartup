# KillMyStartup

> Tell me your startup idea. I'll tell you why it's already dead.

A voice-native AI that brutally roasts startup ideas in real-time using live web data. Speak your idea — the agent searches the internet for your competitors, past failures, and market saturation, then interrupts you with a data-backed roast.

Built for [ElevenHacks](https://elevenlabs.io) using **ElevenAgents** + **Firecrawl Search**.

---

## How it works

1. User speaks a startup idea into the browser
2. ElevenAgents detects the idea and calls Firecrawl Search — live web + news results
3. The agent's LLM synthesizes a brutal, fact-based roast from the search results
4. ElevenAgents speaks the roast back in a sharp, confident voice
5. The UI visualises each phase: white (listening) → amber (searching) → red (roasting)

No backend. ElevenAgents owns the full loop: STT → tool calls → synthesis → TTS.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Voice agent | ElevenAgents (STT + LLM + TTS + tool orchestration) |
| Live web search | Firecrawl Search API (Server Tool inside ElevenAgents) |
| Frontend | Vite + React + TypeScript |
| Deployment | Vercel |

---

## Project Structure

```
KillMyStartup/
├── frontend/               # Vite React app — the entire product
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   └── Orb.tsx     # Animated state visualiser
│   │   └── hooks/
│   │       └── useAppConversation.ts   # ElevenLabs SDK + state machine
│   └── .env.local          # VITE_ELEVENLABS_AGENT_ID
└── implementation/
    └── PLAN.md             # Full step-by-step build plan
```

---

## Local Development

### Prerequisites

- Node.js 18+
- An ElevenLabs account with an agent configured (see `implementation/PLAN.md`)

### Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
```

### Run

```bash
npm run dev
# Opens on http://localhost:5173
```

---

## ElevenAgents Configuration

The agent is configured entirely in the ElevenLabs console — no backend code required.

**Two tools registered on the agent:**

| Tool | Type | Purpose |
|------|------|---------|
| `set_searching_state` | Client Tool | Triggers the amber/searching UI state in the frontend |
| `firecrawl_search` | Server Tool | Calls `https://api.firecrawl.dev/v2/search` directly — live web + news results |

Full configuration details in [`implementation/PLAN.md`](implementation/PLAN.md).

---

## Deployment

Frontend deploys to Vercel:

```bash
cd frontend
vercel
```

Set `VITE_ELEVENLABS_AGENT_ID` in Vercel's environment variables dashboard.

---

## Built with

- [ElevenAgents](https://elevenlabs.io/docs/agents-platform/overview) — conversational voice agent platform
- [Firecrawl Search](https://docs.firecrawl.dev) — live web search API
- [@elevenlabs/react](https://www.npmjs.com/package/@elevenlabs/react) — React SDK for ElevenAgents
