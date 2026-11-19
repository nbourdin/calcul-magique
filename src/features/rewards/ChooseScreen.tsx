import { useNavigate } from 'react-router-dom';
import { fr } from '@/i18n/fr';
import { ChooseCharacter } from './ChooseCharacter';

export function ChooseScreen() {
  const navigate = useNavigate();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
      <h1 className="text-3xl font-extrabold text-primary">{fr.reveal.chooseTitle}</h1>
      <ChooseCharacter onChosen={() => navigate('/', { replace: true })} />
    </main>
  );
}
