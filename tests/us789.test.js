// Tests US7–US9 : revenus + encaissements, import OFX, bilan du mois, migration schéma v1→v2.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  nouvelEtat, ajouterCompte, ajouterPoste, ajouterRevenu,
  saisirDepense, saisirEncaissement, soldeCourant, bilanMois, mensualiser,
} from "../src/domain/domaine.js";
import { parserOfx, importerReleve } from "../src/domain/ofx.js";
import { importer, exporter } from "../src/domain/exportImport.js";

const OFX = `OFXHEADER:100
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20261110</DTPOSTED><TRNAMT>-45,50</TRNAMT><NAME>Courses</NAME></STMTTRN>
<STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20261105</DTPOSTED><TRNAMT>2500.00</TRNAMT><MEMO>Salaire</MEMO></STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

function etatBase() {
  let e = ajouterCompte(nouvelEtat(), { id: "c1", nom: "Courant", soldeInitial: 1000 }).etat;
  return e;
}

test("US7 — revenu + encaissement : solde courant augmenté", () => {
  let e = etatBase();
  e = ajouterRevenu(e, { id: "r1", nom: "Salaire", periodicite: "mensuelle", montantPrevu: 2500 }).etat;
  const r = saisirEncaissement(e, { id: "t1", compteId: "c1", revenuId: "r1", montant: 2500, dateIso: "2026-11-05" });
  assert.equal(r.ok, true);
  assert.equal(soldeCourant(r.etat, "c1"), 3500);
  assert.equal(saisirEncaissement(e, { id: "t", compteId: "c1", revenuId: "rX", montant: 1, dateIso: "2026-11-05" }).raison, "revenu inconnu");
  assert.equal(mensualiser(600, "annuelle"), 50);
});

test("US8 — parserOfx : débit/crédit, virgule, dates", () => {
  const r = parserOfx(OFX);
  assert.equal(r.ok, true);
  assert.equal(r.mouvements.length, 2);
  assert.deepEqual(r.mouvements[0], { type: "depense", montant: 45.5, dateIso: "2026-11-10", libelle: "Courses" });
  assert.deepEqual(r.mouvements[1], { type: "revenu", montant: 2500, dateIso: "2026-11-05", libelle: "Salaire" });
  assert.equal(parserOfx("rien ici").ok, false);
  assert.equal(parserOfx("<OFX><STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20261340</DTPOSTED><TRNAMT>-1</TRNAMT></STMTTRN></OFX>").ok, false);
});

test("US8 — importerReleve : 2 mouvements, poste/revenu « Import bancaire » créés, solde recalculé", () => {
  let i = 0;
  const r = importerReleve(etatBase(), { compteId: "c1", texte: OFX, nouvelId: () => `ofx-${++i}` });
  assert.equal(r.ok, true);
  assert.equal(r.importes, 2);
  assert.equal(soldeCourant(r.etat, "c1"), 3454.5);
  assert.ok(r.etat.postes.some((p) => p.nom === "Import bancaire"));
  assert.ok(r.etat.revenus.some((x) => x.nom === "Import bancaire"));
  const r2 = importerReleve(etatBase(), { compteId: "cX", texte: OFX, nouvelId: () => "x" });
  assert.equal(r2.raison, "compte inconnu");
});

test("US9 — bilanMois : revenus prévus/encaissés, dépenses, solde du mois et solde courant total", () => {
  let e = etatBase();
  e = ajouterRevenu(e, { id: "r1", nom: "Salaire", periodicite: "mensuelle", montantPrevu: 2500 }).etat;
  e = ajouterPoste(e, { id: "p1", nom: "Courses", periodicite: "hebdomadaire", montantPrevu: 120 }).etat;
  e = saisirEncaissement(e, { id: "t1", compteId: "c1", revenuId: "r1", montant: 2500, dateIso: "2026-11-05" }).etat;
  e = saisirDepense(e, { id: "t2", compteId: "c1", posteId: "p1", montant: 50, dateIso: "2026-11-10" }).etat;
  const b = bilanMois(e, "2026-11");
  assert.deepEqual([b.prevuRevenus, b.encaisses, b.depenses, b.soldeMois, b.soldeCourantTotal], [2500, 2500, 50, 2450, 3450]);
  const b2 = bilanMois(e, "2026-12");
  assert.deepEqual([b2.encaisses, b2.depenses, b2.soldeMois], [0, 0, 0]);
});

test("Migration schéma v1 → v2 : revenus ajoutés, transactions typées « depense »", () => {
  const v1 = JSON.stringify({
    format: "budget-familial-donnees-v1",
    schemaVersion: 1,
    comptes: [{ id: "c1", nom: "Courant", soldeInitial: 1000 }],
    postes: [],
    transactions: [{ id: "t1", compteId: "c1", posteId: "p1", montant: 10, dateIso: "2026-11-10" }],
  });
  const r = importer(v1);
  assert.equal(r.ok, true);
  assert.equal(r.etat.schemaVersion, 2);
  assert.deepEqual(r.etat.revenus, []);
  assert.equal(r.etat.transactions[0].type, "depense");
  assert.equal(soldeCourant(r.etat, "c1"), 990);
  const v2 = exporter(r.etat);
  assert.equal(importer(v2).ok, true);
});
