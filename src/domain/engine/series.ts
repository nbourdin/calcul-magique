import { shuffle, type Rng } from '../rng';
import { factsFor, getSkill, isSkillAvailable, questionForFact } from '../skills';
import type { FactState, Level, Question, SkillId } from '../types';
import { isDue, isMastered } from './leitner';

export const SERIES_SIZE = 10;
export const REVIEW_QUOTA = 5;
export const LEARNING_QUOTA = 3;
export const NEW_QUOTA = 2;
export const MAX_NEW_FACTS_PER_DAY = 3;
export const MAX_SAME_FACT_PER_SERIES = 2;
/** La bonne réponse n'occupe jamais la même position plus de 2 fois de suite. */
export const MAX_SAME_ANSWER_POSITION = 2;

export interface ComposeSeriesInput {
  skillId: SkillId;
  level: Level;
  /** États Leitner du profil (toutes compétences confondues). */
  states: readonly FactState[];
  now: number;
  /** Nombre de faits nouveaux déjà introduits aujourd'hui. */
  newFactsIntroducedToday: number;
  rng: Rng;
  /** Niveau courant des autres compétences, pour présenter les révisions (défaut : 1). */
  levels?: Partial<Record<SkillId, Level>>;
  /** Compétences dont on révise les faits échus (défaut : la compétence choisie). */
  reviewSkills?: readonly SkillId[];
}

export interface SeriesPlan {
  questions: Question[];
  /** Faits introduits pour la première fois, à ajouter au compteur du jour. */
  newFactKeys: string[];
}

interface Pick {
  factKey: string;
  skillId: SkillId;
}

const byPriority = (a: FactState, b: FactState) => a.box - b.box || a.dueAt - b.dueAt;

/**
 * Compose une série (PRD §8) : 5 faits à réviser, 3 en cours d'apprentissage, 2 nouveaux
 * (dans la limite de 3 nouveaux par jour), puis complète avec la compétence choisie.
 *
 * Ordre de complément quand les quotas ne suffisent pas : autres faits en cours, faits déjà
 * vus, répétition d'un fait déjà tiré de cette compétence (2 fois max), et en dernier recours des faits nouveaux
 * au-delà du quota quotidien (ex. toute première série).
 */
export function composeSeries(input: ComposeSeriesInput): SeriesPlan {
  const { skillId, level, states, now, rng } = input;
  const reviewSkills = input.reviewSkills ?? [skillId];
  const levelOf = (id: SkillId): Level => (id === skillId ? level : (input.levels?.[id] ?? 1));
  getSkill(skillId); // échoue tôt si la compétence n'existe pas

  const picks: Pick[] = [];
  const counts = new Map<string, number>();
  const add = (p: Pick) => {
    picks.push(p);
    counts.set(p.factKey, (counts.get(p.factKey) ?? 0) + 1);
  };
  const free = () => SERIES_SIZE - picks.length;
  const unpicked = (s: FactState) => !counts.has(s.factKey);
  // Mélange avant le tri stable : départage aléatoire des ex æquo.
  const ordered = (list: readonly FactState[]) => shuffle(rng, list).sort(byPriority);

  // 1. Révisions : faits échus, boîtes basses d'abord.
  const due = ordered(
    states.filter(
      (s) =>
        reviewSkills.includes(s.skillId) && isSkillAvailable(s.skillId) && s.seenCount > 0 && isDue(s, now),
    ),
  );
  due.slice(0, REVIEW_QUOTA).forEach(add);

  // 2. En cours d'apprentissage dans la compétence choisie.
  const skillStates = states.filter((s) => s.skillId === skillId);
  const learning = () => ordered(skillStates.filter((s) => unpicked(s) && !isMastered(s)));
  learning().slice(0, Math.min(LEARNING_QUOTA, free())).forEach(add);

  // 3. Faits nouveaux du niveau, dans la limite quotidienne.
  const known = new Set(skillStates.map((s) => s.factKey));
  const fresh = shuffle(
    rng,
    factsFor(skillId, level).filter((f) => !known.has(f)),
  );
  const newAllowed = Math.max(0, Math.min(NEW_QUOTA, MAX_NEW_FACTS_PER_DAY - input.newFactsIntroducedToday));
  const newFactKeys: string[] = [];
  const addNew = (n: number) => {
    for (const factKey of fresh.splice(0, Math.min(n, free()))) {
      newFactKeys.push(factKey);
      add({ factKey, skillId });
    }
  };
  addNew(newAllowed);

  // 4. Complément avec la compétence choisie.
  learning().slice(0, free()).forEach(add);
  ordered(skillStates.filter(unpicked)).slice(0, free()).forEach(add);
  const repeatChosenSkill = () => {
    for (const p of [...picks].reverse()) {
      if (free() === 0) break;
      if (p.skillId === skillId && (counts.get(p.factKey) ?? 0) < MAX_SAME_FACT_PER_SERIES) add(p);
    }
  };
  repeatChosenSkill();
  addNew(free());
  // Encore de la place (compétence avec très peu de faits) : on répète les nouveaux.
  repeatChosenSkill();

  return { questions: toQuestions(picks, levelOf, rng), newFactKeys };
}

function toQuestions(picks: readonly Pick[], levelOf: (id: SkillId) => Level, rng: Rng): Question[] {
  const questions = orderWithoutAdjacentRepeats(picks, rng).map((p, i) => ({
    ...questionForFact(p.skillId, p.factKey, levelOf(p.skillId), rng),
    id: `${i + 1}-${p.factKey}`,
  }));
  return spreadAnswerPositions(questions, rng);
}

/** Faits déjà rencontrés nécessaires pour un défi du jour (10 questions, 2 fois max chacun). */
export const DAILY_MIN_KNOWN_FACTS = Math.ceil(SERIES_SIZE / MAX_SAME_FACT_PER_SERIES);

const knownFacts = (states: readonly FactState[]) =>
  states.filter((s) => s.seenCount > 0 && isSkillAvailable(s.skillId));

export function canPlayDaily(states: readonly FactState[]): boolean {
  return knownFacts(states).length >= DAILY_MIN_KNOWN_FACTS;
}

export interface ComposeDailyInput {
  states: readonly FactState[];
  now: number;
  rng: Rng;
  /** Niveau courant de chaque compétence (défaut : 1). */
  levels?: Partial<Record<SkillId, Level>>;
}

/**
 * Défi du jour (PRD §5) : 10 questions mixtes, toutes compétences confondues, tirées des
 * faits à réviser (échus, boîtes basses d'abord), puis de ceux en cours d'apprentissage,
 * puis des faits maîtrisés. Jamais de fait nouveau : c'est une révision.
 */
export function composeDailySeries({ states, now, rng, levels = {} }: ComposeDailyInput): Question[] {
  const known = knownFacts(states);
  const ordered = (list: readonly FactState[]) => shuffle(rng, list).sort(byPriority);
  const base: Pick[] = [
    ...ordered(known.filter((s) => isDue(s, now))),
    ...ordered(known.filter((s) => !isDue(s, now) && !isMastered(s))),
    ...ordered(known.filter((s) => !isDue(s, now) && isMastered(s))),
  ].slice(0, SERIES_SIZE);
  // Peu de faits connus : chacun peut revenir une seconde fois.
  const picks = [...base, ...base].slice(0, SERIES_SIZE);
  return toQuestions(picks, (id) => levels[id] ?? 1, rng);
}

/**
 * Ordonne les tirages pour que le même fait ne tombe jamais deux fois d'affilée :
 * à chaque pas, on prend le fait le plus représenté parmi ceux qui diffèrent du précédent.
 */
export function orderWithoutAdjacentRepeats<T extends { factKey: string }>(
  items: readonly T[],
  rng: Rng,
): T[] {
  const groups = new Map<string, T[]>();
  for (const item of shuffle(rng, items)) {
    groups.set(item.factKey, [...(groups.get(item.factKey) ?? []), item]);
  }
  const out: T[] = [];
  let last: string | undefined;
  while (out.length < items.length) {
    const candidates = shuffle(rng, [...groups.entries()]).filter(([k, g]) => k !== last && g.length > 0);
    if (candidates.length === 0) {
      // Impossible d'éviter la répétition (un seul fait restant) : on l'accepte.
      const rest = [...groups.values()].flat();
      return [...out, ...rest];
    }
    const [key, group] = candidates.reduce((best, c) => (c[1].length > best[1].length ? c : best));
    out.push(group.shift() as T);
    last = key;
  }
  return out;
}

/** Évite que la bonne réponse soit à la même position plus de 2 fois de suite. */
export function spreadAnswerPositions(questions: readonly Question[], rng: Rng): Question[] {
  const positions: number[] = [];
  return questions.map((q) => {
    if (!q.choices) return q;
    const choices = [...q.choices];
    let pos = choices.indexOf(q.answer);
    const recent = positions.slice(-MAX_SAME_ANSWER_POSITION);
    if (recent.length === MAX_SAME_ANSWER_POSITION && recent.every((p) => p === pos)) {
      const others = choices.map((_, i) => i).filter((i) => i !== pos);
      const target = others[Math.floor(rng() * others.length)] as number;
      [choices[pos], choices[target]] = [choices[target] as number, choices[pos] as number];
      pos = target;
    }
    positions.push(pos);
    return { ...q, choices };
  });
}
