import { handleChat } from "./ai";
import { getMemory, addMemory, updateMemory, deleteMemory } from "./memory";
import { serveStatic } from "./static";

const router = {
  async handle(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);

    // memory endpoints
    if (url.pathname === "/api/memory" && req.method === "GET") {
      const mem = await getMemory(env);
      return new Response(JSON.stringify(mem), {
        headers: { "content-type": "application/json" }
      });
    }

    if (url.pathname === "/api/memory/add" && req.method === "POST") {
      const body = await req.json() as { key?: string; value?: string };
      if (!body.key || !body.value) {
        return new Response("Missing key or value", { status: 400 });
      }
      await addMemory(env, body.key, body.value);
      return new Response("OK");
    }

    if (url.pathname === "/api/memory/update" && req.method === "POST") {
      const body = await req.json() as { key?: string; value?: string };
      if (!body.key || !body.value) {
        return new Response("Missing key or value", { status: 400 });
      }
      await updateMemory(env, body.key, body.value);
      return new Response("OK");
    }

    if (url.pathname === "/api/memory/delete" && req.method === "POST") {
      const body = await req.json() as { key?: string };
      if (!body.key) {
        return new Response("Missing key", { status: 400 });
      }
      await deleteMemory(env, body.key);
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