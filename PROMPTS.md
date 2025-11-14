# PROMPTS.md

## Purpose

This document summarises all AI-assisted coding prompts used during development of the `cf_ai_chatbot` project.
Prompts are grouped by theme and include only **substantive technical instructions** that contributed directly to the implementation, architecture, or debugging of the system.

---

## 1. Project Planning & Architecture

AI assistance was used for initial high-level design and for selecting the appropriate Cloudflare components:

* “Help me design a Workers-based AI chat application using KV, Durable Objects, and Workers AI.”
* “Outline how to structure long-term memory, short-term history, and user-editable facts.”
* “Describe how to organise the project into Worker backend and React frontend.”
* “Advise on setting up a clean TypeScript Cloudflare Worker project.”

These prompts informed the project architecture but did not generate production code.

---

## 2. Backend Code Generation (Workers, DO, KV, AI)

AI was used to generate or scaffold core modules, which were then manually revised and extended:

* “Generate an `ai.ts` helper to call Workers AI (Llama 3) using messages.”
* “Create a Durable Object (`SessionDO`) that stores chat history and long-term memory.”
* “Build the Worker router (`router.ts`) with endpoints for `/api/chat` and KV-based user facts.”
* “Show an example of how to integrate KV namespaces and Durable Objects in `index.ts`.”
* “Implement logic for sliding-window history and triggering a memory update.”
* “Provide a summarisation helper that updates long-term memory as JSON.”

These served as starting points. Significant logic (summarisation behavior, storage model, sliding window size, response handling) was added or rewritten manually.

---

## 3. Frontend Code Generation (React + Vite)

AI support was used for scaffolding UI components and wiring them to backend endpoints:

* “Generate a minimal React chat UI with scrollable message history.”
* “Create a ChatBubble component with simple left/right alignment.”
* “Build a Memory Panel UI to view, add, and delete KV-stored facts.”
* “Help configure Vite to proxy `/api/*` requests to the Worker.”
* “Provide a dark-themed layout with clean styling.”

Frontend state management, API integration, dynamic resizing, and styling refinements were implemented manually.

---

## 4. Debugging Assistance (Workers, KV, DO, Pages)

AI was used to diagnose issues encountered during deployment and local development:

* “Explain the error: KV namespace not found / invalid binding.”
* “Fix Durable Object binding issues in wrangler config.”
* “Resolve CORS blocking when calling Workers from the Pages frontend.”
* “Interpret Wrangler tail logs and runtime errors (1101, undefined env bindings).”
* “Identify why JSON responses returned `Unexpected token <`.”
* “Fix incorrect production API URLs between Vite dev and Pages deployment.”

Bug fixes and configuration changes were applied manually using these explanations.

---

## 5. Refinement & Finalisation

AI assistance was used for final code review tasks:

* “Help confirm that the session memory update flow is correct.”
* “Clean up the Worker routing structure.”
* “Simplify the React component layout and ensure consistent API calls.”
* “Review the durability model: history window, summarisation threshold, and state reset.”

All final logic, memory behaviour, and architectural decisions were implemented by hand after review.

---

## 6. Summary

AI assistance contributed to:

* architectural guidance
* scaffolding initial Worker/DO/KV files
* generating early UI components
* diagnosing configuration and deployment issues

All mission-critical logic — memory design, summarisation rules, routing behaviour, Durable Object state management, prompt structure, CORS policy, frontend API integration, and deployment configuration — was manually constructed, verified, and refined.

This project is original and not derived from any existing Cloudflare submission.
All prompts above reflect the complete set of AI-assisted interactions relevant to the codebase.
