import type { Question } from '../types';

/**
 * Déroulé d'une série (PRD §5) : une mauvaise réponse affiche l'aide et la question
 * revient une seconde fois en fin de série. Seule la première tentative compte.
 */
export interface RunItem {
  question: Question;
  attempt: 1 | 2;
}

export type RunPhase = 'question' | 'success' | 'help' | 'done';

export interface RunState {
  /** File restante ; la question courante est la première. */
  queue: RunItem[];
  phase: RunPhase;
  /** questionId → bonne réponse du premier coup. */
  firstTry: Record<string, boolean>;
  /** Temps de réponse des bonnes réponses du premier coup (mode chrono). */
  correctFirstTryMs: number[];
  questionCount: number;
}

export function startRun(questions: readonly Question[]): RunState {
  return {
    queue: questions.map((question) => ({ question, attempt: 1 })),
    phase: questions.length === 0 ? 'done' : 'question',
    firstTry: {},
    correctFirstTryMs: [],
    questionCount: questions.length,
  };
}

export function currentItem(state: RunState): RunItem | undefined {
  return state.phase === 'done' ? undefined : state.queue[0];
}

/** Enregistre la réponse à la question courante. */
export function submitAnswer(state: RunState, correct: boolean, responseMs = 0): RunState {
  const item = currentItem(state);
  if (!item || state.phase !== 'question') return state;
  const isFirst = item.attempt === 1;
  return {
    ...state,
    phase: correct ? 'success' : 'help',
    firstTry: isFirst ? { ...state.firstTry, [item.question.id]: correct } : state.firstTry,
    correctFirstTryMs:
      isFirst && correct ? [...state.correctFirstTryMs, responseMs] : state.correctFirstTryMs,
    // Seconde chance en fin de série, une seule fois.
    queue: !correct && isFirst ? [...state.queue, { question: item.question, attempt: 2 }] : state.queue,
  };
}

/** Passe à la question suivante après le retour (succès ou aide). */
export function advance(state: RunState): RunState {
  if (state.phase !== 'success' && state.phase !== 'help') return state;
  const queue = state.queue.slice(1);
  return { ...state, queue, phase: queue.length === 0 ? 'done' : 'question' };
}

export function firstTryCorrectCount(state: RunState): number {
  return Object.values(state.firstTry).filter(Boolean).length;
}

/** Nombre de questions déjà traitées au premier passage (pour la barre de progression). */
export function answeredCount(state: RunState): number {
  return Object.keys(state.firstTry).length;
}
