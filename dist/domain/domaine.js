// Domaine pur du budget familial — zéro I/O, déterministe (ADR-08 : ids et dates injectés par l'appelant).
// Vocabulaire métier en français. Toute fonction mutante retourne { ok: true, etat } ou { ok: false, raison }.

export const PERIODICITES = ["mensuelle", "hebdomadaire", "annuelle"];
export const SCHEMA_VERSION = 1;

export function nouvelEtat() {
  return { schemaVersion: SCHEMA_VERSION, comptes: [], postes: [], transactions: [] };
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

export function ajouterPoste(etat, { id, nom, periodicite, montantPrevu }) {
  if (typeof nom !== "string" || nom.trim() === "") return { ok: false, raison: "nom vide" };
  if (!PERIODICITES.includes(periodicite)) return { ok: false, raison: "périodicité inconnue" };
  if (!estMontantValide(montantPrevu)) return { ok: false, raison: "montant prévu invalide" };
  if (etat.postes.some((p) => p.id === id)) return { ok: false, raison: "poste déjà existant" };
  const next = copier(etat);
  next.postes.push({ id, nom: nom.trim(), periodicite, montantPrevu: arrondi2(montantPrevu) });
  return { ok: true, etat: next };
}

export function saisirDepense(etat, { id, compteId, posteId, montant, dateIso }) {
  if (!estMontantValide(montant) || montant <= 0) return { ok: false, raison: "montant invalide" };
  if (!etat.comptes.some((c) => c.id === compteId)) return { ok: false, raison: "compte inconnu" };
  if (!etat.postes.some((p) => p.id === posteId)) return { ok: false, raison: "poste inconnu" };
  if (!estDateIsoValide(dateIso)) return { ok: false, raison: "date invalide" };
  const next = copier(etat);
  next.transactions.push({ id, compteId, posteId, montant: arrondi2(montant), dateIso });
  return { ok: true, etat: next };
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

export function consommeParPoste(etat, moisIso) {
  const map = {};
  for (const t of etat.transactions) {
    if (moisDe(t.dateIso) === moisIso) map[t.posteId] = arrondi2((map[t.posteId] ?? 0) + t.montant);
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

export function soldeCourant(etat, compteId) {
  const compte = etat.comptes.find((c) => c.id === compteId);
  if (!compte) return null;
  const depense = etat.transactions.filter((t) => t.compteId === compteId).reduce((s, t) => s + t.montant, 0);
  return arrondi2(compte.soldeInitial - depense);
}
