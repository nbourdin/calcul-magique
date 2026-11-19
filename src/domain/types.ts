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
  /** Formulation en mots plutôt qu'en opération : « Double de 8 », « Moitié de 16 ». */
  wording?: 'double' | 'half';
  strategy?: { steps: string[]; visual: StrategyVisual };
}

export type GameId = 'house10' | 'frog' | 'bubbles' | 'race' | 'shop';

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
  /** Première apparition du fait : sert à limiter les nouveaux faits par jour. */
  introducedAt: number;
}

export interface Settings {
  sessionMinutes: 5 | 10 | 15 | 20;
  seriesBeforeBreak: number;
  chronoMode: 'off' | 'soft' | 'on';
  sound: boolean;
  voice: boolean;
  startLevel: Level;
  /** « Tout débloquer » : tous les mondes ouverts, sans attendre la maîtrise. */
  unlockAll: boolean;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  settings: Settings;
}

export interface Attempt {
  id: string;
  profileId: string;
  factKey: string;
  skillId: SkillId;
  gameId: GameId;
  correctFirstTry: boolean;
  responseMs: number;
  usedHelp: boolean;
  ts: number;
  seriesId: string;
}

export type Stars = 1 | 2 | 3;

export interface Series {
  id: string;
  profileId: string;
  skillId: SkillId;
  gameId: GameId;
  startedAt: number;
  endedAt: number;
  stars: Stars;
  mode: 'practice' | 'daily' | 'chrono';
  /** Bonnes réponses du premier coup, sur `questionCount`. */
  firstTryCorrect: number;
  /** Étoile bonus du mode chrono (0 ou 1), en plus des étoiles de la série. */
  bonusStars?: number;
  questionCount: number;
}

/** Métadonnées d'un personnage de l'album (un fichier JSON par personnage). */
export interface CharacterMeta {
  id: string;
  /** Ordre de proposition dans l'album. */
  order: number;
  name: string;
  title: string;
  color: string;
  greeting: string;
}
