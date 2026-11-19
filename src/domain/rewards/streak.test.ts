import { EMPTY_STREAK, flameStatus, recordPlayDay, type Streak } from './streak';

const s = (patch: Partial<Streak>): Streak => ({ ...EMPTY_STREAK, ...patch });

describe('flamme', () => {
  it('démarre au premier jour joué', () => {
    expect(flameStatus(EMPTY_STREAK, '2026-11-19')).toBe('none');
    const { streak, change } = recordPlayDay(EMPTY_STREAK, '2026-11-19');
    expect(change).toBe('started');
    expect(streak).toMatchObject({ count: 1, best: 1, lastDay: '2026-11-19' });
  });

  it('ne compte qu’une fois par jour', () => {
    const lit = s({ count: 3, best: 3, lastDay: '2026-11-19' });
    expect(flameStatus(lit, '2026-11-19')).toBe('lit');
    expect(recordPlayDay(lit, '2026-11-19')).toEqual({ streak: lit, change: 'same' });
  });

  it('grandit le lendemain', () => {
    const before = s({ count: 3, best: 5, lastDay: '2026-11-18' });
    expect(flameStatus(before, '2026-11-19')).toBe('waiting');
    expect(recordPlayDay(before, '2026-11-19')).toEqual({
      streak: { ...before, count: 4, lastDay: '2026-11-19' },
      change: 'grew',
    });
  });

  it('accorde 1 jour de répit par semaine', () => {
    const before = s({ count: 4, best: 4, lastDay: '2026-11-17' });
    expect(flameStatus(before, '2026-11-19')).toBe('waiting');
    const { streak, change } = recordPlayDay(before, '2026-11-19');
    expect(change).toBe('grace');
    expect(streak).toMatchObject({ count: 5, best: 5, graceUsedWeek: '2026-W47' });
    // Deuxième trou dans la même semaine : en veille.
    expect(flameStatus({ ...streak, lastDay: '2026-11-19' }, '2026-11-21')).toBe('asleep');
    // La semaine suivante, le répit revient.
    expect(flameStatus({ ...streak, lastDay: '2026-11-22' }, '2026-11-24')).toBe('waiting');
  });

  it('se réveille après une longue pause sans perdre le record', () => {
    const before = s({ count: 6, best: 9, lastDay: '2026-11-10' });
    expect(flameStatus(before, '2026-11-19')).toBe('asleep');
    const { streak, change } = recordPlayDay(before, '2026-11-19');
    expect(change).toBe('woke');
    expect(streak).toMatchObject({ count: 1, best: 9 });
  });
});
