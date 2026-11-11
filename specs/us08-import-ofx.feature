# language: fr
Fonctionnalité: Import d'un relevé bancaire OFX — US8
  L'utilisateur importe un fichier OFX : DEBIT → dépense, CREDIT → encaissement.

  Scénario: Import d'un relevé OFX valide
    Étant donné un compte « Courant » au solde initial 1000
    Quand l'utilisateur importe sur le compte « Courant » un relevé OFX contenant un débit de 45.50 le 2026-11-10 et un crédit de 2500 le 2026-11-05
    Alors 2 mouvements sont importés
    Et le solde courant du compte « Courant » est 3454.50
    Et le poste « Import bancaire » est créé

  Scénario: Refus d'un contenu non OFX sans impact sur l'état
    Étant donné un compte « Courant » au solde initial 1000
    Quand l'utilisateur importe sur le compte « Courant » un contenu non reconnu
    Alors l'import OFX est refusé avec un message explicite
    Et le solde courant du compte « Courant » reste 1000

  Scénario: Refus si le compte est inconnu
    Étant donné un état vide
    Quand l'utilisateur importe un relevé OFX valide sur le compte « Inconnu »
    Alors l'import est refusé avec la raison « compte inconnu »
