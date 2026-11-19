import type { SkillId } from '@/domain/types';

/**
 * Toutes les chaînes affichées dans l'app.
 * Côté enfant : phrases de 8 mots maximum, tutoiement, ton encourageant.
 */
export const fr = {
  app: {
    name: 'Calcul Magique',
  },
  home: {
    welcome: 'Bienvenue dans le royaume magique !',
    welcomeName: (name: string) => `Coucou ${name} !`,
    forest: 'La Forêt des Dizaines',
    chooseGame: 'Choisis un jeu',
  },
  skills: {
    C10: 'Aller à 10',
    C20: 'Aller à 20',
    CDS: 'La dizaine suivante',
    DBL: 'Les doubles',
    PDB: 'Les presque-doubles',
    TAD: 'Les additions',
    P9: 'Ajouter 9',
    M9: 'Enlever 9',
    D10: 'Les dizaines',
    T2: 'Table de 2',
    T5: 'Table de 5',
    T10: 'Table de 10',
    T3: 'Table de 3',
    T4: 'Table de 4',
  } satisfies Record<SkillId, string>,
  games: {
    house10: {
      name: 'La Maison du 10',
      instruction: 'Combien de fenêtres pour arriver à 10 ?',
      instructionTarget: (target: number) => `Combien pour arriver à ${target} ?`,
      instructionMissingFirst: 'Quel nombre manque ?',
      houseLabel: (lit: number, total: number) => `${lit} fenêtres allumées sur ${total}`,
      dropHere: 'Pose la carte sur la maison',
    },
  },
  play: {
    loading: 'On prépare le jeu…',
    progress: (done: number, total: number) => `Question ${done} sur ${total}`,
    quit: 'Retour à l’accueil',
    choiceLabel: (n: number) => `Répondre ${n}`,
    success: ['Bravo !', 'Super !', 'Génial !', 'Bien joué !', 'Exact !'],
    helpTitle: 'Regarde bien :',
    helpRetry: 'On la refait à la fin !',
    helpLast: 'On la reverra bientôt.',
    helpContinue: 'On continue',
    missing: 'nombre à trouver',
  },
  numpad: {
    label: 'Pavé numérique',
    digit: (d: number) => `${d}`,
    erase: 'Effacer',
    submit: 'Valider',
  },
  end: {
    title: 'Série terminée !',
    stars: (n: number) => `${n} étoile${n > 1 ? 's' : ''} sur 3`,
    summary: (n: number, total: number) => `${n} sur ${total} du premier coup !`,
    message: { 1: 'Bravo, tu as tout fini !', 2: 'Très bien joué !', 3: 'Incroyable, quel talent !' },
    again: 'Rejouer',
    home: 'Accueil',
  },
  errors: {
    title: 'Oups, petit souci !',
    notFound: 'Cette page n’existe pas.',
    backHome: 'Retour à l’accueil',
    loadFailed: 'Le jeu n’a pas pu démarrer.',
  },
  offline: {
    ready: 'Prêt à jouer, même sans internet.',
  },
} as const;
