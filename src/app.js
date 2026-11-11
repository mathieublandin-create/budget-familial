// Application Budget familial — point de passage unique : majEtat (ADR-06).
import {
  nouvelEtat, ajouterCompte, ajouterPoste, ajouterRevenu, saisirDepense, saisirEncaissement,
  budgetMensuel, suiviMois, bilanMois, soldeCourant, moisDe,
} from "./domain/domaine.js";
import { exporter, importer } from "./domain/exportImport.js";
import { importerReleve } from "./domain/ofx.js";
import { isoAujourdhui, nouvelId } from "./horloge.js";
import { creerStockage } from "./stockage.js";

const stockage = creerStockage();
let etat = chargerOuVide();
let ecran = "accueil";
let erreur = null;
let info = null;

function chargerOuVide() {
  const brut = stockage.charger();
  if (brut) {
    const r = importer(brut);
    if (r.ok) return r.etat;
  }
  return nouvelEtat();
}

function majEtat(next, messageInfo = null) {
  etat = next;
  erreur = null;
  info = messageInfo;
  stockage.sauvegarder(exporter(etat));
  afficher();
}

function refuser(resultat) {
  erreur = resultat.raison;
  info = null;
  afficher();
}

function fmt(x) {
  return x.toFixed(2).replace(".", ",") + " €";
}

function ligneSuivi(l) {
  const resteCls = l.reste < 0 ? ' class="montant negatif"' : ' class="montant"';
  return `<tr><td>${l.nom}</td><td>${l.periodicite}</td><td class="montant">${fmt(l.prevu)}</td><td class="montant">${fmt(l.consomme)}</td><td${resteCls}>${fmt(l.reste)}</td></tr>`;
}

const ecrans = {
  accueil() {
    const total = etat.comptes.reduce((s, c) => s + (soldeCourant(etat, c.id) ?? 0), 0);
    const comptes = etat.comptes
      .map((c) => `<tr><td>${c.nom}</td><td class="montant">${fmt(soldeCourant(etat, c.id))}</td></tr>`)
      .join("");
    return `
      <section class="carte"><h2>Comptes</h2>
        ${etat.comptes.length ? `<table><thead><tr><th>Compte</th><th>Solde courant</th></tr></thead><tbody>${comptes}</tbody></table>` : "<p>Aucun compte. Créez-en un ci-dessous.</p>"}
        <form id="form-compte">
          <label>Nom du compte <input id="compte-nom" required maxlength="60" /></label>
          <label>Solde initial (€) <input id="compte-solde" type="number" step="0.01" min="0" required /></label>
          <button class="bouton" type="submit">Créer le compte</button>
        </form>
      </section>
      <section class="carte"><h2>Solde total</h2><p class="montant">${fmt(total)}</p></section>`;
  },

  postes() {
    const lignesPostes = etat.postes
      .map((p) => `<tr><td>${p.nom}</td><td>${p.periodicite}</td><td class="montant">${fmt(p.montantPrevu)}</td></tr>`)
      .join("");
    const lignesRevenus = (etat.revenus ?? [])
      .map((r) => `<tr><td>${r.nom}</td><td>${r.periodicite}</td><td class="montant">${fmt(r.montantPrevu)}</td></tr>`)
      .join("");
    const select = `<select id="periodicite">
        <option value="mensuelle">mensuelle</option>
        <option value="hebdomadaire">hebdomadaire</option>
        <option value="annuelle">annuelle</option>
      </select>`;
    return `
      <section class="carte"><h2>Postes de dépenses</h2>
        ${etat.postes.length ? `<table><thead><tr><th>Poste</th><th>Périodicité</th><th>Montant prévu</th></tr></thead><tbody>${lignesPostes}</tbody></table>` : "<p>Aucun poste.</p>"}
        <form id="form-poste">
          <label>Nom du poste <input id="poste-nom" required maxlength="60" /></label>
          <label>Périodicité ${select.replace('id="periodicite"', 'id="poste-periodicite"')}</label>
          <label>Montant prévu (€) <input id="poste-montant" type="number" step="0.01" min="0" required /></label>
          <button class="bouton" type="submit">Créer le poste</button>
        </form>
      </section>
      <section class="carte"><h2>Revenus</h2>
        ${lignesRevenus ? `<table><thead><tr><th>Revenu</th><th>Périodicité</th><th>Montant prévu</th></tr></thead><tbody>${lignesRevenus}</tbody></table>` : "<p>Aucun revenu.</p>"}
        <form id="form-revenu">
          <label>Nom du revenu <input id="revenu-nom" required maxlength="60" /></label>
          <label>Périodicité ${select.replace('id="periodicite"', 'id="revenu-periodicite"')}</label>
          <label>Montant prévu (€) <input id="revenu-montant" type="number" step="0.01" min="0" required /></label>
          <button class="bouton" type="submit">Créer le revenu</button>
        </form>
      </section>`;
  },

  depense() {
    const optionsComptes = etat.comptes.map((c) => `<option value="${c.id}">${c.nom}</option>`).join("");
    const optionsPostes = etat.postes.map((p) => `<option value="${p.id}">${p.nom} (${p.periodicite})</option>`).join("");
    return `
      <section class="carte"><h2>Nouvelle dépense</h2>
        ${etat.comptes.length && etat.postes.length ? `
        <form id="form-depense">
          <label>Montant (€) <input id="depense-montant" type="number" step="0.01" min="0.01" required /></label>
          <label>Poste <select id="depense-poste">${optionsPostes}</select></label>
          <label>Compte <select id="depense-compte">${optionsComptes}</select></label>
          <label>Date <input id="depense-date" type="date" value="${isoAujourdhui()}" required /></label>
          <button class="bouton" type="submit">Enregistrer</button>
        </form>` : "<p>Créez d'abord un compte et un poste.</p>"}
      </section>`;
  },

  bilan() {
    const mois = moisDe(isoAujourdhui());
    const b = bilanMois(etat, mois);
    const optionsComptes = etat.comptes.map((c) => `<option value="${c.id}">${c.nom}</option>`).join("");
    const optionsRevenus = (etat.revenus ?? []).map((r) => `<option value="${r.id}">${r.nom} (${r.periodicite})</option>`).join("");
    return `
      <section class="carte"><h2>Bilan du mois ${mois}</h2>
        <table>
          <tbody>
            <tr><th>Revenus prévus</th><td class="montant">${fmt(b.prevuRevenus)}</td></tr>
            <tr><th>Revenus encaissés</th><td class="montant">${fmt(b.encaisses)}</td></tr>
            <tr><th>Dépenses du mois</th><td class="montant">${fmt(b.depenses)}</td></tr>
            <tr><th>Solde du mois</th><td class="montant${b.soldeMois < 0 ? " negatif" : ""}">${fmt(b.soldeMois)}</td></tr>
            <tr><th>Solde courant total</th><td class="montant">${fmt(b.soldeCourantTotal)}</td></tr>
          </tbody>
        </table>
      </section>
      <section class="carte"><h2>Nouvel encaissement</h2>
        ${etat.comptes.length && (etat.revenus ?? []).length ? `
        <form id="form-encaissement">
          <label>Montant (€) <input id="encaissement-montant" type="number" step="0.01" min="0.01" required /></label>
          <label>Revenu <select id="encaissement-revenu">${optionsRevenus}</select></label>
          <label>Compte <select id="encaissement-compte">${optionsComptes}</select></label>
          <label>Date <input id="encaissement-date" type="date" value="${isoAujourdhui()}" required /></label>
          <button class="bouton" type="submit">Enregistrer</button>
        </form>` : "<p>Créez d'abord un compte et un revenu.</p>"}
      </section>`;
  },

  budget() {
    const mois = moisDe(isoAujourdhui());
    const suivi = suiviMois(etat, mois);
    const lignes = suivi.lignes.map(ligneSuivi).join("");
    return `
      <section class="carte"><h2>Suivi du mois ${mois}</h2>
        ${suivi.lignes.length ? `<table><thead><tr><th>Poste</th><th>Périodicité</th><th>Prévu</th><th>Consommé</th><th>Reste</th></tr></thead><tbody>${lignes}</tbody>
        <tfoot><tr><th>Total</th><th></th><th class="montant">${fmt(suivi.totalPrevu)}</th><th class="montant">${fmt(suivi.totalConsomme)}</th><th class="montant">${fmt(suivi.totalReste)}</th></tr></tfoot></table>` : "<p>Aucun poste.</p>"}
      </section>
      <section class="carte"><h2>Budget mensuel dérivé</h2>
        <p class="montant">${fmt(budgetMensuel(etat, mois).total)} / mois</p>
      </section>`;
  },

  donnees() {
    const optionsComptes = etat.comptes.map((c) => `<option value="${c.id}">${c.nom}</option>`).join("");
    return `
      <section class="carte"><h2>Export / import JSON</h2>
        <p><button class="bouton" id="btn-exporter" type="button">Exporter mes données</button></p>
        <label>Données exportées (JSON « budget-familial-donnees-v1 »)
          <textarea id="zone-export" rows="6" readonly placeholder="Cliquez sur « Exporter mes données »."></textarea>
        </label>
        <label>Importer un export
          <textarea id="zone-import" rows="6" placeholder="Collez ici un export JSON…"></textarea>
        </label>
        <p><button class="bouton secondaire" id="btn-importer" type="button">Importer</button></p>
      </section>
      <section class="carte"><h2>Import relevé bancaire OFX</h2>
        ${etat.comptes.length ? `
        <label>Compte cible <select id="ofx-compte">${optionsComptes}</select></label>
        <label>Contenu du fichier OFX
          <textarea id="zone-ofx" rows="8" placeholder="Collez ici le contenu du relevé OFX…"></textarea>
        </label>
        <p><button class="bouton" id="btn-ofx" type="button">Importer le relevé</button></p>` : "<p>Créez d'abord un compte.</p>"}
      </section>`;
  },
};

function afficher() {
  document.getElementById("statut-stockage").textContent =
    stockage.statut() === "persistant" ? "" : "⚠️ Stockage non persistant — exportez vos données avant de fermer.";
  document.querySelectorAll("nav button").forEach((b) => {
    if (b.dataset.ecran === ecran) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  const main = document.getElementById("contenu");
  main.innerHTML = (ecrans[ecran] ?? ecrans.accueil)()
    + (info ? `<p class="message-erreur" role="status">${info}</p>` : "")
    + (erreur ? `<p class="message-erreur" role="alert">Refus : ${erreur}</p>` : "");
  brancherFormulaires();
}

function brancherFormulaires() {
  const fCompte = document.getElementById("form-compte");
  if (fCompte) {
    fCompte.addEventListener("submit", (e) => {
      e.preventDefault();
      const r = ajouterCompte(etat, {
        id: nouvelId(),
        nom: document.getElementById("compte-nom").value,
        soldeInitial: Number(document.getElementById("compte-solde").value),
      });
      r.ok ? majEtat(r.etat) : refuser(r);
    });
  }
  const fPoste = document.getElementById("form-poste");
  if (fPoste) {
    fPoste.addEventListener("submit", (e) => {
      e.preventDefault();
      const r = ajouterPoste(etat, {
        id: nouvelId(),
        nom: document.getElementById("poste-nom").value,
        periodicite: document.getElementById("poste-periodicite").value,
        montantPrevu: Number(document.getElementById("poste-montant").value),
      });
      r.ok ? majEtat(r.etat) : refuser(r);
    });
  }
  const fRevenu = document.getElementById("form-revenu");
  if (fRevenu) {
    fRevenu.addEventListener("submit", (e) => {
      e.preventDefault();
      const r = ajouterRevenu(etat, {
        id: nouvelId(),
        nom: document.getElementById("revenu-nom").value,
        periodicite: document.getElementById("revenu-periodicite").value,
        montantPrevu: Number(document.getElementById("revenu-montant").value),
      });
      r.ok ? majEtat(r.etat) : refuser(r);
    });
  }
  const fDepense = document.getElementById("form-depense");
  if (fDepense) {
    fDepense.addEventListener("submit", (e) => {
      e.preventDefault();
      const r = saisirDepense(etat, {
        id: nouvelId(),
        montant: Number(document.getElementById("depense-montant").value),
        posteId: document.getElementById("depense-poste").value,
        compteId: document.getElementById("depense-compte").value,
        dateIso: document.getElementById("depense-date").value,
      });
      r.ok ? majEtat(r.etat) : refuser(r);
    });
  }
  const fEncaissement = document.getElementById("form-encaissement");
  if (fEncaissement) {
    fEncaissement.addEventListener("submit", (e) => {
      e.preventDefault();
      const r = saisirEncaissement(etat, {
        id: nouvelId(),
        montant: Number(document.getElementById("encaissement-montant").value),
        revenuId: document.getElementById("encaissement-revenu").value,
        compteId: document.getElementById("encaissement-compte").value,
        dateIso: document.getElementById("encaissement-date").value,
      });
      r.ok ? majEtat(r.etat) : refuser(r);
    });
  }
  const btnExporter = document.getElementById("btn-exporter");
  if (btnExporter) btnExporter.addEventListener("click", () => { document.getElementById("zone-export").value = exporter(etat); });
  const btnImporter = document.getElementById("btn-importer");
  if (btnImporter) {
    btnImporter.addEventListener("click", () => {
      const r = importer(document.getElementById("zone-import").value);
      r.ok ? majEtat(r.etat) : refuser(r);
    });
  }
  const btnOfx = document.getElementById("btn-ofx");
  if (btnOfx) {
    btnOfx.addEventListener("click", () => {
      const r = importerReleve(etat, {
        compteId: document.getElementById("ofx-compte").value,
        texte: document.getElementById("zone-ofx").value,
        nouvelId,
      });
      r.ok ? majEtat(r.etat, `${r.importes} mouvement(s) importé(s).`) : refuser(r);
    });
  }
}

document.querySelectorAll("nav button").forEach((b) => {
  b.addEventListener("click", () => { ecran = b.dataset.ecran; afficher(); });
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

afficher();
