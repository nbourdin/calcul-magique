# PRD — Jeux de calcul mental CE1 (web app)

Nom de travail : **Calcul Magique** (renommable). Document destiné à Claude Code : il décrit quoi construire, dans quel ordre, et comment vérifier que c'est fait.

---

## 1. Contexte, objectifs et principes produit

On construit une web app (PWA) de mini-jeux qui fait automatiser à une enfant de CE1 (7 ans) les faits numériques et stratégies de calcul mental du programme, avec une gamification centrée sur des puzzles qui révèlent des personnages (fée, licorne, princesse…).

**Utilisatrice principale** : une élève de CE1 en difficulté sur le calcul mental, qui lit encore lentement. **Utilisateur secondaire** : le parent, qui veut suivre la progression et régler l'app.

**Objectifs**

- Automatiser : compléments à 10, +9 / −9 (via la dizaine), doubles, tables d'addition, puis premières tables de multiplication.
- Rendre la **stratégie** visible, pas seulement le résultat (ex. 6 + 9 → 6 + 10 = 16 → 16 − 1 = 15), car c'est ce que recommande l'Éducation nationale et ce que les apps existantes font peu.
- Donner envie de revenir chaque jour pour des sessions courtes (5 à 10 minutes).

**Principes produit (non négociables)**

1. **Zéro punition** : une erreur ne retire jamais de points ni de pièces ; elle déclenche une aide bienveillante et une seconde chance.
2. **La récompense suit l'effort** : finir une série débloque toujours une pièce de puzzle, la précision donne des étoiles en plus.
3. **Peu de lecture** : consignes courtes, illustrées, avec option audio (synthèse vocale).
4. **Pas de pression par défaut** : le chrono est un mode optionnel, jamais imposé.
5. **Sessions courtes et bornées** : une série = 10 questions ≈ 2 minutes ; l'app encourage à s'arrêter après 3 séries.
6. **Vie privée** : aucun compte, aucun tracking, aucune pub, données stockées sur l'appareil.

**Mesures de succès** (usage personnel, pas d'analytics externes) : au moins 4 jours d'utilisation par semaine ; temps de réponse moyen sur les faits « compléments à 10 » sous 3 secondes ; au moins 80 % de réussite à la première tentative sur les faits marqués « maîtrisés ».

---

## 2. Périmètre MVP et hors périmètre

Le MVP livre 5 mini-jeux, un moteur adaptatif, la boucle puzzle/album et un espace parent, entièrement hors ligne et sans backend.

**Dans le MVP**

- Onboarding : prénom, choix d'un avatar, support de 2 à 4 profils sur le même appareil.
- Carte de progression par mondes (un monde = une famille de compétences).
- Pour chaque compétence : une étape « Je découvre » (animation de la stratégie), puis « Je m'entraîne », puis les mini-jeux.
- 5 mini-jeux (section 6) et un défi du jour.
- Moteur d'exercices avec répétition espacée (section 8).
- Gamification : pièces de puzzle, album de personnages, étoiles, série de jours, quelques badges (section 7).
- Espace parent protégé : tableau de bord, réglages, export/import des données (section 9).
- PWA installable, fonctionnement hors ligne, français uniquement.

**Hors MVP (v1.1 et après)**

- Comptes, synchronisation entre appareils, backend, classement entre joueurs.
- Multijoueur ou duels.
- Boutique d'accessoires pour l'avatar, événements saisonniers.
- Multiplication au-delà des tables 2, 3, 4, 5 et 10 ; soustractions posées ; problèmes à énoncé.
- Autres langues, applications natives iOS/Android.

**Contraintes**

- Cible principale : tablette et téléphone en portrait, utilisable aussi sur ordinateur.
- Aucun contenu externe chargé à l'exécution (polices, sons et images embarqués), pour garantir le hors ligne et la confidentialité.
- Aucune publicité, aucun achat intégré, aucun lien sortant visible côté enfant.

---

## 3. Stack technique et architecture

Application 100 % front, statique, hébergeable sur n'importe quel CDN.

| Besoin | Choix | Remarque |
| --- | --- | --- |
| Build / framework | Vite + React 18 + TypeScript strict | |
| Routage | React Router (hash ou history avec fallback SPA) | |
| État UI | Zustand | un store par domaine (session, profil, réglages) |
| Persistance | Dexie (IndexedDB) | `localStorage` uniquement pour le profil actif |
| Styles | Tailwind CSS + variables CSS pour le thème | |
| Animation | Framer Motion | respecter `prefers-reduced-motion` |
| Son | Howler.js | sons courts embarqués, bouton muet global |
| Voix | Web Speech API `speechSynthesis` (fr-FR) | option, avec repli silencieux si indisponible |
| PWA | vite-plugin-pwa (Workbox) | précache de tous les assets |
| Tests | Vitest (unitaires), Testing Library, Playwright (parcours) | |
| Qualité | ESLint, Prettier, `tsc --noEmit` en CI | |

**Structure de dossiers**

```
src/
  app/            # routes, layout, providers
  domain/
    skills/       # définition des compétences + générateurs de questions
    engine/       # sélection adaptative, Leitner, séries
    rewards/      # puzzles, album, étoiles, badges, séries de jours
  games/          # un dossier par mini-jeu (composant + règles + assets)
  features/       # onboarding, carte, parent, album
  data/           # Dexie : schéma, repositories, export/import
  ui/             # composants partagés (pavé numérique, boutons, modales)
  assets/         # svg, audio, polices
  i18n/fr.ts      # toutes les chaînes affichées
```

**Règles d'architecture**

- `domain/` est du TypeScript pur, sans React ni accès navigateur : testable en isolation.
- Les générateurs de questions sont des fonctions pures `(skillId, difficulty, rng) → Question`, avec un générateur pseudo-aléatoire injectable pour des tests reproductibles.
- Les jeux ne connaissent que l'interface `Question` et le callback `onAnswer(correct, responseMs)` ; ils ne touchent jamais directement à la base.
- Aucune chaîne en dur dans les composants : tout passe par `i18n/fr.ts`.

---

## 4. Référentiel pédagogique : compétences et progression

Chaque compétence a un identifiant, une stratégie enseignée, 3 niveaux de difficulté et une définition précise de ce qu'est un « fait » (l'unité suivie par le moteur).

| ID | Compétence | Stratégie à montrer | Niveaux | Fait suivi |
| --- | --- | --- | --- | --- |
| C10 | Compléments à 10 | maison du 10, décomposition | 1 : 0–10 avec support visuel ; 2 : sans support ; 3 : à trous (`_ + 7 = 10`) | `c10:7` |
| C20 | Compléments à 20 | passer par 10 | 1 : 11–19 → 20 ; 2 : n'importe quel complément ≤ 20 | `c20:13` |
| CDS | Complément à la dizaine supérieure | se placer sur la dizaine | 1 : 23 → 30 ; 2 : 67 → 70 | `cds:7` (unités seules) |
| DBL | Doubles et moitiés | double puis moitié inverse | 1 : doubles ≤ 10 ; 2 : doubles ≤ 50 ; 3 : moitiés de pairs ≤ 100 | `dbl:8` |
| PDB | Presque-doubles | double ± 1 | 1 : 6+7 ; 2 : 8+9, 7+6 | `pdb:7+8` |
| TAD | Tables d'addition ≤ 20 | compléments, doubles, passage de la dizaine | 1 : sommes ≤ 10 ; 2 : sommes ≤ 20 ; 3 : dans les deux sens (soustraction) | `tad:8+5` |
| P9 | Ajouter 9 | +10 puis −1 | 1 : n + 9 avec n < 10 ; 2 : n < 100 sans retenue ; 3 : 19 et 29 | `p9:n` |
| M9 | Soustraire 9 | −10 puis +1 | 1 : n < 30 ; 2 : n < 100 | `m9:n` |
| D10 | ±10 et dizaines entières | table des nombres | 1 : ±10 ; 2 : ± dizaines entières | `d10:…` |
| T2-T10 | Tables ×2, ×5, ×10, ×3, ×4 | dénombrer par sauts | une table par niveau | `x:3x7` |

**Ordre des mondes** (déblocage progressif, mais l'enfant peut rejouer ce qu'elle veut)

1. Forêt des Dizaines : C10, C20, CDS.
2. Rivière des Doubles : DBL, PDB.
3. Montagne des Sommes : TAD.
4. Prairie du Neuf : P9, M9, D10.
5. Château des Tables : T2, T5, T10, puis T3, T4 (bonus, après le MVP si besoin).

**Règles de progression**

- Une compétence passe au niveau suivant quand 80 % des faits du niveau sont en boîte 3 ou plus (section 8).
- Un monde se débloque quand 60 % de la compétence précédente est maîtrisée, ou via un bouton parent « tout débloquer ».
- L'enfant peut toujours rejouer n'importe quelle compétence déjà débloquée.

---

## 5. Boucle de jeu et parcours utilisateur

**Parcours type (5 à 10 minutes)**

1. Écran d'accueil : avatar, « Défi du jour », carte des mondes, album.
2. Choix d'une compétence sur la carte (ou « Défi du jour » en un tap).
3. Étape « Je découvre » (première fois seulement, ou via un bouton « revoir ») : animation de 20 à 30 secondes de la stratégie, avec un exemple interactif guidé.
4. Série de 10 questions dans un mini-jeu (tiré automatiquement ou choisi).
5. Écran de fin de série : pièce de puzzle gagnée (animation), étoiles (0 à 3), résumé en une ligne.
6. Après 3 séries dans la journée : écran « Bravo, à demain ! » avec le puzzle en cours ; un bouton discret permet de continuer.

**Gestion d'une question**

- La question s'affiche ; l'enfant répond (choix multiples au niveau 1, pavé numérique ensuite).
- Bonne réponse : feedback sonore et visuel immédiat, question suivante après 700 ms.
- Mauvaise réponse : pas de son négatif ; le jeu affiche l'aide de stratégie animée (ex. le saut +10 puis −1), puis redonne la même question une seconde fois en fin de série. La première tentative seule compte pour les étoiles.
- Aucune limite de temps par défaut. En mode chrono (optionnel, réglable par le parent), le temps ne fait que moduler un bonus d'étoile.

**Étoiles d'une série** : 1 étoile pour avoir terminé, 2 pour au moins 7 bonnes réponses du premier coup, 3 pour au moins 9.

**Défi du jour** : une série de 10 questions mixtes tirées des faits à réviser (section 8), disponible une fois par jour ; bonus d'étoiles et incrément de la série de jours.

---

## 6. Spécification des mini-jeux

Tous les jeux partagent le même contrat : ils reçoivent 10 `Question` consécutives, appellent `onAnswer(questionId, correct, responseMs)` et `onComplete()`. Chaque jeu déclare les compétences qu'il sait rendre. Habillage graphique commun : l'univers « royaume magique » (forêt, rivière, château).

**Format `Question`**

```ts
type Question = {
  id: string;
  skillId: SkillId;
  factKey: string;             // ex. "p9:6" ; sert au suivi adaptatif
  display: { a: number; op: '+' | '−' | '×'; b: number | null; missing?: 'a' | 'b' | 'result' };
  answer: number;
  choices?: number[];          // 3 ou 4 propositions plausibles, dont la bonne
  strategy?: { steps: string[]; // ex. ["6 + 10 = 16", "16 − 1 = 15"]
               visual: 'numberline' | 'tenframe' | 'house10' | 'coins' };
};
```

**Jeu 1 — La Maison du 10** (C10, C20, CDS)
Une maison avec 10 fenêtres ; un nombre de fenêtres est allumé, l'enfant choisit ou tape combien il faut en allumer pour arriver à 10. Niveau 1 : drag d'une carte-nombre vers la fenêtre. Niveau 2 : pavé numérique, support visuel masqué.

**Jeu 2 — Le Saut de la grenouille** (P9, M9, D10, TAD)
Une droite numérique ; pour `n + 9`, la grenouille saute de +10 sur un nénuphar, puis recule d'un cran. En entraînement, l'enfant fait le saut elle-même (tap sur +10 puis −1) avant de saisir le résultat ; plus tard, elle tape directement la réponse et l'animation ne sert qu'à l'aide.

**Jeu 3 — Les Bulles magiques** (C10, C20, CDS, TAD)
Des bulles portent des nombres ; l'enfant touche deux ou trois bulles dont la somme fait la cible (10, 20 ou la dizaine suivante) avant qu'elles s'envolent. Vitesse lente, aucune perte quand une bulle part ; seules les bulles bien éclatées comptent pour la série.

**Jeu 4 — La Course des doubles** (DBL, PDB, T2, T5, T10)
Un poney court sur une piste ; à chaque question, l'enfant choisit parmi 3 voies (3 réponses). Bonne voie : le poney accélère. Mauvaise voie : le poney trébuche gentiment, l'aide s'affiche, la question revient.

**Jeu 5 — La Boutique de la fée** (C10, C20, rendre la monnaie)
Prix en euros (≤ 20 €), l'enfant doit rendre la monnaie à partir d'un billet de 10 ou 20 € en tapant des pièces et billets. Travaille les compléments à 10 et 20 dans un contexte concret.

**Sélection d'un jeu** : chaque compétence propose 2 jeux compatibles ; le choix est automatique mais l'enfant peut en changer avant de lancer.

---

## 7. Gamification : puzzles, collection, récompenses

La boucle centrale : **série terminée → pièce de puzzle → image complète → personnage dans l'album**.

**Puzzles**

- Chaque puzzle est une illustration découpée en **9 pièces** (grille 3 × 3). Une série terminée = 1 pièce posée, avec animation de la pièce qui vole vers sa place, son joyeux et brillance.
- L'image est floutée/grisée avant déblocage, puis se colore pièce par pièce.
- Quand les 9 pièces sont posées : animation de révélation, le personnage s'anime brièvement (une phrase courte, ex. « Je suis Lila, la fée des étoiles »), et entre dans l'**album**.
- Un seul puzzle est actif à la fois ; l'enfant choisit le prochain personnage parmi les 3 prochains non débloqués (elle choisit ce qu'elle a envie de gagner).

**Album (MVP : 9 personnages)**

Fée des étoiles, licorne arc-en-ciel, princesse du château, sirène, dragon gentil, chaton magicien, chevalière, elfe de la forêt, renard-lune. Les personnages se débloquent par ordre de choix de l'enfant. Chacun a un nom, une couleur, une phrase d'accueil.

**Étoiles**

- Récompense de précision (0 à 3 par série), cumulées dans un compteur visible.
- Seuils d'étoiles : débloquent des **fonds d'écran** et des couleurs d'avatar (3 à 5 paliers au MVP). Les étoiles ne se dépensent pas et ne se perdent jamais.

**Série de jours (flamme)**

- +1 par jour avec au moins une série terminée.
- Tolérance : 1 jour de répit est accordé automatiquement par semaine ; manquer plus ne remet pas à zéro brutalement mais ramène la flamme à « en veille », sans message négatif.

**Badges (MVP : 8)**

« Première série », « 3 jours de suite », « Maître du 10 » (tous les faits C10 en boîte 4), « Sauteur de grenouille » (50 questions du jeu 2), « Course parfaite » (10/10 au jeu 4), « Album à 3 », « 100 questions du jour », « Retour après une pause ». Un badge s'affiche comme une médaille, jamais comme une obligation.

**Garde-fous**

- Pas de récompense aléatoire payante, pas de coffres à ouvrir, pas de compte à rebours qui crée de l'urgence.
- Un message de fin de série différent selon l'effort, jamais de comparaison avec d'autres enfants.
- Les animations de récompense durent au plus 4 secondes et sont passables d'un tap.

**Illustrations**

- MVP : illustrations vectorielles SVG originales (personnages stylisés, palette pastel), organisées en 9 pièces via `clip-path` ; chaque personnage = 1 fichier SVG et 1 fichier JSON de métadonnées.
- Le code ne doit dépendre d'aucune image précise : remplacer les SVG par des illustrations finales ne doit demander aucun changement de code.
- Ne reproduire aucun personnage protégé (pas de licence Disney, Barbie, etc.) : tous les personnages sont originaux.

---

## 8. Moteur d'exercices et répétition espacée

Le moteur choisit **quels faits** poser, selon un système de Leitner à 5 boîtes par enfant.

**État d'un fait** : `{ profileId, factKey, box (0–4), dueAt, seenCount, correctFirstTry, avgMs }`.

**Règles de mouvement**

- Bonne réponse du premier coup et en moins de 5 secondes : boîte +1.
- Bonne réponse mais lente (plus de 5 secondes) ou après aide : la boîte ne change pas.
- Mauvaise réponse : retour en boîte 0 (ou −2 boîtes, plancher 0, au choix du réglage par défaut : retour boîte 0).
- Intervalle de révision par boîte : 0 → même session ; 1 → 1 jour ; 2 → 3 jours ; 3 → 7 jours ; 4 → 21 jours.
- Un fait est **maîtrisé** quand il est en boîte 3 ou plus avec au moins 3 réussites consécutives.

**Composition d'une série de 10 questions**

- 5 faits à réviser (échus, priorité aux boîtes basses).
- 3 faits en cours d'apprentissage de la compétence choisie.
- 2 faits nouveaux (dans la limite de 3 nouveaux faits par jour).
- Aucun fait posé plus de 2 fois dans la même série ; jamais deux fois d'affilée la même question.
- Si l'enfant a moins de 4 faits échus, la série se complète avec la compétence choisie.

**Génération des propositions (choix multiples)**

- Toujours 3 propositions, uniques, positives, dont la bonne.
- Les mauvaises propositions sont des **erreurs typiques** : résultat ±1, résultat ±10, oubli de la correction (ex. 6 + 9 → 16), inversion des chiffres.
- Ordre mélangé, la bonne réponse jamais à la même position plus de 2 fois de suite.

**Difficulté adaptative légère**

- Si 3 séries consécutives donnent au moins 90 % de bonnes réponses du premier coup, proposer le niveau suivant (acceptation par l'enfant, jamais automatique).
- Si 2 séries consécutives sont sous 50 %, revenir au niveau précédent avec un message encourageant et reproposer « Je découvre ».

**Tests obligatoires sur `domain/`**

- Chaque générateur : réponse correcte, plages respectées, choix uniques et contenant la bonne réponse, pour 1 000 tirages avec graine fixe.
- Leitner : tests pour chaque transition de boîte et chaque intervalle.
- Composition de série : jamais plus de 10 questions, quotas respectés.

---

## 9. Espace parent

Accessible via un bouton discret (icône engrenage) protégé par une question de calcul adulte (ex. « 7 × 8 = ? », valeurs aléatoires de la table de 6 à 9). Pas de mot de passe.

**Tableau de bord (par profil)**

- **Compétences** : liste avec statut Non commencé / En cours / Solide, barre de faits maîtrisés (ex. 14/22).
- **Faits à travailler** : les 10 faits les plus ratés ou les plus lents (ex. `8 + 5`, `p9:47`), avec temps moyen.
- **Activité** : minutes par jour sur 14 jours (graphique en barres), nombre de séries, série de jours.
- **Historique récent** : 10 dernières séries avec date, jeu, étoiles.

**Réglages**

| Réglage | Valeurs | Défaut |
| --- | --- | --- |
| Durée recommandée par jour | 5 / 10 / 15 / 20 min | 10 |
| Séries avant message « à demain » | 2 à 5 | 3 |
| Mode chrono | désactivé / doux / actif | désactivé |
| Sons | activés / coupés | activés |
| Voix (lecture des consignes) | activée / coupée | coupée |
| Niveau de départ par compétence | 1 / 2 / 3 | 1 |
| Tout débloquer | bouton | — |

**Données**

- Export des données du profil en JSON (téléchargement), import avec validation de schéma.
- Réinitialiser un profil : confirmation en deux étapes ; jamais d'effacement sans validation explicite.
- Aucun envoi de données hors de l'appareil.

---

## 10. UX/UI, accessibilité, audio

**Principes visuels**

- Style chaleureux et lisible : fonds pastel, grands aplats, coins arrondis, pas de rouge agressif pour les erreurs (utiliser un orange doux et une icône d'aide).
- Police : Lexend ou Nunito (embarquée, tailles ≥ 20 px pour les consignes, ≥ 36 px pour les nombres).
- Cibles tactiles ≥ 64 px pour les boutons de réponse, ≥ 48 px partout ailleurs.
- Pavé numérique personnalisé (pas le clavier du système) : chiffres 0–9, effacer, valider ; en portrait, occupe le tiers inférieur de l'écran.

**Accessibilité**

- Contraste WCAG AA minimum pour tout texte et nombre.
- Respect de `prefers-reduced-motion` : animations remplacées par des fondus simples.
- Étiquettes ARIA sur tous les boutons ; navigation clavier complète sur ordinateur (chiffres, Entrée, Retour arrière).
- Couleur jamais seule porteuse d'information : toujours doublée d'une icône ou d'un texte.
- Option « Écouter » : lit l'énoncé avec `speechSynthesis` en français.

**Audio**

- 6 à 8 sons courts embarqués : clic, bonne réponse, pièce de puzzle, puzzle terminé, étoile, bulle, saut. Format `.ogg` + `.mp3` de repli.
- Aucune musique de fond par défaut ; un bouton de mute global visible en permanence.
- Volume modéré, aucun son strident.

**Textes**

- Phrases de 8 mots maximum côté enfant, tutoiement, ton encourageant. Exemples : « Bravo ! », « On essaie encore ? », « Regarde le saut ».
- Tous les textes dans `i18n/fr.ts`.

**Écrans à fournir au MVP**

Onboarding, choix de profil, accueil, carte des mondes, découverte d'une compétence, les 5 jeux, fin de série, puzzle, album, détail d'un personnage, « à demain », espace parent (accès, tableau de bord, réglages), écran d'erreur/hors ligne.

---

## 11. Modèle de données et persistance

Stockage local via Dexie (IndexedDB), version du schéma gérée par migrations.

```ts
type Profile = { id: string; name: string; avatar: string; createdAt: number; settings: Settings };

type FactState = {
  profileId: string; factKey: string; skillId: SkillId;
  box: 0 | 1 | 2 | 3 | 4; dueAt: number;
  seenCount: number; correctFirstTry: number; consecutiveCorrect: number; avgMs: number;
};

type Attempt = {
  id: string; profileId: string; factKey: string; skillId: SkillId; gameId: GameId;
  correctFirstTry: boolean; responseMs: number; usedHelp: boolean; ts: number; seriesId: string;
};

type Series = { id: string; profileId: string; skillId: SkillId; gameId: GameId;
  startedAt: number; endedAt: number; stars: 1 | 2 | 3; mode: 'practice' | 'daily' | 'chrono' };

type PuzzleProgress = { profileId: string; characterId: string; piecesPlaced: number; completedAt?: number };

type Reward = { profileId: string; stars: number; badges: BadgeId[]; streak: { count: number; lastDay: string; graceUsedWeek: string } };

type Settings = { sessionMinutes: number; seriesBeforeBreak: number; chronoMode: 'off' | 'soft' | 'on';
  sound: boolean; voice: boolean; startLevel: 1 | 2 | 3 };
```

**Règles**

- Toutes les écritures passent par des repositories (`data/`), jamais par les composants.
- Chaque tentative est enregistrée immédiatement ; une série interrompue ne donne pas de pièce mais conserve les tentatives.
- Le format d'export JSON inclut un champ `schemaVersion` ; l'import refuse un fichier d'une version supérieure.
- Les jours sont calculés dans le fuseau local (`Europe/Paris` par défaut via `Intl`), au format `YYYY-MM-DD`.
- Demander `navigator.storage.persist()` au premier lancement pour limiter le risque d'effacement par le navigateur.

---

## 12. Plan de livraison et critères d'acceptation

Livrer par jalons, chaque jalon étant utilisable et testé avant de passer au suivant.

| Jalon | Contenu | Critères d'acceptation |
| --- | --- | --- |
| M0 — Socle | Vite + React + TS, routage, Tailwind, thème, i18n, CI (lint, types, tests), PWA vide | `npm run build` passe ; l'app s'installe et s'ouvre hors ligne ; `tsc --noEmit` et `eslint` sans erreur |
| M1 — Moteur | Générateurs C10, C20, CDS, P9, M9 ; Leitner ; composition de série ; tests unitaires | Couverture de `domain/` ≥ 90 % ; tous les tests de la section 8 passent |
| M2 — Premier jeu | Pavé numérique, jeu « Maison du 10 », écran de fin de série, persistance Dexie | Une série complète jouable de bout en bout ; les tentatives apparaissent en base ; rechargement sans perte |
| M3 — Gamification | Puzzle 3×3, album, étoiles, flamme, 1 puzzle complet avec animation | 9 séries terminées révèlent un personnage ajouté à l'album ; fonctionne après redémarrage |
| M4 — Autres jeux | Grenouille, Bulles, Course, Boutique ; étape « Je découvre » | Chaque jeu joue 10 questions, appelle `onAnswer`, respecte le contrat de la section 6 |
| M5 — Espace parent | Accès protégé, tableau de bord, réglages, export/import | Export puis import redonne un état identique ; réglages pris en compte en jeu |
| M6 — Finition | Accessibilité, sons, voix, mode reduced-motion, tests Playwright, perf | Lighthouse mobile : Performance ≥ 90, Accessibilité ≥ 95, PWA valide ; parcours Playwright vert |

**Parcours Playwright à automatiser (au minimum)**

1. Créer un profil, jouer une série de « Maison du 10 », voir une pièce de puzzle apparaître.
2. Fournir 3 mauvaises réponses d'affilée : l'aide s'affiche, aucune pénalité visible, la question revient.
3. Terminer 9 séries : le personnage rejoint l'album.
4. Couper le réseau : l'app continue de fonctionner.
5. Accéder à l'espace parent avec la bonne réponse au calcul, échouer avec une mauvaise.

**Conventions pour Claude Code**

- Créer un `CLAUDE.md` à la racine reprenant : stack, règle « `domain/` pur », « aucune chaîne en dur », commandes (`dev`, `build`, `test`, `lint`, `typecheck`).
- Commits petits et fréquents, un par sous-tâche ; ne jamais committer de dépendances inutiles.
- Avant chaque jalon : lister les tâches, implémenter, lancer tests et lint, puis résumer ce qui reste.
- Ne rien supprimer ni modifier de ce qui existe hors du périmètre du jalon en cours sans demander.

**Questions ouvertes à trancher avant M3**

- Prénom et univers préférés de l'enfant (licornes, fées, princesses : confirmer la liste des 9 personnages).
- Appareil principal (tablette, téléphone, ordinateur) pour caler les tailles.
- Illustrations : SVG générés dans le code pour le MVP, ou génération d'images en amont ?
- Hébergement souhaité (Cloudflare Pages, Vercel, Netlify) ou usage local uniquement.
