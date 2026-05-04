import { Heart } from "lucide-react";
import { useOptionalCouple } from "@/hooks/use-couple";
import { cn } from "@/lib/utils";

interface CoupleLogoProps {
  /** Tailwind size class — controls both wrapper and fallback heart */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Optional extra classes for the wrapper */
  className?: string;
  /** Make the logo glow with the primary color halo (used on login + home) */
  glow?: boolean;
  /** Render with rounded-full (default rounded-2xl) */
  rounded?: "full" | "2xl" | "3xl";
}

const SIZE_CLASSES: Record<NonNullable<CoupleLogoProps["size"]>, {
  wrap: string;
  heart: string;
  heartStroke: number;
}> = {
  xs: { wrap: "h-5 w-5", heart: "h-3 w-3", heartStroke: 0 },
  sm: { wrap: "h-7 w-7", heart: "h-4 w-4", heartStroke: 0 },
  md: { wrap: "h-9 w-9", heart: "h-5 w-5", heartStroke: 0 },
  lg: { wrap: "h-14 w-14", heart: "h-7 w-7", heartStroke: 0 },
  xl: { wrap: "h-20 w-20", heart: "h-10 w-10", heartStroke: 0 },
};

/**
 * Logo dinâmica do casal — usa `couples.logo_url` quando disponível,
 * senão cai no coração coral padrão. Compartilha cache HTTP entre instâncias
 * porque é a mesma URL pública em todas as telas.
 */
export function CoupleLogo({
  size = "md",
  className,
  glow = false,
  rounded = "2xl",
}: CoupleLogoProps) {
  const ctx = useOptionalCouple();
  const logoUrl = ctx?.couple?.logo_url ?? null;
  const sz = SIZE_CLASSES[size];
  const roundedCls =
    rounded === "full" ? "rounded-full" : rounded === "3xl" ? "rounded-3xl" : "rounded-2xl";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {glow && (
        <div className="pointer-events-none absolute inset-0 -z-10 scale-150 rounded-full bg-primary/40 blur-lg" />
      )}
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Logo do casal"
          className={cn(
            sz.wrap,
            roundedCls,
            "object-cover ring-1 ring-primary/20 shadow-md shadow-primary/10"
          )}
        />
      ) : (
        <span
          className={cn(
            "inline-flex items-center justify-center",
            sz.wrap
          )}
        >
          <Heart
            className={cn(sz.heart, "text-primary")}
            fill="currentColor"
            strokeWidth={sz.heartStroke}
          />
        </span>
      )}
    </div>
  );
}
