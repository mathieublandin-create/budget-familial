// Domaine pur du budget familial — zéro I/O, déterministe (ADR-08 : ids et dates injectés par l'appelant).
// Vocabulaire métier en français. Toute fonction mutante retourne { ok: true, etat } ou { ok: false, raison }.
// Schéma v2 : ajout des revenus et du type des transactions ("depense" | "revenu").

export const PERIODICITES = ["mensuelle", "hebdomadaire", "annuelle"];
export const TYPES_TRANSACTION = ["depense", "revenu"];
export const SCHEMA_VERSION = 2;

export function nouvelEtat() {
  return { schemaVersion: SCHEMA_VERSION, comptes: [], postes: [], revenus: [], transactions: [] };
}

export function arrondi2(x) {
  return Math.round(x * 100) / 100;
}

export function estDateIsoValide(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function moisDe(dateIso) {
  return dateIso.slice(0, 7); // yyyy-mm
}

function estMontantValide(x) {
  return typeof x === "number" && Number.isFinite(x) && x >= 0;
}

function copier(etat) {
  return {
    schemaVersion: etat.schemaVersion,
    comptes: etat.comptes.map((c) => ({ ...c })),
    postes: etat.postes.map((p) => ({ ...p })),
    revenus: (etat.revenus ?? []).map((r) => ({ ...r })),
    transactions: etat.transactions.map((t) => ({ ...t })),
  };
}

export function ajouterCompte(etat, { id, nom, soldeInitial }) {
  if (typeof nom !== "string" || nom.trim() === "") return { ok: false, raison: "nom vide" };
  if (!estMontantValide(soldeInitial)) return { ok: false, raison: "solde initial invalide" };
  if (etat.comptes.some((c) => c.id === id)) return { ok: false, raison: "compte déjà existant" };
  const next = copier(etat);
  next.comptes.push({ id, nom: nom.trim(), soldeInitial: arrondi2(soldeInitial) });
  return { ok: true, etat: next };
}

function ajouterLibelle(etat, collection, { id, nom, periodicite, montantPrevu }) {
  if (typeof nom !== "string" || nom.trim() === "") return { ok: false, raison: "nom vide" };
  if (!PERIODICITES.includes(periodicite)) return { ok: false, raison: "périodicité inconnue" };
  if (!estMontantValide(montantPrevu)) return { ok: false, raison: "montant prévu invalide" };
  if (etat[collection].some((x) => x.id === id)) return { ok: false, raison: `${collection === "postes" ? "poste" : "revenu"} déjà existant` };
  const next = copier(etat);
  next[collection].push({ id, nom: nom.trim(), periodicite, montantPrevu: arrondi2(montantPrevu) });
  return { ok: true, etat: next };
}

export function ajouterPoste(etat, args) {
  return ajouterLibelle(etat, "postes", args);
}

// US7 — les revenus suivent les mêmes règles que les postes (mensuel / annuel, etc.).
export function ajouterRevenu(etat, args) {
  return ajouterLibelle(etat, "revenus", args);
}

function ajouterTransaction(etat, { id, compteId, type, posteId, revenuId, montant, dateIso }) {
  if (!estMontantValide(montant) || montant <= 0) return { ok: false, raison: "montant invalide" };
  if (!etat.comptes.some((c) => c.id === compteId)) return { ok: false, raison: "compte inconnu" };
  if (type === "depense" && !etat.postes.some((p) => p.id === posteId)) return { ok: false, raison: "poste inconnu" };
  if (type === "revenu" && !(etat.revenus ?? []).some((r) => r.id === revenuId)) return { ok: false, raison: "revenu inconnu" };
  if (!estDateIsoValide(dateIso)) return { ok: false, raison: "date invalide" };
  const next = copier(etat);
  const t = { id, compteId, type, montant: arrondi2(montant), dateIso };
  if (type === "depense") t.posteId = posteId;
  else t.revenuId = revenuId;
  next.transactions.push(t);
  return { ok: true, etat: next };
}

export function saisirDepense(etat, { id, compteId, posteId, montant, dateIso }) {
  return ajouterTransaction(etat, { id, compteId, type: "depense", posteId, montant, dateIso });
}

// US7 — saisie d'un encaissement réel sur un revenu.
export function saisirEncaissement(etat, { id, compteId, revenuId, montant, dateIso }) {
  return ajouterTransaction(etat, { id, compteId, type: "revenu", revenuId, montant, dateIso });
}

// US5 — mensualisation déterministe d'un montant selon la périodicité.
export function mensualiser(montant, periodicite) {
  if (periodicite === "mensuelle") return arrondi2(montant);
  if (periodicite === "hebdomadaire") return arrondi2((montant * 52) / 12);
  if (periodicite === "annuelle") return arrondi2(montant / 12);
  return 0;
}

export function budgetMensuel(etat, moisIso) {
  const lignes = etat.postes.map((p) => ({
    posteId: p.id,
    nom: p.nom,
    periodicite: p.periodicite,
    prevu: mensualiser(p.montantPrevu, p.periodicite),
  }));
  const total = arrondi2(lignes.reduce((s, l) => s + l.prevu, 0));
  return { mois: moisIso, total, lignes };
}

function sommeTransactions(etat, filtre) {
  return arrondi2(etat.transactions.filter(filtre).reduce((s, t) => s + t.montant, 0));
}

export function consommeParPoste(etat, moisIso) {
  const map = {};
  for (const t of etat.transactions) {
    if (t.type === "depense" && moisDe(t.dateIso) === moisIso) map[t.posteId] = arrondi2((map[t.posteId] ?? 0) + t.montant);
  }
  return map;
}

export function encaisseParRevenu(etat, moisIso) {
  const map = {};
  for (const t of etat.transactions) {
    if (t.type === "revenu" && moisDe(t.dateIso) === moisIso) map[t.revenuId] = arrondi2((map[t.revenuId] ?? 0) + t.montant);
  }
  return map;
}

export function suiviMois(etat, moisIso) {
  const consomme = consommeParPoste(etat, moisIso);
  const lignes = etat.postes.map((p) => {
    const prevu = mensualiser(p.montantPrevu, p.periodicite);
    const c = consomme[p.id] ?? 0;
    return { posteId: p.id, nom: p.nom, periodicite: p.periodicite, prevu, consomme: c, reste: arrondi2(prevu - c) };
  });
  return {
    mois: moisIso,
    totalPrevu: arrondi2(lignes.reduce((s, l) => s + l.prevu, 0)),
    totalConsomme: arrondi2(lignes.reduce((s, l) => s + l.consomme, 0)),
    totalReste: arrondi2(lignes.reduce((s, l) => s + l.reste, 0)),
    lignes,
  };
}

// US7 — le solde courant intègre les encaissements.
export function soldeCourant(etat, compteId) {
  const compte = etat.comptes.find((c) => c.id === compteId);
  if (!compte) return null;
  const depense = sommeTransactions(etat, (t) => t.compteId === compteId && t.type === "depense");
  const encaisse = sommeTransactions(etat, (t) => t.compteId === compteId && t.type === "revenu");
  return arrondi2(compte.soldeInitial + encaisse - depense);
}

// US9 — bilan du mois : revenus prévus vs encaissés, dépenses, solde du mois, solde courant total.
export function bilanMois(etat, moisIso) {
  const encaisses = encaisseParRevenu(etat, moisIso);
  const totalEncaisse = arrondi2(Object.values(encaisses).reduce((s, v) => s + v, 0));
  const totalDepense = sommeTransactions(etat, (t) => t.type === "depense" && moisDe(t.dateIso) === moisIso);
  const prevuRevenus = arrondi2((etat.revenus ?? []).reduce((s, r) => s + mensualiser(r.montantPrevu, r.periodicite), 0));
  return {
    mois: moisIso,
    prevuRevenus,
    encaisses: totalEncaisse,
    depenses: totalDepense,
    soldeMois: arrondi2(totalEncaisse - totalDepense),
    soldeCourantTotal: arrondi2(etat.comptes.reduce((s, c) => s + (soldeCourant(etat, c.id) ?? 0), 0)),
  };
}
