import { handleChat } from "./ai";
import { serveStatic } from "./static";

const router = {
  async handle(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);

    if (url.pathname === "/api/chat" && req.method === "POST") {
    const sessionId =
        url.searchParams.get("session") || crypto.randomUUID();

    return handleChat(req, env, sessionId);
    }


    return serveStatic(req);
  },
};

export default router;
