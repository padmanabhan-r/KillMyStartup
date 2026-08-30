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

> `limit`, `sources`, and `tbs` are static so the LLM only needs to construct the `query`. `tbs: qdr:y` filters web results to the past 12 months, ranked by relevance.

### Step 1.6 — Test in ElevenLabs Console

1. Open the agent's built-in test widget
2. Say: *"I have a startup idea — an AI app that summarizes podcasts"*
3. Expected sequence in the Conversations transcript:
   - `set_searching_state` called (no params)
   - `firecrawl_search` called with a targeted query
   - `show_sources` called with results
   - Agent speaks a brutal roast
4. If tools don't fire: check the system prompt tool-call sequence and tool descriptions

### Step 1.7 — Session length cap

The agent cuts a conversation off at `max_duration_seconds` (ElevenLabs default:
600s / 10 min). Set it from the console under **Advanced → Max conversation
duration**, or from the repo once `.env.local` exists:

```bash
./scripts/set-session-cap.sh 60   # minutes; allowed range is 1–120
```

The script reads the value back after writing it, so a silently rejected change
fails instead of looking like it worked.

> Raising the cap raises the ceiling on credit burn with it — ElevenLabs bills
> per minute, and an abandoned session with the mic still open runs until the cap.
> `conversation_config.turn.turn_timeout` only decides how long the agent waits
> before prompting again; it re-prompts rather than hanging up.

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

> Accounts and usage limits add more variables — see Phase 3. They are optional;
> without them the app runs with no sign-in and no limits.

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

### Step 2.5 — Android (Capacitor) prerequisite

The Autopsy Report and Transcript are written to the device with the Capacitor **Filesystem**
plugin. Install it in the Capacitor project that wraps this app:

```bash
npm install @capacitor/filesystem && npx cap sync android
```

Without it the app reports "Couldn't save the report on this device" rather than
falling back to `jsPDF.save()` — that fallback is what produced a share sheet
instead of a saved file, so it is deliberately not used on native.

---

## Phase 3 — Accounts and Usage Limits

Optional. With no Firebase env vars set the app runs exactly as it did before:
no sign-in button, no limits, nothing to configure.

### Step 3.1 — Firebase project

1. Create a Firebase project and enable **Authentication → Sign-in method → Google**
2. Add your domains under **Authentication → Settings → Authorised domains**
   (`killmystartup.today` and `localhost`)
3. Create a **Firestore** database
4. Copy the web app config from **Project settings → General → Your apps**

### Step 3.2 — Environment variables

Client (must be `VITE_`-prefixed to reach the browser; these are public by
design and identify the project, they do not authorise anything):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=...
```

Server, used by `api/signed-url.ts` to verify ID tokens:

```env
FIREBASE_PROJECT_ID=your-project
```

### Step 3.3 — Firestore security rules

Usage counters are written by the client, so these rules are the only thing
stopping one account writing another's:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usage/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

> These let a signed-in user write their **own** counter, which means a
> determined user can reset their own minutes. That is inherent to metering
> client-reported duration and is a deliberate trade. Closing it properly means
> an ElevenLabs post-call webhook writing the counter server-side.

### Step 3.4 — Limits

Both live in `src/lib/quota.ts`:

| Constant | Default | Applies to |
| --- | --- | --- |
| `FREE_ANON_SESSIONS` | 2 | Sessions before sign-in is required |
| `MINUTE_CAP` | 60 | Lifetime minutes per signed-in account |

The anonymous allowance is a per-device `localStorage` counter — clearing site
data resets it. It exists to delay the consent screen for a first-time visitor,
not to stop anyone determined. Only the signed-in cap is enforced server-side.

### Step 3.5 — Android

**Google sign-in does not work in the Android build as written.** Firebase's
`signInWithPopup` needs a browser popup, which a Capacitor WebView does not
provide; the native app needs a Capacitor Google Auth plugin and your release
SHA-1 registered in the Firebase console. Until that is wired, the Android app
behaves as it does today: no sign-in, no limits.

---

## Project Structure

```
KillMyStartup/
├── src/
│   ├── App.tsx                      # Root component
│   ├── types.ts                     # AppState, Turn, Source types + parseSources
│   ├── index.css                    # Global styles
│   ├── main.tsx                     # Entry point
│   ├── assets/                      # Static assets
│   ├── components/
│   │   ├── Orb.tsx                  # 4-state animated orb
│   │   ├── SearchingStatus.tsx      # Rotating status lines shown while searching
│   │   ├── SourcesPanel.tsx         # Right panel — sources per turn, collapsible
│   │   └── PoweredBy.tsx
│   ├── hooks/
│   │   ├── useAppConversation.ts    # ElevenLabs SDK wrapper + state machine
│   │   └── useAuth.ts               # Firebase Google sign-in state
│   └── lib/
│       ├── utils.ts                 # Utility functions
│       ├── firebase.ts              # Firebase app + auth, absent config tolerated
│       ├── quota.ts                 # Allowance rules (no Firebase, no DOM)
│       ├── usage.ts                 # Usage counter over the Firestore REST API
│       ├── report.ts                # Autopsy Report + Transcript PDF generation
│       └── savePdf.ts               # Writes a PDF to disk (native vs browser)
├── api/
│   ├── signed-url.ts               # Vercel Edge function — signs ElevenLabs session URLs
│   └── _auth.ts                    # Firebase ID token verification (JWKS, Edge-safe)
├── scripts/
│   └── set-session-cap.sh          # Sets the agent's max conversation duration
├── public/
│   └── favicon.svg
└── prompts/
    └── AGENT_SYSTEM_PROMPT.md      # Paste this into the ElevenLabs agent console
```

---

## UI State Machine

| State | Orb | Trigger |
|-------|-----|---------|
| `idle` | Dark, still | Session not started / ended |
| `listening` | White, slow pulse | Connected — mic open |
| `searching` | Amber, rotating ring | `set_searching_state` client tool fires |
| `roasting` | Red, fast pulse | Agent speaking |

