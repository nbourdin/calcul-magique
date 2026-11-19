import { starsForSeries } from './stars';

describe('starsForSeries', () => {
  it.each([
    [0, 1],
    [6, 1],
    [7, 2],
    [8, 2],
    [9, 3],
    [10, 3],
  ] as const)('%i bonnes réponses du premier coup → %i étoile(s)', (n, stars) => {
    expect(starsForSeries(n)).toBe(stars);
  });
});
