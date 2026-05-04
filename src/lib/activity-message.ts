/**
 * Pure helpers que constroem mensagens carinhosas pro Activity Feed.
 * Espelham (em PT-BR) a lógica do edge-function couple-push, mas sem
 * dependências de Deno — rodam no client.
 */

export type ActivityKind =
  | "movies"
  | "series"
  | "date_ideas"
  | "mimos"
  | "wishlist_items"
  | "baby_names"
  | "gallery_albums"
  | "gallery_photos"
  | "letters"
  | "transactions"
  | "financial_goals"
  | "goal_deposits";

export interface ActivityRow {
  id: string;
  kind: ActivityKind;
  /** ISO timestamp — created_at OR updated_at, whichever is newer */
  ts: string;
  /** raw row from supabase, used by message builder */
  row: Record<string, unknown>;
  /** for navigation */
  url: string;
}

export interface ActivityMessage {
  emoji: string;
  /** Verbo + objeto curto. Ex: "adicionou um filme" */
  action: string;
  /** Subject — geralmente o título/nome (cinza menor) */
  subject: string;
  /** Tone class — primary|emerald|rose|plum|amber|teal — controls accent */
  tone: "primary" | "emerald" | "rose" | "plum" | "amber" | "teal";
}

const safe = (s: unknown): string => (typeof s === "string" ? s : "");

const brl = (v: unknown): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
};

export function buildActivityMessage(item: ActivityRow): ActivityMessage | null {
  const r = item.row;
  switch (item.kind) {
    case "movies": {
      const title = safe(r.title) || "um filme";
      const status = safe(r.status);
      if (status === "watching")
        return { emoji: "🍿", action: "começou a assistir", subject: title, tone: "primary" };
      if (status === "watched")
        return { emoji: "🎉", action: "terminou um filme", subject: title, tone: "emerald" };
      return { emoji: "🎬", action: "adicionou um filme", subject: title, tone: "primary" };
    }
    case "series": {
      const title = safe(r.title) || "uma série";
      const status = safe(r.status);
      if (status === "watching")
        return { emoji: "📺", action: "começou uma série", subject: title, tone: "primary" };
      if (status === "watched")
        return { emoji: "🎉", action: "terminou uma série", subject: title, tone: "emerald" };
      return { emoji: "📺", action: "adicionou uma série", subject: title, tone: "primary" };
    }
    case "date_ideas": {
      const name = safe(r.name) || "um date";
      const status = safe(r.status);
      if (status === "scheduled")
        return { emoji: "💕", action: "marcou um date", subject: name, tone: "rose" };
      if (status === "done")
        return { emoji: "🥂", action: "registrou um date que rolou", subject: name, tone: "emerald" };
      return { emoji: "💡", action: "teve uma ideia de date", subject: name, tone: "amber" };
    }
    case "mimos": {
      const name = safe(r.name) || "um mimo";
      const brand = safe(r.brand);
      const subject = brand ? `${brand} · ${name}` : name;
      if (r.finished)
        return { emoji: "😢", action: "marcou um mimo como acabado", subject, tone: "amber" };
      if (r.owned)
        return { emoji: "✨", action: "ganhou um mimo", subject, tone: "emerald" };
      return { emoji: "✨", action: "tá de olho num mimo", subject, tone: "rose" };
    }
    case "wishlist_items": {
      const name = safe(r.name) || "um item";
      const brand = safe(r.brand);
      const subject = brand ? `${brand} · ${name}` : name;
      const status = safe(r.status);
      if (status === "comprado")
        return { emoji: "🛍️", action: "comprou", subject, tone: "emerald" };
      if (status === "desistido")
        return { emoji: "🤷", action: "desistiu de comprar", subject, tone: "amber" };
      return { emoji: "🛒", action: "quer comprar", subject, tone: "primary" };
    }
    case "baby_names": {
      const name = safe(r.name) || "um nome";
      if (r.favorite)
        return { emoji: "💖", action: "favoritou um nome", subject: name, tone: "rose" };
      return { emoji: "👶", action: "pensou num nome", subject: name, tone: "rose" };
    }
    case "gallery_albums": {
      const name = safe(r.name) || "um álbum";
      return { emoji: "📂", action: "criou um álbum", subject: name, tone: "plum" };
    }
    case "gallery_photos": {
      return {
        emoji: "📸",
        action: "subiu uma foto",
        subject: safe(r.caption) || "Toque pra ver",
        tone: "plum",
      };
    }
    case "letters": {
      const title = safe(r.title) || "uma cartinha";
      if (r.unlock_at) {
        return {
          emoji: "🔒",
          action: "selou uma cartinha pro futuro",
          subject: title,
          tone: "plum",
        };
      }
      return { emoji: "💌", action: "escreveu uma cartinha", subject: title, tone: "rose" };
    }
    case "transactions": {
      const isIncome = r.type === "income";
      const amount = brl(r.amount);
      const cat = safe(r.category);
      return {
        emoji: isIncome ? "💰" : "💸",
        action: isIncome ? "registrou uma entrada" : "registrou uma despesa",
        subject: [amount, cat].filter(Boolean).join(" · "),
        tone: isIncome ? "emerald" : "amber",
      };
    }
    case "financial_goals": {
      const name = safe(r.name) || "uma meta";
      return { emoji: "🎯", action: "criou uma meta", subject: name, tone: "teal" };
    }
    case "goal_deposits": {
      const amount = brl(r.amount) || "novo depósito";
      return { emoji: "💪", action: "guardou pra meta", subject: amount, tone: "emerald" };
    }
    default:
      return null;
  }
}

/** Resolve nome do autor baseado em created_device + nomes do casal. */
export function resolveAuthorName(
  device: string | null | undefined,
  iphoneName: string | null,
  androidName: string | null,
  fallbackDisplay: string | null
): string {
  if (device === "iphone" && iphoneName) return iphoneName;
  if (device === "android" && androidName) return androidName;
  return fallbackDisplay || "Vocês";
}
