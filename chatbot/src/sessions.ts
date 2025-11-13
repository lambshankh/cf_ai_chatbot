export class SessionDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(req: Request) {
    const url = new URL(req.url);
    const method = req.method;

    if (url.pathname === "/get") {
      const summary = (await this.state.storage.get("summary")) || "";
      const history = (await this.state.storage.get("history")) || [];
      return new Response(
        JSON.stringify({ summary, history }),
        { headers: { "content-type": "application/json" } }
      );
    }

    if (url.pathname === "/add" && method === "POST") {
        const body = await req.json() as { entry?: { role: string; content: string } };
        const entry = body.entry;
        if (!entry) return new Response("Missing entry", { status: 400 });

        const MAX_WINDOW = 5;

        const history = await this.state.storage.get<Array<{ role: string; content: string }>>("history") || [];
        history.push(entry);

        if (history.length > MAX_WINDOW) {
            await this.state.storage.put("history", history);
            return new Response("NEED_SUMMARY");
        }

        await this.state.storage.put("history", history);
        return new Response("OK");
    }


    if (url.pathname === "/save-summary" && method === "POST") {
      const body = await req.json() as { summary?: string };

      await this.state.storage.put("summary", body.summary || "");
      await this.state.storage.put("history", []);

      return new Response("OK");
    }

    return new Response("Not found", { status: 404 });
  }
}
