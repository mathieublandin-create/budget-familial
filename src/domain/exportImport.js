// Export / import des données — US6. Format « budget-familial-donnees-v1 ».
import { SCHEMA_VERSION, nouvelEtat } from "./domaine.js";

export const FORMAT_EXPORT = "budget-familial-donnees-v1";

export function exporter(etat) {
  return JSON.stringify(
    {
      format: FORMAT_EXPORT,
      schemaVersion: etat.schemaVersion,
      comptes: etat.comptes,
      postes: etat.postes,
      transactions: etat.transactions,
    },
    null,
    2,
  );
}

function estTableau(x) {
  return Array.isArray(x);
}

export function importer(texte) {
  let data;
  try {
    data = JSON.parse(texte);
  } catch {
    return { ok: false, raison: "contenu non reconnu" };
  }
  if (!data || data.format !== FORMAT_EXPORT) return { ok: false, raison: "format non reconnu" };
  if (data.schemaVersion !== SCHEMA_VERSION) return { ok: false, raison: "schéma non supporté" };
  if (!estTableau(data.comptes) || !estTableau(data.postes) || !estTableau(data.transactions))
    return { ok: false, raison: "contenu non reconnu" };
  const etat = nouvelEtat();
  etat.comptes = data.comptes;
  etat.postes = data.postes;
  etat.transactions = data.transactions;
  return { ok: true, etat };
}
