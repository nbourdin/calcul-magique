import { Link } from 'react-router-dom';
import type { Series } from '@/domain/types';
import { fr } from '@/i18n/fr';
import { Button } from '@/ui/Button';
import { buttonClass } from '@/ui/buttonClass';
import { Icon } from '@/ui/Icon';

interface EndScreenProps {
  series: Series;
  onReplay: () => void;
}

export function EndScreen({ series, onReplay }: EndScreenProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
      <h1 className="text-4xl font-extrabold text-primary">{fr.end.title}</h1>
      <div role="img" aria-label={fr.end.stars(series.stars)} className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <Icon
            key={i}
            name="star"
            filled
            className={`size-20 ${i <= series.stars ? 'text-[#f5b82e]' : 'text-primary-soft'}`}
          />
        ))}
      </div>
      <p className="text-3xl font-extrabold">{fr.end.message[series.stars]}</p>
      <p className="text-instruction text-ink-soft">
        {fr.end.summary(series.firstTryCorrect, series.questionCount)}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <Button onClick={onReplay}>
          <Icon name="replay" />
          {fr.end.again}
        </Button>
        <Link to="/" className={buttonClass('soft')}>
          <Icon name="home" />
          {fr.end.home}
        </Link>
      </div>
    </main>
  );
}
