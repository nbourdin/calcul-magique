import { applyOp, evaluate, hiddenValue } from './display';

describe('display', () => {
  it('calcule les trois opérations', () => {
    expect(applyOp(6, '+', 9)).toBe(15);
    expect(applyOp(23, '−', 9)).toBe(14);
    expect(applyOp(3, '×', 7)).toBe(21);
  });

  it('retrouve le terme caché', () => {
    expect(hiddenValue({ a: 7, op: '+', b: 3, missing: 'b' })).toBe(3);
    expect(hiddenValue({ a: 3, op: '+', b: 7, missing: 'a' })).toBe(3);
    expect(hiddenValue({ a: 6, op: '+', b: 9 })).toBe(15);
  });

  it('refuse une opération sans second terme', () => {
    expect(() => evaluate({ a: 8, op: '+', b: null })).toThrow();
    expect(() => hiddenValue({ a: 8, op: '+', b: null, missing: 'b' })).toThrow();
  });
});
