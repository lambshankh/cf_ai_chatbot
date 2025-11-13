export async function getMemory(env: Env): Promise<Array<{ key: string; value: string }>> {
  const raw = await env.MEMORY.get("memories");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveMemory(
  env: Env,
  entries: Array<{ key: string; value: string }>
) {
  await env.MEMORY.put("memories", JSON.stringify(entries));
}

export async function addMemory(env: Env, key: string, value: string) {
  const current = await getMemory(env);
  current.push({ key, value });
  await saveMemory(env, current);
}

export async function updateMemory(env: Env, key: string, value: string) {
  const current = await getMemory(env);
  const updated = current.map(e => (e.key === key ? { key, value } : e));
  await saveMemory(env, updated);
}

export async function deleteMemory(env: Env, key: string) {
  const current = await getMemory(env);
  const filtered = current.filter(e => e.key !== key);
  await saveMemory(env, filtered);
}
