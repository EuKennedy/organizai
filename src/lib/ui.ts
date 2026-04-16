/**
 * Canonical button styles used across the app.
 * Always rounded-full. Always hover-lift. One primary. One secondary. One ghost.
 */
export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover-glow-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-sm";

export const btnPrimarySm =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover-glow-primary disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground";

export const btnSecondarySm =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground";

export const chip =
  "inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium transition-all";

export const chipActive =
  "border-primary/30 bg-primary/12 text-primary ring-1 ring-primary/20";

export const chipIdle =
  "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground";
