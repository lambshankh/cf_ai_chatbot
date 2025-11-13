import { getMemory } from "./memory";

// -------------------------------------------
// Handle chat
// -------------------------------------------
export async function handleChat(req: Request, env: Env, sessionId: string) {
  const body = await req.json() as { message?: string };
  const userMessage = body.message?.trim();

  if (!userMessage) {
    return new Response(JSON.stringify({ error: "Missing message" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  // Durable Object session instance
  const id = env.SESSIONS.idFromName(sessionId);
  const stub = env.SESSIONS.get(id);

  // Load memory + history
  const sessionDataResp = await stub.fetch("http://session/get");
  const { memory, history } =
    await sessionDataResp.json() as {
      memory: Record<string, any>;
      history: Array<{ role: string; content: string }>;
    };

  // Build prompt
  const contextMsgs: Array<{ role: string; content: string }> = [];

  // SYSTEM BEHAVIOUR
  contextMsgs.push({
    role: "system",
    content:
      "You are a direct assistant. No fluff. No invented facts.\n" +
      "You MUST treat the MEMORY block as ground truth.\n" +
      "If asked about stored facts, answer strictly from MEMORY.\n" +
      "For all other questions, use full conversation context."
  });

  // Inject stored JSON memory
  contextMsgs.push({
    role: "assistant",
    content: `MEMORY:\n${JSON.stringify(memory)}`
  });

  // Insert conversation history
  for (const entry of history) {
    contextMsgs.push({ role: entry.role, content: entry.content });
  }

  // Insert new user message
  contextMsgs.push({ role: "user", content: userMessage });

  // Debug
  console.log(">>> PROMPT START >>>");
  contextMsgs.forEach((m, i) =>
    console.log(`[${i}] ${m.role.toUpperCase()}: ${m.content}`)
  );
  console.log("<<< PROMPT END <<<");

  // LLM call
  const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    messages: contextMsgs
  });

  const reply = result.response ?? "";

  // Save new turns to history
  const addUserResp = await stub.fetch("http://session/add", {
    method: "POST",
    body: JSON.stringify({ entry: { role: "user", content: userMessage } })
  });

  const addBotResp = await stub.fetch("http://session/add", {
    method: "POST",
    body: JSON.stringify({ entry: { role: "assistant", content: reply } })
  });

  // Decide whether to update memory
  const needUpdate =
    (await addUserResp.text()) === "NEED_SUMMARY" ||
    (await addBotResp.text()) === "NEED_SUMMARY";

  if (needUpdate) {
    await updateMemory(env, stub);
  }

  return new Response(JSON.stringify({ reply }), {
    headers: { "content-type": "application/json" }
  });
}


// -------------------------------------------
// MEMORY UPDATE (JSON PATCH)
// -------------------------------------------
async function updateMemory(env: Env, stub: DurableObjectStub) {
  const sessionData = await stub.fetch("http://session/get");
  const { memory, history } =
    await sessionData.json() as {
      memory: Record<string, any>;
      history: Array<{ role: string; content: string }>;
    };

  const prompt = `
You update a memory JSON object for the user.

RULES:
- Modify a field ONLY if the user explicitly states a new fact.
- Do NOT remove fields unless the user directly contradicts them.
- User questions, confusion, or uncertainty DO NOT change memory.
- Add new fields ONLY for clear factual statements.
- Output MUST be valid JSON only. No explanation.

Current memory:
${JSON.stringify(memory, null, 2)}

Recent messages:
${history.map(h => `${h.role}: ${h.content}`).join("\n")}
`;

  const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    messages: [
      {
        role: "system",
        content: "You update memory. Output only valid JSON."
      },
      { role: "user", content: prompt }
    ]
  });

  let newMemory: Record<string, any>;
  try {
    newMemory = JSON.parse(result.response);
  } catch {
    // Safety fallback
    newMemory = memory;
  }

  // Save new JSON memory to DO
  await stub.fetch("http://session/save-memory", {
    method: "POST",
    body: JSON.stringify({ memory: newMemory })
  });
}
