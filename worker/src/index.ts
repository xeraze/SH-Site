import type { Env } from "./types";
import { corsHeaders, jsonResponse } from "./utils";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    try {
      return jsonResponse({ error: "Not found" }, { status: 404, env });
    } catch (err) {
      console.error(err);
      return jsonResponse({ error: "Внутрішня помилка сервера" }, { status: 500, env });
    }
  },
};
