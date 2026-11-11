// US8 — Import de relevés bancaires au format OFX (SGML). Domaine pur : l'id est injecté (nouvelId).
import { estDateIsoValide, saisirDepense, saisirEncaissement, ajouterPoste, ajouterRevenu } from "./domaine.js";

const LIBELLE_IMPORT = "Import bancaire";

// Extrait les mouvements d'un relevé OFX : [{ type: "depense"|"revenu", montant, dateIso, libelle }]
export function parserOfx(texte) {
  if (typeof texte !== "string" || !/<STMTTRN>/.test(texte) || !/<TRNTYPE>/.test(texte))
    return { ok: false, raison: "relevé OFX non reconnu" };
  const blocs = texte.split(/<STMTTRN>/i).slice(1);
  const mouvements = [];
  for (const bloc of blocs) {
    const tags = {};
    for (const m of bloc.matchAll(/<([A-Z0-9]+)>([^<]*)/gi)) tags[m[1].toUpperCase()] = m[2].trim();
    const type = tags.TRNTYPE?.toUpperCase();
    if (type !== "DEBIT" && type !== "CREDIT") return { ok: false, raison: "type de transaction OFX inconnu" };
    const brut = (tags.TRNAMT ?? "").replace(",", ".");
    const montant = Math.abs(Number(brut));
    if (!Number.isFinite(montant) || montant <= 0) return { ok: false, raison: "montant OFX invalide" };
    const brutDate = tags.DTPOSTED ?? "";
    const dateIso = `${brutDate.slice(0, 4)}-${brutDate.slice(4, 6)}-${brutDate.slice(6, 8)}`;
    if (!estDateIsoValide(dateIso)) return { ok: false, raison: "date OFX invalide" };
    mouvements.push({
      type: type === "DEBIT" ? "depense" : "revenu",
      montant,
      dateIso,
      libelle: tags.NAME || tags.MEMO || LIBELLE_IMPORT,
    });
  }
  if (!mouvements.length) return { ok: false, raison: "aucun mouvement dans le relevé" };
  return { ok: true, mouvements };
}

// Importe un relevé OFX sur un compte : mouvements rattachés au poste/revenu « Import bancaire » (créés si absents).
export function importerReleve(etat, { compteId, texte, nouvelId }) {
  if (!etat.comptes.some((c) => c.id === compteId)) return { ok: false, raison: "compte inconnu" };
  const r = parserOfx(texte);
  if (!r.ok) return r;
  let next = etat;
  if (!next.postes.some((p) => p.nom === LIBELLE_IMPORT)) {
    const rp = ajouterPoste(next, { id: nouvelId(), nom: LIBELLE_IMPORT, periodicite: "mensuelle", montantPrevu: 0 });
    next = rp.etat;
  }
  if (!(next.revenus ?? []).some((x) => x.nom === LIBELLE_IMPORT)) {
    const rr = ajouterRevenu(next, { id: nouvelId(), nom: LIBELLE_IMPORT, periodicite: "mensuelle", montantPrevu: 0 });
    next = rr.etat;
  }
  const posteId = next.postes.find((p) => p.nom === LIBELLE_IMPORT).id;
  const revenuId = next.revenus.find((x) => x.nom === LIBELLE_IMPORT).id;
  for (const m of r.mouvements) {
    const ajout = m.type === "depense"
      ? saisirDepense(next, { id: nouvelId(), compteId, posteId, montant: m.montant, dateIso: m.dateIso })
      : saisirEncaissement(next, { id: nouvelId(), compteId, revenuId, montant: m.montant, dateIso: m.dateIso });
    if (!ajout.ok) return ajout;
    next = ajout.etat;
  }
  return { ok: true, etat: next, importes: r.mouvements.length };
}
