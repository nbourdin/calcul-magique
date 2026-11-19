export const DAY_MS = 86_400_000;

/**
 * Minuit local du jour `days` jours après `ts`.
 * Un fait « dû dans 1 jour » est ainsi disponible dès le lendemain matin,
 * quelle que soit l'heure de la séance.
 */
export function startOfLocalDayPlus(ts: number, days: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** Jour calendaire « YYYY-MM-DD » dans le fuseau donné (par défaut : celui de l'appareil). */
export function dayKey(ts: number, timeZone?: string): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
  if (timeZone) options.timeZone = timeZone;
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(new Date(ts));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function dayToUtc(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

/** Nombre de jours de `from` à `to` (positif si `to` est après). */
export function daysBetween(from: string, to: string): number {
  return Math.round((dayToUtc(to) - dayToUtc(from)) / DAY_MS);
}

/** Semaine ISO du jour, ex. "2026-W47". */
export function isoWeekKey(day: string): string {
  const date = new Date(dayToUtc(day));
  const weekday = (date.getUTCDay() + 6) % 7; // lundi = 0
  date.setUTCDate(date.getUTCDate() - weekday + 3); // jeudi de la semaine
  const year = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / DAY_MS - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
    );
  return `${year}-W${String(week).padStart(2, '0')}`;
}
