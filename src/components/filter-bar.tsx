import { useState, type ReactNode } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  active: number;
  onClear: () => void;
  children: ReactNode;
  /** Se quiser controlar abertura externamente */
  defaultOpen?: boolean;
}

/**
 * Polished collapsible filter panel used across list pages.
 * - Icon chip with count badge (not a generic chevron button)
 * - Smooth height animation
 * - Clear filters inline
 */
export function FilterBar({ active, onClear, children, defaultOpen = false }: FilterBarProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all",
            active > 0
              ? "border-primary/40 bg-primary/12 text-primary"
              : "border-border bg-card/60 text-foreground/80 hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {active > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {active}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
        {active > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="filter-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 rounded-2xl border border-border bg-card/50 p-4 backdrop-blur-sm">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}
