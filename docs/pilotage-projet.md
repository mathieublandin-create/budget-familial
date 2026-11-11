# Pilotage — Budget familial

Registre tenu par le **CPM**. Décisions et actions du projet.

## Décisions actées

| ID | Date | Décision |
| --- | --- | --- |
| D-M0 | 11/11/2026 | Lancement du palier **M0 — Socle** (US1–US6) en PWA zéro dépendance, build Node rejouable, déploiement GitHub Pages automatique (hérité d'`objectifs-pwa`) |
| D-CI | 11/11/2026 | CI minimale documentaire dès la proposition de ferme ; build + tests + BDD ajoutés au M0 (build.js présent) |
| D-US789 | 11/11/2026 | Recette mobile A-104 : installation PWA OK, app fonctionnelle. Demandes client : revenus (US7), import relevé bancaire OFX (US8), bilan du mois (US9) — intégrées au palier courant |

## Actions ouvertes

| ID | Action | Responsable | Échéance |
| --- | --- | --- | --- |
| A-102 | Activer GitHub Pages (source « GitHub Actions ») au merge du M0 sur `main` — déploiement sans Node local (build sur le runner CI) | Mathieu | merge M0 |
| A-103 | Rédiger le guide utilisateur v1.0 (installation PWA) à la livraison M0 | analyste métier | livraison M0 |
| A-104 | Recette en conditions réelles navigateur une fois en ligne (R11 hors ligne, R12 persistance fermeture/réouverture, invite d'installation PWA desktop + mobile) — **en cours** : installation OK, 3 demandes notées (D-US789) | Mathieu | mise en ligne faite |
| A-105 | Livraison US7–US9 (branche `feat/US07-09-revenus-import-ofx-bilan`) + recette métier associée | analyste métier + dev | palier courant |

## Recettes

| Palier | Verdict | Date | Détail |
| --- | --- | --- | --- |
| M0 (US1–US6) | **Validée avec réserves** | 11/11/2026 | Analyste métier spécialisé gestion budgétaire : 11/11 tests unitaires verts, 17/17 scénarios BDD verts (6 `.feature`), build rejouable bit à bit. **Réserves** : vérifications navigateur réel (hors ligne, persistance, installation PWA) impossibles sans mise en ligne → A-104. Aucun rejet, aucune anomalie bloquante ou majeure. |

Actions soldées à connaître : A-101 (recette métier M0 — verdict ci-dessus).

## Liens

- [Ferme agentique](ferme-agentique.md) — rôles, cycle v6, gouvernance
- [Cahier des charges M0](cahier-des-charges.md) — US1–US6 + critères d'acceptation
