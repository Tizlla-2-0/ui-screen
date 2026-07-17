export interface Env {
  STORE: KVNamespace;
  APP_USER: string;
  APP_PASS: string;
}

const STORE_KEY = "store";

const EMPTY = { screens: [] };

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data: unknown, init: ResponseInit = {}, request: Request): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  for (const [k, v] of Object.entries(corsHeaders(request))) {
    headers.set(k, v);
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

function unauthorized(request: Request): Response {
  return json({ error: "Unauthorized" }, { status: 401 }, request);
}

function checkAuth(request: Request, env: Env): boolean {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const i = decoded.indexOf(":");
    if (i < 0) return false;
    const user = decoded.slice(0, i);
    const pass = decoded.slice(i + 1);
    return user === env.APP_USER && pass === env.APP_PASS;
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/store" && url.pathname !== "/store/") {
      return json({ error: "Not found" }, { status: 404 }, request);
    }

    if (!checkAuth(request, env)) {
      return unauthorized(request);
    }

    if (request.method === "GET") {
      const raw = await env.STORE.get(STORE_KEY);
      if (!raw) {
        return json(EMPTY, {}, request);
      }
      try {
        return json(JSON.parse(raw), {}, request);
      } catch {
        return json(EMPTY, {}, request);
      }
    }

    if (request.method === "PUT") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, { status: 400 }, request);
      }
      if (
        !body ||
        typeof body !== "object" ||
        !Array.isArray((body as { screens?: unknown }).screens)
      ) {
        return json({ error: "Body must be { screens: [] }" }, { status: 400 }, request);
      }
      await env.STORE.put(STORE_KEY, JSON.stringify(body));
      return json(body, {}, request);
    }

    return json({ error: "Method not allowed" }, { status: 405 }, request);
  },
};
