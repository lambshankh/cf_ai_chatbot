export class SessionDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(req: Request) {
    const url = new URL(req.url);
    const method = req.method;

    // Log which DO is being hit
    console.log(">>> SessionDO:", this.state.id.toString(), url.pathname);

    // -------------------------------
    // GET summary + history
    // -------------------------------
    if (url.pathname === "/get") {
      const summary = (await this.state.storage.get("summary")) || "";
      const history =
        (await this.state.storage.get<
          Array<{ role: string; content: string }>
        >("history")) || [];

      console.log(">>> [GET] Summary:", summary);
      console.log(">>> [GET] History len:", history.length);

      return new Response(
        JSON.stringify({ summary, history }),
        { headers: { "content-type": "application/json" } }
      );
    }

    // -------------------------------
    // ADD a chat entry
    // -------------------------------
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

      // Trigger summarisation if window exceeded
      if (history.length > MAX_WINDOW) {
        await this.state.storage.put("history", history);
        console.log(">>> [ADD] NEED_SUMMARY triggered");
        return new Response("NEED_SUMMARY");
      }

      await this.state.storage.put("history", history);
      return new Response("OK");
    }

    // -------------------------------
    // SAVE SUMMARY
    // -------------------------------
    if (url.pathname === "/save-summary" && method === "POST") {
      const body = await req.json() as { summary?: string };
      const newSummary = body.summary || "";

      console.log(">>> [SAVE] Writing summary:", newSummary);

      await this.state.storage.put("summary", newSummary);
      await this.state.storage.put("history", []); // reset window

      console.log(">>> [SAVE] Summary saved + history cleared");

      return new Response("OK");
    }

    // -------------------------------
    // FALLBACK
    // -------------------------------
    return new Response("Not found", { status: 404 });
  }
}
