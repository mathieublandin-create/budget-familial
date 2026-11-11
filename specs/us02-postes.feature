# language: fr
Fonctionnalité: Postes de dépenses par périodicité — US2 (M0)
  L'utilisateur définit des postes classés mensuelle / hebdomadaire / annuelle.

  Scénario: Création de postes des trois périodicités
    Étant donné un état vide
    Quand l'utilisateur crée le poste « Électricité » mensuel prévu 80
    Et l'utilisateur crée le poste « Courses » hebdomadaire prévu 120
    Et l'utilisateur crée le poste « Entretien maison » annuel prévu 1200
    Alors les 3 postes sont créés avec leur périodicité

  Scénario: Refus d'une périodicité inconnue
    Étant donné un état vide
    Quand l'utilisateur crée le poste « Divers » avec la périodicité « trimestrielle » prévu 50
    Alors la création est refusée avec la raison « périodicité inconnue »
    Et aucun poste n'est créé

  Scénario: Refus d'un montant prévu négatif
    Étant donné un état vide
    Quand l'utilisateur crée le poste « Électricité » mensuel prévu -10
    Alors la création est refusée avec la raison « montant prévu invalide »
    Et aucun poste n'est créé
