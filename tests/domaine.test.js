// Tests du domaine pur — couverture des fonctions pures et de chaque raison de refus (US1–US5).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  nouvelEtat, ajouterCompte, ajouterPoste, saisirDepense,
  mensualiser, budgetMensuel, suiviMois, soldeCourant, consommeParPoste,
  estDateIsoValide, moisDe, arrondi2, PERIODICITES,
} from "../src/domain/domaine.js";
import { exporter, importer, FORMAT_EXPORT } from "../src/domain/exportImport.js";

test("US1 — création de compte valide et solde courant initial", () => {
  let r = ajouterCompte(nouvelEtat(), { id: "c1", nom: "Courant", soldeInitial: 1500 });
  assert.equal(r.ok, true);
  assert.equal(soldeCourant(r.etat, "c1"), 1500);
});

test("US1 — refus nom vide / solde invalide, état inchangé", () => {
  const e0 = nouvelEtat();
  assert.deepEqual(ajouterCompte(e0, { id: "c1", nom: "  ", soldeInitial: 100 }).raison, "nom vide");
  assert.deepEqual(ajouterCompte(e0, { id: "c1", nom: "C", soldeInitial: NaN }).raison, "solde initial invalide");
  assert.deepEqual(ajouterCompte(e0, { id: "c1", nom: "C", soldeInitial: "abc" }).raison, "solde initial invalide");
  assert.equal(e0.comptes.length, 0);
});

test("US2 — création de postes des 3 périodicités + refus", () => {
  let e = nouvelEtat();
  for (const [id, p] of [["p1", "mensuelle"], ["p2", "hebdomadaire"], ["p3", "annuelle"]]) {
    const r = ajouterPoste(e, { id, nom: id, periodicite: p, montantPrevu: 100 });
    assert.equal(r.ok, true);
    e = r.etat;
  }
  assert.equal(e.postes.length, 3);
  assert.equal(ajouterPoste(e, { id: "x", nom: "X", periodicite: "trimestrielle", montantPrevu: 10 }).raison, "périodicité inconnue");
  assert.equal(ajouterPoste(e, { id: "x", nom: "X", periodicite: "mensuelle", montantPrevu: -1 }).raison, "montant prévu invalide");
  assert.deepEqual(PERIODICITES, ["mensuelle", "hebdomadaire", "annuelle"]);
});

test("US3 — saisie de dépense valide : solde et consommé impactés", () => {
  let e = ajouterCompte(nouvelEtat(), { id: "c1", nom: "Courant", soldeInitial: 1000 }).etat;
  e = ajouterPoste(e, { id: "p1", nom: "Courses", periodicite: "hebdomadaire", montantPrevu: 120 }).etat;
  const r = saisirDepense(e, { id: "t1", compteId: "c1", posteId: "p1", montant: 45.5, dateIso: "2026-11-10" });
  assert.equal(r.ok, true);
  assert.equal(soldeCourant(r.etat, "c1"), 954.5);
  assert.equal(consommeParPoste(r.etat, "2026-11")["p1"], 45.5);
});

test("US3 — refus : montant <= 0, poste inconnu, compte inconnu, date invalide", () => {
  let e = ajouterCompte(nouvelEtat(), { id: "c1", nom: "Courant", soldeInitial: 1000 }).etat;
  e = ajouterPoste(e, { id: "p1", nom: "Courses", periodicite: "hebdomadaire", montantPrevu: 120 }).etat;
  assert.equal(saisirDepense(e, { id: "t", compteId: "c1", posteId: "p1", montant: 0, dateIso: "2026-11-10" }).raison, "montant invalide");
  assert.equal(saisirDepense(e, { id: "t", compteId: "c1", posteId: "pX", montant: 10, dateIso: "2026-11-10" }).raison, "poste inconnu");
  assert.equal(saisirDepense(e, { id: "t", compteId: "cX", posteId: "p1", montant: 10, dateIso: "2026-11-10" }).raison, "compte inconnu");
  assert.equal(saisirDepense(e, { id: "t", compteId: "c1", posteId: "p1", montant: 10, dateIso: "2026-13-40" }).raison, "date invalide");
});

test("US5 — mensualisation déterministe", () => {
  assert.equal(mensualiser(80, "mensuelle"), 80);
  assert.equal(mensualiser(120, "hebdomadaire"), 520);
  assert.equal(mensualiser(1200, "annuelle"), 100);
  assert.equal(mensualiser(10, "inconnue"), 0);
});

test("US5 — budget mensuel total", () => {
  let e = nouvelEtat();
  e = ajouterPoste(e, { id: "p1", nom: "Électricité", periodicite: "mensuelle", montantPrevu: 80 }).etat;
  e = ajouterPoste(e, { id: "p2", nom: "Courses", periodicite: "hebdomadaire", montantPrevu: 120 }).etat;
  e = ajouterPoste(e, { id: "p3", nom: "Entretien", periodicite: "annuelle", montantPrevu: 1200 }).etat;
  const b = budgetMensuel(e, "2026-11");
  assert.equal(b.total, 700);
  assert.equal(b.lignes.find((l) => l.posteId === "p2").prevu, 520);
  assert.equal(budgetMensuel(nouvelEtat(), "2026-11").total, 0);
});

test("US4 — suivi du mois : prevu/consomme/reste par poste et totaux", () => {
  let e = nouvelEtat();
  e = ajouterPoste(e, { id: "p1", nom: "Électricité", periodicite: "mensuelle", montantPrevu: 80 }).etat;
  e = ajouterPoste(e, { id: "p2", nom: "Courses", periodicite: "hebdomadaire", montantPrevu: 120 }).etat;
  e = ajouterCompte(e, { id: "c1", nom: "Courant", soldeInitial: 1000 }).etat;
  e = saisirDepense(e, { id: "t1", compteId: "c1", posteId: "p1", montant: 30, dateIso: "2026-11-05" }).etat;
  e = saisirDepense(e, { id: "t2", compteId: "c1", posteId: "p2", montant: 50, dateIso: "2026-11-10" }).etat;
  const s = suiviMois(e, "2026-11");
  const l1 = s.lignes.find((l) => l.posteId === "p1");
  assert.deepEqual([l1.prevu, l1.consomme, l1.reste], [80, 30, 50]);
  assert.equal(s.totalConsomme, 80);
  const s2 = suiviMois(e, "2026-12");
  assert.deepEqual([s2.lignes[0].prevu, s2.lignes[0].consomme, s2.lignes[0].reste], [80, 0, 80]);
});

test("dates ISO et mois", () => {
  assert.equal(estDateIsoValide("2026-11-10"), true);
  assert.equal(estDateIsoValide("2026-13-40"), false);
  assert.equal(estDateIsoValide("10/11/2026"), false);
  assert.equal(moisDe("2026-11-10"), "2026-11");
  assert.equal(arrondi2(0.1 + 0.2), 0.3);
});

test("US6 — export au format v1, round-trip sans perte, refus contenu non reconnu", () => {
  let e = ajouterCompte(nouvelEtat(), { id: "c1", nom: "Courant", soldeInitial: 1000 }).etat;
  e = ajouterPoste(e, { id: "p1", nom: "Courses", periodicite: "hebdomadaire", montantPrevu: 120 }).etat;
  e = saisirDepense(e, { id: "t1", compteId: "c1", posteId: "p1", montant: 25, dateIso: "2026-11-10" }).etat;
  const json = exporter(e);
  assert.equal(JSON.parse(json).format, FORMAT_EXPORT);
  const r = importer(json);
  assert.equal(r.ok, true);
  assert.deepEqual(r.etat, e);
  assert.equal(importer("pas du json").ok, false);
  assert.equal(importer(JSON.stringify({ format: "autre" })).raison, "format non reconnu");
});
