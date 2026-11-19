# Calcul Magique

PWA de mini-jeux de calcul mental pour une élève de CE1. La spécification complète est dans
[PRD-calcul-mental-ce1.md](PRD-calcul-mental-ce1.md) : la relire avant chaque jalon.

## Stack

Vite + React 18 + TypeScript strict · React Router (hash) · Tailwind CSS v4 (thème en variables CSS dans
`src/app/theme.css`) · vite-plugin-pwa (Workbox, précache de tout) · Vitest + Testing Library.
À ajouter quand le jalon en a besoin : Zustand, Dexie, Framer Motion, Howler, Playwright.

TypeScript est épinglé en `~6.0` : typescript-eslint ne supporte pas encore TS 7.

## Commandes

- `npm run dev` : serveur de dev
- `npm run build` : typecheck + build de production (avec service worker)
- `npm run preview` : sert le build (pour tester PWA / hors ligne)
- `npm test` : tests Vitest · `npm run test:watch`
- `npm run lint` · `npm run typecheck` · `npm run format` / `format:check`

La CI (`.github/workflows/ci.yml`) lance format:check, lint, typecheck, test et build.

## Règles d'architecture (non négociables)

- **`src/domain/` est du TypeScript pur** : ni React, ni Dexie/Zustand, ni `window`/`document`/`navigator`.
  ESLint le fait respecter. Générateurs = fonctions pures `(skillId, difficulty, rng) → Question`, rng injectable.
- **Aucune chaîne en dur dans les composants** : tout texte affiché vient de `src/i18n/fr.ts`.
  Côté enfant : 8 mots maximum, tutoiement, ton encourageant.
- Les jeux ne connaissent que `Question` et `onAnswer` / `onComplete` ; ils n'accèdent jamais à la base.
- Toutes les écritures en base passent par les repositories de `src/data/`.
- Aucun contenu externe à l'exécution (polices, sons, images embarqués). Aucun tracking.
- Import avec l'alias `@/` (→ `src/`).

## UI

- Erreurs en orange doux (`help`), jamais de rouge. Couleur jamais seule porteuse d'information.
- Consignes ≥ 20 px (`text-instruction`), nombres ≥ 36 px (`text-number`).
- Cibles tactiles : 64 px pour les réponses (`min-h-touch`), 48 px ailleurs (`min-h-tap`).
- Respecter `prefers-reduced-motion`.

## Façon de travailler

- Avancer par jalons (PRD §12) : lister les tâches, implémenter, lancer tests + lint, résumer ce qui reste.
- Commits petits et fréquents, un par sous-tâche. Pas de dépendance inutile.
- Ne rien modifier hors du périmètre du jalon en cours sans demander.
