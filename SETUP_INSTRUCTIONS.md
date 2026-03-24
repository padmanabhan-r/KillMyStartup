# Setup Instructions

This document covers the full setup from scratch — ElevenAgents configuration, Firecrawl wiring, and local development.

---

## Architecture

```
Browser (mic)
     ↓
ElevenAgents (STT → LLM)
     ↓  calls set_searching_state (Client Tool)
Frontend UI → amber searching state
     ↓  calls firecrawl_search (Server Tool / Webhook)
Firecrawl API (https://api.firecrawl.dev/v2/search)
     ↓  returns live web + news results
ElevenAgents LLM synthesises the roast
     ↓
ElevenAgents TTS speaks the roast
     ↓
Browser receives audio → red roasting state
```

**No backend.** ElevenAgents owns the full loop: STT → tool calls → synthesis → TTS. The frontend is a pure React app.

---

## Phase 1 — ElevenAgents Configuration

Everything in this phase is done in the [ElevenLabs console](https://elevenlabs.io/app/agents). No code.

### Step 1.1 — Create the Agent

1. Go to **elevenlabs.io/app/agents** → **Create Agent**
2. Name it (e.g. `KillMyStartup`)
3. **Voice:** pick something sharp and confident — `Charlie` or `Daniel` work well
4. **TTS Model:** `eleven_flash_v2_5`
5. **LLM:** `gpt-4o`, `claude-sonnet`, or `gemini-2.5-flash`
6. **Visibility:** Public — the frontend passes `agentId` directly, no signed URL needed in dev

### Step 1.2 — System Prompt

Paste the contents of [`prompts/AGENT_SYSTEM_PROMPT.md`](prompts/AGENT_SYSTEM_PROMPT.md) into the agent's system prompt field.

Key behaviours enforced by the prompt:
- Always calls `set_searching_state` silently before searching
- Always calls `firecrawl_search` immediately after
- Always calls `show_sources` with the results before speaking
- Delivers a brutal, evidence-backed roast in max 3 sentences
- No hedging, no encouragement, no filler

### Step 1.3 — Register Client Tool: `set_searching_state`

**Tools → Add Tool → Type: Client**

| Field | Value |
|-------|-------|
| Name | `set_searching_state` |
| Description | `Call this silently before firecrawl_search to signal the UI to show a searching state. No parameters.` |
| Wait for response | **ON** |
| Parameters | _(none)_ |

This is handled in the React frontend. When the agent calls it, the UI transitions to the amber searching state.

### Step 1.4 — Register Client Tool: `show_sources`

**Tools → Add Tool → Type: Client**

| Field | Value |
|-------|-------|
| Name | `show_sources` |
| Description | `Call this after firecrawl_search to send sources to the UI before delivering the roast.` |
| Wait for response | **ON** |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `idea` | string | The startup idea as a short phrase, e.g. "AI Podcast Summarizer" |
| `sources` | string | Pipe-and-double-semicolon formatted results: `"Title 1\|URL1\|Description 1;;Title 2\|URL2\|Description 2;;..."` |

This is also handled in the React frontend — it parses the sources string and appends a new turn to the right panel.

### Step 1.5 — Register Server Tool: `firecrawl_search`

**Tools → Add Tool → Type: Webhook**

| Field | Value |
|-------|-------|
| Name | `firecrawl_search` |
| URL | `https://api.firecrawl.dev/v2/search` |
| Method | `POST` |
| Wait for response | **ON** |

**Headers:**

| Name | Type | Value |
|------|------|-------|
| `Authorization` | Secret | `Bearer YOUR_FIRECRAWL_API_KEY` |
| `Content-Type` | Static | `application/json` |

**Body parameters:**

| Name | Type | Value type | Required | Description |
|------|------|------------|----------|-------------|
| `query` | string | LLM Prompt | Yes | A short, natural search query — e.g. `"{idea} startup competitors funded"` |
| `limit` | number | Static | No | `3` |
| `sources` | array | Static | No | `["web", "news"]` |
| `tbs` | string | Static | No | `qdr:y` |

> `limit`, `sources`, and `tbs` are static so the LLM only needs to construct the `query`. `tbs: qdr:y` filters web results to the past 12 months.

### Step 1.6 — Test in ElevenLabs Console

1. Open the agent's built-in test widget
2. Say: *"I have a startup idea — an AI app that summarizes podcasts"*
3. Expected sequence in the Conversations transcript:
   - `set_searching_state` called (no params)
   - `firecrawl_search` called with a targeted query
   - `show_sources` called with results
   - Agent speaks a brutal roast
4. If tools don't fire: check the system prompt tool-call sequence and tool descriptions

---

## Phase 2 — Local Development

### Prerequisites

- Node.js 18+
- ElevenLabs account with the agent configured above
- Firecrawl API key (used only inside ElevenLabs console as a secret — never in code)

### Step 2.1 — Clone and install

```bash
git clone https://github.com/padmanabhan-r/KillMyStartup.git
cd KillMyStartup
npm install
```

### Step 2.2 — Environment variables

Create `.env.local` at the project root:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id
```

Get the Agent ID from the ElevenLabs console — it's in the agent settings URL or the overview page.

> `ELEVENLABS_API_KEY` is used server-side only (Vercel Edge function / Vite middleware) to generate signed session URLs. It never touches the browser.

### Step 2.3 — Run locally

```bash
npm run dev
# http://localhost:5173
```

The Vite dev server includes a middleware that proxies signed URL requests to ElevenLabs so your API key stays server-side.

### Step 2.4 — Test end-to-end

1. Open `http://localhost:5173`
2. Click **Kill My Startup** — allow mic access
3. Speak an idea
4. Expected flow:
   - Orb goes white (listening)
   - Orb goes amber (searching) — Firecrawl is live
   - Sources appear in the right panel
   - Orb goes red (roasting) — agent speaks
5. After **I Quit** — right panel closes, Download Autopsy Report button appears

---

## Project Structure

```
KillMyStartup/
├── src/
│   ├── App.tsx                      # Root component
│   ├── types.ts                     # AppState, Turn, Source types
│   ├── components/
│   │   ├── Orb.tsx                  # 4-state animated orb
│   │   ├── SourcesPanel.tsx         # Right panel — sources per turn, collapsible
│   │   └── PoweredBy.tsx
│   └── hooks/
│       └── useAppConversation.ts    # ElevenLabs SDK wrapper + state machine
├── api/
│   └── signed-url.ts               # Vercel Edge function — signs ElevenLabs session URLs
├── public/
│   └── favicon.svg
├── prompts/
│   └── AGENT_SYSTEM_PROMPT.md      # Paste this into the ElevenLabs agent console
└── notes/
    └── PLAN.md                     # Original implementation plan
```

---

## UI State Machine

| State | Orb | Trigger |
|-------|-----|---------|
| `idle` | Dark, still | Session not started / ended |
| `listening` | White, slow pulse | Connected — mic open |
| `searching` | Amber, rotating ring | `set_searching_state` client tool fires |
| `roasting` | Red, fast pulse | Agent speaking |

