import { dayKey, daysBetween, isoWeekKey, startOfLocalDayPlus } from './time';

describe('startOfLocalDayPlus', () => {
  it('renvoie minuit local N jours plus tard', () => {
    const now = new Date(2026, 10, 19, 18, 30).getTime();
    expect(startOfLocalDayPlus(now, 1)).toBe(new Date(2026, 10, 20).getTime());
    expect(startOfLocalDayPlus(now, 21)).toBe(new Date(2026, 11, 10).getTime());
    expect(startOfLocalDayPlus(now, 0)).toBe(new Date(2026, 10, 19).getTime());
  });
});

describe('jours', () => {
  it('dayKey suit le fuseau demandé', () => {
    const ts = Date.UTC(2026, 10, 19, 23, 30); // 23h30 UTC = 00h30 à Paris le 20
    expect(dayKey(ts, 'UTC')).toBe('2026-11-19');
    expect(dayKey(ts, 'Europe/Paris')).toBe('2026-11-20');
    expect(dayKey(new Date(2026, 0, 5, 12).getTime())).toBe('2026-01-05');
  });

  it('daysBetween compte les jours calendaires', () => {
    expect(daysBetween('2026-11-19', '2026-11-20')).toBe(1);
    expect(daysBetween('2026-02-27', '2026-03-01')).toBe(2);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2); // passage à l'heure d'été
    expect(daysBetween('2026-11-20', '2026-11-19')).toBe(-1);
  });

  it.each([
    ['2026-11-19', '2026-W47'],
    ['2026-11-16', '2026-W47'],
    ['2026-11-22', '2026-W47'],
    ['2026-11-23', '2026-W48'],
    ['2021-01-03', '2020-W53'],
    ['2024-12-30', '2025-W01'],
    ['2026-01-01', '2026-W01'],
  ])('isoWeekKey(%s) = %s', (day, week) => {
    expect(isoWeekKey(day)).toBe(week);
  });
});
