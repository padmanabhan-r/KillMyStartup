![KillMyStartup](images/Cover%20Page.jpg)

# KillMyStartup

> Your idea isn't special. It's probably already dead. Let's confirm that together.

Most founders skip market research — not because they're lazy, but because it's painful to find out your idea already exists, already failed, or already has a $500M competitor. So they pitch blind and find out the hard way.

**KillMyStartup** is a voice-native antagonistic AI that plays devil's advocate against your startup idea before investors do. As you pitch, it pulls live data on real competitors, recent funding rounds, and startups that died doing exactly what you're describing — and throws it back at you in real time. The research you were avoiding shows up anyway.

Not another agent with search bolted on. The one use case where live search actually changes the outcome — because an objection without evidence is just an opinion, and founders are very good at ignoring opinions.

No complex UI. No over-engineering. No fluff. Just you, your idea, and the truth.

Recognising a dead end early saves you time, money, and the slow-motion failure you'd have arrived at anyway.

The UI is deliberately minimal and dark — no friendly colours, no encouragement, no softening. The experience is designed to feel unsettling, because this is not a tool that's rooting for you.

The domain, **killmystartup.today**, is intentional too — a direct imperative. Not "should you?" or "maybe consider it." Kill your startup. Today.
🔗 **[killmystartup.today](https://killmystartup.today)**

---

## Demo

Hit **Kill My Startup**. Allow mic. Pitch your idea.

The orb tells you where you are:

- **White** — it's listening
- **Amber** — it's searching the live web right now
- **Red** — verdict incoming

Sources appear in the right panel as they're found. After the session, download the full **Autopsy Report** as a PDF.

### Screenshots

**Home**

<p align="center"><img src="images/Home%20Page.png" width="600" /></p>

**Listening / Searching**

<img src="images/White%20Orb.png" width="49%" /> <img src="images/Yellow%20Orb.png" width="49%" />

**Verdict**

<img src="images/Red%20Orb%201.png" width="49%" /> <img src="images/Red%20Orb%202.png" width="49%" />

**Autopsy Report**

<p align="center"><img src="images/Autopsy%20Report.png" width="400" /></p>

---

## How the search works

Firecrawl Search is the backbone of the system — wired directly into ElevenAgents as a webhook, called live on every conversation.

The search is deliberately constrained:

- **3 web + 3 news results** — enough evidence to land a devastating verdict, not enough to overwhelm a conversational agent with context
- **Past 12 months, sorted newest first** — stale data gives founders an out; fresh data doesn't. Results are sorted by date so the most recent evidence surfaces first
- **Three attack vectors** — every query targets one of: existing competitors, funding scale, or startups that already died doing this

This isn't search bolted on. The tight context window is the design — a conversational agent performs best when given the right amount of information, not the most information.

---

## Built with

| | |
|---|---|
| **[ElevenAgents](https://elevenlabs.io/docs/agents-platform/overview)** | Handles everything voice — speech-to-text, LLM, text-to-speech, and tool orchestration. No separate backend. |
| **[Firecrawl Search](https://docs.firecrawl.dev/features/search)** | Wired into ElevenAgents as a webhook. Called live during every conversation — real results, not cached. Returns web + news results in a single call. |
| **Vite + React + TypeScript** | Frontend, deployed to Vercel. |

---

## Setup

→ **[Full setup instructions](SETUP_INSTRUCTIONS.md)** — ElevenAgents config, Firecrawl wiring, and local dev.
