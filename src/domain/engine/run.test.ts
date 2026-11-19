import { createRng } from '../rng';
import { generateQuestion } from '../skills';
import { advance, answeredCount, currentItem, firstTryCorrectCount, startRun, submitAnswer } from './run';

const questions = Array.from({ length: 3 }, (_, i) => ({
  ...generateQuestion('C10', 1, createRng(i)),
  id: `q${i + 1}`,
}));

function answer(state: ReturnType<typeof startRun>, correct: boolean) {
  return advance(submitAnswer(state, correct));
}

describe('déroulé d’une série', () => {
  it('enchaîne les bonnes réponses jusqu’à la fin', () => {
    let s = startRun(questions);
    expect(currentItem(s)?.question.id).toBe('q1');
    s = submitAnswer(s, true);
    expect(s.phase).toBe('success');
    s = answer(advance(s), true);
    s = answer(s, true);
    expect(s.phase).toBe('done');
    expect(currentItem(s)).toBeUndefined();
    expect(firstTryCorrectCount(s)).toBe(3);
  });

  it('une erreur affiche l’aide et repose la question une fois en fin de série', () => {
    let s = submitAnswer(startRun(questions), false);
    expect(s.phase).toBe('help');
    s = advance(s);
    s = answer(s, true);
    s = answer(s, true);
    expect(currentItem(s)).toEqual({ question: questions[0], attempt: 2 });
    s = submitAnswer(s, false);
    expect(s.phase).toBe('help');
    s = advance(s);
    expect(s.phase).toBe('done');
    expect(firstTryCorrectCount(s)).toBe(2);
    expect(answeredCount(s)).toBe(3);
  });

  it('la seconde chance réussie ne compte pas comme du premier coup', () => {
    let s = answer(startRun(questions.slice(0, 1)), false);
    s = answer(s, true);
    expect(s.phase).toBe('done');
    expect(firstTryCorrectCount(s)).toBe(0);
  });

  it('ignore les actions hors phase', () => {
    const s = startRun(questions);
    expect(advance(s)).toBe(s);
    const answered = submitAnswer(s, true);
    expect(submitAnswer(answered, false)).toBe(answered);
  });

  it('une série vide est terminée', () => {
    expect(startRun([]).phase).toBe('done');
  });
});
