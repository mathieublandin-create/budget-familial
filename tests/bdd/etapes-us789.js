// Step definitions US7–US9 (revenus, import OFX, bilan du mois).
import assert from "node:assert/strict";
import { nouvelEtat, ajouterCompte, ajouterPoste, ajouterRevenu, saisirDepense, saisirEncaissement, bilanMois } from "../../src/domain/domaine.js";
import { importerReleve, parserOfx } from "../../src/domain/ofx.js";

const n = (s) => Number(s);
const NORMALISER = { mensuel: "mensuelle", annuel: "annuelle", hebdomadaire: "hebdomadaire" };
const compteParNom = (ctx, nom) => ctx.etat.comptes.find((c) => c.nom === nom);
const posteParNom = (ctx, nom) => ctx.etat.postes.find((p) => p.nom === nom);
const revenuParNom = (ctx, nom) => (ctx.etat.revenus ?? []).find((r) => r.nom === nom);

function creerRevenu(ctx, nom, periodicite, montant) {
  const r = ajouterRevenu(ctx.etat, { id: `r-${nom}`, nom, periodicite: NORMALISER[periodicite] ?? periodicite, montantPrevu: n(montant) });
  if (r.ok) ctx.etat = r.etat;
  ctx.dernier = r;
  return r;
}

function ofxSample(mouvements) {
  const trns = mouvements
    .map((m) => `<STMTTRN><TRNTYPE>${m.trntype}</TRNTYPE><DTPOSTED>${m.dateIso.replaceAll("-", "")}</DTPOSTED><TRNAMT>${m.trnamt}</TRNAMT><NAME>${m.name}</NAME></STMTTRN>`)
    .join("");
  return `OFXHEADER:100\n<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>${trns}</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;
}

export const etapes = [
  { motif: /^un revenu « (.+) » (\w+) prévu (.+) et un poste « (.+) » (\w+) prévu (.+)$/, action: (m, ctx) => {
    ctx.etat = ctx.etat ?? nouvelEtat();
    creerRevenu(ctx, m[1], m[2], m[3]);
    ctx.etat = ajouterPoste(ctx.etat, { id: `p-${m[4]}`, nom: m[4], periodicite: NORMALISER[m[5]] ?? m[5], montantPrevu: n(m[6]) }).etat;
  } },
  { motif: /^un revenu « (.+) » (\w+) prévu (.+)$/, action: (m, ctx) => { ctx.etat = ctx.etat ?? nouvelEtat(); creerRevenu(ctx, m[1], m[2], m[3]); } },

  { motif: /^l'utilisateur crée le revenu « (.+) » (\w+) prévu (.+)$/, action: (m, ctx) => { ctx.etat = ctx.etat ?? nouvelEtat(); creerRevenu(ctx, m[1], m[2], m[3]); } },
  { motif: /^l'utilisateur crée le revenu « (.+) » avec la périodicité « (.+) » prévu (.+)$/, action: (m, ctx) => { ctx.etat = ctx.etat ?? nouvelEtat(); creerRevenu(ctx, m[1], m[2], m[3]); } },
  { motif: /^l'utilisateur encaisse (.+) sur le revenu « (.+) » du compte « (.+) » le (.+)$/, action: (m, ctx) => {
    const r = saisirEncaissement(ctx.etat, {
      id: `t-${ctx.etat.transactions.length + 1}`, montant: n(m[1]),
      revenuId: revenuParNom(ctx, m[2])?.id ?? "inconnu", compteId: compteParNom(ctx, m[3])?.id ?? "inconnu", dateIso: m[4],
    });
    if (r.ok) ctx.etat = r.etat;
    ctx.dernier = r;
  } },
  { motif: /^un encaissement de (.+) sur « (.+) » le (.+) et une dépense de (.+) sur « (.+) » le (.+)$/, action: (m, ctx) => {
    if (!ctx.etat.comptes.length) ctx.etat = ajouterCompte(ctx.etat, { id: "c-Courant", nom: "Courant", soldeInitial: 1000 }).etat;
    ctx.etat = saisirEncaissement(ctx.etat, {
      id: `t-${ctx.etat.transactions.length + 1}`, montant: n(m[1]),
      revenuId: revenuParNom(ctx, m[2]).id, compteId: ctx.etat.comptes[0].id, dateIso: m[3],
    }).etat;
    ctx.etat = saisirDepense(ctx.etat, {
      id: `t-${ctx.etat.transactions.length + 1}`, montant: n(m[4]),
      posteId: posteParNom(ctx, m[5]).id, compteId: ctx.etat.comptes[0].id, dateIso: m[6],
    }).etat;
  } },

  { motif: /^le revenu est créé$/, action: (m, ctx) => assert.equal(ctx.dernier.ok, true) },
  { motif: /^l'encaissement est refusé avec la raison « (.+) »$/, action: (m, ctx) => { assert.equal(ctx.dernier.ok, false); assert.equal(ctx.dernier.raison, m[1]); } },
  { motif: /^aucun revenu n'est créé$/, action: (m, ctx) => assert.equal((ctx.etat.revenus ?? []).length, 0) },

  { motif: /^l'utilisateur importe sur le compte « (.+) » un relevé OFX contenant un débit de (.+) le (.+) et un crédit de (.+) le (.+)$/, action: (m, ctx) => {
    ctx.etat = ctx.etat ?? nouvelEtat();
    const texte = ofxSample([
      { trntype: "DEBIT", trnamt: `-${m[2]}`, dateIso: m[3], name: "Courses" },
      { trntype: "CREDIT", trnamt: m[4], dateIso: m[5], name: "Salaire" },
    ]);
    let i = 0;
    ctx.dernier = importerReleve(ctx.etat, { compteId: compteParNom(ctx, m[1])?.id ?? "inconnu", texte, nouvelId: () => `ofx-${++i}` });
    if (ctx.dernier.ok) ctx.etat = ctx.dernier.etat;
  } },
  { motif: /^l'utilisateur importe sur le compte « (.+) » un contenu non reconnu$/, action: (m, ctx) => {
    let i = 0;
    ctx.dernier = importerReleve(ctx.etat, { compteId: compteParNom(ctx, m[1])?.id ?? "inconnu", texte: "ceci n'est pas un relevé", nouvelId: () => `ofx-${++i}` });
  } },
  { motif: /^l'utilisateur importe un relevé OFX valide sur le compte « (.+) »$/, action: (m, ctx) => {
    ctx.etat = ctx.etat ?? nouvelEtat();
    const texte = ofxSample([{ trntype: "DEBIT", trnamt: "-10.00", dateIso: "2026-11-10", name: "Test" }]);
    let i = 0;
    ctx.dernier = importerReleve(ctx.etat, { compteId: compteParNom(ctx, m[1])?.id ?? "inconnu", texte, nouvelId: () => `ofx-${++i}` });
    if (ctx.dernier.ok) ctx.etat = ctx.dernier.etat;
  } },
  { motif: /^(\d+) mouvements? (?:sont|est) importé(s?)$/, action: (m, ctx) => assert.equal(ctx.dernier.importes, Number(m[1])) },
  { motif: /^le poste « (.+) » est créé$/, action: (m, ctx) => assert.ok(posteParNom(ctx, m[1])) },
  { motif: /^l'import OFX est refusé avec un message explicite$/, action: (m, ctx) => { assert.equal(ctx.dernier.ok, false); assert.ok(ctx.dernier.raison); } },
  { motif: /^l'import est refusé avec la raison « (.+) »$/, action: (m, ctx) => { assert.equal(ctx.dernier.ok, false); assert.equal(ctx.dernier.raison, m[1]); } },

  { motif: /^l'utilisateur consulte le bilan du mois (\d{4}-\d{2})$/, action: (m, ctx) => { ctx.bilan = bilanMois(ctx.etat, m[1]); } },
  { motif: /^le bilan affiche revenus prévus (.+), encaissés (.+), dépenses (.+)$/, action: (m, ctx) => {
    assert.deepEqual([ctx.bilan.prevuRevenus, ctx.bilan.encaisses, ctx.bilan.depenses], [n(m[1]), n(m[2]), n(m[3])]);
  } },
  { motif: /^le bilan affiche encaissés (.+), dépenses (.+), solde du mois (.+)$/, action: (m, ctx) => {
    assert.deepEqual([ctx.bilan.encaisses, ctx.bilan.depenses, ctx.bilan.soldeMois], [n(m[1]), n(m[2]), n(m[3])]);
  } },
  { motif: /^le solde du mois est (.+)$/, action: (m, ctx) => assert.equal(ctx.bilan.soldeMois, n(m[1])) },
  { motif: /^le solde courant total est (.+)$/, action: (m, ctx) => assert.equal(ctx.bilan.soldeCourantTotal, n(m[1])) },
];
