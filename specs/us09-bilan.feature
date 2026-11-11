# language: fr
Fonctionnalité: Bilan du mois — US9
  L'utilisateur visualise le bilan du mois : revenus prévus/encaissés, dépenses, solde du mois.

  Scénario: Bilan d'un mois avec encaissement et dépense
    Étant donné un compte « Courant » au solde initial 1000
    Et un revenu « Salaire » mensuel prévu 2500 et un poste « Courses » hebdomadaire prévu 120
    Et un encaissement de 2500 sur « Salaire » le 2026-11-05 et une dépense de 50 sur « Courses » le 2026-11-10
    Quand l'utilisateur consulte le bilan du mois 2026-11
    Alors le bilan affiche revenus prévus 2500.00, encaissés 2500.00, dépenses 50.00
    Et le solde du mois est 2450.00
    Et le solde courant total est 3450.00

  Scénario: Bilan d'un mois sans mouvement
    Étant donné un compte « Courant » au solde initial 1000 et un revenu « Salaire » mensuel prévu 2500
    Quand l'utilisateur consulte le bilan du mois 2026-12
    Alors le bilan affiche encaissés 0.00, dépenses 0.00, solde du mois 0.00
