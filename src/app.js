// Application Budget familial — socle M0. Point de passage unique : majEtat (ADR-06).
import {
  nouvelEtat, ajouterCompte, ajouterPoste, saisirDepense,
  budgetMensuel, suiviMois, soldeCourant, moisDe,
} from "./domain/domaine.js";
import { exporter, importer } from "./domain/exportImport.js";
import { isoAujourdhui, nouvelId } from "./horloge.js";
import { creerStockage } from "./stockage.js";

const stockage = creerStockage();
let etat = chargerOuVide();
let ecran = "accueil";
let erreur = null;

function chargerOuVide() {
  const brut = stockage.charger();
  if (brut) {
    const r = importer(brut);
    if (r.ok) return r.etat;
  }
  return nouvelEtat();
}

function majEtat(next) {
  etat = next;
  erreur = null;
  stockage.sauvegarder(exporter(etat));
  afficher();
}

function refuser(resultat) {
  erreur = resultat.raison;
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
    const lignes = etat.postes
      .map((p) => `<tr><td>${p.nom}</td><td>${p.periodicite}</td><td class="montant">${fmt(p.montantPrevu)}</td></tr>`)
      .join("");
    return `
      <section class="carte"><h2>Postes de dépenses</h2>
        ${etat.postes.length ? `<table><thead><tr><th>Poste</th><th>Périodicité</th><th>Montant prévu</th></tr></thead><tbody>${lignes}</tbody></table>` : "<p>Aucun poste.</p>"}
        <form id="form-poste">
          <label>Nom du poste <input id="poste-nom" required maxlength="60" /></label>
          <label>Périodicité
            <select id="poste-periodicite">
              <option value="mensuelle">mensuelle</option>
              <option value="hebdomadaire">hebdomadaire</option>
              <option value="annuelle">annuelle</option>
            </select>
          </label>
          <label>Montant prévu (€) <input id="poste-montant" type="number" step="0.01" min="0" required /></label>
          <button class="bouton" type="submit">Créer le poste</button>
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
    return `
      <section class="carte"><h2>Export / import</h2>
        <p><button class="bouton" id="btn-exporter" type="button">Exporter mes données</button></p>
        <label>Données exportées (JSON « budget-familial-donnees-v1 »)
          <textarea id="zone-export" rows="8" readonly placeholder="Cliquez sur « Exporter mes données »."></textarea>
        </label>
        <label>Importer un export
          <textarea id="zone-import" rows="8" placeholder="Collez ici un export JSON…"></textarea>
        </label>
        <p><button class="bouton secondaire" id="btn-importer" type="button">Importer</button></p>
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
  main.innerHTML = (ecrans[ecran] ?? ecrans.accueil)() + (erreur ? `<p class="message-erreur" role="alert">Refus : ${erreur}</p>` : "");
  brancherFormulaires();
}

function brancherFormulaires() {
  const fCompte = document.getElementById("form-compte");
  if (fCompte) {
    fCompte.addEventListener("submit", (e) => {
      e.preventDefault();
      const nom = document.getElementById("compte-nom").value;
      const solde = Number(document.getElementById("compte-solde").value);
      const r = ajouterCompte(etat, { id: nouvelId(), nom, soldeInitial: solde });
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
  const btnExporter = document.getElementById("btn-exporter");
  if (btnExporter) btnExporter.addEventListener("click", () => { document.getElementById("zone-export").value = exporter(etat); });
  const btnImporter = document.getElementById("btn-importer");
  if (btnImporter) {
    btnImporter.addEventListener("click", () => {
      const r = importer(document.getElementById("zone-import").value);
      r.ok ? majEtat(r.etat) : refuser(r);
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
