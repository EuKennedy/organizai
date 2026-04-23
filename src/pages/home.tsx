import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Film,
  Play,
  CheckCheck,
  Clock,
  ArrowRight,
  Images,
  Sparkles,
} from "lucide-react";
import { useMovies } from "@/hooks/use-movies";
import { useGallery } from "@/hooks/use-gallery";
import { posterUrl, backdropUrl } from "@/lib/tmdb";
import {
  COUPLE_START_DATE,
  daysTogether,
  togetherBreakdown,
  nextMonthAnniversary,
  greeting,
} from "@/lib/couple-config";
import { cn } from "@/lib/utils";

/**
 * Dashboard / Home — pulse of our life together. Aggregates data that
 * already lives in other modules (movies, gallery) and derives the two
 * time-based affordances: days together, and countdown to the next
 * "mês-versário" (same day-of-month as the start date).
 */
export function HomePage() {
  const [now, setNow] = useState(() => new Date());

  // Tick every minute so "hoje é mês-versário!" flips at midnight without
  // forcing a refresh.
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const { movies } = useMovies();
  const { photos } = useGallery();

  const days = daysTogether(now);
  const breakdown = togetherBreakdown(now);
  const anniv = nextMonthAnniversary(now);

  const movieStats = useMemo(() => {
    const watching = movies.filter((m) => m.status === "watching");
    const watched = movies.filter((m) => m.status === "watched");
    const wantToWatch = movies.filter((m) => m.status === "want_to_watch");
    const latest = [...movies].sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1
    )[0];
    return {
      total: movies.length,
      watching,
      watched,
      wantToWatch,
      latest,
    };
  }, [movies]);

  const recentPhotos = useMemo(() => {
    return [...photos]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 6);
  }, [photos]);

  // Backdrop for the hero: use the "watching" movie's backdrop if we have
  // one — gives the home page a cinematic vibe that changes with life.
  const heroBackdrop = useMemo(() => {
    const candidate =
      movieStats.watching.find((m) => m.backdrop_path) ??
      movieStats.watched.find((m) => m.backdrop_path) ??
      movieStats.wantToWatch.find((m) => m.backdrop_path);
    return candidate?.backdrop_path
      ? backdropUrl(candidate.backdrop_path, "w1280")
      : null;
  }, [movieStats]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HERO — greeting + days-together counter */}
      <section className="relative -mx-4 -mt-6 overflow-hidden px-4 pb-10 pt-10 sm:-mx-6 sm:rounded-b-[32px] sm:px-8 sm:pb-12 sm:pt-14 lg:-mx-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          {heroBackdrop && (
            <img
              src={heroBackdrop}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30 blur-2xl saturate-[1.2]"
            />
          )}
          <div className="absolute inset-0 bg-ambient-rose" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/80">
            {greeting(now)}
          </p>

          <h1 className="mt-2 text-[34px] font-semibold leading-[1.05] tracking-tight sm:text-[44px] lg:text-[52px]">
            Nossa <span className="font-serif italic text-primary">vida a dois</span>
          </h1>

          {/* DAYS TOGETHER — big, tabular, moment-of-truth number */}
          <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-4 sm:mt-10">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Estamos juntos há
              </p>
              <p className="mt-1 flex items-baseline gap-2 font-semibold tabular tracking-tight">
                <motion.span
                  key={days}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-[56px] leading-none text-foreground sm:text-[72px] lg:text-[88px]"
                >
                  {days}
                </motion.span>
                <span className="text-xl font-normal text-muted-foreground sm:text-2xl">
                  {days === 1 ? "dia" : "dias"}
                </span>
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                desde {formatFullDate(COUPLE_START_DATE)} ·{" "}
                <span className="text-foreground/80">
                  {formatBreakdown(breakdown)}
                </span>
              </p>
            </div>

            {/* MÊS-VERSÁRIO CARD */}
            <MonthAnniversaryCard
              daysUntil={anniv.daysUntil}
              isToday={anniv.isToday}
              monthCount={anniv.monthCount}
              targetDate={anniv.date}
            />
          </div>
        </motion.div>
      </section>

      {/* MOVIES SNAPSHOT */}
      <MoviesSnapshot stats={movieStats} />

      {/* GALLERY THUMBNAILS */}
      <GallerySnapshot recent={recentPhotos} />
    </div>
  );
}

/** -------------------------------------------------------------------- */

function MonthAnniversaryCard({
  daysUntil,
  isToday,
  monthCount,
  targetDate,
}: {
  daysUntil: number;
  isToday: boolean;
  monthCount: number;
  targetDate: Date;
}) {
  if (isToday) {
    return (
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-primary/40 bg-primary/10 px-5 py-4 ring-1 ring-primary/25 sm:px-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-ambient-rose opacity-60" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Hoje é mês-versário
          </p>
          <p className="mt-1 flex items-baseline gap-2 font-semibold tracking-tight">
            <span className="font-serif text-[34px] italic text-primary sm:text-[40px]">
              {monthCount} meses 🎉
            </span>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card/60 px-5 py-4 backdrop-blur-sm sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Próximo mês-versário
      </p>
      <p className="mt-1 flex items-baseline gap-2 font-semibold tabular tracking-tight">
        <span className="text-[28px] leading-none text-foreground sm:text-[34px]">
          faltam {daysUntil}
        </span>
        <span className="text-sm font-normal text-muted-foreground">
          {daysUntil === 1 ? "dia" : "dias"}
        </span>
      </p>
      <p className="mt-1.5 text-[11.5px] text-muted-foreground">
        Dia {formatShortDate(targetDate)} · {monthCount} meses juntos
      </p>
    </div>
  );
}

/** -------------------------------------------------------------------- */

function MoviesSnapshot({
  stats,
}: {
  stats: {
    total: number;
    watching: { id: string; title: string; poster_path: string | null }[];
    watched: unknown[];
    wantToWatch: unknown[];
    latest: { title: string; poster_path: string | null } | undefined;
  };
}) {
  return (
    <section>
      <header className="mb-4 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
            Biblioteca
          </p>
          <h2 className="mt-0.5 flex items-baseline gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            Nossos filmes
            {stats.total > 0 && (
              <span className="text-sm font-normal text-muted-foreground tabular">
                {stats.total}
              </span>
            )}
          </h2>
        </div>
        <Link
          to="/movies"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11.5px] font-medium text-foreground/80 backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground"
        >
          Ver todos
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-[1.15fr_1fr] sm:gap-4">
        {/* Stats card */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <MiniStat
            icon={<Play className="h-3.5 w-3.5" strokeWidth={2.25} />}
            label="Assistindo"
            value={stats.watching.length}
            accent="from-transparent via-amber-500/60 to-transparent"
            valueClassName="text-amber-500"
          />
          <MiniStat
            icon={<Clock className="h-3.5 w-3.5" strokeWidth={2.25} />}
            label="Fila"
            value={stats.wantToWatch.length}
            accent="from-transparent via-primary/60 to-transparent"
            valueClassName="text-primary"
          />
          <MiniStat
            icon={<CheckCheck className="h-3.5 w-3.5" strokeWidth={2.25} />}
            label="Já vimos"
            value={stats.watched.length}
            accent="from-transparent via-emerald-500/60 to-transparent"
            valueClassName="text-emerald-500"
          />
        </div>

        {/* Latest / currently watching spotlight */}
        {stats.watching[0] ? (
          <SpotlightMovie
            title={stats.watching[0].title}
            poster={stats.watching[0].poster_path}
            badge="Assistindo agora"
            tone="amber"
          />
        ) : stats.latest ? (
          <SpotlightMovie
            title={stats.latest.title}
            poster={stats.latest.poster_path}
            badge="Último adicionado"
            tone="primary"
          />
        ) : (
          <EmptyLibrary />
        )}
      </div>
    </section>
  );
}

function MiniStat({
  icon,
  label,
  value,
  accent,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  valueClassName?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r",
          accent
        )}
      />
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-2 text-[26px] font-semibold tabular tracking-tight sm:text-[30px]",
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SpotlightMovie({
  title,
  poster,
  badge,
  tone,
}: {
  title: string;
  poster: string | null;
  badge: string;
  tone: "amber" | "primary";
}) {
  const badgeTone =
    tone === "amber"
      ? "bg-amber-500/15 text-amber-500 ring-amber-500/25"
      : "bg-primary/15 text-primary ring-primary/25";

  return (
    <Link
      to="/movies"
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 transition-all hover:ring-1 hover:ring-primary/30 sm:gap-4 sm:p-3.5"
    >
      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/5 shadow-md shadow-black/20 sm:h-24 sm:w-16">
        {poster ? (
          <img
            src={posterUrl(poster, "w185")}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Film className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1",
            badgeTone
          )}
        >
          {tone === "amber" && <Play className="h-2.5 w-2.5" fill="currentColor" />}
          {badge}
        </span>
        <p className="mt-2 text-[14px] font-semibold leading-tight tracking-tight line-clamp-2 sm:text-[15px]">
          {title}
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground/80">
          Abrir biblioteca
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
}

function EmptyLibrary() {
  return (
    <Link
      to="/movies"
      className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-card/70"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
        <Film className="h-5 w-5 text-primary" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold">Biblioteca vazia</p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          Adicionem o primeiro filme pra começar a coleção.
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
    </Link>
  );
}

/** -------------------------------------------------------------------- */

function GallerySnapshot({
  recent,
}: {
  recent: { id: string; public_url: string; album_id: string }[];
}) {
  const count = recent.length;

  return (
    <section>
      <header className="mb-4 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
            Memórias recentes
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">
            Últimas fotos
          </h2>
        </div>
        <Link
          to="/gallery"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11.5px] font-medium text-foreground/80 backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground"
        >
          Ver galeria
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      {count === 0 ? (
        <Link
          to="/gallery"
          className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-card/70"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Images className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold">Galeria vazia</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Criem o primeiro mural e adicionem fotos.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
        </Link>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
          {recent.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.2) }}
            >
              <Link
                to={`/gallery/${p.album_id}`}
                className="group block aspect-square overflow-hidden rounded-xl ring-1 ring-border shadow-sm shadow-black/10 transition-all hover:ring-primary/40"
              >
                <img
                  src={p.public_url}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full select-none object-cover transition-transform duration-[450ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]"
                />
              </Link>
            </motion.div>
          ))}
          {/* Filler slots if we have fewer than 6 to keep the grid visually balanced */}
          {Array.from({ length: Math.max(0, 6 - count) }).map((_, i) => (
            <div
              key={`filler-${i}`}
              className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/20"
            >
              <Sparkles className="h-4 w-4 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** -------------------------------------------------------------------- */

function formatFullDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatBreakdown({
  years,
  months,
  days,
}: {
  years: number;
  months: number;
  days: number;
}): string {
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "ano" : "anos"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "mês" : "meses"}`);
  if (days > 0 || parts.length === 0)
    parts.push(`${days} ${days === 1 ? "dia" : "dias"}`);
  return parts.join(", ");
}
