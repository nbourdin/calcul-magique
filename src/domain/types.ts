/** Identifiants des compétences du référentiel (PRD §4). */
export type SkillId =
  'C10' | 'C20' | 'CDS' | 'DBL' | 'PDB' | 'TAD' | 'P9' | 'M9' | 'D10' | 'T2' | 'T5' | 'T10' | 'T3' | 'T4';

export type Level = 1 | 2 | 3;

/** Opérateurs affichés (signes typographiques, pas le tiret ASCII). */
export type Op = '+' | '−' | '×';

export type StrategyVisual = 'numberline' | 'tenframe' | 'house10' | 'coins';

export interface QuestionDisplay {
  a: number;
  op: Op;
  b: number | null;
  /**
   * Terme caché à trouver. Le résultat affiché se calcule avec `evaluate(display)`.
   * Ex. `7 + _ = 10` → { a: 7, op: '+', b: 3, missing: 'b' }.
   */
  missing?: 'a' | 'b' | 'result';
}

export interface Question {
  id: string;
  skillId: SkillId;
  /** Unité suivie par le moteur adaptatif, ex. "p9:6". */
  factKey: string;
  /** Niveau de présentation (1 : choix multiples + support visuel ; 2-3 : pavé numérique). */
  level: Level;
  display: QuestionDisplay;
  answer: number;
  /** 3 propositions uniques, positives, dont la bonne. */
  choices?: number[];
  strategy?: { steps: string[]; visual: StrategyVisual };
}

export type LeitnerBox = 0 | 1 | 2 | 3 | 4;

export interface FactState {
  profileId: string;
  factKey: string;
  skillId: SkillId;
  box: LeitnerBox;
  dueAt: number;
  seenCount: number;
  correctFirstTry: number;
  consecutiveCorrect: number;
  avgMs: number;
}
