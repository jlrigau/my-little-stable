/* =========================================================
   🤠 Mon Ranch du Far West
   Jeu de simulation d'élevage de chevaux pour enfants (9-10 ans).
   100% statique : aucune dépendance, sauvegarde dans le navigateur.
   ========================================================= */

"use strict";

/* ---------- Données du jeu ---------- */

// Races de chevaux disponibles, avec leur emoji et leur prix d'achat.
const RACES = [
  { nom: "Mustang", emoji: "🐎", prix: 40 },
  { nom: "Appaloosa", emoji: "🐴", prix: 55 },
  { nom: "Poney", emoji: "🦄", prix: 35 },
  { nom: "Quarter Horse", emoji: "🏇", prix: 70 },
];

// Robes (couleurs) que peut avoir un cheval.
const ROBES = [
  { id: "alezan", nom: "Alezan", couleur: "#b5651d" },
  { id: "bai", nom: "Bai", couleur: "#6e4a2f" },
  { id: "noir", nom: "Noir", couleur: "#3f3a36" },
  { id: "gris", nom: "Gris", couleur: "#b9b2a9" },
  { id: "palomino", nom: "Palomino", couleur: "#e6c068" },
  { id: "pie", nom: "Pie", couleur: "#8a6f57" },
];

// Décorations achetables pour embellir le ranch.
const DECORS = [
  { id: "cactus", nom: "Cactus", emoji: "🌵", prix: 15 },
  { id: "feu", nom: "Feu de camp", emoji: "🔥", prix: 20 },
  { id: "tonneau", nom: "Tonneau", emoji: "🛢️", prix: 18 },
  { id: "roue", nom: "Roue de chariot", emoji: "🛞", prix: 25 },
  { id: "etoile", nom: "Étoile de shérif", emoji: "⭐", prix: 30 },
  { id: "guitare", nom: "Guitare", emoji: "🎸", prix: 22 },
  { id: "mesa", nom: "Mesa", emoji: "🏜️", prix: 35 },
  { id: "coucher", nom: "Soleil couchant", emoji: "🌅", prix: 40 },
];

// Objectifs (quêtes) : chacun donne une médaille et une récompense en dollars.
const QUETES = [
  { id: "deuxchevaux", titre: "Premiers compagnons", desc: "Avoir 2 chevaux", recompense: 25, test: (e) => e.chevaux.length >= 2 },
  { id: "rodeo1", titre: "Premier rodéo gagné", desc: "Gagner 1 rodéo", recompense: 30, test: (e) => e.stats.rodeosGagnes >= 1 },
  { id: "poulain", titre: "Premier poulain", desc: "Faire naître un poulain", recompense: 35, test: (e) => e.stats.poulainsNes >= 1 },
  { id: "dressage50", titre: "Bon dresseur", desc: "Dresser un cheval au niveau 50", recompense: 40, test: (e) => e.chevaux.some((c) => c.entrainement >= 50) },
  { id: "decor3", titre: "Ranch coquet", desc: "Installer 3 décorations", recompense: 30, test: (e) => e.decors.length >= 3 },
  { id: "jour7", titre: "Une semaine au ranch", desc: "Atteindre le jour 7", recompense: 35, test: (e) => e.jour >= 7 },
  { id: "corral5", titre: "Grand corral", desc: "Avoir 5 box dans le corral", recompense: 50, test: (e) => e.boxes >= 5 },
  { id: "cinqchevaux", titre: "Grand éleveur", desc: "Avoir 5 chevaux", recompense: 60, test: (e) => e.chevaux.length >= 5 },
  { id: "rodeo5", titre: "Star du rodéo", desc: "Gagner 5 rodéos", recompense: 70, test: (e) => e.stats.rodeosGagnes >= 5 },
];

// Titres de ranch selon le nombre d'objectifs accomplis.
const TITRES_RANCH = [
  "🌱 Ranch débutant", "🤠 Petit ranch", "⭐ Ranch prometteur",
  "🏅 Grand ranch", "🔥 Ranch réputé", "👑 Ranch légendaire",
];

// Petit dictionnaire de noms rigolos pour générer des chevaux.
const NOMS_CHEVAUX = [
  "Éclair", "Tornade", "Caramel", "Étoile", "Tonnerre", "Cannelle",
  "Bandit", "Poussière", "Sherif", "Mistral", "Cactus", "Soleil",
  "Flèche", "Pépite", "Rusty", "Comète", "Sable", "Bravo",
];

// Réglages d'équilibrage du jeu.
const CONFIG = {
  pieceDepart: 60,
  foinDepart: 6,
  boxesDepart: 3,
  prixBotteFoin: 4,      // coût d'une botte de foin à la boutique
  prixBox: 80,           // coût pour agrandir le corral (+1 box)
  ageAdulte: 5,          // à partir de cet âge (en jours), le poulain devient adulte
  baisseParJour: {       // ce que chaque cheval perd chaque nuit
    faim: 25, energie: 18, proprete: 16, bonheur: 12,
  },
};

/* ---------- État de la partie ---------- */

let etat = null; // rempli au démarrage ou au chargement

const CLE_SAUVEGARDE = "mon-ranch-far-west";

/* ---------- Utilitaires ---------- */

function aleatoire(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choisir(liste) {
  return liste[aleatoire(0, liste.length - 1)];
}

// Garde une valeur entre 0 et 100.
function borner(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function $(id) {
  return document.getElementById(id);
}

function trouverRobe(id) {
  return ROBES.find((r) => r.id === id) || ROBES[0];
}

/* ---------- Création des chevaux ---------- */

let compteurId = 1;

function nouveauCheval(options = {}) {
  const race = options.race || choisir(RACES);
  return {
    id: compteurId++,
    nom: options.nom || choisir(NOMS_CHEVAUX),
    race: race.nom,
    emoji: race.emoji,
    robe: options.robe || choisir(ROBES).id,
    age: options.age != null ? options.age : aleatoire(5, 9), // adulte par défaut
    faim: 70,
    energie: 80,
    proprete: 75,
    bonheur: 80,
    entrainement: options.entrainement || 0, // niveau de dressage (0-100)
    concoursFait: false, // a déjà participé à un concours aujourd'hui ?
  };
}

function estPoulain(cheval) {
  return cheval.age < CONFIG.ageAdulte;
}

/* ---------- Sauvegarde / chargement ---------- */

function sauvegarder() {
  etat.compteurId = compteurId;
  try {
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etat));
  } catch (e) {
    // Le mode navigation privée peut bloquer la sauvegarde : on ignore.
  }
}

function charger() {
  try {
    const brut = localStorage.getItem(CLE_SAUVEGARDE);
    if (!brut) return null;
    return JSON.parse(brut);
  } catch (e) {
    return null;
  }
}

// Complète une sauvegarde ancienne avec les nouveaux champs (compatibilité).
function migrer(sauv) {
  if (!sauv.decors) sauv.decors = [];
  if (!sauv.quetesFaites) sauv.quetesFaites = [];
  if (!sauv.stats) sauv.stats = { rodeosGagnes: 0, poulainsNes: 0 };
  sauv.chevaux.forEach((c) => {
    if (!c.robe) c.robe = choisir(ROBES).id;
  });
  return sauv;
}

/* ---------- Démarrage ---------- */

function nouvellePartie(nomRanch) {
  compteurId = 1;
  etat = {
    nomRanch: nomRanch,
    pieces: CONFIG.pieceDepart,
    foin: CONFIG.foinDepart,
    jour: 1,
    boxes: CONFIG.boxesDepart,
    chevaux: [nouveauCheval({ nom: "Éclair", race: RACES[0], robe: "palomino" })],
    decors: [],
    quetesFaites: [],
    stats: { rodeosGagnes: 0, poulainsNes: 0 },
  };
  sauvegarder();
  demarrerJeu();
}

function continuerPartie() {
  const sauv = charger();
  if (!sauv) {
    $("msg-accueil").textContent = "Aucune partie sauvegardée. Commence une nouvelle aventure !";
    return;
  }
  etat = migrer(sauv);
  compteurId = sauv.compteurId || (etat.chevaux.length + 1);
  demarrerJeu();
}

function demarrerJeu() {
  $("ecran-accueil").classList.add("cache");
  $("ecran-jeu").classList.remove("cache");
  $("aff-nom-haras").textContent = etat.nomRanch;
  rafraichir();
}

/* ---------- Niveau du ranch ---------- */

function infoNiveau() {
  const n = etat.quetesFaites.length;
  const index = Math.min(n, TITRES_RANCH.length - 1);
  return { niveau: index + 1, titre: TITRES_RANCH[index] };
}

function majNiveau() {
  const info = infoNiveau();
  $("aff-niveau").textContent = `· Niveau ${info.niveau} ${info.titre}`;
}

/* ---------- Affichage ---------- */

function rafraichir() {
  $("aff-pieces").textContent = etat.pieces;
  $("aff-carottes").textContent = etat.foin;
  $("aff-jour").textContent = etat.jour;
  $("aff-boxes").textContent = etat.chevaux.length + "/" + etat.boxes;
  majNiveau();
  afficherDecor();
  afficherChevaux();
  verifierQuetes(); // peut accorder des récompenses et mettre à jour l'affichage
  sauvegarder();
}

// Affiche le bandeau des décorations possédées.
function afficherDecor() {
  const bandeau = $("bandeau-decor");
  if (etat.decors.length === 0) {
    bandeau.classList.add("cache");
    bandeau.innerHTML = "";
    return;
  }
  bandeau.classList.remove("cache");
  bandeau.innerHTML = etat.decors
    .map((id) => {
      const d = DECORS.find((x) => x.id === id);
      return d ? `<span title="${d.nom}">${d.emoji}</span>` : "";
    })
    .join("");
}

// Construit une barre de besoin colorée (vert / jaune / rouge).
function barreBesoin(icone, label, valeur) {
  let couleur = "r-vert";
  if (valeur < 50) couleur = "r-jaune";
  if (valeur < 25) couleur = "r-rouge";
  return `
    <div class="besoin" title="${label}">
      <span class="icone">${icone}</span>
      <div class="barre"><div class="barre-remplissage ${couleur}" style="width:${valeur}%"></div></div>
    </div>`;
}

function afficherChevaux() {
  const zone = $("zone-chevaux");
  zone.innerHTML = "";

  etat.chevaux.forEach((c) => {
    const poulain = estPoulain(c);
    const robe = trouverRobe(c.robe);
    const carte = document.createElement("div");
    carte.className = "carte-cheval" + (poulain ? " poulain" : "");

    const badge = poulain
      ? `<span class="badge">Poulain (${c.age} j)</span>`
      : `<span class="badge adulte">Adulte (${c.age} j)</span>`;

    carte.innerHTML = `
      <div class="cheval-tete">
        <div class="cheval-emoji" style="border-color:${robe.couleur}">${c.emoji}</div>
        <div class="cheval-infos">
          <h3>${c.nom} ${badge}</h3>
          <div class="race">
            <span class="robe-pastille" style="background:${robe.couleur}"></span>${robe.nom}
            · ${c.race} · 🎖️ ${c.entrainement}
          </div>
        </div>
      </div>
      ${barreBesoin("🌾", "Faim", c.faim)}
      ${barreBesoin("⚡", "Énergie", c.energie)}
      ${barreBesoin("🧼", "Propreté", c.proprete)}
      ${barreBesoin("😊", "Bonheur", c.bonheur)}
      <div class="actions-cheval">
        <button class="bouton" data-action="nourrir" data-id="${c.id}">🌾 Nourrir</button>
        <button class="bouton" data-action="brosser" data-id="${c.id}">🧽 Brosser</button>
        <button class="bouton" data-action="jouer" data-id="${c.id}">🎾 Jouer</button>
        <button class="bouton" data-action="entrainer" data-id="${c.id}">🤠 Dresser</button>
        <button class="bouton bouton-concours" data-action="concours" data-id="${c.id}"
          ${c.concoursFait ? "disabled" : ""}>
          ${c.concoursFait ? "🏅 Rodéo déjà couru aujourd'hui" : "🏆 Participer au rodéo"}
        </button>
      </div>
    `;
    zone.appendChild(carte);
  });
}

/* ---------- Messages ---------- */

let timerMessage = null;

function message(texte) {
  const el = $("message-jeu");
  el.textContent = texte;
  el.classList.remove("cache");
  // relance l'animation
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "";
  clearTimeout(timerMessage);
  timerMessage = setTimeout(() => el.classList.add("cache"), 2800);
}

/* ---------- Objectifs / progression ---------- */

// Vérifie les quêtes accomplies, donne les récompenses et met à jour l'écran.
function verifierQuetes() {
  const nouvelles = [];
  QUETES.forEach((q) => {
    if (!etat.quetesFaites.includes(q.id) && q.test(etat)) {
      etat.quetesFaites.push(q.id);
      etat.pieces += q.recompense;
      nouvelles.push(q);
    }
  });
  if (nouvelles.length > 0) {
    // On met à jour directement l'affichage (sans rappeler rafraichir).
    $("aff-pieces").textContent = etat.pieces;
    majNiveau();
    const txt = nouvelles
      .map((q) => `🏅 ${q.titre} (+${q.recompense}💰)`)
      .join(" · ");
    message("Objectif réussi ! " + txt);
  }
}

/* ---------- Actions sur un cheval ---------- */

function trouverCheval(id) {
  return etat.chevaux.find((c) => c.id === Number(id));
}

function actionCheval(action, id) {
  const c = trouverCheval(id);
  if (!c) return;

  switch (action) {
    case "nourrir":
      if (etat.foin <= 0) {
        message("🌾 Plus de foin ! Achète-en à la boutique.");
        return;
      }
      etat.foin--;
      c.faim = borner(c.faim + 35);
      c.bonheur = borner(c.bonheur + 6);
      message(`${c.nom} a mangé une bonne botte de foin ! 🌾`);
      break;

    case "brosser":
      c.proprete = borner(c.proprete + 40);
      c.bonheur = borner(c.bonheur + 10);
      c.energie = borner(c.energie - 6);
      message(`${c.nom} est tout beau et brillant ! ✨`);
      break;

    case "jouer":
      if (c.energie < 15) {
        message(`${c.nom} est trop fatigué pour jouer. 😴`);
        return;
      }
      c.bonheur = borner(c.bonheur + 22);
      c.energie = borner(c.energie - 18);
      c.faim = borner(c.faim - 10);
      message(`${c.nom} s'est bien amusé au galop ! 🎾`);
      break;

    case "entrainer":
      if (estPoulain(c)) {
        message(`${c.nom} est encore un poulain, il est trop petit pour le dressage. 🐣`);
        return;
      }
      if (c.energie < 20) {
        message(`${c.nom} a besoin de repos avant de s'entraîner. 😴`);
        return;
      }
      c.entrainement = borner(c.entrainement + aleatoire(6, 12));
      c.energie = borner(c.energie - 22);
      c.faim = borner(c.faim - 12);
      c.bonheur = borner(c.bonheur + 5);
      message(`${c.nom} progresse au dressage ! 🎖️ Niveau ${c.entrainement}`);
      break;

    case "concours":
      lancerConcours(c);
      return; // lancerConcours rafraîchit déjà

    default:
      return;
  }
  rafraichir();
}

/* ---------- Rodéo (concours) ---------- */

function lancerConcours(c) {
  if (c.concoursFait) return;
  if (estPoulain(c)) {
    message(`${c.nom} est trop jeune pour le rodéo. Attends qu'il grandisse ! 🐣`);
    return;
  }
  if (c.energie < 30) {
    message(`${c.nom} est trop fatigué pour le rodéo. Laisse-le se reposer. 😴`);
    return;
  }
  if (c.bonheur < 35) {
    message(`${c.nom} n'est pas d'humeur. Joue avec lui d'abord ! 😟`);
    return;
  }

  c.concoursFait = true;
  c.energie = borner(c.energie - 30);
  c.faim = borner(c.faim - 10);

  // Le score dépend du dressage, du bonheur et d'un peu de chance.
  const score = c.entrainement + c.bonheur / 2 + aleatoire(0, 30);
  let gain, texte;
  if (score > 110) {
    gain = aleatoire(45, 70);
    texte = `🥇 ${c.nom} GAGNE le rodéo ! +${gain} 💰`;
    c.bonheur = borner(c.bonheur + 15);
    etat.stats.rodeosGagnes++;
  } else if (score > 75) {
    gain = aleatoire(20, 40);
    texte = `🥈 ${c.nom} finit sur le podium ! +${gain} 💰`;
    c.bonheur = borner(c.bonheur + 8);
  } else {
    gain = aleatoire(8, 18);
    texte = `🎗️ ${c.nom} a bien participé. +${gain} 💰`;
  }
  etat.pieces += gain;
  message(texte);
  rafraichir();
}

/* ---------- Jour suivant ---------- */

function jourSuivant() {
  etat.jour++;
  const negliges = [];
  // Les décorations rendent le ranch agréable : petit bonus de bonheur.
  const bonusDecor = Math.min(etat.decors.length * 2, 10);

  etat.chevaux.forEach((c) => {
    c.age++;
    const b = CONFIG.baisseParJour;
    c.faim = borner(c.faim - b.faim);
    c.energie = borner(c.energie + 35 - b.energie + 20); // ils dorment la nuit → récupèrent de l'énergie
    c.proprete = borner(c.proprete - b.proprete);
    // Le bonheur dépend des autres besoins : un cheval affamé ou sale est triste.
    let ajustBonheur = -b.bonheur + bonusDecor;
    if (c.faim < 25 || c.proprete < 25) ajustBonheur -= 10;
    if (c.faim > 60 && c.proprete > 60) ajustBonheur += 8;
    c.bonheur = borner(c.bonheur + ajustBonheur);
    c.concoursFait = false;

    if (c.bonheur < 25 || c.faim < 20) negliges.push(c.nom);
  });

  rafraichir();

  if (negliges.length > 0) {
    message(`🌅 Jour ${etat.jour}. Attention, ${negliges.join(" et ")} ${negliges.length > 1 ? "ont" : "a"} besoin de soins !`);
  } else {
    message(`🌅 Bonjour ! C'est le jour ${etat.jour}. Tes chevaux vont bien. 🐴`);
  }
}

/* ---------- Modale générique ---------- */

function ouvrirModale(titre, htmlCorps) {
  $("modale-titre").innerHTML = titre;
  $("modale-corps").innerHTML = htmlCorps;
  $("modale").classList.remove("cache");
}

function fermerModale() {
  $("modale").classList.add("cache");
}

/* ---------- Boutique ---------- */

function ouvrirBoutique() {
  const placeLibre = etat.chevaux.length < etat.boxes;

  let html = `
    <div class="ligne-boutique">
      <div class="desc">
        <b>🌾 Botte de foin</b>
        <small>Pour nourrir tes chevaux.</small>
      </div>
      <button class="bouton" data-boutique="foin">${CONFIG.prixBotteFoin} 💰</button>
    </div>
    <div class="ligne-boutique">
      <div class="desc">
        <b>🏚️ Agrandir le corral (+1 box)</b>
        <small>Tu as ${etat.chevaux.length}/${etat.boxes} box occupés.</small>
      </div>
      <button class="bouton" data-boutique="box">${CONFIG.prixBox} 💰</button>
    </div>

    <h3 style="margin-top:18px;">🐴 Acheter et personnaliser un cheval</h3>
  `;

  if (!placeLibre) {
    html += `<p>⚠️ Ton corral est plein ! Agrandis-le d'abord pour accueillir un nouveau cheval.</p>`;
  } else {
    html += `
      <div class="formulaire-achat">
        <label>Race :</label>
        <select id="achat-race">
          ${RACES.map((r, i) => `<option value="${i}">${r.emoji} ${r.nom} — ${r.prix} 💰</option>`).join("")}
        </select>

        <label>Nom du cheval :</label>
        <input id="achat-nom" type="text" maxlength="14" placeholder="Choisis un nom rigolo" />

        <label>Robe (couleur) :</label>
        <div class="choix-robes">
          ${ROBES.map((r, i) => `
            <label class="swatch">
              <input type="radio" name="robe" value="${r.id}" ${i === 0 ? "checked" : ""} />
              <span class="pastille" style="background:${r.couleur}"></span>
              ${r.nom}
            </label>`).join("")}
        </div>

        <button class="bouton bouton-geant" data-boutique="cheval">🛒 Acheter ce cheval</button>
      </div>
    `;
  }

  ouvrirModale("🛒 Boutique du Far West", html);
}

function acheter(quoi) {
  if (quoi === "foin") {
    if (etat.pieces < CONFIG.prixBotteFoin) return message("Pas assez de 💰 !");
    etat.pieces -= CONFIG.prixBotteFoin;
    etat.foin++;
    message("🌾 +1 botte de foin !");
  } else if (quoi === "box") {
    if (etat.pieces < CONFIG.prixBox) return message("Pas assez de 💰 !");
    etat.pieces -= CONFIG.prixBox;
    etat.boxes++;
    message("🏚️ Ton corral s'agrandit ! +1 box.");
  } else if (quoi === "cheval") {
    if (etat.chevaux.length >= etat.boxes) return message("Corral plein !");
    const iRace = Number($("achat-race").value);
    const r = RACES[iRace];
    if (etat.pieces < r.prix) return message("Pas assez de 💰 !");
    const radio = document.querySelector('input[name="robe"]:checked');
    const robe = radio ? radio.value : ROBES[0].id;
    const nom = $("achat-nom").value.trim() || choisir(NOMS_CHEVAUX);
    etat.pieces -= r.prix;
    etat.chevaux.push(nouveauCheval({ race: r, robe: robe, nom: nom }));
    message(`Bienvenue au ranch, ${nom} ! 🎉`);
  }
  rafraichir();
  ouvrirBoutique(); // met à jour les prix/états dans la modale
}

/* ---------- Décorations ---------- */

function ouvrirDecorer() {
  let html = `<p>Décore ton ranch ! Chaque décoration rend tes chevaux un peu plus heureux chaque jour. 😊</p>`;

  DECORS.forEach((d) => {
    const possede = etat.decors.includes(d.id);
    html += `
      <div class="ligne-boutique">
        <div class="desc">
          <b>${d.emoji} ${d.nom}</b>
          <small>${possede ? "Déjà installé dans ton ranch." : "Embellit ton ranch."}</small>
        </div>
        ${possede
          ? `<button class="bouton bouton-secondaire" disabled>✅ Installé</button>`
          : `<button class="bouton" data-decor="${d.id}">${d.prix} 💰</button>`}
      </div>`;
  });

  ouvrirModale("🎨 Décorer le ranch", html);
}

function acheterDecor(id) {
  if (etat.decors.includes(id)) return;
  const d = DECORS.find((x) => x.id === id);
  if (!d) return;
  if (etat.pieces < d.prix) return message("Pas assez de 💰 !");
  etat.pieces -= d.prix;
  etat.decors.push(id);
  // Petit coup de bonheur immédiat pour tous les chevaux.
  etat.chevaux.forEach((c) => (c.bonheur = borner(c.bonheur + 5)));
  message(`${d.emoji} ${d.nom} installé ! Ton ranch est plus joli.`);
  rafraichir();
  ouvrirDecorer();
}

/* ---------- Objectifs (affichage) ---------- */

function ouvrirObjectifs() {
  const info = infoNiveau();
  let html = `
    <p style="font-size:1.1rem;"><b>${info.titre}</b> — Niveau ${info.niveau}</p>
    <p>Objectifs accomplis : <b>${etat.quetesFaites.length}/${QUETES.length}</b></p>
    <p>🥇 Rodéos gagnés : <b>${etat.stats.rodeosGagnes}</b> · 🐣 Poulains nés : <b>${etat.stats.poulainsNes}</b></p>
  `;

  QUETES.forEach((q) => {
    const fait = etat.quetesFaites.includes(q.id);
    html += `
      <div class="quete-ligne ${fait ? "faite" : ""}">
        <span class="quete-coche">${fait ? "🏅" : "⬜"}</span>
        <div class="desc">
          <b>${q.titre}</b>
          <small>${q.desc}</small>
        </div>
        <span class="quete-gain">+${q.recompense} 💰</span>
      </div>`;
  });

  ouvrirModale("🏆 Objectifs & médailles", html);
}

/* ---------- Élevage (faire naître un poulain) ---------- */

function ouvrirElevage() {
  const adultes = etat.chevaux.filter((c) => !estPoulain(c) && c.bonheur >= 50);
  const placeLibre = etat.chevaux.length < etat.boxes;

  let html = `<p>Choisis deux chevaux adultes et heureux (bonheur ≥ 50) pour avoir un adorable poulain&nbsp;! 🐣</p>`;

  if (!placeLibre) {
    html += `<p>⚠️ Ton corral est plein. Agrandis-le à la boutique avant d'élever un poulain.</p>`;
  } else if (adultes.length < 2) {
    html += `<p>Il te faut au moins <b>2 chevaux adultes heureux</b>. Prends soin d'eux puis reviens&nbsp;!</p>`;
  } else {
    html += `
      <label>Premier parent :</label>
      <select id="parent1" class="select-large">
        ${adultes.map((c) => `<option value="${c.id}">${c.emoji} ${c.nom} (${c.race})</option>`).join("")}
      </select>
      <label>Deuxième parent :</label>
      <select id="parent2" class="select-large">
        ${adultes.map((c) => `<option value="${c.id}">${c.emoji} ${c.nom} (${c.race})</option>`).join("")}
      </select>
      <button class="bouton bouton-geant" data-elevage="go">🐣 Faire naître un poulain</button>
    `;
  }

  ouvrirModale("🐣 Élevage de poulains", html);
}

function faireNaitre() {
  const id1 = Number($("parent1").value);
  const id2 = Number($("parent2").value);
  if (id1 === id2) return message("Choisis deux chevaux différents ! 🙂");
  if (etat.chevaux.length >= etat.boxes) return message("Corral plein !");

  const p1 = trouverCheval(id1);
  const p2 = trouverCheval(id2);
  // Le poulain hérite de la race et de la robe d'un des parents.
  const parentRace = Math.random() < 0.5 ? p1 : p2;
  const parentRobe = Math.random() < 0.5 ? p1 : p2;
  const race = RACES.find((r) => r.nom === parentRace.race) || RACES[0];

  const poulain = nouveauCheval({ race: race, age: 0, robe: parentRobe.robe });
  poulain.nom = choisir(NOMS_CHEVAUX);
  // Les parents sont un peu fatigués mais très heureux.
  p1.bonheur = borner(p1.bonheur + 10);
  p2.bonheur = borner(p2.bonheur + 10);
  etat.chevaux.push(poulain);
  etat.stats.poulainsNes++;

  fermerModale();
  rafraichir();
  message(`🎉 Un poulain est né : ${poulain.nom} ! Prends-en bien soin, il grandira en ${CONFIG.ageAdulte} jours.`);
}

/* ---------- Aide ---------- */

function ouvrirAide() {
  ouvrirModale("❓ Comment jouer", `
    <div class="aide-texte">
      <p><b>Bienvenue, jeune cow-boy ou cow-girl ! 🤠</b> Ton but : prendre soin de tes chevaux et faire grandir ton ranch.</p>
      <p><b>Chaque cheval a 4 besoins :</b></p>
      <ul>
        <li>🌾 <b>Faim</b> — donne-lui du foin (bouton « Nourrir »).</li>
        <li>⚡ <b>Énergie</b> — il récupère en dormant chaque nuit (jour suivant).</li>
        <li>🧼 <b>Propreté</b> — brosse-le pour qu'il reste propre.</li>
        <li>😊 <b>Bonheur</b> — joue avec lui ! Un cheval heureux gagne plus de rodéos.</li>
      </ul>
      <p><b>🤠 Dresser</b> ton cheval augmente son niveau de dressage : plus il est dressé, plus il gagne au <b>🏆 rodéo</b> (et plus tu gagnes de 💰).</p>
      <p><b>🛒 Boutique</b> : achète du foin, agrandis ton corral et achète un cheval en choisissant son nom et sa robe.</p>
      <p><b>🎨 Décorer</b> : embellis ton ranch avec des décorations qui rendent tes chevaux plus heureux.</p>
      <p><b>🐣 Élevage</b> : avec 2 chevaux adultes et heureux, fais naître un poulain !</p>
      <p><b>🏆 Objectifs</b> : accomplis des défis pour gagner des médailles, des dollars et monter de niveau !</p>
      <p><b>🌙 Jour suivant</b> : le temps passe, les chevaux dorment, grandissent et leurs besoins baissent.</p>
      <p>💾 Ta partie est sauvegardée automatiquement dans ton navigateur.</p>
    </div>
  `);
}

/* ---------- Branchements (événements) ---------- */

function init() {
  // Écran d'accueil
  $("btn-commencer").addEventListener("click", () => {
    const nom = $("nom-haras").value.trim() || "Mon Ranch";
    nouvellePartie(nom);
  });
  $("btn-charger").addEventListener("click", continuerPartie);
  $("nom-haras").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("btn-commencer").click();
  });

  // Barre du bas
  $("btn-boutique").addEventListener("click", ouvrirBoutique);
  $("btn-elevage").addEventListener("click", ouvrirElevage);
  $("btn-decorer").addEventListener("click", ouvrirDecorer);
  $("btn-objectifs").addEventListener("click", ouvrirObjectifs);
  $("btn-jour-suivant").addEventListener("click", jourSuivant);
  $("btn-aide").addEventListener("click", ouvrirAide);

  // Modale
  $("btn-fermer-modale").addEventListener("click", fermerModale);
  $("modale").addEventListener("click", (e) => {
    if (e.target.id === "modale") fermerModale();
  });

  // Délégation des clics : actions chevaux, boutique, décor, élevage.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.dataset.action) {
      actionCheval(btn.dataset.action, btn.dataset.id);
    } else if (btn.dataset.boutique) {
      acheter(btn.dataset.boutique);
    } else if (btn.dataset.decor) {
      acheterDecor(btn.dataset.decor);
    } else if (btn.dataset.elevage) {
      faireNaitre();
    }
  });

  // S'il existe une sauvegarde, on propose de continuer.
  if (charger()) {
    $("msg-accueil").textContent = "Une partie existe : clique sur « Continuer ma partie » 🐴";
  }
}

document.addEventListener("DOMContentLoaded", init);
