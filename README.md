![KillMyStartup](images/Home%20Page.png)

# KillMyStartup

> Your idea isn't special. It's probably already dead. Let's confirm that together.

Most startup ideas fail for reasons that already exist on the internet — a competitor that launched two years ago, a Y Combinator postmortem, a TechCrunch article about the exact same pivot. You just haven't looked.

**KillMyStartup** is an antagonistic voice AI that plays devil's advocate — and does the looking for you.

Pitch your idea out loud. As you speak, it searches the live web in real-time, surfacing competitors, failed clones, and market realities — citing its sources as it goes. Then it delivers the verdict. Brutally. In seconds.

Recognising a dead end early saves you time, money, and the slow-motion failure you'd have arrived at anyway.

🔗 **[killmystartup.today](https://killmystartup.today)**

---

## Demo

Hit **Kill My Startup**. Allow mic. Pitch your idea.

The orb tells you where you are:

- **White** — it's listening
- **Amber** — it's searching the live web right now
- **Red** — verdict incoming

Sources appear in the right panel as they're found. After the session, download the full **Autopsy Report** as a PDF.

---

## Built with

| | |
|---|---|
| **[ElevenAgents](https://elevenlabs.io/docs/agents-platform/overview)** | Handles everything voice — speech-to-text, LLM, text-to-speech, and tool orchestration. No separate backend. |
| **[Firecrawl Search](https://docs.firecrawl.dev/features/search)** | Registered as a Server Tool directly inside ElevenAgents. The agent calls it live during every conversation — real results, not cached. |
| **Vite + React + TypeScript** | Frontend, deployed to Vercel. |

---

## Setup

→ **[Full setup instructions](SETUP_INSTRUCTIONS.md)** — ElevenAgents config, Firecrawl wiring, local dev, and Vercel deployment.

---

## Built for ElevenHacks
