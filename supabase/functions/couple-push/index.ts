// Edge Function: couple-push
//
// Recebe payloads de triggers Postgres (table + record) e dispara Web Push
// pra todos os dispositivos do casal — exceto pro autor da inserção.
//
// Required env (Edge Function secrets):
//   - VAPID_PUBLIC_KEY
//   - VAPID_PRIVATE_KEY
//   - VAPID_SUBJECT (mailto:seu@email.com)
//   - PUSH_WEBHOOK_SECRET (mesmo secret armazenado no vault da DB)
//   - SUPABASE_URL (auto-injected)
//   - SUPABASE_SERVICE_ROLE_KEY (auto-injected)

// @ts-expect-error — Deno std import map
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-expect-error — npm: specifier
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT =
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:noreply@organizai.app";
const WEBHOOK_SECRET = Deno.env.get("PUSH_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
  icon?: string;
}

// -----------------------------------------------------------------------------
// Mensagem por tipo de tabela
// -----------------------------------------------------------------------------
function brl(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

function buildPayload(
  table: string,
  record: Record<string, unknown>,
  authorName: string
): PushPayload | null {
  const author = authorName || "Seu amor";
  const safe = (s: unknown): string => (typeof s === "string" ? s : "");

  switch (table) {
    case "movies":
      return {
        title: `🎬 ${author} adicionou um filme`,
        body: safe(record.title) || "Novo filme",
        url: "/movies",
        tag: `movies-${record.id}`,
      };
    case "series":
      return {
        title: `📺 ${author} adicionou uma série`,
        body: safe(record.title) || "Nova série",
        url: "/series",
        tag: `series-${record.id}`,
      };
    case "date_ideas":
      return {
        title: `💕 ${author} adicionou um date`,
        body: safe(record.name) || "Novo date",
        url: "/dates",
        tag: `dates-${record.id}`,
      };
    case "mimos":
      return {
        title: `✨ ${author} adicionou um mimo`,
        body:
          [safe(record.brand), safe(record.name)].filter(Boolean).join(" · ") ||
          "Novo mimo",
        url: "/mimos",
        tag: `mimos-${record.id}`,
      };
    case "wishlist_items":
      return {
        title: `🛒 ${author} quer comprar`,
        body:
          [safe(record.brand), safe(record.name)].filter(Boolean).join(" · ") ||
          "Novo item na lista",
        url: "/wishlist",
        tag: `wishlist-${record.id}`,
      };
    case "baby_names":
      return {
        title: `👶 ${author} pensou em um nome`,
        body: safe(record.name) || "Novo nome",
        url: "/baby-names",
        tag: `babynames-${record.id}`,
      };
    case "gallery_albums":
      return {
        title: `📸 ${author} criou um álbum`,
        body: safe(record.name) || "Novo álbum",
        url: "/gallery",
        tag: `albums-${record.id}`,
      };
    case "gallery_photos":
      return {
        title: `📸 ${author} adicionou uma foto`,
        body: "Toque pra ver",
        url: `/gallery/${safe(record.album_id)}`,
        tag: `photo-${record.id}`,
      };
    case "letters":
      return {
        title: `💌 ${author} escreveu uma cartinha`,
        body: safe(record.title) || "Nova cartinha",
        url: "/letters",
        tag: `letters-${record.id}`,
      };
    case "transactions": {
      const amount = brl(record.amount);
      const cat = safe(record.category);
      return {
        title:
          record.type === "income"
            ? `💰 ${author} registrou uma entrada`
            : `💸 ${author} registrou uma despesa`,
        body: [amount, cat].filter(Boolean).join(" · ") || "Nova transação",
        url: "/expenses",
        tag: `tx-${record.id}`,
      };
    }
    case "financial_goals":
      return {
        title: `🎯 ${author} criou uma meta`,
        body: safe(record.name) || "Nova meta",
        url: "/goals",
        tag: `goals-${record.id}`,
      };
    case "goal_deposits":
      return {
        title: `🎯 ${author} guardou pra meta`,
        body: brl(record.amount) || "Novo depósito",
        url: "/goals",
        tag: `dep-${record.id}`,
      };
    case "mimo_categories":
    case "wishlist_categories":
      // Categorias custom — não notifica (ruído)
      return null;
    default:
      return null;
  }
}

// -----------------------------------------------------------------------------
// HTTP handler
// -----------------------------------------------------------------------------
Deno.serve(async (req) => {
  // CORS preflight (caso seja chamada via fetch do browser por engano)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Auth check: shared secret no header
  const provided = req.headers.get("X-Webhook-Secret");
  if (!WEBHOOK_SECRET || provided !== WEBHOOK_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: { table?: string; record?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { table, record } = body;
  if (!table || !record) {
    return new Response("Missing table or record", { status: 400 });
  }

  const coupleId = record.couple_id as string | undefined;
  const createdBy = (record.created_by ?? record.user_id) as string | undefined;
  if (!coupleId || !createdBy) {
    return new Response(
      JSON.stringify({ skipped: "missing couple_id or created_by" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Nome do autor (display_name do couple_members)
  const { data: authorRow } = await admin
    .from("couple_members")
    .select("display_name")
    .eq("user_id", createdBy)
    .maybeSingle();
  const authorName =
    (authorRow?.display_name as string | undefined) || "Seu amor";

  const built = buildPayload(table, record, authorName);
  if (!built) {
    return new Response(JSON.stringify({ skipped: "no payload" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Enrich with table + id so the SW can self-suppress (same-account dedup)
  const payload = {
    ...built,
    table,
    id: typeof record.id === "string" ? record.id : "",
  };

  // Buscar TODOS os subs do casal exceto os do autor
  const { data: subs, error: subsErr } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("couple_id", coupleId)
    .neq("user_id", createdBy);

  if (subsErr) {
    return new Response(JSON.stringify({ error: subsErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stats = { total: subs?.length ?? 0, sent: 0, gone: 0, failed: 0 };
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ ...stats, skipped: "no recipients" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const expiredIds: string[] = [];

  await Promise.allSettled(
    subs.map(async (s) => {
      const subscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24, urgency: "normal" }
        );
        stats.sent++;
        // best-effort touch last_used_at
        admin
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", s.id)
          .then(() => void 0);
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        // 404/410: subscription expirou — limpar
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          expiredIds.push(s.id);
          stats.gone++;
        } else {
          console.error("[push] send failed", e?.statusCode, e?.message);
          stats.failed++;
        }
      }
    })
  );

  if (expiredIds.length > 0) {
    await admin
      .from("push_subscriptions")
      .delete()
      .in("id", expiredIds);
  }

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
