import { embedText } from "./embed";

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

  // Load conversation history
  const historyResp = await stub.fetch("http://session/get");
  const history =
    await historyResp.json() as Array<{ role: string; content: string }>;

  // Build context window
  const contextMsgs = history.map(h => ({
    role: h.role,
    content: h.content
  }));
  contextMsgs.push({ role: "user", content: userMessage });

  // LLM call with full context
  const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    messages: contextMsgs
  });

  const reply = result.response ?? "";

  // Store both user and assistant messages in the session history
  await stub.fetch("http://session/add", {
    method: "POST",
    body: JSON.stringify({
      entry: { role: "user", content: userMessage }
    })
  });

  await stub.fetch("http://session/add", {
    method: "POST",
    body: JSON.stringify({
      entry: { role: "assistant", content: reply }
    })
  });

  return new Response(JSON.stringify({ reply }), {
    headers: { "content-type": "application/json" }
  });
}
