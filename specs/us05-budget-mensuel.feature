# language: fr
Fonctionnalité: Budget mensuel dérivé — US5 (M0)
  Le budget mensuel est dérivé des postes : mensuel tel quel, hebdo × 52/12, annuel / 12.

  Scénario: Mensualisation des trois périodicités
    Étant donné un poste « Électricité » mensuel prévu 80
    Et un poste « Courses » hebdomadaire prévu 120
    Et un poste « Entretien maison » annuel prévu 1200
    Quand l'utilisateur consulte le budget mensuel de 2026-11
    Alors la ligne « Électricité » est prévu à 80.00
    Et la ligne « Courses » est prévu à 520.00
    Et la ligne « Entretien maison » est prévu à 100.00
    Et le budget mensuel total de 2026-11 est 700.00

  Scénario: Budget mensuel sans poste
    Étant donné un état vide
    Quand l'utilisateur consulte le budget mensuel de 2026-11
    Alors le budget mensuel total de 2026-11 est 0.00
