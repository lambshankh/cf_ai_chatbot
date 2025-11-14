export class SessionDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(req: Request) {
    const url = new URL(req.url);
    const method = req.method;

    // ------------------------------------------
    // GET memory + history
    // ------------------------------------------
    if (url.pathname === "/get") {
      const memory =
        (await this.state.storage.get<Record<string, any>>("memory")) || {};
      const history =
        (await this.state.storage.get<
          Array<{ role: string; content: string }>
        >("history")) || [];

      return new Response(
        JSON.stringify({ memory, history }),
        { headers: { "content-type": "application/json" } }
      );
    }

    // ------------------------------------------
    // ADD a chat message to history
    // ------------------------------------------
    if (url.pathname === "/add" && method === "POST") {
      const body = await req.json() as { entry?: { role: string; content: string } };
      const entry = body.entry;

      if (!entry) return new Response("Missing entry", { status: 400 });

      const MAX_WINDOW = 25;

      const history =
        (await this.state.storage.get<
          Array<{ role: string; content: string }>
        >("history")) || [];

      history.push(entry);

      // If history exceeds window, trigger memory update
      await this.state.storage.put("history", history);

      if (history.length > MAX_WINDOW) {
        return new Response("NEED_MEMORY_UPDATE");
      }

      return new Response("OK");
    }

    // ------------------------------------------
    // SAVE MEMORY (overwrite JSON memory)
    // ------------------------------------------
    if (url.pathname === "/save-memory" && method === "POST") {
      const body = await req.json() as { memory?: Record<string, any> };
      const newMemory = body.memory || {};

      await this.state.storage.put("memory", newMemory);
      await this.state.storage.put("history", []); // reset the sliding window

      return new Response("OK");
    }

    // ------------------------------------------
    // FALLBACK
    // ------------------------------------------
    return new Response("Not found", { status: 404 });
  }
}
