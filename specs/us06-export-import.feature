# language: fr
Fonctionnalité: Export / import des données — US6 (M0)
  L'utilisateur exporte ses données au format budget-familial-donnees-v1 et les réimporte sans perte.

  Scénario: Export au format v1
    Étant donné un compte « Courant » au solde initial 1000 et un poste « Courses » hebdomadaire prévu 120
    Quand l'utilisateur exporte ses données
    Alors l'export est au format « budget-familial-donnees-v1 »
    Et l'export contient le compte et le poste

  Scénario: Round-trip export puis import sans perte
    Étant donné un compte « Courant » au solde initial 1000 et une dépense de 25 sur un poste « Courses » le 2026-11-10
    Quand l'utilisateur exporte ses données puis les réimporte dans un état vide
    Alors les données réimportées sont identiques à l'export

  Scénario: Refus d'un contenu non reconnu sans impact sur l'existant
    Étant donné un état contenant un compte « Courant » au solde initial 1000
    Quand l'utilisateur importe un contenu non reconnu
    Alors l'import est refusé avec un message explicite
    Et les données existantes sont intactes
