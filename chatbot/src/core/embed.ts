export async function embedText(env: Env, text: string): Promise<number[]> {
  const result = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text
  });

  if (!result || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
    throw new Error("Embedding failed");
  }

  return result.data[0].embedding ?? result.data[0];
}
