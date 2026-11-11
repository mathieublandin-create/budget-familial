# language: fr
Fonctionnalité: Revenus mensuels ou annuels — US7
  L'utilisateur définit des revenus et saisit des encaissements réels qui augmentent le solde.

  Scénario: Création d'un revenu et encaissement
    Étant donné un compte « Courant » au solde initial 1000
    Quand l'utilisateur crée le revenu « Salaire » mensuel prévu 2500
    Et l'utilisateur encaisse 2500 sur le revenu « Salaire » du compte « Courant » le 2026-11-05
    Alors le revenu est créé
    Et le solde courant du compte « Courant » est 3500

  Scénario: Refus d'un encaissement sur revenu inconnu
    Étant donné un compte « Courant » au solde initial 1000
    Quand l'utilisateur encaisse 100 sur le revenu « Inconnu » du compte « Courant » le 2026-11-05
    Alors l'encaissement est refusé avec la raison « revenu inconnu »
    Et le solde courant du compte « Courant » reste 1000

  Scénario: Refus d'une périodicité inconnue sur un revenu
    Étant donné un état vide
    Quand l'utilisateur crée le revenu « Prime » avec la périodicité « trimestrielle » prévu 500
    Alors la création est refusée avec la raison « périodicité inconnue »
    Et aucun revenu n'est créé
