/**
 * OrganizAI — Supabase proxy Worker
 * ------------------------------------------------------------------
 * Alguns dispositivos (mobile em redes específicas) não conseguem
 * estabelecer conexão direta com `*.supabase.co`. Esse Worker fica
 * num domínio `*.workers.dev` que esses dispositivos conseguem
 * alcançar normalmente, e repassa cada request para o Supabase.
 *
 * Deploy:
 *   1. Cloudflare Dashboard → Workers & Pages → Create Worker
 *   2. Cola este arquivo em Edit Code
 *   3. Substitui SUPABASE_URL abaixo pelo URL do seu projeto
 *   4. Save and Deploy
 *   5. Copia o URL público do Worker (algo como
 *      https://organizai-api.SEU_USUARIO.workers.dev)
 *   6. Atualiza o GitHub Secret VITE_SUPABASE_URL com esse novo URL
 *   7. Push qualquer commit pra re-rodar o deploy do GitHub Pages
 */

// Replace with your own Supabase project URL before deploying.
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";

// CORS aberto — o próprio Worker serve ao app front-end.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods":
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, prefer, range, x-supabase-api-version",
  "Access-Control-Expose-Headers":
    "content-range, content-length, range, etag",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request) {
    // Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const incoming = new URL(request.url);
    const target = new URL(SUPABASE_URL);
    target.pathname = incoming.pathname;
    target.search = incoming.search;

    // Reconstroi a request com novo host mas preservando método,
    // headers, body e redirect behavior.
    const headers = new Headers(request.headers);
    // O header Host é inferido do URL de destino; remove o do worker
    // pra evitar o Supabase receber o Host do Worker.
    headers.delete("host");
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("cf-ray");
    headers.delete("cf-visitor");
    headers.delete("x-forwarded-proto");
    headers.delete("x-forwarded-for");
    headers.delete("x-real-ip");

    const proxied = new Request(target.toString(), {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : request.body,
      redirect: "follow",
    });

    let upstream;
    try {
      upstream = await fetch(proxied);
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "proxy_fetch_failed",
          detail: err instanceof Error ? err.message : String(err),
        }),
        {
          status: 502,
          headers: {
            "content-type": "application/json",
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Clona resposta adicionando CORS.
    const responseHeaders = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(k, v);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  },
};
