import type { CodeRecord, DoctorRecord, Env, SessionRecord } from "./types";
import { corsHeaders, generateCode, generateToken, isRateLimited, jsonResponse } from "./utils";

const CODE_TTL_SECONDS = 5 * 60;
const SESSION_TTL_SECONDS = 24 * 60 * 60;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    try {
      if (url.pathname === "/request-code" && request.method === "POST") {
        return await handleRequestCode(request, env);
      }
      if (url.pathname === "/verify-code" && request.method === "POST") {
        return await handleVerifyCode(request, env);
      }
      if (url.pathname === "/session-check" && request.method === "POST") {
        return await handleSessionCheck(request, env);
      }
      if (url.pathname === "/statuses" && request.method === "GET") {
        return await handleGetStatuses(env);
      }
      if (url.pathname === "/status" && request.method === "POST") {
        return await handleUpdateStatus(request, env);
      }
      if (url.pathname === "/session" && request.method === "GET") {
        return await handleSession(request, env);
      }
      return jsonResponse({ error: "Not found" }, { status: 404, env });
    } catch (err) {
      console.error(err);
      return jsonResponse({ error: "Внутрішня помилка сервера" }, { status: 500, env });
    }
  },
};

async function handleRequestCode(request: Request, env: Env): Promise<Response> {
  const body = await request.json().catch(() => null) as { discordId?: string } | null;
  const discordId = body?.discordId?.trim();

  if (!discordId || !/^\d{15,25}$/.test(discordId)) {
    return jsonResponse({ error: "Некоректний Discord ID" }, { status: 400, env });
  }

  const limited = await isRateLimited(env, `ratelimit:code:${discordId}`, 5, 600);
  if (limited) {
    return jsonResponse(
      { error: "Забагато спроб. Спробуйте пізніше." },
      { status: 429, env },
    );
  }

  const doctorRaw = await env.AUTH_KV.get(`doctor:${discordId}`);
  if (!doctorRaw) {
    return jsonResponse(
      { error: "Discord ID не знайдено серед допущеного персоналу" },
      { status: 403, env },
    );
  }

  const doctor: DoctorRecord = JSON.parse(doctorRaw);
  const code = generateCode();
  const record: CodeRecord = { code, discordId, createdAt: Date.now() };

  await env.AUTH_KV.put(`code:${discordId}`, JSON.stringify(record), {
    expirationTtl: CODE_TTL_SECONDS,
  });

  await sendDiscordWebhook(env, doctor, code);

  return jsonResponse({ ok: true }, { env });
}

async function handleVerifyCode(request: Request, env: Env): Promise<Response> {
  const body = await request.json().catch(() => null) as
    | { discordId?: string; code?: string }
    | null;
  const discordId = body?.discordId?.trim();
  const code = body?.code?.trim();

  if (!discordId || !code) {
    return jsonResponse({ error: "Відсутні обов'язкові поля" }, { status: 400, env });
  }

  const limited = await isRateLimited(env, `ratelimit:verify:${discordId}`, 10, 600);
  if (limited) {
    return jsonResponse(
      { error: "Забагато спроб. Спробуйте пізніше." },
      { status: 429, env },
    );
  }

  const storedRaw = await env.AUTH_KV.get(`code:${discordId}`);
  if (!storedRaw) {
    return jsonResponse({ error: "Код недійсний або прострочений" }, { status: 401, env });
  }

  const stored: CodeRecord = JSON.parse(storedRaw);
  if (stored.code !== code) {
    return jsonResponse({ error: "Невірний код" }, { status: 401, env });
  }

  await env.AUTH_KV.delete(`code:${discordId}`);

  const doctorRaw = await env.AUTH_KV.get(`doctor:${discordId}`);
  if (!doctorRaw) {
    return jsonResponse({ error: "Персонал не знайдено" }, { status: 403, env });
  }
  const doctor: DoctorRecord = JSON.parse(doctorRaw);

  const token = generateToken();
  const session: SessionRecord = {
    discordId,
    name: doctor.name,
    role: doctor.role,
    createdAt: Date.now(),
    isAdmin: doctor.isAdmin,
  };
  await env.AUTH_KV.put(`session:${token}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS,
  });

  return jsonResponse({ token, name: doctor.name, role: doctor.role, isAdmin: doctor.isAdmin }, { env });
}

async function handleSession(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return jsonResponse({ error: "Немає токена" }, { status: 401, env });
  }

  const sessionRaw = await env.AUTH_KV.get(`session:${token}`);
  if (!sessionRaw) {
    return jsonResponse({ error: "Сесія недійсна" }, { status: 401, env });
  }

  const session: SessionRecord = JSON.parse(sessionRaw);
  return jsonResponse({ name: session.name, role: session.role, isAdmin: session.isAdmin }, { env });
}

async function handleSessionCheck(request: Request, env: Env): Promise<Response> {
  const body = await request.json().catch(() => null) as { token?: string } | null;
  const token = body?.token;
  if (!token) {
    return jsonResponse({ error: "Немає токена" }, { status: 400, env });
  }
  const sessionRaw = await env.AUTH_KV.get(`session:${token}`);
  if (!sessionRaw) {
    return jsonResponse({ error: "Сесія недійсна" }, { status: 401, env });
  }
  const session: SessionRecord = JSON.parse(sessionRaw);
  return jsonResponse({ session }, { env });
}

async function handleGetStatuses(env: Env): Promise<Response> {
  const statusesRaw = await env.AUTH_KV.get("hierarchy:statuses");
  const statuses = statusesRaw ? JSON.parse(statusesRaw) : {};
  return jsonResponse({ statuses }, { env });
}

async function handleUpdateStatus(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return jsonResponse({ error: "Немає токена" }, { status: 401, env });

  const sessionRaw = await env.AUTH_KV.get(`session:${token}`);
  if (!sessionRaw) return jsonResponse({ error: "Сесія недійсна" }, { status: 401, env });

  const session: SessionRecord = JSON.parse(sessionRaw);
  if (!session.isAdmin) return jsonResponse({ error: "Немає прав доступу" }, { status: 403, env });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = await request.json().catch(() => null) as { roleId?: string; status?: any } | null;
  if (!body || !body.roleId || !body.status) {
    return jsonResponse({ error: "Відсутні обов'язкові поля" }, { status: 400, env });
  }

  const statusesRaw = await env.AUTH_KV.get("hierarchy:statuses");
  const statuses = statusesRaw ? JSON.parse(statusesRaw) : {};
  
  statuses[body.roleId] = body.status;
  await env.AUTH_KV.put("hierarchy:statuses", JSON.stringify(statuses));

  return jsonResponse({ ok: true }, { env });
}

async function sendDiscordWebhook(env: Env, doctor: DoctorRecord, code: string): Promise<void> {
  const payload = {
    embeds: [
      {
        title: "Код підтвердження входу",
        description: `Для **${doctor.name}** (${doctor.role})\n\nОдноразовий код дійсний 5 хвилин.`,
        color: 0x2e8b8b,
        fields: [{ name: "Код", value: `\`${code}\``, inline: true }],
      },
    ],
  };

  const res = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status}`);
  }
}