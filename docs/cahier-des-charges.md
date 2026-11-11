# Cahier des charges — Budget familial — Palier M0 (Socle)

Rôle propriétaire : **analyste métier**. Version 1.0 — 11/11/2026. Vocabulaire figé en français.

Périmètre M0 : un compte avec solde initial, des **postes** de dépenses classés par périodicité
(`mensuelle`, `hebdomadaire`, `annuelle`), la **saisie rapide des dépenses**, le **suivi consommé vs prévu**
et le **budget mensuel dérivé**, plus l'**export/import** des données. Le prédictif mi-mois est au M1.

## US1 — Compte et solde initial

En tant qu'utilisateur, je crée un compte (nom + solde initial) pour suivre son solde courant.

Critères d'acceptation :
1. Un compte est créé avec un `id` unique, un nom non vide et un solde initial (nombre fini, 2 décimales max).
2. Le solde courant d'un compte = solde initial − somme des dépenses du compte.
3. Refus avec raison affichée si le nom est vide ou si le solde initial n'est pas un nombre fini ; l'état est alors inchangé.

## US2 — Postes de dépenses par périodicité

En tant qu'utilisateur, je définis des postes (nom, périodicité, montant prévu).

Critères d'acceptation :
1. La périodicité est exactement `mensuelle`, `hebdomadaire` ou `annuelle`.
2. Le montant prévu est un nombre ≥ 0.
3. Refus avec raison affichée si la périodicité est inconnue ou le montant négatif ; l'état est inchangé.

## US3 — Saisie rapide d'une dépense

En tant qu'utilisateur, je saisis une dépense (montant, poste, compte, date) en quelques secondes.

Critères d'acceptation :
1. Une dépense valide est enregistrée (montant > 0, poste et compte existants, date ISO `yyyy-mm-dd` valide).
2. Elle diminue le solde courant du compte et augmente le consommé du poste pour le mois de la date.
3. Refus avec raison affichée si montant ≤ 0, poste/compte inconnu ou date invalide ; l'état est inchangé.

## US4 — Suivi consommé vs prévu (mois en cours)

En tant qu'utilisateur, je consulte pour le mois en cours, par poste : prévu, consommé, reste, plus les totaux.

Critères d'acceptation :
1. Le suivi agrège les dépenses du mois `yyyy-mm` de la date du jour (horloge injectée).
2. Par poste : `prevu` = mensualisation du montant prévu, `consomme` = somme des dépenses du mois, `reste` = prevu − consomme.
3. Les totaux du mois sont la somme des lignes.

## US5 — Budget mensuel dérivé

En tant qu'utilisateur, je dispose d'un budget mensuel dérivé des postes.

Critères d'acceptation :
1. Mensualisation : `mensuelle` → montant ; `hebdomadaire` → montant × 52 / 12 ; `annuelle` → montant / 12 (arrondi à 2 décimales).
2. Le budget mensuel d'un mois = somme des mensualisations de tous les postes.
3. Le calcul est déterministe et testé à 100 % en domaine pur.

## US6 — Export / import des données

En tant qu'utilisateur, j'exporte et réimporte toutes mes données (portabilité, secours).

Critères d'acceptation :
1. L'export est un JSON au format `budget-familial-donnees-v1` contenant comptes, postes et dépenses.
2. L'import d'un export valide restitue des données identiques (round-trip sans perte).
3. L'import d'un contenu non reconnu est refusé avec un message explicite et l'état existant est intact.

## Hors périmètre M0

Prédictif mi-mois (M1), réajustement mensuel (M2), projets et simulations (M3), persistance distante, multi-comptes avancés.
