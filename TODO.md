# À faire

Reste du MVP après le M6 (état au 19/11/2026). Relire le PRD et `CLAUDE.md` avant de commencer.

## 1. Les 8 badges (PRD §7)

Liste : « Première série », « 3 jours de suite », « Maître du 10 » (tous les faits C10 en boîte 4),
« Sauteur de grenouille » (50 questions du jeu 2 `frog`), « Course parfaite » (10/10 au jeu 4 `race`),
« Album à 3 », « 100 questions du jour », « Retour après une pause ».
Un badge s'affiche comme une médaille, jamais comme une obligation (pas de barre « encore X pour… »).

Déjà en place :

- `RewardState.badges: string[]` existe (`src/domain/rewards/seriesRewards.ts`), toujours vide. Il est déjà
  dans la table `rewards`, donc déjà exporté, importé et réinitialisé avec le profil.
- Les données utiles sont là : séries (`gameId`, `firstTryCorrect`, `questionCount`), tentatives,
  états des faits (boîtes Leitner), série de jours (`streak`), puzzles terminés (album).

À faire :

- `src/domain/rewards/badges.ts` (pur) : type `BadgeId`, règle de chaque badge, et une fonction qui
  renvoie les badges nouvellement gagnés à partir de l'état après une série. Tests (couverture ≥ 90 %).
  Préciser « Retour après une pause » (proposition : rejouer après ≥ 7 jours sans jouer).
- Brancher dans `finishSeries` (`src/data/rewards.ts`) : ajouter les nouveaux badges au résultat
  (`SeriesRewardOutcome`) et les enregistrer.
- Affichage : médaille dans l'écran de fin de série quand un badge est gagné (son `star`, animation
  `anim-pop-in`), et une rangée de médailles dans l'album (gagnées en couleur, les autres en silhouette
  discrète). Dessins en SVG dans le code, textes dans `src/i18n/fr.ts`.

## 2. Proposition de changement de niveau (PRD §8)

- Si 3 séries consécutives d'une compétence font ≥ 90 % de bonnes réponses du premier coup : proposer
  le niveau suivant. L'enfant accepte ou refuse, jamais automatique.
- Si 2 séries consécutives sont sous 50 % : revenir au niveau précédent avec un message encourageant et
  reproposer « Je découvre ».

Déjà en place :

- Logique pure : `suggestLevelChange(firstTryRates)` et `canLevelUp` dans
  `src/domain/engine/progression.ts` (testées, pas encore utilisées par l'interface).
- Écriture du niveau : `setSkillLevel` dans `src/data/skills.ts` (utilisé par l'espace parent).
- Séries récentes : `listRecentSeries` dans `src/data/progress.ts`.

À faire :

- Après une série, calculer la suggestion pour la compétence jouée (séries de cette compétence
  uniquement, au niveau courant ; ignorer les séries jouées avec `?niveau=` forcé si possible).
- Écran de fin : carte « Prête pour le niveau 2 ? » avec « Oui ! » / « Pas encore ». « Oui » appelle
  `setSkillLevel` puis recharge le profil (`useProfile.load`). « Pas encore » ne repropose pas avant
  3 nouvelles séries réussies.
- Retour en arrière : `setSkillLevel(level - 1)`, message encourageant, puis « Je découvre » à la
  prochaine ouverture de la compétence (remettre `discoveredAt` à vide ou passer `?revoir=1`).
- Ne jamais descendre sous le niveau 1 ni monter au-delà des niveaux de la compétence.

## Vérifications avant de committer

`npm run format:check && npm run lint && npm run typecheck && npm run test:coverage && npm run build`
(c'est ce que lance la CI).
