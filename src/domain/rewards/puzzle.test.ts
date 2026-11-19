import {
  isComplete,
  nextCharacterChoices,
  pieceOrder,
  placedPieces,
  placePiece,
  PUZZLE_PIECES,
  startPuzzle,
} from './puzzle';

describe('puzzle 3×3', () => {
  it('chaque personnage a un ordre de pose stable couvrant les 9 pièces', () => {
    const order = pieceOrder('fee');
    expect([...order].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(pieceOrder('fee')).toEqual(order);
    expect(pieceOrder('licorne')).not.toEqual(order);
  });

  it('9 pièces posées complètent le puzzle', () => {
    let progress = startPuzzle('p1', 'fee', 0);
    const indices: number[] = [];
    for (let i = 1; i <= PUZZLE_PIECES; i++) {
      const r = placePiece(progress, 1000 + i);
      indices.push(r.pieceIndex);
      expect(r.completed).toBe(i === PUZZLE_PIECES);
      progress = r.progress;
    }
    expect(indices).toEqual(pieceOrder('fee'));
    expect(placedPieces(progress)).toEqual(indices);
    expect(isComplete(progress)).toBe(true);
    expect(progress.completedAt).toBe(1009);
    expect(() => placePiece(progress, 2000)).toThrow();
  });

  it('propose les 3 prochains personnages non terminés', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const done = { ...startPuzzle('p1', 'b', 0), piecesPlaced: 9 };
    const partial = { ...startPuzzle('p1', 'a', 0), piecesPlaced: 4 };
    expect(nextCharacterChoices(ids, [done, partial])).toEqual(['a', 'c', 'd']);
    expect(nextCharacterChoices(['a'], [{ ...partial, piecesPlaced: 9 }])).toEqual([]);
  });
});
