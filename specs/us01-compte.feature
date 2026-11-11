# language: fr
Fonctionnalité: Compte et solde initial — US1 (M0)
  L'utilisateur crée un compte avec un solde initial et suit son solde courant.

  Scénario: Création d'un compte valide
    Étant donné un état vide
    Quand l'utilisateur crée le compte « Courant » avec un solde initial de 1500.00
    Alors le compte est créé
    Et le solde courant du compte « Courant » est 1500.00

  Scénario: Refus d'un nom vide sans impact sur l'état
    Étant donné un état vide
    Quand l'utilisateur crée le compte «  » avec un solde initial de 100
    Alors la création est refusée avec la raison « nom vide »
    Et aucun compte n'est créé

  Scénario: Refus d'un solde initial invalide
    Étant donné un état vide
    Quand l'utilisateur crée le compte « Courant » avec un solde initial « abc »
    Alors la création est refusée avec la raison « solde initial invalide »
    Et aucun compte n'est créé
