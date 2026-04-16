import { useRef, useState, useEffect, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaCarouselShellProps {
  eyebrow?: string;
  title: ReactNode;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Shared shell for horizontally-scrolling rails (movies, series, mimos).
 * - Faded edges
 * - Hover-reveal arrows (desktop)
 * - Snap scrolling
 */
export function MediaCarouselShell({
  eyebrow,
  title,
  count,
  action,
  children,
}: MediaCarouselShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setAtStart(el.scrollLeft <= 4);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="group/rail space-y-4">
      <div className="flex items-end justify-between gap-4 px-1">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-muted-foreground/70">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-0.5 flex items-baseline gap-2.5 text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
            {typeof count === "number" && count > 0 && (
              <span className="text-sm font-normal text-muted-foreground tabular">
                {count}
              </span>
            )}
          </h2>
        </div>
        {action}
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-200 sm:w-14",
            atStart ? "opacity-0" : "opacity-100"
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 sm:w-14",
            atEnd ? "opacity-0" : "opacity-100"
          )}
        />

        {/* Arrows (desktop only) */}
        <button
          type="button"
          onClick={() => scroll("left")}
          disabled={atStart}
          aria-label="Rolar esquerda"
          className={cn(
            "absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-xl ring-1 ring-border backdrop-blur-md transition-all duration-200 sm:flex",
            "opacity-0 group-hover/rail:opacity-100 hover:scale-[1.08] disabled:opacity-0 disabled:pointer-events-none"
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          disabled={atEnd}
          aria-label="Rolar direita"
          className={cn(
            "absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-xl ring-1 ring-border backdrop-blur-md transition-all duration-200 sm:flex",
            "opacity-0 group-hover/rail:opacity-100 hover:scale-[1.08] disabled:opacity-0 disabled:pointer-events-none"
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 sm:gap-4"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
