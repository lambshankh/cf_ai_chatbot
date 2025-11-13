import router from "./core/router";
export { SessionDO } from "./sessions";

export interface Env {
  AI: Ai;
  CACHE: KVNamespace;
  SESSIONS: DurableObjectNamespace;
  MEMORY: KVNamespace;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    return router.handle(req, env, ctx);
  },
};
