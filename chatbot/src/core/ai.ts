import { getMemory } from "./memory";

export async function handleChat(req: Request, env: Env, sessionId: string) {
  const body = await req.json() as { message?: string };
  const userMessage = body.message?.trim();

  if (!userMessage) {
    return new Response(JSON.stringify({ error: "Missing message" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  // Durable Object session
  const id = env.SESSIONS.idFromName(sessionId);
  const stub = env.SESSIONS.get(id);

  // Load summary + history
  const sessionDataResp = await stub.fetch("http://session/get");
  const { summary, history } = await sessionDataResp.json() as {
    summary: string;
    history: Array<{ role: string; content: string }>;
  };

  // Load long-term KV memory
  const longTerm = await getMemory(env);

  const memoryBlock =
    longTerm.length > 0
      ? [{
          role: "system",
          content:
            "Persistent user memory:\n" +
            longTerm.map(m => `- ${m.key}: ${m.value}`).join("\n")
        }]
      : [];

  const contextMsgs: Array<{ role: string; content: string }> = [];

  // 1. LTM
  contextMsgs.push(...memoryBlock);

  // 2. Session summary
  if (summary && summary.length > 0) {
    contextMsgs.push({
      role: "system",
      content: "Conversation summary:\n" + summary
    });
  }

  // 3. Last window history
  for (const entry of history) {
    contextMsgs.push({ role: entry.role, content: entry.content });
  }

  // 4. New user message
  contextMsgs.push({ role: "user", content: userMessage });

  // LLM call
  const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    messages: contextMsgs
  });

  const reply = result.response ?? "";

  // --------------------------
  // Store user + assistant turns
  // --------------------------

  const addUserResp = await stub.fetch("http://session/add", {
    method: "POST",
    body: JSON.stringify({
      entry: { role: "user", content: userMessage }
    })
  });

  const addBotResp = await stub.fetch("http://session/add", {
    method: "POST",
    body: JSON.stringify({
      entry: { role: "assistant", content: reply }
    })
  });

  // --------------------------
  // Check for summarisation trigger
  // --------------------------

  const needSummary =
    (await addUserResp.text()) === "NEED_SUMMARY" ||
    (await addBotResp.text()) === "NEED_SUMMARY";

  if (needSummary) {
    await summariseSession(env, stub);
  }

  // Return reply
  return new Response(JSON.stringify({ reply }), {
    headers: { "content-type": "application/json" }
  });
}

// ----------------------
// Summarisation helper
// ----------------------

async function summariseSession(env: Env, stub: DurableObjectStub) {
  const sessionData = await stub.fetch("http://session/get");
  const { summary, history } =
    await sessionData.json() as {
      summary: string;
      history: Array<{ role: string; content: string }>
    };

  const prompt = `
Summarise the following conversation into a concise long-term memory.
Preserve only:
- user facts
- preferences
- goals/tasks
- ongoing context
- anything important long-term

Previous summary:
${summary}

New messages:
${history.map(h => `${h.role}: ${h.content}`).join("\n")}
`;

  const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    messages: [
      { role: "system", content: "Summarise into compact memory. Output plain text only." },
      { role: "user", content: prompt }
    ]
  });

  const newSummary = result.response ?? summary;

  await stub.fetch("http://session/save-summary", {
    method: "POST",
    body: JSON.stringify({ summary: newSummary })
  });
}
