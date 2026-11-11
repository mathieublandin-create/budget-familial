# language: fr
Fonctionnalité: Saisie rapide d'une dépense — US3 (M0)
  L'utilisateur saisit une dépense qui impacte le solde du compte et le consommé du poste.

  Scénario: Saisie d'une dépense valide
    Étant donné un compte « Courant » au solde initial 1000 et un poste « Courses » hebdomadaire prévu 120
    Quand l'utilisateur saisit une dépense de 45.50 sur le poste « Courses » du compte « Courant » le 2026-11-10
    Alors la dépense est enregistrée
    Et le solde courant du compte « Courant » est 954.50
    Et le consommé du poste « Courses » en 2026-11 est 45.50

  Scénario: Refus d'un montant non positif
    Étant donné un compte « Courant » au solde initial 1000 et un poste « Courses » hebdomadaire prévu 120
    Quand l'utilisateur saisit une dépense de 0 sur le poste « Courses » du compte « Courant » le 2026-11-10
    Alors la saisie est refusée avec la raison « montant invalide »
    Et le solde courant du compte « Courant » reste 1000

  Scénario: Refus d'un poste inconnu
    Étant donné un compte « Courant » au solde initial 1000
    Quand l'utilisateur saisit une dépense de 20 sur le poste « Inconnu » du compte « Courant » le 2026-11-10
    Alors la saisie est refusée avec la raison « poste inconnu »

  Scénario: Refus d'une date invalide
    Étant donné un compte « Courant » au solde initial 1000 et un poste « Courses » hebdomadaire prévu 120
    Quand l'utilisateur saisit une dépense de 20 sur le poste « Courses » du compte « Courant » le 2026-13-40
    Alors la saisie est refusée avec la raison « date invalide »
