![KillMyStartup](images/Home%20Page.png)

# KillMyStartup

> Your idea isn't special. It's probably already dead. Let's confirm that together.

**KillMyStartup** is an antagonistic voice AI that plays devil's advocate — brutally, and with receipts.

Speak your startup idea. It searches the live web for every competitor you missed, every similar product that already failed, and every reason your market is a graveyard. Then it tells you — out loud, without flinching.

Recognising a dead end saves you time, money, and the inevitable failure you'd have gotten to anyway. Think of it as the co-founder who actually tells you the truth.

Built for [ElevenHacks](https://elevenlabs.io) using **[ElevenAgents](https://elevenlabs.io/docs/agents-platform/overview)** + **[Firecrawl Search](https://docs.firecrawl.dev)**.

🔗 **[killmystartup.today](https://killmystartup.today)**

---

## How it works

1. Hit **Kill My Startup** — grant mic access
2. Describe your idea out loud
3. [ElevenAgents](https://elevenlabs.io/docs/agents-platform/overview) picks it up via STT and instantly calls [Firecrawl Search](https://docs.firecrawl.dev) — live web + news results, no caching
4. The LLM synthesises a data-backed roast from real search results — named competitors, real failures, market realities
5. ElevenAgents speaks the verdict back in a sharp, surgical voice
6. An autopsy report of every source surfaces in the right panel — downloadable as a PDF

No backend. ElevenAgents owns the full loop: **STT → tool calls → LLM synthesis → TTS**. The frontend is a pure React app.

---

## UI States

The orb visualises exactly what's happening:

| State | Orb | Trigger |
|-------|-----|---------|
| Idle | Dark, still | Session not started |
| Listening | White, slow pulse | Connected — waiting for your pitch |
| Searching | Amber, rotating ring | Firecrawl searching the web live |
| Roasting | Red, fast pulse | Agent speaking the verdict |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Voice agent | [ElevenAgents](https://elevenlabs.io/docs/agents-platform/overview) — STT + LLM + TTS + tool orchestration |
| Live web search | [Firecrawl Search API](https://docs.firecrawl.dev) — Server Tool inside ElevenAgents |
| Frontend | Vite + React + TypeScript |
| Deployment | Vercel |

---

## ElevenAgents Configuration

The agent is configured entirely in the ElevenLabs console — no backend code required.

**Two tools registered on the agent:**

| Tool | Type | Purpose |
|------|------|---------|
| `set_searching_state` | Client Tool | Signals the frontend to transition to the amber searching state |
| `firecrawl_search` | Server Tool (Webhook) | Calls `https://api.firecrawl.dev/v2/search` directly — returns live web + news results |

### `firecrawl_search` — Server Tool

| Field | Value |
|-------|-------|
| URL | `https://api.firecrawl.dev/v2/search` |
| Method | `POST` |
| Auth header | `Authorization: Bearer <your_firecrawl_key>` (console secret) |
| `query` | LLM Prompt — the agent constructs a targeted search query |
| `limit` | Static: `5` |
| `sources` | Static: `["web", "news"]` |
| Wait for response | ON |

### `set_searching_state` — Client Tool

No parameters. When the agent calls this, the frontend transitions to the amber searching state. Handled in `useAppConversation.ts`.

---

## Local Development

### Prerequisites

- Node.js 18+
- ElevenLabs account with the agent configured as above
- Firecrawl API key (added as a secret in the ElevenLabs console)

### Setup

```bash
npm install
```

Create `.env.local` at the project root:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id
```

### Run

```bash
npm run dev
# http://localhost:5173
```

The Vite dev server includes a middleware that proxies signed URL requests to ElevenLabs so your API key never touches the browser.

### Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

---

## Deployment (Vercel)

**Build settings** (auto-detected):
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `/`

**Environment variables** (Settings → Environment Variables):
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`

The `api/signed-url.ts` Edge function is picked up automatically from the `api/` folder.

---

## Project Structure

```
KillMyStartup/
├── src/
│   ├── App.tsx                        # Root component — wires hook to UI
│   ├── types.ts                       # AppState, Turn, Source types
│   ├── components/
│   │   ├── Orb.tsx                    # 4-state animated orb
│   │   ├── SourcesPanel.tsx           # Right panel — sources per turn, collapsible
│   │   └── PoweredBy.tsx              # Footer attribution
│   └── hooks/
│       └── useAppConversation.ts      # ElevenLabs SDK wrapper + state machine
├── api/
│   └── signed-url.ts                  # Vercel Edge function — signs ElevenLabs session URLs
├── public/
│   └── favicon.svg                    # Orb favicon
├── images/
│   └── Home Page.png
├── prompts/
│   └── AGENT_SYSTEM_PROMPT.md         # Agent system prompt (paste into ElevenLabs console)
└── notes/
    └── PLAN.md                        # Full implementation plan
```

---

## Built with

- [ElevenAgents](https://elevenlabs.io/docs/agents-platform/overview) — conversational voice agent platform
- [Firecrawl Search](https://docs.firecrawl.dev) — live web search API
- [@elevenlabs/react](https://www.npmjs.com/package/@elevenlabs/react) — React SDK for ElevenAgents
- [jsPDF](https://github.com/parallax/jsPDF) — PDF generation for the autopsy report
