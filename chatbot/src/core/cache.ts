// src/core/cache.ts

// Normalize vectors so dot products = cosine similarity
function normalize(v: number[]): number[] {
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (mag === 0) return v;
  return v.map(x => x / mag);
}

function cosine(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export async function storeCacheHit(
  env: Env,
  key: string,
  data: {
    input: string;
    embedding: number[];
    answer: string;
  }
) {
  const normalized = normalize(data.embedding);

  await env.CACHE.put(
    key,
    JSON.stringify({
      input: data.input,
      embedding: normalized,
      answer: data.answer
    })
  );
}

export async function getCacheHit(env: Env, key: string) {
  const raw = await env.CACHE.get(key);
  if (!raw) return null;
  return JSON.parse(raw);
}


export async function findClosest(
  env: Env,
  queryEmbedding: number[],
  threshold: number
): Promise<string | null> {
  const q = normalize(queryEmbedding);

  let bestKey: string | null = null;
  let bestScore = threshold;

  const list = await env.CACHE.list();

  for (const item of list.keys) {
    const entry = await env.CACHE.get(item.name);
    if (!entry) continue;

    const parsed = JSON.parse(entry);
    const emb: number[] = parsed.embedding;
    if (!emb) continue;

    const score = cosine(q, emb);
    if (score > bestScore) {
      bestScore = score;
      bestKey = item.name;
    }
  }

  return bestKey;
}
