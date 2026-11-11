# language: fr
Fonctionnalité: Suivi consommé vs prévu — US4 (M0)
  L'utilisateur consulte le mois en cours : prévu, consommé, reste par poste et au total.

  Scénario: Suivi du mois avec une dépense
    Étant donné un poste « Électricité » mensuel prévu 80 et un poste « Courses » hebdomadaire prévu 120
    Et une dépense de 30 sur « Électricité » le 2026-11-05 et une dépense de 50 sur « Courses » le 2026-11-10
    Quand l'utilisateur consulte le suivi du mois 2026-11
    Alors la ligne « Électricité » affiche prévu 80, consommé 30, reste 50
    Et la ligne « Courses » affiche consommé 50
    Et le total du mois affiche consommé 80

  Scénario: Mois sans dépense
    Étant donné un poste « Électricité » mensuel prévu 80
    Quand l'utilisateur consulte le suivi du mois 2026-12
    Alors la ligne « Électricité » affiche prévu 80, consommé 0, reste 80
