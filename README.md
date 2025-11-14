# CF AI Chatbot

An AI chat application built entirely on Cloudflare’s edge.
It uses Workers, Durable Objects, KV, and Workers AI to provide stateful chat with persistent memory and a Pages-hosted React UI.

## Live Demo

**[https://f61b4948.cf-ai-ui.pages.dev/](https://f61b4948.cf-ai-ui.pages.dev/)**

---

## Cloudflare AI Assignment Coverage

This project satisfies all required components of the Cloudflare AI optional assignment:

* **LLM**
  Uses `@cf/meta/llama-3-8b-instruct` via Workers AI (`env.AI.run`).

* **Workflow / coordination**
  A **Durable Object** (`SessionDO`) stores session history and learned memory, and coordinates all updates.

* **User input**
  A **Pages-hosted React UI** provides the chat interface and interacts with the Worker through `/api/chat`.

* **Memory / state**

  * Long-term user facts stored in KV
  * Session history + summarised memory stored in the Durable Object
  * Automatic memory condensation when chat length grows too large

All prompts used during development are documented in **PROMPTS.md**.

---

## Purpose

Show how to build a stateful AI application at the edge using Cloudflare’s platform primitives — Workers for compute, Durable Objects for coordination, KV for persistence, and Pages for UI hosting.

---

## Architecture

```
User (Pages UI)
   ↓
React frontend → /api/chat (Worker)
                   │
                   ├── KV (user facts)
                   ├── Durable Object (session history + learned memory)
                   └── Workers AI (Llama 3.x)
```

### Why this architecture

* Workers are stateless, so the **Durable Object** anchors all session state.
* **KV** is used for user-editable memory because it’s cheap and global.
* A **sliding window + summarization** keeps prompts small and inference fast.
* **Workers AI** keeps the entire LLM pipeline inside Cloudflare’s network.
* Pages + Worker means one unified platform with no external services.

---

## Features

* Memory-aware LLM chat
* Durable Object session memory with automatic summarisation
* User-controlled long-term memory stored in KV
* React UI with toggleable Memory Panel
* Compatible with local dev (Vite proxy) and Pages deployment

---

## Project Structure

```
cf_ai_chatbot/
├── chatbot/
│   ├── src/core/ai.ts          # Prompt-building + AI orchestration
│   ├── src/core/router.ts      # API routing
│   ├── src/sessions.ts         # Durable Object logic
│   ├── src/static.ts           # Minimal static fallback
│   └── wrangler.jsonc
└── ui/
    ├── src/App.tsx
    ├── src/components/
    │   ├── MemoryPanel.tsx
    │   └── ChatBubble.tsx
    └── package.json
```

---

## Memory Model

Two sources of memory:

### User Facts (KV)

* Edited manually in the UI
* Persists globally across all sessions

### Learned Memory (Durable Object)

* Updated automatically by the LLM
* Extracted only from explicit long-term user statements
* Summarized periodically and stored as JSON
* History window resets after each summary

This keeps the model’s context small and avoids runaway prompt size.

---

## Development

Install dependencies:

```bash
cd chatbot && npm install
cd ../ui && npm install
```

Run Worker:

```bash
cd chatbot
npm run dev
```

Run UI:

```bash
cd ui
npm run dev
```

The UI automatically proxies `/api/*` to the local Worker.

---

## Deployment

1. Create KV namespaces and Durable Object using Wrangler (names defined in `wrangler.jsonc`).
2. Deploy Worker:

```bash
cd chatbot
npm run deploy
```

3. Deploy UI:

```bash
cd ui
npm run build
wrangler pages deploy dist
```

4. Ensure Pages routes `/api/*` to the Worker (Functions or custom domain routing).

---

## Limitations

This is a prototype built on Cloudflare’s free tier. The quota is generous, but it still shapes a few design decisions:

- Workers AI calls are kept short and efficient to avoid burning through inference credits.
- Only essential state is persisted; memory, facts, and history are intentionally minimal.
- No streaming, no large model variants, and no heavy embeddings pipeline to keep usage low.
- The Durable Object runs in a single region, which is fine for a prototype but not ideal for global latency.
- KV is used sparingly.

The app is engineered to stay well within free-tier constraints while still demonstrating proper use of Workers, Durable Objects, KV, and Workers AI.

---

