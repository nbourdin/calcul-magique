import { columnLayout, columnSteps, digitsOf } from './column';
import type { QuestionDisplay } from './types';

const add = (a: number, b: number): QuestionDisplay => ({ a, op: '+', b, missing: 'result' });
const sub = (a: number, b: number): QuestionDisplay => ({ a, op: '−', b, missing: 'result' });

describe('calcul posé', () => {
  it('découpe un nombre en chiffres, unités d’abord', () => {
    expect(digitsOf(427)).toEqual([7, 2, 4]);
    expect(digitsOf(0)).toEqual([0]);
  });

  it('addition sans retenue', () => {
    const layout = columnLayout(add(23, 14));
    expect(layout).toMatchObject({ width: 2, top: [3, 2], bottom: [4, 1], result: [7, 3], carries: [0, 0] });
    expect(columnSteps(add(23, 14))).toEqual(['3 + 4 = 7', '2 + 1 = 3', '23 + 14 = 37']);
  });

  it('addition avec retenue, second nombre à un chiffre', () => {
    expect(columnLayout(add(27, 5))).toMatchObject({ bottom: [5, null], result: [2, 3], carries: [0, 1] });
    expect(columnSteps(add(27, 15))).toEqual(['7 + 5 = 12', '1 + 2 + 1 = 4', '27 + 15 = 42']);
    expect(columnSteps(add(27, 5))).toEqual(['7 + 5 = 12', '1 + 2 = 3', '27 + 5 = 32']);
  });

  it('la retenue peut créer une colonne de plus', () => {
    expect(columnLayout(add(8, 5))).toMatchObject({
      width: 2,
      top: [8, null],
      result: [3, 1],
      carries: [0, 1],
    });
    expect(columnLayout(add(67, 48))).toMatchObject({ width: 3, result: [5, 1, 1], carries: [0, 1, 1] });
  });

  it('soustraction sans emprunt', () => {
    expect(columnLayout(sub(58, 23))).toMatchObject({ borrows: [false, false], topAfter: [8, 5] });
    expect(columnSteps(sub(58, 23))).toEqual(['8 − 3 = 5', '5 − 2 = 3', '58 − 23 = 35']);
  });

  it('soustraction en cassant une dizaine', () => {
    expect(columnLayout(sub(53, 27))).toMatchObject({ borrows: [true, false], topAfter: [13, 4] });
    expect(columnSteps(sub(53, 27))).toEqual(['13 − 7 = 6', '4 − 2 = 2', '53 − 27 = 26']);
    expect(columnSteps(sub(43, 7))).toEqual(['13 − 7 = 6', '4 − 1 = 3', '43 − 7 = 36']);
  });

  it('emprunts en chaîne', () => {
    expect(columnLayout(sub(100, 1))).toMatchObject({
      result: [9, 9],
      borrows: [true, true, false],
      topAfter: [10, 9, 0],
    });
  });

  it('refuse ce qui ne se pose pas', () => {
    expect(columnLayout({ a: 3, op: '×', b: 4 })).toBeNull();
    expect(columnLayout({ a: 3, op: '+', b: 4, missing: 'b' })).toBeNull();
    expect(columnLayout(sub(3, 4))).toBeNull();
    expect(columnSteps({ a: 3, op: '×', b: 4 })).toEqual([]);
  });
});
