import { useEffect } from "react";
import { useOptionalCouple } from "@/hooks/use-couple";
import { useTheme } from "@/hooks/use-theme";

/**
 * Injeta variáveis CSS overrides no <html> com base em `couple.accent_hue`.
 * Mantém as luminosidades / cromas alinhadas com o tema editorial — só o
 * hue muda. Null/undefined = remove os overrides (volta pro coral default).
 *
 * Renderiza nada — é só um efeito.
 */
export function ThemeApplier() {
  const ctx = useOptionalCouple();
  const hue = ctx?.couple?.accent_hue ?? null;
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const props = [
      "--primary",
      "--primary-foreground",
      "--ring",
      "--sidebar-primary",
      "--sidebar-primary-foreground",
      "--chart-1",
    ];

    if (hue == null || Number.isNaN(hue)) {
      // Remove overrides → cai pro CSS padrão de :root / .dark
      props.forEach((p) => root.style.removeProperty(p));
      return;
    }

    // Match o tom dos defaults do index.css (.dark mode mais luminoso, light
    // mode mais saturado). Isso preserva contraste em ambos os temas.
    const isDark = theme === "dark";
    const lightness = isDark ? 0.78 : 0.64;
    const chroma = isDark ? 0.155 : 0.17;
    const fgL = isDark ? 0.145 : 0.995;

    root.style.setProperty("--primary", `oklch(${lightness} ${chroma} ${hue})`);
    root.style.setProperty("--primary-foreground", `oklch(${fgL} 0 0)`);
    root.style.setProperty(
      "--ring",
      `oklch(${lightness} ${chroma} ${hue} / ${isDark ? 0.5 : 0.55})`
    );
    root.style.setProperty(
      "--sidebar-primary",
      `oklch(${lightness} ${chroma} ${hue})`
    );
    root.style.setProperty("--sidebar-primary-foreground", `oklch(${fgL} 0 0)`);
    root.style.setProperty("--chart-1", `oklch(${lightness} ${chroma} ${hue})`);
  }, [hue, theme]);

  return null;
}
