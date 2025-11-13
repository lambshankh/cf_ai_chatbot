export async function handleChat(req: Request, env: Env) {
  const body = await req.json();
  const userMessage = body?.message?.trim();

  if (!userMessage) {
    return new Response(
      JSON.stringify({ error: "Missing message" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const result = await env.AI.run("@cf/meta/llama-3.3-8b-instruct", {
    messages: [
      { role: "system", content: "You are a concise, helpful assistant." },
      { role: "user", content: userMessage },
    ],
  });

  return new Response(
    JSON.stringify({ reply: result.output_text }),
    { headers: { "content-type": "application/json" } }
  );
}
