import { handleChat } from "./ai";
import { serveStatic } from "./static";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const router = {
  async handle(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);

    // ------------------------------------------
    // CORS preflight
    // ------------------------------------------
    if (req.method === "OPTIONS") {
      return new Response("OK", { headers: corsHeaders });
    }

    // ------------------------------------------
    // User-controlled FACTS (KV)
    // ------------------------------------------
    if (url.pathname === "/api/facts" && req.method === "GET") {
      const list = await env.MEMORY.list();
      const items = await Promise.all(
        list.keys.map(async (k) => ({
          key: k.name,
          value: await env.MEMORY.get(k.name)
        }))
      );
      return new Response(JSON.stringify(items), {
        headers: { "content-type": "application/json", ...corsHeaders }
      });
    }

    if (url.pathname === "/api/facts/add" && req.method === "POST") {
      const body: { key?: string; value?: string } = await req.json();
      if (!body.key || !body.value)
        return new Response("Missing", {
          status: 400,
          headers: corsHeaders
        });

      await env.MEMORY.put(body.key, body.value);
      return new Response("OK", { headers: corsHeaders });
    }

    if (url.pathname === "/api/facts/delete" && req.method === "POST") {
      const body: { key?: string; value?: string } = await req.json();
      if (!body.key)
        return new Response("Missing key", {
          status: 400,
          headers: corsHeaders
        });

      await env.MEMORY.delete(body.key);
      return new Response("OK", { headers: corsHeaders });
    }

    // ------------------------------------------
    // CHAT endpoint
    // ------------------------------------------
    if (url.pathname === "/api/chat" && req.method === "POST") {
      console.log("HIT /api/chat");

      const sessionId = url.searchParams.get("session") || "default";
      const resp = await handleChat(req, env, sessionId);

      // add CORS headers to chat response
      const newResp = new Response(resp.body, resp);
      Object.entries(corsHeaders).forEach(([k, v]) =>
        newResp.headers.set(k, v)
      );

      return newResp;
    }

    // ------------------------------------------
    // STATIC fallback
    // ------------------------------------------
    const staticResp = await serveStatic(req);
    // add CORS because browser might fetch assets
    const newStatic = new Response(staticResp.body, staticResp);
    Object.entries(corsHeaders).forEach(([k, v]) =>
      newStatic.headers.set(k, v)
    );
    return newStatic;
  }
};

export default router;
