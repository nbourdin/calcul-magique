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
    comingSoon: 'Les jeux arrivent bientôt.',
  },
  errors: {
    title: 'Oups, petit souci !',
    notFound: 'Cette page n’existe pas.',
    backHome: 'Retour à l’accueil',
  },
  offline: {
    ready: 'Prêt à jouer, même sans internet.',
  },
} as const;
