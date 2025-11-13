export class SessionDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(req: Request) {
    const url = new URL(req.url);
    const method = req.method;

    if (url.pathname === "/get") {
      const history = (await this.state.storage.get("history")) || [];
      return new Response(JSON.stringify(history), {
        headers: { "content-type": "application/json" }
      });
    }

    if (url.pathname === "/add" && method === "POST") {
      const body = await req.json();
      const entry = body?.entry;
      if (!entry) return new Response("Missing entry", { status: 400 });

      const history = (await this.state.storage.get("history")) || [];
      history.push(entry);
      await this.state.storage.put("history", history);

      return new Response("OK");
    }

    return new Response("Not found", { status: 404 });
  }
}
