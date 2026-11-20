// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRng } from '@/domain/rng';
import { generateQuestion, getSkill } from '@/domain/skills';
import type { GameId, Question, SkillId } from '@/domain/types';
import { fr } from '@/i18n/fr';
import { frogJumps, jumpLabel } from './frog/jumps';
import { BubblesGame } from './bubbles/BubblesGame';
import { FrogGame } from './frog/FrogGame';
import { House10Game } from './house10/House10Game';
import { SKILL_GAMES } from './index';
import { RaceGame } from './race/RaceGame';
import { ShopGame } from './shop/ShopGame';
import { TrainGame } from './train/TrainGame';
import type { GameProps } from './types';

/** Les jeux importés directement (le registre les charge à la demande). */
const COMPONENTS: Record<GameId, (props: GameProps) => React.JSX.Element> = {
  house10: House10Game,
  frog: FrogGame,
  bubbles: BubblesGame,
  race: RaceGame,
  shop: ShopGame,
  train: TrainGame,
};

/** Tape un nombre au clavier puis Entrée (pavé numérique). */
function typeNumber(n: number) {
  for (const d of String(n)) fireEvent.keyDown(window, { key: d });
  fireEvent.keyDown(window, { key: 'Enter' });
}

/** Comment répondre `value` dans chaque jeu, comme le ferait l'enfant. */
const answerWith: Record<GameId, (q: Question, value: number) => void> = {
  house10: (q, value) => {
    if (q.level === 1) fireEvent.click(screen.getByRole('button', { name: fr.play.choiceLabel(value) }));
    else typeNumber(value);
  },
  frog: (q, value) => {
    if (q.level === 1) {
      // Les sauts se font dans l'ordre : on touche à chaque fois le bouton actif.
      for (const j of frogJumps(q).jumps) {
        const buttons = screen.getAllByRole('button', { name: fr.games.frog.jump(jumpLabel(j)) });
        const now = buttons.find((b) => !(b as HTMLButtonElement).disabled);
        if (now) fireEvent.click(now);
      }
    }
    typeNumber(value);
  },
  race: (q, value) => {
    const index = (q.choices ?? []).indexOf(value);
    fireEvent.click(screen.getByRole('button', { name: fr.games.race.lane(value, index + 1) }));
  },
  bubbles: (_q, value) =>
    fireEvent.click(screen.getByRole('button', { name: fr.games.bubbles.bubble(value) })),
  shop: (_q, value) => {
    let left = value;
    for (const coin of [10, 5, 2, 1]) {
      while (left >= coin) {
        const button = screen.queryByRole('button', { name: fr.games.shop.coin(coin) });
        if (!button) break;
        fireEvent.click(button);
        left -= coin;
      }
    }
    fireEvent.click(screen.getByRole('button', { name: fr.games.shop.submit }));
  },
  train: (q, value) => {
    // Calcul posé : une case par chiffre du résultat, remplie depuis les unités.
    // Les retenues se touchent quand elles apparaissent (sinon elles se posent seules).
    const cells = String(q.answer).length;
    const digits = [...String(value).padStart(cells, '0')].reverse();
    for (const d of digits) {
      const star = screen.queryByRole('button', { name: fr.games.train.carryButton });
      if (star) fireEvent.click(star);
      fireEvent.keyDown(window, { key: d });
    }
    fireEvent.keyDown(window, { key: 'Enter' });
  },
};

const wrongValue = (q: Question) => (q.choices ?? []).find((c) => c !== q.answer) ?? q.answer + 1;

const cases = (Object.keys(SKILL_GAMES) as SkillId[]).flatMap((skillId) =>
  SKILL_GAMES[skillId].flatMap((gameId) =>
    getSkill(skillId).levels.map((level) => ({ skillId, gameId, level, Game: COMPONENTS[gameId] })),
  ),
);

afterEach(cleanup);

describe('contrat des mini-jeux (PRD §6)', () => {
  it('chaque compétence propose au moins 2 jeux', () => {
    for (const games of Object.values(SKILL_GAMES)) expect(games.length).toBeGreaterThanOrEqual(2);
  });

  it.each(cases)(
    '$gameId × $skillId niveau $level : 10 questions, onAnswer à chaque réponse',
    ({ skillId, gameId, level, Game }) => {
      const rng = createRng(42);
      for (let i = 0; i < 10; i++) {
        const question = generateQuestion(skillId, level, rng);
        const onAnswer = vi.fn();
        const wrong = i % 3 === 2; // une réponse sur trois est fausse
        const { unmount } = render(
          <Game key={i} question={question} attempt={1} active progress={i / 10} onAnswer={onAnswer} />,
        );
        answerWith[gameId](question, wrong ? wrongValue(question) : question.answer);
        expect(onAnswer).toHaveBeenCalledTimes(1);
        expect(onAnswer).toHaveBeenCalledWith(!wrong, expect.any(Number));
        unmount();
      }
    },
  );
});
