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

## US7 — Revenus (mensuels ou annuels)

En tant qu'utilisateur, je définis des revenus (nom, périodicité `mensuelle`/`hebdomadaire`/`annuelle`, montant prévu) et je saisis des encaissements réels.

Critères d'acceptation :
1. Un revenu est créé comme un poste, avec les mêmes périodicités et la même validation (refus avec raison sinon).
2. Un encaissement réel (montant > 0, revenu existant, compte existant, date ISO valide) est enregistré ; refus avec raison sinon.
3. Le solde courant d'un compte = solde initial + encaissements − dépenses.
4. La mensualisation des revenus suit la même règle que les postes (hebdo × 52/12, annuel / 12).

## US8 — Import d'un relevé bancaire au format OFX

En tant qu'utilisateur, j'importe un fichier OFX de relevé bancaire pour alimenter mes transactions sans ressaisie.

Critères d'acceptation :
1. Le parseur OFX extrait chaque `STMTTRN` : `TRNTYPE` (DEBIT → dépense, CREDIT → encaissement), `TRNAMT` (séparateur `.` ou `,`), `DTPOSTED` (`yyyyMMdd…` → `yyyy-mm-dd`), libellé (`NAME` ou `MEMO`).
2. L'import crée les transactions sur le compte choisi, rattachées au poste/revenu « Import bancaire » (créé si absent) ; le solde courant est recalculé en conséquence.
3. Refus avec raison si le compte est inconnu ou si le contenu n'est pas un relevé OFX reconnu ; l'état est inchangé.

## US9 — Bilan du mois

En tant qu'utilisateur, je visualise le bilan du mois en cours : revenus prévus vs encaissés, dépenses, solde du mois, solde courant total.

Critères d'acceptation :
1. Le bilan du mois `yyyy-mm` affiche : revenus prévus (mensualisés), revenus encaissés, dépenses du mois, solde du mois (encaissés − dépenses), solde courant total des comptes.
2. Le solde du mois est cohérent avec le suivi par poste (US4) : dépenses du bilan = total consommé du suivi.
3. Un mois sans mouvement affiche des totaux à 0.

## Hors périmètre M0

Prédictif mi-mois (M1), réajustement mensuel (M2), projets et simulations (M3), persistance distante, multi-comptes avancés.

Mise à jour 11/11/2026 (recette mobile A-104) : ajout des US7–US9 (revenus, import OFX, bilan du mois) au palier courant.
