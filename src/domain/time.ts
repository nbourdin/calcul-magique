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
