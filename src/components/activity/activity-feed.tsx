import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useActivityFeed } from "@/hooks/use-activity-feed";
import { useCouple } from "@/hooks/use-couple";
import { useAuth } from "@/hooks/use-auth";
import {
  buildActivityMessage,
  resolveAuthorName,
  type ActivityRow,
} from "@/lib/activity-message";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<
  NonNullable<ReturnType<typeof buildActivityMessage>>["tone"],
  { bg: string; text: string; ring: string }
> = {
  primary: { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", ring: "ring-emerald-500/20" },
  rose:    { bg: "bg-rose-500/10",    text: "text-rose-500",    ring: "ring-rose-500/20" },
  plum:    { bg: "bg-purple-500/10",  text: "text-purple-400",  ring: "ring-purple-500/20" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-500",   ring: "ring-amber-500/20" },
  teal:    { bg: "bg-teal-500/10",    text: "text-teal-400",    ring: "ring-teal-500/20" },
};

interface ActivityFeedProps {
  /** Initial collapsed count (defaults to 5). */
  initial?: number;
  /** Max items the feed will ever show when expanded (defaults to whatever the hook returns). */
  max?: number;
}

export function ActivityFeed({ initial = 5, max }: ActivityFeedProps) {
  const { items, loading } = useActivityFeed();
  const { couple, members } = useCouple();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const myDisplayName = members.find((m) => m.user_id === user?.id)?.display_name ?? null;

  const fullList = useMemo(
    () => (max ? items.slice(0, max) : items),
    [items, max]
  );
  const visible = useMemo(
    () => (expanded ? fullList : fullList.slice(0, initial)),
    [fullList, expanded, initial]
  );
  const hiddenCount = fullList.length - initial;

  if (loading && items.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!loading && fullList.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 px-5 py-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Nada por aqui ainda
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground/70">
          Quando vocês adicionarem algo, vai aparecer aqui em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((item) => (
            <ActivityItem
              key={`${item.kind}:${item.id}`}
              item={item}
              iphoneName={couple?.iphone_partner_name ?? null}
              androidName={couple?.android_partner_name ?? null}
              fallbackDisplay={myDisplayName}
            />
          ))}
        </AnimatePresence>
      </ul>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="group mx-auto mt-3 flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-4 py-2 text-[11.5px] font-semibold tracking-tight text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/[0.04] hover:text-foreground"
        >
          {expanded ? "Mostrar menos" : `Mostrar mais ${hiddenCount}`}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </button>
      )}
    </div>
  );
}

interface ActivityItemProps {
  item: ActivityRow;
  iphoneName: string | null;
  androidName: string | null;
  fallbackDisplay: string | null;
}

function ActivityItem({
  item,
  iphoneName,
  androidName,
  fallbackDisplay,
}: ActivityItemProps) {
  const msg = buildActivityMessage(item);
  if (!msg) return null;

  const device = (item.row.created_device as string | undefined) ?? null;
  const author = resolveAuthorName(device, iphoneName, androidName, fallbackDisplay);
  const tone = TONE_CLASSES[msg.tone];

  let timeLabel: string;
  try {
    timeLabel = formatDistanceToNow(new Date(item.ts), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    timeLabel = "";
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
    >
      <Link
        to={item.url}
        className="group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-3 transition-all hover:border-border hover:bg-card/60 sm:px-4"
      >
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ring-1",
            tone.bg,
            tone.ring
          )}
        >
          <span className="text-base leading-none">{msg.emoji}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] leading-snug">
            <span className={cn("font-semibold", tone.text)}>{author}</span>{" "}
            <span className="text-foreground/85">{msg.action}</span>
          </p>
          {msg.subject && (
            <p className="truncate text-[12.5px] font-medium text-muted-foreground">
              {msg.subject}
            </p>
          )}
        </div>

        <span className="shrink-0 self-center text-[10.5px] text-muted-foreground/70 tabular">
          {timeLabel}
        </span>
      </Link>
    </motion.li>
  );
}

/** Just the section header with a sparkle. */
export function ActivityFeedHeader({ title = "Nossa linha do tempo" }: { title?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-muted-foreground/70">
          Atividade
        </p>
        <h2 className="mt-0.5 flex items-baseline gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
          <Sparkles className="h-4 w-4 text-primary" />
          {title}
        </h2>
      </div>
    </div>
  );
}
