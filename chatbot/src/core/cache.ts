// store: raw text input, embedding vector, output
export async function storeCacheHit(
  env: Env,
  key: string,
  data: {
    input: string;
    embedding: number[];
    answer: string;
  }
) {
  await env.CACHE.put(key, JSON.stringify(data));
}

export async function getCacheHit(env: Env, key: string) {
  const raw = await env.CACHE.get(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

// stub: we’ll fill this with real vector similarity next commit
export async function findClosest(
  env: Env,
  embedding: number[],
  threshold: number
): Promise<string | null> {
  // For now always return null so no caching happens yet.
  return null;
}
