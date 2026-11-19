import { Link } from 'react-router-dom';
import { CHARACTERS } from '@/assets/characters';
import { isComplete, placedPieces } from '@/domain/rewards/puzzle';
import { isThemeUnlocked, THEMES, type ThemeId } from '@/domain/rewards/themes';
import { setTheme } from '@/data/rewards';
import { useProfile } from '@/features/profile/profileStore';
import { StarCount } from '@/features/rewards/Badges';
import { Puzzle } from '@/features/rewards/Puzzle';
import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';

const swatch: Record<ThemeId, string> = {
  cream: '#fff8f0',
  mint: '#c9ecd9',
  sky: '#c8e0f6',
  lavender: '#ddd0f4',
  rose: '#f6cfdd',
};

export function AlbumScreen() {
  const { profile, rewards, puzzles, load } = useProfile();
  if (!profile || !rewards) return null;
  const completed = puzzles.filter(isComplete).length;

  const chooseTheme = async (theme: ThemeId) => {
    await setTheme(profile.id, theme);
    await load();
  };

  return (
    <main className="flex flex-1 flex-col gap-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          aria-label={fr.album.back}
          className="flex size-tap items-center justify-center rounded-full bg-primary-soft text-primary"
        >
          <Icon name="home" />
        </Link>
        <h1 className="text-3xl font-extrabold text-primary">{fr.album.title}</h1>
        <StarCount stars={rewards.stars} />
      </header>
      <p className="text-center text-instruction text-ink-soft">
        {fr.album.count(completed, CHARACTERS.length)}
      </p>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {CHARACTERS.map((c) => {
          const progress = puzzles.find((p) => p.characterId === c.id);
          const done = progress !== undefined && isComplete(progress);
          const card = (
            <>
              <Puzzle character={c} placed={progress ? placedPieces(progress) : []} mystery={!progress} />
              <span className="text-xl font-extrabold">
                {done ? c.name : progress ? fr.album.inProgress(progress.piecesPlaced) : fr.album.locked}
              </span>
            </>
          );
          return (
            <li key={c.id}>
              {done ? (
                <Link
                  to={`/album/${c.id}`}
                  className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-3 shadow-md transition hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-primary"
                  style={{ borderBottom: `8px solid ${c.color}` }}
                >
                  {card}
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface/70 p-3">{card}</div>
              )}
            </li>
          );
        })}
      </ul>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold">{fr.album.themes}</h2>
        <ul className="flex flex-wrap gap-3">
          {THEMES.map((t) => {
            const unlocked = isThemeUnlocked(t.id, rewards.stars);
            const selected = rewards.theme === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={!unlocked}
                  aria-pressed={selected}
                  aria-label={
                    unlocked ? fr.album.themeChoose(fr.themes[t.id]) : fr.album.themeLocked(t.minStars)
                  }
                  onClick={() => void chooseTheme(t.id)}
                  className={`flex min-h-touch items-center gap-3 rounded-2xl bg-surface px-4 py-2 text-lg font-bold shadow-sm transition focus-visible:outline-4 focus-visible:outline-primary disabled:opacity-60 ${
                    selected ? 'ring-4 ring-primary' : ''
                  }`}
                >
                  <span
                    className="size-8 rounded-full border-2 border-ink"
                    style={{ background: swatch[t.id] }}
                  />
                  {unlocked ? (
                    fr.themes[t.id]
                  ) : (
                    <span className="flex items-center gap-1">
                      <Icon name="star" filled className="size-5 text-[#f5b82e]" />
                      {t.minStars}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
