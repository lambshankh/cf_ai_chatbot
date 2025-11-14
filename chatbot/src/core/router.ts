import { handleChat } from "./ai";
import { serveStatic } from "./static";

const router = {
  async handle(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);
    
    // ------------------------------------------------------
    // User-controlled FACTS (KV)
    // ------------------------------------------------------
    if (url.pathname === "/api/facts" && req.method === "GET") {
      const list = await env.MEMORY.list();
      const items = await Promise.all(
        list.keys.map(async (k) => ({
          key: k.name,
          value: await env.MEMORY.get(k.name)
        }))
      );
      return new Response(JSON.stringify(items), {
        headers: { "content-type": "application/json" }
      });
    }

    if (url.pathname === "/api/facts/add" && req.method === "POST") {
      const body: { key?: string; value?: string } = await req.json();
      if (!body.key || !body.value) return new Response("Missing", { status: 400 });

      await env.MEMORY.put(body.key, body.value);
      return new Response("OK");
    }

    if (url.pathname === "/api/facts/delete" && req.method === "POST") {
      const body: { key?: string; value?: string } = await req.json();
      if (!body.key) return new Response("Missing key", { status: 400 });

      await env.MEMORY.delete(body.key);
      return new Response("OK");
    }

    // existing chat route stays above or below this

    if (url.pathname === "/api/chat" && req.method === "POST") {
      console.log("HIT /api/chat");
      const sessionId = url.searchParams.get("session") || "default";

      return handleChat(req, env, sessionId);
    }

    return serveStatic(req);
  },
};
export default router;