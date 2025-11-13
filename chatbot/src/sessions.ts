export class SessionDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(req: Request) {
    const url = new URL(req.url);
    const method = req.method;

    console.log(">>> SessionDO:", this.state.id.toString(), url.pathname);

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

      console.log(">>> [GET] Memory:", memory);
      console.log(">>> [GET] History len:", history.length);

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

      const MAX_WINDOW = 5;

      const history =
        (await this.state.storage.get<
          Array<{ role: string; content: string }>
        >("history")) || [];

      history.push(entry);

      console.log(">>> [ADD] Added:", entry.role, "-", entry.content);
      console.log(">>> [ADD] History len now:", history.length);

      // If history exceeds window, trigger memory update
      await this.state.storage.put("history", history);

      if (history.length > MAX_WINDOW) {
        console.log(">>> [ADD] NEED_MEMORY_UPDATE triggered");
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

      console.log(">>> [SAVE] Writing memory:", newMemory);

      await this.state.storage.put("memory", newMemory);
      await this.state.storage.put("history", []); // reset the sliding window

      console.log(">>> [SAVE] Memory saved + history cleared");

      return new Response("OK");
    }

    // ------------------------------------------
    // FALLBACK
    // ------------------------------------------
    return new Response("Not found", { status: 404 });
  }
}
