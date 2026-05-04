// Edge Function: couple-push
//
// Recebe payloads de triggers Postgres (table + record + old_record + event +
// device_type) e dispara Web Push pra todos os dispositivos do casal.
// A dedup de "não notificar quem fez" é feita no SW de cada device via IDB
// (push é entregue pra todos, SW filtra antes de mostrar).
//
// Mensagens são contextuais e carinhosas — variam por tabela, evento (insert
// vs status change) e quem originou (iPhone vs Android, configurável em
// couples.iphone_partner_name / android_partner_name).
//
// Required env (Edge Function secrets):
//   - VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
//   - PUSH_WEBHOOK_SECRET (mesmo secret no Vault da DB)
//   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)

// @ts-expect-error — Deno std/npm imports
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

type DeviceType = "iphone" | "android" | "desktop" | null;

interface CoupleRow {
  id: string;
  iphone_partner_name: string | null;
  android_partner_name: string | null;
  logo_url: string | null;
}

// -----------------------------------------------------------------------------
// Helpers
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

function safe(s: unknown): string {
  return typeof s === "string" ? s : "";
}

function fmtDateBR(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

/**
 * Resolve qual nome usar baseado no device de origem. Fallback: display_name
 * do member, ou "Seu amor" se nada estiver setado.
 */
function resolveAuthorName(
  device: DeviceType,
  couple: CoupleRow | null,
  fallback: string
): string {
  if (device === "iphone" && couple?.iphone_partner_name) {
    return couple.iphone_partner_name;
  }
  if (device === "android" && couple?.android_partner_name) {
    return couple.android_partner_name;
  }
  return fallback || "Seu amor";
}

// -----------------------------------------------------------------------------
// Mensagens por tabela — INSERT e UPDATE
// -----------------------------------------------------------------------------

interface BuildArgs {
  table: string;
  event: "INSERT" | "UPDATE" | string;
  record: Record<string, unknown>;
  oldRecord: Record<string, unknown> | null;
  author: string;
}

function buildPayload(args: BuildArgs): PushPayload | null {
  const { table, event, record, oldRecord, author } = args;
  const isUpdate = event === "UPDATE";

  switch (table) {
    case "movies":
      return moviePayload(record, oldRecord, author, isUpdate);
    case "series":
      return seriesPayload(record, oldRecord, author, isUpdate);
    case "date_ideas":
      return datePayload(record, oldRecord, author, isUpdate);
    case "mimos":
      return mimoPayload(record, oldRecord, author, isUpdate);
    case "wishlist_items":
      return wishlistPayload(record, oldRecord, author, isUpdate);
    case "baby_names":
      return babyNamePayload(record, oldRecord, author, isUpdate);
    case "gallery_albums":
      return albumPayload(record, author);
    case "gallery_photos":
      return photoPayload(record, author);
    case "letters":
      return letterPayload(record, author);
    case "transactions":
      return transactionPayload(record, author);
    case "financial_goals":
      return goalPayload(record, author);
    case "goal_deposits":
      return depositPayload(record, author);
    // Categorias custom: ruído, não notifica
    case "mimo_categories":
    case "wishlist_categories":
      return null;
    default:
      return null;
  }
}

// -- Movies -------------------------------------------------------------------
function moviePayload(
  r: Record<string, unknown>,
  old: Record<string, unknown> | null,
  author: string,
  isUpdate: boolean
): PushPayload {
  const title = safe(r.title) || "um filme";
  const status = safe(r.status);
  const oldStatus = old ? safe(old.status) : null;

  let head = "", body = "";
  if (isUpdate && oldStatus && oldStatus !== status) {
    if (status === "watching") {
      head = `🍿 ${author} começou a assistir`;
      body = `${title} — quer companhia?`;
    } else if (status === "watched") {
      head = `🎉 Vocês terminaram um filme!`;
      body = `${title} 💖`;
    } else if (status === "want_to_watch") {
      head = `🎬 ${author} quer ver`;
      body = title;
    } else {
      head = `🎬 ${author} mexeu no filme`;
      body = title;
    }
  } else {
    // INSERT
    if (status === "watching") {
      head = `🍿 ${author} já tá assistindo`;
      body = title;
    } else if (status === "watched") {
      head = `✅ ${author} marcou um filme como visto`;
      body = title;
    } else {
      head = `🎬 ${author} adicionou um filme pra vocês verem`;
      body = title;
    }
  }
  return { title: head, body, url: "/movies", tag: `movies-${r.id}` };
}

// -- Series -------------------------------------------------------------------
function seriesPayload(
  r: Record<string, unknown>,
  old: Record<string, unknown> | null,
  author: string,
  isUpdate: boolean
): PushPayload {
  const title = safe(r.title) || "uma série";
  const status = safe(r.status);
  const oldStatus = old ? safe(old.status) : null;

  let head = "", body = "";
  if (isUpdate && oldStatus && oldStatus !== status) {
    if (status === "watching") {
      head = `📺 ${author} começou uma série`;
      body = `${title} — bora ver junto?`;
    } else if (status === "watched") {
      head = `🎉 Vocês fecharam uma série!`;
      body = title;
    } else {
      head = `📺 ${author} quer ver`;
      body = title;
    }
  } else {
    if (status === "watching") {
      head = `📺 ${author} já tá vendo`;
      body = title;
    } else {
      head = `📺 ${author} adicionou uma série`;
      body = title;
    }
  }
  return { title: head, body, url: "/series", tag: `series-${r.id}` };
}

// -- Date ideas ---------------------------------------------------------------
function datePayload(
  r: Record<string, unknown>,
  old: Record<string, unknown> | null,
  author: string,
  isUpdate: boolean
): PushPayload {
  const name = safe(r.name) || "um date";
  const status = safe(r.status);
  const oldStatus = old ? safe(old.status) : null;
  const dateTime = safe(r.date_time);
  const when = dateTime ? fmtDateBR(dateTime) : "";

  let head = "", body = "";
  if (isUpdate && oldStatus && oldStatus !== status) {
    if (status === "scheduled") {
      head = `💕 ${author} marcou um date pra vocês`;
      body = when ? `${name} · ${when}` : name;
    } else if (status === "done") {
      head = `🥂 Que date inesquecível!`;
      body = name;
    } else if (status === "idea") {
      head = `💡 ${author} guardou uma ideia`;
      body = name;
    }
  } else {
    if (status === "scheduled") {
      head = `💕 ${author} marcou um date`;
      body = when ? `${name} · ${when}` : name;
    } else if (status === "done") {
      head = `🥂 ${author} registrou um date que já rolou`;
      body = name;
    } else {
      head = `💡 ${author} teve uma ideia de date`;
      body = name;
    }
  }
  return { title: head, body, url: "/dates", tag: `dates-${r.id}` };
}

// -- Mimos --------------------------------------------------------------------
function mimoPayload(
  r: Record<string, unknown>,
  old: Record<string, unknown> | null,
  author: string,
  isUpdate: boolean
): PushPayload {
  const name = safe(r.name) || "um mimo";
  const brand = safe(r.brand);
  const subject = brand ? `${brand} · ${name}` : name;
  const owned = !!r.owned;
  const finished = !!r.finished;
  const oldOwned = old ? !!old.owned : null;
  const oldFinished = old ? !!old.finished : null;

  let head = "", body = "";
  if (isUpdate) {
    if (oldFinished === false && finished) {
      head = `😢 Acabou o mimo`;
      body = `${subject} — hora de repor?`;
    } else if (oldOwned === false && owned) {
      head = `✨ ${author} ganhou um mimo`;
      body = subject;
    } else {
      head = `✨ ${author} mexeu no mimo`;
      body = subject;
    }
  } else {
    head = `✨ ${author} tá de olho num mimo`;
    body = subject;
  }
  return { title: head, body, url: "/mimos", tag: `mimos-${r.id}` };
}

// -- Wishlist -----------------------------------------------------------------
function wishlistPayload(
  r: Record<string, unknown>,
  old: Record<string, unknown> | null,
  author: string,
  isUpdate: boolean
): PushPayload {
  const name = safe(r.name) || "um item";
  const brand = safe(r.brand);
  const subject = brand ? `${brand} · ${name}` : name;
  const status = safe(r.status);
  const oldStatus = old ? safe(old.status) : null;
  const price = brl(r.price);

  let head = "", body = "";
  if (isUpdate && oldStatus && oldStatus !== status) {
    if (status === "comprado") {
      head = `🛍️ Compraram!`;
      body = price ? `${subject} · ${price}` : subject;
    } else if (status === "desistido") {
      head = `🤷 ${author} desistiu`;
      body = subject;
    } else {
      head = `🛒 ${author} quer comprar`;
      body = subject;
    }
  } else {
    head = `🛒 ${author} quer isso`;
    body = price ? `${subject} · ${price}` : subject;
  }
  return { title: head, body, url: "/wishlist", tag: `wishlist-${r.id}` };
}

// -- Baby names ---------------------------------------------------------------
function babyNamePayload(
  r: Record<string, unknown>,
  old: Record<string, unknown> | null,
  author: string,
  isUpdate: boolean
): PushPayload {
  const name = safe(r.name) || "um nome";
  const fav = !!r.favorite;
  const oldFav = old ? !!old.favorite : null;

  let head = "", body = "";
  if (isUpdate) {
    if (oldFav === false && fav) {
      head = `💖 ${author} ama esse nome`;
      body = `${name} virou favorito 🥹`;
    } else if (oldFav === true && !fav) {
      head = `${author} mudou de ideia`;
      body = `${name} saiu dos favoritos`;
    } else {
      head = `👶 ${author} mexeu num nome`;
      body = name;
    }
  } else {
    head = `👶 ${author} pensou num nome`;
    body = `${name} ${fav ? "💖" : ""}`.trim();
  }
  return { title: head, body, url: "/baby-names", tag: `babynames-${r.id}` };
}

// -- Gallery ------------------------------------------------------------------
function albumPayload(r: Record<string, unknown>, author: string): PushPayload {
  const name = safe(r.name) || "um álbum";
  return {
    title: `📸 ${author} criou um álbum`,
    body: name,
    url: "/gallery",
    tag: `albums-${r.id}`,
  };
}

function photoPayload(r: Record<string, unknown>, author: string): PushPayload {
  return {
    title: `📸 ${author} subiu uma foto nova`,
    body: "Toque pra ver a memória",
    url: `/gallery/${safe(r.album_id)}`,
    tag: `photo-${r.id}`,
  };
}

// -- Letters ------------------------------------------------------------------
function letterPayload(r: Record<string, unknown>, author: string): PushPayload {
  const title = safe(r.title) || "uma cartinha";
  return {
    title: `💌 ${author} escreveu pra você`,
    body: title,
    url: "/letters",
    tag: `letters-${r.id}`,
  };
}

// -- Finance ------------------------------------------------------------------
function transactionPayload(
  r: Record<string, unknown>,
  author: string
): PushPayload {
  const amount = brl(r.amount);
  const cat = safe(r.category);
  const isIncome = r.type === "income";
  return {
    title: isIncome
      ? `💰 ${author} registrou uma entrada`
      : `💸 ${author} registrou uma despesa`,
    body: [amount, cat].filter(Boolean).join(" · ") || "Nova transação",
    url: "/expenses",
    tag: `tx-${r.id}`,
  };
}

function goalPayload(r: Record<string, unknown>, author: string): PushPayload {
  const name = safe(r.name) || "uma meta";
  const target = brl(r.target_amount);
  return {
    title: `🎯 ${author} criou uma meta nova`,
    body: target ? `${name} — meta: ${target}` : name,
    url: "/goals",
    tag: `goals-${r.id}`,
  };
}

function depositPayload(
  r: Record<string, unknown>,
  author: string
): PushPayload {
  const amount = brl(r.amount);
  return {
    title: `💪 ${author} guardou pra meta`,
    body: amount || "Novo depósito",
    url: "/goals",
    tag: `dep-${r.id}`,
  };
}

// -----------------------------------------------------------------------------
// HTTP handler
// -----------------------------------------------------------------------------
Deno.serve(async (req) => {
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

  // Auth check
  const provided = req.headers.get("X-Webhook-Secret");
  if (!WEBHOOK_SECRET || provided !== WEBHOOK_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: {
    table?: string;
    record?: Record<string, unknown>;
    old_record?: Record<string, unknown> | null;
    event?: string;
    device_type?: DeviceType;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { table, record, old_record, event = "INSERT", device_type = null } = body;
  if (!table || !record) {
    return new Response("Missing table or record", { status: 400 });
  }

  const coupleId = record.couple_id as string | undefined;
  const createdBy = (record.created_by ?? record.user_id) as string | undefined;
  if (!coupleId) {
    return new Response(
      JSON.stringify({ skipped: "missing couple_id" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Fetch couple (for device names + logo)
  const { data: coupleRow } = await admin
    .from("couples")
    .select("id, iphone_partner_name, android_partner_name, logo_url")
    .eq("id", coupleId)
    .maybeSingle();
  const couple = (coupleRow as CoupleRow | null) ?? null;

  // Fallback display name from couple_members
  let memberDisplayName = "";
  if (createdBy) {
    const { data: m } = await admin
      .from("couple_members")
      .select("display_name")
      .eq("user_id", createdBy)
      .maybeSingle();
    memberDisplayName = (m?.display_name as string | undefined) || "";
  }

  const author = resolveAuthorName(device_type, couple, memberDisplayName);

  const built = buildPayload({
    table,
    event,
    record,
    oldRecord: old_record ?? null,
    author,
  });
  if (!built) {
    return new Response(JSON.stringify({ skipped: "no payload" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Enrich with table + id (SW dedup) + couple logo (notification icon)
  const payload = {
    ...built,
    table,
    id: typeof record.id === "string" ? record.id : "",
    icon: couple?.logo_url ?? built.icon,
  };

  // Send to ALL subs in the couple — SW does the dedup
  const { data: subs, error: subsErr } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("couple_id", coupleId);

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
        admin
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", s.id)
          .then(() => void 0);
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
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
    await admin.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return new Response(JSON.stringify({ ...stats, author, device_type }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
