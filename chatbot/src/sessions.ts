export class SessionDO {
  state: DurableObjectState;
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(req: Request) {
    return new Response("OK"); // placeholder
  }
}
