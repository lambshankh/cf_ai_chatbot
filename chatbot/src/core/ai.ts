// ------------------------------------------------------
// Handle chat
// ------------------------------------------------------
export async function handleChat(req: Request, env: Env, sessionId: string) {
  const body = await req.json() as { message?: string };
  const userMessage = body.message?.trim();

  if (!userMessage) {
    return new Response(JSON.stringify({ error: "Missing message" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const id = env.SESSIONS.idFromName(sessionId);
  const stub = env.SESSIONS.get(id);

  // Load memory + history
  const sessionDataResp = await stub.fetch("http://session/get");
  const { memory, history } =
    await sessionDataResp.json() as {
      memory: Record<string, any>;
      history: Array<{ role: string; content: string }>;
    };

  // Build LLM prompt
  const contextMsgs: Array<{ role: string; content: string }> = [];

  // SYSTEM PROMPT
  contextMsgs.push({
    role: "system",
    content:
      "You are a natural, human-sounding assistant. " +
      "You remember stable facts the user tells you in this session. " +
      "These facts are provided below. " +
      "You never mention the word 'memory' to the user."
  });

  // User controlled memory
  const kvList = await env.MEMORY.list();
  const userFacts = await Promise.all(
    kvList.keys.map(async (k) => ({
      key: k.name,
      value: await env.MEMORY.get(k.name)
    }))
  );

  contextMsgs.push({
    role: "assistant",
    content:
      "USER_FACTS:\n" +
      (userFacts.length
        ? userFacts.map(f => `- ${f.key}: ${f.value}`).join("\n")
        : "None")
  });

  // Model-learned memory
  contextMsgs.push({
    role: "assistant",
    content: `MEMORY:\n${JSON.stringify(memory)}`
  });

  // Add conversation history
  for (const entry of history) {
    contextMsgs.push({ role: entry.role, content: entry.content });
  }

  // Add new user message
  contextMsgs.push({ role: "user", content: userMessage });

  // LLM call
  const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    messages: contextMsgs
  });

  const reply = result.response ?? "";

  // Store the turns
  const addUserResp = await stub.fetch("http://session/add", {
    method: "POST",
    body: JSON.stringify({ entry: { role: "user", content: userMessage } })
  });

  const addBotResp = await stub.fetch("http://session/add", {
    method: "POST",
    body: JSON.stringify({ entry: { role: "assistant", content: reply } })
  });

  // Memory update trigger
  const needUpdate =
    (await addUserResp.text()) === "NEED_MEMORY_UPDATE" ||
    (await addBotResp.text()) === "NEED_MEMORY_UPDATE";

  if (needUpdate) {
    await updateMemory(env, stub);
  }

  return new Response(JSON.stringify({ reply }), {
    headers: { "content-type": "application/json" }
  });
}

async function updateMemory(env: Env, stub: DurableObjectStub) {
  const sessionData = await stub.fetch("http://session/get");
  const { memory, history } =
    await sessionData.json() as {
      memory: Record<string, any>;
      history: Array<{ role: string; content: string }>;
    };

  // Only use the last 4 messages for memory updates
  const recent = history.slice(-4);

  const prompt = `
Update the JSON MEMORY using only long-term, user-stated facts.

STRICT RULES:
- Only save information the user clearly states about themselves that would matter long term.
- Ignore code, debugging, meta-discussion, instructions, prompts, or anything about the assistant.
- Ignore temporary info, opinions, jokes, one-off comments.
- Ignore anything not explicitly about the user.
- Do NOT save low-value details like mood or temporary plans.
- If the user contradicts an existing fact, keep the newest explicit statement.
- If no stable facts were stated, return the JSON unchanged.
- Output ONLY valid JSON. No comments.

Current memory:
${JSON.stringify(memory, null, 2)}

Recent messages:
${recent.map(m => `${m.role}: ${m.content}`).join("\n")}
`;

  const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    messages: [
      {
        role: "system",
        content: "Update the MEMORY JSON. Output JSON only."
      },
      { role: "user", content: prompt }
    ]
  });

  let newMemory: Record<string, any>;
  try {
    const raw = result.response ?? "";
    newMemory = JSON.parse(raw);
  } catch {
    newMemory = memory;
  }

  await stub.fetch("http://session/save-memory", {
    method: "POST",
    body: JSON.stringify({ memory: newMemory })
  });
}
