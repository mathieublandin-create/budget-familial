// Step definitions US10 — solde projeté fin de mois.
import assert from "node:assert/strict";
import { soldeProjete } from "../../src/domain/domaine.js";

export const etapes = [
  { motif: /^l'utilisateur consulte le solde projeté de (\d{4}-\d{2})$/, action: (m, ctx) => { ctx.projete = soldeProjete(ctx.etat, m[1]); } },
  { motif: /^le solde projeté est (.+)$/, action: (m, ctx) => assert.equal(ctx.projete, Number(m[1])) },
];
