import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { now } from '@/app/clock';
import { postponeLevelUp, setSkillLevel } from '@/data/skills';
import type { Level, SkillId } from '@/domain/types';
import { useProfile } from '@/features/profile/profileStore';
import { fr } from '@/i18n/fr';
import { Button } from '@/ui/Button';
import { buttonClass } from '@/ui/buttonClass';
import { Icon } from '@/ui/Icon';

interface LevelCardProps {
  skillId: SkillId;
  change: { kind: 'up' | 'down'; level: Level };
}

/**
 * Fin de série : le niveau suivant se propose (jamais imposé), ou l'on annonce en douceur
 * le retour au niveau précédent avec l'astuce à revoir (PRD §8).
 */
export function LevelCard({ skillId, change }: LevelCardProps) {
  const navigate = useNavigate();
  const profile = useProfile((s) => s.profile);
  const reload = useProfile((s) => s.load);
  const [declined, setDeclined] = useState(false);
  if (!profile || declined) return null;

  if (change.kind === 'down') {
    return (
      <section className="flex flex-col items-center gap-3 rounded-3xl bg-help-soft p-5">
        <h2 className="text-2xl font-extrabold">{fr.level.downTitle}</h2>
        <p className="text-instruction">{fr.level.downText}</p>
        <Link to={`/competence/${skillId}?revoir=1`} className={buttonClass('soft')}>
          <Icon name="help" />
          {fr.level.rewatch}
        </Link>
      </section>
    );
  }

  const accept = async () => {
    await setSkillLevel(profile.id, skillId, change.level, now());
    await reload();
    // L'écran de la compétence montre « Je découvre » du nouveau niveau.
    navigate(`/competence/${skillId}`);
  };
  const decline = async () => {
    setDeclined(true);
    // Les niveaux se suivent : on reste au niveau juste en dessous de celui proposé.
    await postponeLevelUp(profile.id, skillId, (change.level - 1) as Level, now());
  };

  return (
    <section className="flex flex-col items-center gap-3 rounded-3xl bg-primary-soft p-5">
      <h2 className="flex items-center gap-2 text-2xl font-extrabold">
        <Icon name="star" filled className="size-8 text-[#f5b82e]" />
        {fr.level.upTitle}
      </h2>
      <p className="text-instruction">{fr.level.upText(change.level)}</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button onClick={() => void accept()}>{fr.level.upYes(change.level)}</Button>
        <button
          type="button"
          onClick={() => void decline()}
          className="min-h-tap px-3 text-lg font-bold text-ink-soft underline"
        >
          {fr.level.upNo}
        </button>
      </div>
    </section>
  );
}
