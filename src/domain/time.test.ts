import { startOfLocalDayPlus } from './time';

describe('startOfLocalDayPlus', () => {
  it('renvoie minuit local N jours plus tard', () => {
    const now = new Date(2026, 10, 19, 18, 30).getTime();
    expect(startOfLocalDayPlus(now, 1)).toBe(new Date(2026, 10, 20).getTime());
    expect(startOfLocalDayPlus(now, 21)).toBe(new Date(2026, 11, 10).getTime());
    expect(startOfLocalDayPlus(now, 0)).toBe(new Date(2026, 10, 19).getTime());
  });
});
