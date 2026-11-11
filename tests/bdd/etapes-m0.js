// Step definitions M0 — US1 à US6. Comportements observables uniquement, via le domaine pur.
import assert from "node:assert/strict";
import {
  nouvelEtat, ajouterCompte, ajouterPoste, saisirDepense,
  budgetMensuel, suiviMois, soldeCourant, consommeParPoste, moisDe,
} from "../../src/domain/domaine.js";
import { exporter, importer } from "../../src/domain/exportImport.js";

const n = (s) => Number(s);
const NORMALISER = { mensuel: "mensuelle", annuel: "annuelle", hebdomadaire: "hebdomadaire" };
const compteParNom = (ctx, nom) => ctx.etat.comptes.find((c) => c.nom === nom);
const posteParNom = (ctx, nom) => ctx.etat.postes.find((p) => p.nom === nom);

function creerCompte(ctx, nom, solde) {
  const r = ajouterCompte(ctx.etat, { id: `c-${nom}`, nom, soldeInitial: n(solde) });
  if (r.ok) ctx.etat = r.etat;
  ctx.dernier = r;
  return r;
}

function creerPoste(ctx, nom, periodicite, montant) {
  const p = NORMALISER[periodicite] ?? periodicite;
  const r = ajouterPoste(ctx.etat, { id: `p-${nom}`, nom, periodicite: p, montantPrevu: n(montant) });
  if (r.ok) ctx.etat = r.etat;
  ctx.dernier = r;
  return r;
}

// Les dépenses "donné" de US4/US6 n'ont pas de compte : on en crée un pour que la dépense porte sur un compte valide.
function assurerCompte(ctx) {
  if (!ctx.etat.comptes.length) creerCompte(ctx, "Courant", "1000");
}

export const etapes = [
  { motif: /^un état vide$/, action: (m, ctx) => { ctx.etat = nouvelEtat(); } },
  { motif: /^un état contenant un compte « (.+) » au solde initial (.+)$/, action: (m, ctx) => { ctx.etat = nouvelEtat(); creerCompte(ctx, m[1], m[2]); } },
  { motif: /^un compte « (.+) » au solde initial (.+) et un poste « (.+) » (\w+) prévu (.+)$/, action: (m, ctx) => { ctx.etat = nouvelEtat(); creerCompte(ctx, m[1], m[2]); creerPoste(ctx, m[3], m[4], m[5]); } },
  { motif: /^un compte « (.+) » au solde initial (.+)$/, action: (m, ctx) => { ctx.etat = ctx.etat ?? nouvelEtat(); creerCompte(ctx, m[1], m[2]); } },
  { motif: /^un poste « (.+) » (\w+) prévu (.+) et un poste « (.+) » (\w+) prévu (.+)$/, action: (m, ctx) => { ctx.etat = ctx.etat ?? nouvelEtat(); creerPoste(ctx, m[1], m[2], m[3]); creerPoste(ctx, m[4], m[5], m[6]); } },
  { motif: /^un poste « (.+) » (\w+) prévu (.+)$/, action: (m, ctx) => { ctx.etat = ctx.etat ?? nouvelEtat(); creerPoste(ctx, m[1], m[2], m[3]); } },

  { motif: /^l'utilisateur crée le compte «\s*([^»]*?)\s*» avec un solde initial (?:de |« )([^»]+?)»?$/, action: (m, ctx) => { ctx.etat = ctx.etat ?? nouvelEtat(); creerCompte(ctx, m[1], m[2]); } },
  { motif: /^l'utilisateur crée le poste « (.+) » (\w+) prévu (.+)$/, action: (m, ctx) => { ctx.etat = ctx.etat ?? nouvelEtat(); creerPoste(ctx, m[1], m[2], m[3]); } },
  { motif: /^l'utilisateur crée le poste « (.+) » avec la périodicité « (.+) » prévu (.+)$/, action: (m, ctx) => { ctx.etat = ctx.etat ?? nouvelEtat(); creerPoste(ctx, m[1], m[2], m[3]); } },

  { motif: /^l'utilisateur saisit une dépense de (.+) sur le poste « (.+) » du compte « (.+) » le (.+)$/, action: (m, ctx) => {
    const r = saisirDepense(ctx.etat, {
      id: `t-${ctx.etat.transactions.length + 1}`,
      montant: n(m[1]), posteId: posteParNom(ctx, m[2])?.id ?? "inconnu", compteId: compteParNom(ctx, m[3])?.id ?? "inconnu", dateIso: m[4],
    });
    if (r.ok) ctx.etat = r.etat;
    ctx.dernier = r;
  } },
  { motif: /^une dépense de (.+) sur « (.+) » le (.+) et une dépense de (.+) sur « (.+) » le (.+)$/, action: (m, ctx) => {
    assurerCompte(ctx);
    for (const [montant, poste, date] of [[m[1], m[2], m[3]], [m[4], m[5], m[6]]]) {
      ctx.etat = saisirDepense(ctx.etat, {
        id: `t-${ctx.etat.transactions.length + 1}`, montant: n(montant),
        posteId: posteParNom(ctx, poste).id, compteId: ctx.etat.comptes[0].id, dateIso: date,
      }).etat;
    }
  } },
  { motif: /^une dépense de (.+) sur (?:un poste )?« (.+) » le (.+)$/, action: (m, ctx) => {
    assurerCompte(ctx);
    ctx.etat = saisirDepense(ctx.etat, {
      id: `t-${ctx.etat.transactions.length + 1}`, montant: n(m[1]),
      posteId: posteParNom(ctx, m[2]).id, compteId: ctx.etat.comptes[0].id, dateIso: m[3],
    }).etat;
  } },

  { motif: /^le compte est créé$/, action: (m, ctx) => assert.equal(ctx.dernier.ok, true) },
  { motif: /^les (\d+) postes sont créés avec leur périodicité$/, action: (m, ctx) => {
    assert.equal(ctx.etat.postes.length, Number(m[1]));
    assert.ok(ctx.etat.postes.every((p) => ["mensuelle", "hebdomadaire", "annuelle"].includes(p.periodicite)));
  } },
  { motif: /^la dépense est enregistrée$/, action: (m, ctx) => assert.equal(ctx.dernier.ok, true) },
  { motif: /^la création est refusée avec la raison « (.+) »$/, action: (m, ctx) => { assert.equal(ctx.dernier.ok, false); assert.equal(ctx.dernier.raison, m[1]); } },
  { motif: /^la saisie est refusée avec la raison « (.+) »$/, action: (m, ctx) => { assert.equal(ctx.dernier.ok, false); assert.equal(ctx.dernier.raison, m[1]); } },
  { motif: /^aucun compte n'est créé$/, action: (m, ctx) => assert.equal(ctx.etat.comptes.length, 0) },
  { motif: /^aucun poste n'est créé$/, action: (m, ctx) => assert.equal(ctx.etat.postes.length, 0) },

  { motif: /^le solde courant du compte « (.+) » (?:est|reste) (.+)$/, action: (m, ctx) => assert.equal(soldeCourant(ctx.etat, compteParNom(ctx, m[1]).id), n(m[2])) },
  { motif: /^le consommé du poste « (.+) » en (\d{4}-\d{2}) est (.+)$/, action: (m, ctx) => assert.equal(consommeParPoste(ctx.etat, m[2])[posteParNom(ctx, m[1]).id] ?? 0, n(m[3])) },

  { motif: /^l'utilisateur consulte le suivi du mois (\d{4}-\d{2})$/, action: (m, ctx) => { ctx.suivi = suiviMois(ctx.etat, m[1]); } },
  { motif: /^la ligne « (.+) » affiche prévu (.+), consommé (.+), reste (.+)$/, action: (m, ctx) => {
    const l = ctx.suivi.lignes.find((x) => x.nom === m[1]);
    assert.deepEqual([l.prevu, l.consomme, l.reste], [n(m[2]), n(m[3]), n(m[4])]);
  } },
  { motif: /^la ligne « (.+) » affiche consommé (.+)$/, action: (m, ctx) => {
    const l = ctx.suivi.lignes.find((x) => x.nom === m[1]);
    assert.equal(l.consomme, n(m[2]));
  } },
  { motif: /^le total du mois affiche consommé (.+)$/, action: (m, ctx) => assert.equal(ctx.suivi.totalConsomme, n(m[1])) },

  { motif: /^l'utilisateur consulte le budget mensuel de (\d{4}-\d{2})$/, action: (m, ctx) => { ctx.budget = budgetMensuel(ctx.etat, m[1]); } },
  { motif: /^la ligne « (.+) » est prévu à (.+)$/, action: (m, ctx) => {
    const l = ctx.budget.lignes.find((x) => x.nom === m[1]);
    assert.equal(l.prevu, n(m[2]));
  } },
  { motif: /^le budget mensuel total de (\d{4}-\d{2}) est (.+)$/, action: (m, ctx) => assert.equal(ctx.budget.total, n(m[2])) },

  { motif: /^l'utilisateur exporte ses données$/, action: (m, ctx) => { ctx.export = exporter(ctx.etat); } },
  { motif: /^l'utilisateur exporte ses données puis les réimporte dans un état vide$/, action: (m, ctx) => {
    ctx.export = exporter(ctx.etat);
    const r = importer(ctx.export);
    assert.equal(r.ok, true);
    ctx.reimport = r.etat;
  } },
  { motif: /^l'export est au format « (.+) »$/, action: (m, ctx) => assert.equal(JSON.parse(ctx.export).format, m[1]) },
  { motif: /^l'export contient le compte et le poste$/, action: (m, ctx) => {
    const d = JSON.parse(ctx.export);
    assert.ok(d.comptes.length >= 1 && d.postes.length >= 1);
  } },
  { motif: /^les données réimportées sont identiques à l'export$/, action: (m, ctx) => assert.deepEqual(ctx.reimport, ctx.etat) },
  { motif: /^l'utilisateur importe un contenu non reconnu$/, action: (m, ctx) => { ctx.avant = structuredClone(ctx.etat); ctx.importRefus = importer("contenu non reconnu {{{"); } },
  { motif: /^l'import est refusé avec un message explicite$/, action: (m, ctx) => { assert.equal(ctx.importRefus.ok, false); assert.ok(ctx.importRefus.raison); } },
  { motif: /^les données existantes sont intactes$/, action: (m, ctx) => assert.deepEqual(ctx.etat, ctx.avant) },
];
