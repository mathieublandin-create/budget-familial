// Tests US10 — solde projeté fin de mois (fonction pure, couverture 100 % de la formule).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  nouvelEtat, ajouterCompte, ajouterPoste, ajouterRevenu,
  saisirDepense, saisirEncaissement, soldeProjete, bilanMois,
} from "../src/domain/domaine.js";

function etatBase() {
  return ajouterCompte(nouvelEtat(), { id: "c1", nom: "Courant", soldeInitial: 1000 }).etat;
}

test("US10 — projection avec consommation partielle", () => {
  let e = etatBase();
  e = ajouterRevenu(e, { id: "r1", nom: "Salaire", periodicite: "mensuelle", montantPrevu: 2500 }).etat;
  e = ajouterPoste(e, { id: "p1", nom: "Courses", periodicite: "hebdomadaire", montantPrevu: 120 }).etat;
  e = ajouterPoste(e, { id: "p2", nom: "Électricité", periodicite: "mensuelle", montantPrevu: 80 }).etat;
  e = saisirEncaissement(e, { id: "t1", compteId: "c1", revenuId: "r1", montant: 2500, dateIso: "2026-11-05" }).etat;
  e = saisirDepense(e, { id: "t2", compteId: "c1", posteId: "p1", montant: 50, dateIso: "2026-11-10" }).etat;
  // soldeCourantTotal 3450 + resteRevenus 0 − resteDépenses (520−50 + 80 = 550) = 2900
  assert.equal(soldeProjete(e, "2026-11"), 2900);
  assert.equal(bilanMois(e, "2026-11").soldeProjete, 2900);
});

test("US10 — poste dépassé : reste pris en compte = 0", () => {
  let e = etatBase();
  e = ajouterPoste(e, { id: "p1", nom: "Courses", periodicite: "hebdomadaire", montantPrevu: 120 }).etat;
  e = saisirDepense(e, { id: "t1", compteId: "c1", posteId: "p1", montant: 600, dateIso: "2026-11-10" }).etat;
  assert.equal(soldeProjete(e, "2026-11"), 400);
});

test("US10 — sans mouvement : solde courant + revenus prévus − budget mensuel", () => {
  let e = etatBase();
  e = ajouterRevenu(e, { id: "r1", nom: "Salaire", periodicite: "mensuelle", montantPrevu: 2500 }).etat;
  e = ajouterPoste(e, { id: "p2", nom: "Électricité", periodicite: "mensuelle", montantPrevu: 80 }).etat;
  assert.equal(soldeProjete(e, "2026-11"), 3420);
});

test("US10 — revenus non encore encaissés : le reste est projeté", () => {
  let e = etatBase();
  e = ajouterRevenu(e, { id: "r1", nom: "Salaire", periodicite: "mensuelle", montantPrevu: 2500 }).etat;
  // solde courant 1000 + resteRevenus 2500 = 3500 (aucune dépense)
  assert.equal(soldeProjete(e, "2026-11"), 3500);
});
