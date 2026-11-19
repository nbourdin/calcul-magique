import { columnLayout, type ColumnLayout } from '@/domain/column';
import type { QuestionDisplay } from '@/domain/types';
import {
  activeCell,
  emptyEntry,
  entryValue,
  eraseDigit,
  pendingAction,
  resolvePending,
  shownTop,
  solvedEntry,
  typeDigit,
} from './entry';

const layoutOf = (a: number, op: '+' | '−', b: number): ColumnLayout => {
  const display: QuestionDisplay = { a, op, b, missing: 'result' };
  const layout = columnLayout(display);
  if (!layout) throw new Error('pas posable');
  return layout;
};

describe('saisie du calcul posé', () => {
  it('remplit les cases depuis les unités', () => {
    const layout = layoutOf(23, '+', 14);
    let entry = emptyEntry(layout);
    expect(activeCell(entry)).toBe(0);
    entry = typeDigit(layout, entry, 7);
    expect(activeCell(entry)).toBe(1);
    expect(entryValue(entry)).toBeNull();
    entry = typeDigit(layout, entry, 3);
    expect(activeCell(entry)).toBeNull();
    expect(entryValue(entry)).toBe(37);
    // Case pleine : un chiffre de plus ne change rien.
    expect(typeDigit(layout, entry, 9)).toBe(entry);
  });

  it('efface le dernier chiffre posé', () => {
    const layout = layoutOf(23, '+', 14);
    const entry = typeDigit(layout, typeDigit(layout, emptyEntry(layout), 7), 3);
    expect(eraseDigit(entry).digits).toEqual([7, null]);
    expect(eraseDigit(emptyEntry(layout)).digits).toEqual([null, null]);
  });

  it('attend la retenue avant les dizaines', () => {
    const layout = layoutOf(27, '+', 15);
    let entry = typeDigit(layout, emptyEntry(layout), 2);
    expect(pendingAction(layout, entry)).toEqual({ kind: 'carry', column: 1 });
    entry = resolvePending(layout, entry);
    expect(entry.carriesSent).toEqual([false, true]);
    expect(pendingAction(layout, entry)).toBeNull();
  });

  it('pose la retenue toute seule si l’enfant tape directement', () => {
    const layout = layoutOf(27, '+', 15);
    const entry = typeDigit(layout, typeDigit(layout, emptyEntry(layout), 2), 4);
    expect(entry.carriesSent[1]).toBe(true);
    expect(entryValue(entry)).toBe(42);
  });

  it('casse une dizaine avant les unités', () => {
    const layout = layoutOf(53, '−', 27);
    let entry = emptyEntry(layout);
    expect(pendingAction(layout, entry)).toEqual({ kind: 'borrow', column: 0 });
    entry = resolvePending(layout, entry);
    expect(shownTop(layout, entry, 0)).toBe(13);
    expect(shownTop(layout, entry, 1)).toBe(4);
    expect(pendingAction(layout, entry)).toBeNull();
  });

  it('démonstration : colonnes remplies une à une, retenue comprise', () => {
    const layout = layoutOf(27, '+', 15);
    expect(solvedEntry(layout, 0).digits).toEqual([null, null]);
    expect(solvedEntry(layout, 1)).toMatchObject({ digits: [2, null], carriesSent: [false, true] });
    expect(entryValue(solvedEntry(layout))).toBe(42);
  });
});
