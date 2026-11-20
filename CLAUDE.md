# Calcul Magique

PWA de mini-jeux de calcul mental pour une élève de CE1. La spécification complète est dans
[PRD-calcul-mental-ce1.md](PRD-calcul-mental-ce1.md) : la relire avant chaque jalon. Ce qui reste à faire
est dans [TODO.md](TODO.md).

## Stack

Vite + React 18 + TypeScript strict · React Router (hash) · Zustand · Dexie (IndexedDB) · Howler · Tailwind CSS v4 (thème en variables CSS dans
`src/app/theme.css`) · vite-plugin-pwa (Workbox, précache de tout) · Vitest + Testing Library.
Pas de Framer Motion (animations CSS) ni de Playwright (abandonné à la demande de l'utilisateur).

TypeScript est épinglé en `~6.0` : typescript-eslint ne supporte pas encore TS 7.

## Commandes

- `npm run dev` : serveur de dev
- `npm run build` : typecheck + build de production (avec service worker)
- `npm run preview` : sert le build (pour tester PWA / hors ligne)
- `npm test` : tests Vitest · `npm run test:watch`
- `npm run lint` · `npm run typecheck` · `npm run format` / `format:check`

La CI (`.github/workflows/ci.yml`) lance format:check, lint, typecheck, test et build.
Déploiement : chaque push sur `main` est vérifié puis publié sur GitHub Pages
(`.github/workflows/deploy.yml`, site sous `/calcul-magique/` via `BASE_PATH`). Version de Node dans `.node-version`.

## Règles d'architecture (non négociables)

- **`src/domain/` est du TypeScript pur** : ni React, ni Dexie/Zustand, ni `window`/`document`/`navigator`.
  ESLint le fait respecter. Générateurs = fonctions pures `(skillId, difficulty, rng) → Question`, rng injectable.
- **Aucune chaîne en dur dans les composants** : tout texte affiché vient de `src/i18n/fr.ts`.
  Côté enfant : 8 mots maximum, tutoiement, ton encourageant.
- Les jeux (`src/games/`) reçoivent une question à la fois (`GameProps` : `question`, `attempt`, `active`,
  `onAnswer(correct, responseMs)`) et n'accèdent jamais à la base. Le lecteur de série
  (`src/features/play/`) gère la seconde chance, l'aide, la fin de série et l'enregistrement.
- Toutes les écritures en base passent par les repositories de `src/data/`.
- Aucun contenu externe à l'exécution (polices, sons, images embarqués). Aucun tracking.
- Import avec l'alias `@/` (→ `src/`).

## Astuces de dev

- `#/jouer/C10?niveau=2&jeu=bubbles` force le niveau et le jeu (sinon : niveau de la compétence ou
  `startLevel`, et premier jeu de `SKILL_GAMES`) ; un niveau forcé ne déclenche aucun conseil de niveau.
  `#/competence/P9?revoir=1` rejoue « Je découvre ». `#/defi` : défi du jour (une fois par jour).
- Progression (adoucie par rapport au PRD §4) : 7 mondes dans `src/domain/worlds.ts`, du plus simple
  (`ADS` plus et moins ≤ 10) au calcul posé (`APO`, `SPO`) puis aux tables. Chaque niveau d'une compétence
  ne demande qu'une marche de plus ; « Je découvre » a un exemple et une phrase par niveau
  (`DEMO_FACTS` dans `Discover.tsx`, `fr.discover.intro`) et revient quand un nouveau niveau est atteint.
- Niveaux en jeu : `levelAdvice` (`domain/engine/progression.ts`) propose de monter en fin de série
  (jamais imposé) ou redescend après 2 séries difficiles ; seules les séries jouées depuis
  `SkillProgress.levelSince` comptent.
- Calcul posé : `src/domain/column.ts` (colonnes, retenues, emprunts) ; jeu « Le Petit Train »
  (`src/games/train`), saisie des unités vers la gauche (`entry.ts`).
- Jeux compatibles par compétence : `SKILL_GAMES` dans `src/games/index.ts`. Tout nouveau jeu doit passer
  `src/games/contract.test.tsx` (10 questions par compétence et niveau, `onAnswer` à chaque réponse).
- Données : IndexedDB `calcul-magique` (profils, états des faits, tentatives, séries, puzzles, récompenses) ;
  profil actif dans `localStorage`. Schéma versionné dans `src/data/db.ts` : ajouter une `version(n)` par
  migration, ne jamais modifier une version publiée.
- Export/import (`src/data/backup.ts`) : le fichier porte `schemaVersion`. Un import plus récent que l'app est
  refusé ; un import plus ancien est accepté (tables absentes = vides). Toute nouvelle table liée à un profil
  doit être ajoutée à l'export, à l'import, à la réinitialisation et au test d'aller-retour.
  Un champ non indexé (ex. `SkillProgress.discoveredLevel`, `Series.level`) ne demande pas de migration.
- Médailles : `src/domain/rewards/medals.ts`, attribuées dans `finishSeries` (`rewards.badges`).
- Espace parent : engrenage de l'accueil → `#/parent` (multiplication des tables 6 à 9).
- Personnages : `src/assets/characters/<id>.svg` (carré 300×300) + `<id>.json` ; le catalogue les découvre seul.
- L'horloge passe par `now()` de `src/app/clock.ts` (la règle React « purity » refuse `Date.now()` dans les
  composants).

## UI

- Erreurs en orange doux (`help`), jamais de rouge. Couleur jamais seule porteuse d'information.
- Consignes ≥ 20 px (`text-instruction`), nombres ≥ 36 px (`text-number`).
- Cibles tactiles : 64 px pour les réponses (`min-h-touch`), 48 px ailleurs (`min-h-tap`).
- Clavier : les flèches passent au bouton ou lien le plus proche dans leur direction
  (`useArrowNavigation`, `src/ui/arrowNavigation.ts`, branché dans `Layout`) ; Entrée ou Espace active.
  Les jeux n'utilisent pas les flèches (chiffres, Entrée, Retour arrière, 1-2-3 à la course).
- Respecter `prefers-reduced-motion` : les classes `anim-*` deviennent des fondus (voir `theme.css`).
- Violet principal `#6a4ab5` : contraste AA sur tous les fonds (l'ancien `#7b5cc4` échouait sur lavande).
- Sons : `playSound()` de `src/app/audio.ts` (Howler chargé au premier son, fichiers dans
  `src/assets/sounds`, jamais de son négatif). Voix : `ListenButton` si le réglage « voix » est activé.
- Écrans secondaires et jeux chargés à la demande (`src/app/lazyScreens.tsx`, `GAMES`) ; tout reste
  précaché par le service worker.

## Façon de travailler

- Avancer par jalons (PRD §12) : lister les tâches, implémenter, lancer tests + lint, résumer ce qui reste.
- Commits petits et fréquents, un par sous-tâche. Pas de dépendance inutile.
- Ne rien modifier hors du périmètre du jalon en cours sans demander.
