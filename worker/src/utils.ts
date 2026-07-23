import type { Env } from "./types";

export function generateCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (array[0] % 1_000_000).toString().padStart(6, "0");
  return code;
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function corsHeaders(env: Env): HeadersInit {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function jsonResponse(
  data: unknown,
  init: { status?: number; env: Env },
): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(init.env),
    },
  });
}

export async function isRateLimited(
  env: Env,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const raw = await env.AUTH_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= limit) return true;
  await env.AUTH_KV.put(key, String(count + 1), { expirationTtl: windowSeconds });
  return false;
}