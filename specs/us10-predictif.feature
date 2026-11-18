# language: fr
Fonctionnalité: Solde projeté fin de mois — US10 (palier M1, prédictif)
  Formule chiffrée : soldeProjeté = soldeCourantTotal + max(0, revenusPrévus − encaissés) − Σ max(0, prevu − consommé).

  Scénario: Projection avec consommation partielle
    Étant donné un compte « Courant » au solde initial 1000
    Et un revenu « Salaire » mensuel prévu 2500 et un poste « Courses » hebdomadaire prévu 120 et un poste « Électricité » mensuel prévu 80
    Et un encaissement de 2500 sur « Salaire » le 2026-11-05 et une dépense de 50 sur « Courses » le 2026-11-10
    Quand l'utilisateur consulte le solde projeté de 2026-11
    Alors le solde projeté est 2900.00

  Scénario: Poste dépassé — le reste pris en compte est 0
    Étant donné un compte « Courant » au solde initial 1000 et un poste « Courses » hebdomadaire prévu 120
    Et une dépense de 600 sur « Courses » le 2026-11-10
    Quand l'utilisateur consulte le solde projeté de 2026-11
    Alors le solde projeté est 400.00

  Scénario: Sans mouvement, la projection vaut solde courant + revenus prévus − budget mensuel
    Étant donné un compte « Courant » au solde initial 1000
    Et un revenu « Salaire » mensuel prévu 2500 et un poste « Électricité » mensuel prévu 80
    Quand l'utilisateur consulte le solde projeté de 2026-11
    Alors le solde projeté est 3420.00
