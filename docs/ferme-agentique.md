# Ferme agentique — Projet « Budget familial »

Proposition de ferme agentique multi-rôles pour le projet **budget-familial**, inspirée et adaptée de celle du projet `objectifs-pwa` (`docs/REPRISE.md` §6 et `docs/objectifs-pilotage-projet.md`). Le client, décideur unique, reste l'humain ; toute évolution du projet est pilotée en rejouant les rôles ci-dessous comme des personas successifs.

## 1. Contexte produit

Application personnelle de **gestion de budget familial** :

- suivi de comptes et de dépenses par **postes** classés par périodicité : `mensuelle` (électricité, emprunt…), `hebdomadaire` (courses…), `annuelle` (entretien maison…) ;
- déduction d'un **budget mensuel** et suivi consommé vs prévu ;
- **prédictif mi-mois** : à une date donnée, solde actuel, échéances régulières restantes, solde projeté si le budget est tenu, écart par rapport à l'équilibre ;
- **réajustement mensuel** : proposition du budget du mois suivant intégrant le budget annuel non consommé réparti sur les mois restants ;
- à terme, **projets** avec simulations de financement.

Vocabulaire métier **en français et figé** : `compte`, `poste`, `transaction`, `echeance`, `budget_mensuel`, `solde_projete`, `projet`.

## 2. Les rôles et leurs livrables propriétaires

Un livrable = un seul propriétaire ; les autres rôles soumettent des propositions.

| Rôle | Livrables propriétaires | Responsabilités sur ce projet |
| --- | --- | --- |
| **Orchestrateur** | Routage des phases, registre des interprétations (Ix), comptage régulier du code, revue de code automatique | Un seul orchestrateur route tout ; cycle complet en une session sauf points de validation humaine |
| **Analyste métier** | Cahier des charges (US numérotées + critères d'acceptation), fichiers `.feature` Gherkin, recettes métier (Validée / Validée avec réserves / Rejetée) | Le prédictif mi-mois est une US à part entière avec critères chiffrés (formule du solde projeté) |
| **Architecte logiciel** | DAT versionné + ADR, verdict de conformité par conception (Conformité / Conformité avec réserves / Non conforme) | ADR clés : pas de serveur, PWA offline-first, domaine pur, horloge injectée (indispensable au prédictif « on est le 10 du mois »), port de stockage unique |
| **Responsable technique (RT)** | Guide de bonnes pratiques, contrôle d'explicité + readiness des US, conception des évolutions (découpage + plan de tests macro), revues de code (max 2 allers-retours par US) | Conçoit le **moteur de calcul budgétaire en fonctions pures** : `soldeProjete`, `repartitionAnnuelleReste`, `simulationFinancement` — testées à 100 % |
| **Développeur** (instanciable en parallèle) | Code + step definitions BDD + tests + rapport de tests, sur branche dédiée `feat/USxx-…` | TDD strict (red → green → refactor), non-régression rejouée à chaque livraison ; parallélisation après analyse d'impact fichiers |
| **UX/UI** | Revues design chiffrées, accessibilité AA | Saisie d'une dépense < 10 s ; tableau de bord consommé/prévu lisible |
| **Chef de projet technique (CPM)** | Planning, priorisation, charge, reporting, risques, registre des actions, escalade au client | Planifie les paliers fonctionnels avec **test utilisateur réel timeboxé** ; présente les arbitrages en guichet groupé |

## 3. Cycle de développement (cycle v6 adapté, pour chaque US ou évolution)

1. **Raffinement** de l'US par l'analyste métier.
2. **Contrôle d'explicité + readiness** par le RT ; dès que l'US est prête, l'analyste écrit la `.feature` Gherkin (un scénario par critère + limites, en français, comportements observables uniquement) ; le RT valide couverture et steps réalisables.
3. **Conception** par le RT (+ plan de tests macro) ; validation de conformité par l'architecte (DAT/ADR) ; relecture par le développeur.
4. **Revue de lancement** RT ↔ développeur avant tout codage : lève les ambiguïtés résiduelles.
5. **Développement TDD strict** sur branche `feat/USxx-…` ; non-régression rejouée à chaque livraison.
6. **Revue d'entrée en test** : le développeur présente ; l'analyste juge la recette jouable.
7. **Revue de code par le RT** (normes + conception, tests ayant précédé le code) — lancée automatiquement dès la livraison du développeur, sans validation humaine.
8. **Tests au vert complet** : suite BDD du périmètre de l'US + non-régression des US antérieures.
9. **Revue de fin de développement**, puis **recette métier** par l'analyste (critères + bout-en-bout + limites) ; verdict consigné.
10-11. **Boucle correction / re-recette** (points formulés en critères testables) jusqu'à acceptation ou **escalade au client** avec options argumentées.

## 4. Gouvernance anti-boucles (reprise intégrale d'objectifs-pwa)

- **File unique orchestrée** : les agents produisent, ne s'interpellent pas directement.
- **Enchaînement spontané des rôles** : l'orchestrateur fait succéder les rôles de lui-même dans une même session, sans attendre l'humain entre deux rôles (hors points de validation humaine, §7) — aucune question de l'utilisateur n'est nécessaire pour lancer un rôle ; une question de l'utilisateur est routée directement vers le rôle propriétaire du sujet.
- **PR prête à merger après recette** (décision client 11/11/2026) : la livraison ouvre la PR en brouillon ; dès que la recette métier est **Validée** (ou « Validée avec réserves » non bloquantes) **et** la CI est verte, l'orchestrateur passe la PR en « ready for review » automatiquement. Le merge effectif reste une décision humaine (revue + clic « Merge »).
- **Règle de l'écrit** : tout échange passe par un livrable ; une information manquante devient une **interprétation consignée (Ix)** et le travail continue — jamais de question agent → agent.
- Les Ix ne sont arbitrées que par l'humain aux points de validation, ou en revue de fin de cycle.
- **Plafonds** : 2 allers-retours de revue de code, 2 rejets de recette ; au-delà → revue à trois + arbitrage humain. Aucune boucle ne tourne en silence.
- **Parallélisation** : plusieurs développeurs possibles, chacun sur sa propre branche, après analyse d'impact fichiers.
- **Comptage régulier du code** (fichiers et lignes de `src/` et `tests/`) consigné à chaque livraison et en fin de session ; écart anormal à la baisse = arrêt, restauration depuis le dépôt, incident consigné.
- **3 échanges sans avancement de livrable = cycle stoppé et escalade.**

## 5. Phasage proposé

| Palier | Contenu | US clés |
| --- | --- | --- |
| **M0 — Socle** (mise en place en quelques dizaines de minutes) | Compte + solde initial, postes par périodicité (mensuelle / hebdomadaire / annuelle), saisie rapide des dépenses, suivi consommé vs prévu | US1–US6 |
| **M1 — Prédictif mi-mois** | À une date donnée : solde actuel, échéances régulières restantes, solde projeté si le budget est tenu, écart vs équilibre mensuel | US7–US9 (formule du solde projeté testée à 100 % en domaine pur, horloge injectée) |
| **M2 — Réajustement mensuel** | Clôture de mois, proposition du budget du mois suivant avec répartition du budget annuel non consommé sur les mois restants de l'année | US10–US12 |
| **M3 — Projets et simulations** | Projet (coût cible, échéance), plan de financement, impact projeté sur le budget mensuel et le prédictif | US13–US15 |

Chaque palier livré individuellement (merge après tests verts + revue) ; un **test utilisateur en conditions réelles, timeboxé**, est organisé par le CPM lorsqu'un palier fonctionnel est livré.

## 6. Normes de développement (héritées d'objectifs-pwa)

- **Stack** : PWA zéro dépendance au socle (build Node rejouable bit à bit, déploiement GitHub Pages automatique), puis React 18 + TypeScript strict + Vite au portage.
- **Structure** : `src/domain` (fonctions pures, zéro I/O) · `src/storage` (port + adaptateur IndexedDB) · `src/clock` (horloge injectée) · `src/screens` · `src/app` ; dépendances unidirectionnelles `app → screens → domain/ports`.
- **Langue** : vocabulaire métier français dans le code ; dates ISO `yyyy-mm-dd` uniquement via l'horloge injectée ; commentaires de traçage `// USxx — …`.
- **Commits** : conventional commits ; branche `main` protégée (merge après tests verts + revue) ; branches courtes `feat/USxx-…` ; un commit + un tag versionné par livraison.
- **Accessibilité AA** : cibles ≥ 44 px, `aria-label` sur les boutons à icône seule, focus visible + piège de focus dans les overlays.
- **Patterns imposés** : domaine pur · port/adaptateur · point de passage unique · suppression logique (jamais physique) · migrations nommées et idempotentes.
- **Tests** : 100 % de couverture des fonctions pures (y compris chaque raison de refus) ; suite BDD Gherkin zéro dépendance comme non-régression fonctionnelle.

## 7. Points de validation humaine obligatoires

Readiness de l'US, anomalies bloquantes, arbitrages produit — présentés en **guichet groupé** par le CPM, jamais au compte-gouttes. En cas d'arbitrage produit nécessaire : arrêt et présentation des options au client, jamais de décision à sa place.

## 8. Différences clés avec la ferme d'objectifs-pwa

- Le métier change : budget familial (comptes, postes, échéances, projets) au lieu d'objectifs/tâches.
- Le **moteur de calcul budgétaire** (prédictif mi-mois, répartition annuelle, simulation de financement) devient le cœur du domaine pur, testé exhaustivement.
- Le phasage M0→M3 suit les quatre phases du cadrage initial (socle → prédictif → réajustement → projets).
