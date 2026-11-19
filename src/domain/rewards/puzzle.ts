import { createRng, shuffle } from '../rng';

export const PUZZLE_PIECES = 9;
/** L'enfant choisit son prochain personnage parmi les 3 prochains non débloqués. */
export const NEXT_CHOICES = 3;

export interface PuzzleProgress {
  profileId: string;
  characterId: string;
  piecesPlaced: number;
  startedAt: number;
  completedAt?: number;
}

function hash(text: string): number {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ (c.codePointAt(0) ?? 0), 16777619);
  return h >>> 0;
}

/** Ordre de pose des pièces (0 à 8, de gauche à droite puis de haut en bas), propre à chaque personnage. */
export function pieceOrder(characterId: string): number[] {
  return shuffle(
    createRng(hash(characterId)),
    Array.from({ length: PUZZLE_PIECES }, (_, i) => i),
  );
}

export function placedPieces(progress: Pick<PuzzleProgress, 'characterId' | 'piecesPlaced'>): number[] {
  return pieceOrder(progress.characterId).slice(0, progress.piecesPlaced);
}

export function isComplete(progress: Pick<PuzzleProgress, 'piecesPlaced'>): boolean {
  return progress.piecesPlaced >= PUZZLE_PIECES;
}

export function startPuzzle(profileId: string, characterId: string, now: number): PuzzleProgress {
  return { profileId, characterId, piecesPlaced: 0, startedAt: now };
}

/** Pose la pièce suivante ; renvoie aussi l'indice de la pièce posée. */
export function placePiece(
  progress: PuzzleProgress,
  now: number,
): { progress: PuzzleProgress; pieceIndex: number; completed: boolean } {
  if (isComplete(progress)) throw new Error(`Puzzle déjà terminé : ${progress.characterId}`);
  const pieceIndex = pieceOrder(progress.characterId)[progress.piecesPlaced] as number;
  const piecesPlaced = progress.piecesPlaced + 1;
  const completed = piecesPlaced >= PUZZLE_PIECES;
  return {
    progress: { ...progress, piecesPlaced, ...(completed ? { completedAt: now } : {}) },
    pieceIndex,
    completed,
  };
}

/** Les prochains personnages proposés : les premiers du catalogue pas encore terminés. */
export function nextCharacterChoices(
  catalogIds: readonly string[],
  puzzles: readonly PuzzleProgress[],
  count = NEXT_CHOICES,
): string[] {
  const done = new Set(puzzles.filter(isComplete).map((p) => p.characterId));
  return catalogIds.filter((id) => !done.has(id)).slice(0, count);
}
