// Export / import des données — US6. Format « budget-familial-donnees-v1 » (schéma v2 courant).
// Migration nommée et idempotente : schéma v1 (sans revenus) → v2.
import { SCHEMA_VERSION, nouvelEtat } from "./domaine.js";

export const FORMAT_EXPORT = "budget-familial-donnees-v1";

export function exporter(etat) {
  return JSON.stringify(
    {
      format: FORMAT_EXPORT,
      schemaVersion: etat.schemaVersion,
      comptes: etat.comptes,
      postes: etat.postes,
      revenus: etat.revenus ?? [],
      transactions: etat.transactions,
    },
    null,
    2,
  );
}

// Migration v1 → v2 : ajoute la collection revenus et le type "depense" sur les transactions existantes.
export function migrer(data) {
  if (data.schemaVersion === 1) {
    return {
      ...data,
      schemaVersion: 2,
      revenus: [],
      transactions: data.transactions.map((t) => ({ type: "depense", ...t })),
    };
  }
  return data;
}

export function importer(texte) {
  let data;
  try {
    data = JSON.parse(texte);
  } catch {
    return { ok: false, raison: "contenu non reconnu" };
  }
  if (!data || data.format !== FORMAT_EXPORT) return { ok: false, raison: "format non reconnu" };
  if (data.schemaVersion > SCHEMA_VERSION) return { ok: false, raison: "schéma non supporté" };
  if (!Array.isArray(data.comptes) || !Array.isArray(data.postes) || !Array.isArray(data.transactions))
    return { ok: false, raison: "contenu non reconnu" };
  const migre = migrer(data);
  const etat = nouvelEtat();
  etat.comptes = migre.comptes;
  etat.postes = migre.postes;
  etat.revenus = migre.revenus ?? [];
  etat.transactions = migre.transactions;
  return { ok: true, etat };
}
