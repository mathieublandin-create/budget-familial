// Horloge injectable — ADR-08 : jamais de Date.now() dans le domaine.
export function isoAujourdhui(maintenant = new Date()) {
  const y = maintenant.getFullYear();
  const m = String(maintenant.getMonth() + 1).padStart(2, "0");
  const d = String(maintenant.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function nouvelId() {
  return crypto.randomUUID();
}
