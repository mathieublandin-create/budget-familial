# budget-familial

Application personnelle de **gestion de budget familial** — PWA offline-first, zéro dépendance au socle M0.

- [Proposition de ferme agentique](docs/ferme-agentique.md) — pilotage multi-rôles du développement (adaptée d'`objectifs-pwa`).
- [Cahier des charges M0](docs/cahier-des-charges.md) — US1–US6 : compte, postes par périodicité, saisie de dépenses, suivi consommé/prévu, budget mensuel dérivé, export/import.
- [Pilotage du projet](docs/pilotage-projet.md) — décisions et registre des actions.

## Commandes (Node 20+, aucune dépendance à installer)

```bash
npm run build   # construit dist/ (rejouable bit à bit, icônes générées)
npm test        # build + tests unitaires (node --test) + BDD Gherkin (specs/*.feature)
```

## Déploiement

Le workflow `.github/workflows/deploy.yml` publie `dist/` sur GitHub Pages à chaque push sur `main` (activer Pages → source « GitHub Actions »).
