import { embedText } from "./embed";
import { findClosest, getCacheHit, storeCacheHit } from "./cache";

export async function handleChat(req: Request, env: Env) {
  const body = await req.json() as { message?: string };
  const userMessage = body.message?.trim();

  if (!userMessage) {
    return new Response(JSON.stringify({ error: "Missing message" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  // Step 1: embed the question
  const v = await embedText(env, userMessage);

  // Step 2: check semantic cache
  const cacheKey = await findClosest(env, v, 0.9);
  if (cacheKey) {
    const cached = await getCacheHit(env, cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ reply: cached.answer, from_cache: true }),
        { headers: { "content-type": "application/json" } }
      );
    }
  }

  // Step 3: LLM call
    const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    messages: [
      { role: "system", content: "You are a concise, helpful assistant." },
      { role: "user", content: userMessage }
    ]
  });

  const reply = result.response ?? "";
  console.log("LLM raw result:", result);


  // Step 4: store in cache
  const key = crypto.randomUUID();
  await storeCacheHit(env, key, {
    input: userMessage,
    embedding: v,
    answer: reply
  });

  return new Response(JSON.stringify({ reply }), {
    headers: { "content-type": "application/json" }
  });
}
