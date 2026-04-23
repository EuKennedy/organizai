/**
 * Date the couple started dating. Drives every "estamos juntos há…" and
 * "faltam X dias pro mês-versário" counter on the Home page.
 *
 * ISO 8601 (yyyy-mm-dd). Local timezone interpretation.
 */
export const COUPLE_START_DATE = "2026-01-03";

/** Strip time, return a stable local Date at 00:00 for the given ISO day. */
function startOfDay(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00`) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Inclusive day diff, e.g. same day → 0. */
export function daysBetween(a: Date | string, b: Date | string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const A = startOfDay(a).getTime();
  const B = startOfDay(b).getTime();
  return Math.round((B - A) / MS_PER_DAY);
}

/** Days since we started dating, clamped at 0. */
export function daysTogether(today: Date = new Date()): number {
  return Math.max(0, daysBetween(COUPLE_START_DATE, today));
}

/** Break daysTogether into years + months + days for a textured display. */
export function togetherBreakdown(
  today: Date = new Date()
): { years: number; months: number; days: number } {
  const start = startOfDay(COUPLE_START_DATE);
  const now = startOfDay(today);

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    // days in previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

/**
 * The "mês-versário" is the same day-of-month as the start date.
 * Returns the next one (today or later), days until it, and whether
 * today IS the anniversary (mesversário).
 */
export function nextMonthAnniversary(today: Date = new Date()): {
  date: Date;
  daysUntil: number;
  isToday: boolean;
  monthCount: number;
} {
  const start = startOfDay(COUPLE_START_DATE);
  const dayOfMonth = start.getDate();
  const now = startOfDay(today);

  const candidateThisMonth = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  const target =
    candidateThisMonth.getTime() >= now.getTime()
      ? candidateThisMonth
      : new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);

  const daysUntil = daysBetween(now, target);
  const isToday = daysUntil === 0;

  // How many complete months since start, counting the target.
  const monthCount =
    (target.getFullYear() - start.getFullYear()) * 12 +
    (target.getMonth() - start.getMonth());

  return { date: target, daysUntil, isToday, monthCount };
}

/** Pick "Bom dia" / "Boa tarde" / "Boa noite" for the greeting header. */
export function greeting(today: Date = new Date()): string {
  const h = today.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
