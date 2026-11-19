# À faire — Calcul Magique

État au 19/11/2026. Les jalons M0 à M6 du PRD (§12) sont livrés, avec ces ajouts :

- **Progression plus douce** : 7 mondes courts au lieu de 5, nouvelle première marche « Plus et moins »
  (`ADS`, ≤ 10), niveaux de `TAD` et `DBL` adoucis, « Je découvre » par niveau, prochaine étape
  conseillée et niveau (●○○) sur la carte.
- **Niveaux en jeu** : montée proposée en fin de série, retour doux après deux séries difficiles
  (les règles existaient dans le domaine mais n'étaient pas branchées).
- **Calcul posé** : addition (`APO`) et soustraction (`SPO`) posées, jeu « Le Petit Train ».
- **Défi du jour** et **8 médailles** du PRD (§5 et §7), qui manquaient.

## Reste à faire

- [ ] **Audit Lighthouse mobile** (critère M6 jamais mesuré) : Performance ≥ 90, Accessibilité ≥ 95,
      PWA valide, sur `npm run build && npm run preview`.
- [ ] **Son du Petit Train** : un sifflet court au départ du train (`.ogg` + `.mp3` dans
      `src/assets/sounds`, ajouter l'id à `SoundId`). Aujourd'hui : son « bulle » pour la retenue et
      son de réussite habituel.
- [ ] **Essayer la nouvelle progression avec l'enfant** et régler si besoin :
  - rythme de montée de niveau (3 séries ≥ 90 %, ou 80 % des faits solides et 2 séries réussies),
    constantes dans `src/domain/engine/progression.ts` ;
  - ouverture des mondes (60 % d'une compétence maîtrisée, soit environ une semaine à cause des
    intervalles Leitner) ; le parent peut toujours « Tout débloquer ».
- [ ] **Calcul posé, suite** (hors MVP) : nombres à 3 chiffres, emprunts en chaîne. Le moteur
      `src/domain/column.ts` et le train savent déjà les poser, il manque des générateurs/niveaux.
- [ ] **Faits orphelins** de l'ancienne progression : `tad:a+b` à somme ≤ 10 (ancien niveau 1 de TAD,
      désormais dans `ADS`) et moitiés de pairs > 20 de `DBL` restent en base. Ils restent jouables et
      peuvent revenir en révision ; on pourrait les migrer vers `ads:` ou les ignorer.
- [ ] **Questions ouvertes du PRD** : hébergement (Cloudflare Pages, Netlify…) ou usage local ;
      illustrations finales des personnages (remplacer les SVG suffit, aucun code à changer).

## Choix assumés

- Playwright abandonné à la demande : les parcours du PRD §12 sont couverts par des tests
  Testing Library (`router.test.tsx`, `SeriesScreen.test.tsx`, `sessionStore.test.ts`…).
- « 100 questions du jour » (médaille) = 100 questions jouées en défis du jour, pour ne pas inciter
  à jouer longtemps dans une même journée.
