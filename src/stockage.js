// Port de stockage unique (ADR-03) — M0 : localStorage derrière un port, statut exposé.
const CLE = "budget-familial-donnees";

export function creerStockage() {
  let disponible = true;
  try {
    const t = "__test__";
    localStorage.setItem(t, "1");
    localStorage.removeItem(t);
  } catch {
    disponible = false;
  }
  return {
    statut: () => (disponible ? "persistant" : "indisponible"),
    charger() {
      if (!disponible) return null;
      try {
        return localStorage.getItem(CLE);
      } catch {
        return null;
      }
    },
    sauvegarder(json) {
      if (!disponible) return { ok: false, raison: "stockage indisponible" };
      try {
        localStorage.setItem(CLE, json);
        return { ok: true };
      } catch {
        return { ok: false, raison: "écriture refusée" };
      }
    },
  };
}
