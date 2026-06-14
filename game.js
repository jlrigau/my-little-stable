/* =========================================================
   🤠 Mon Ranch du Far West
   Jeu de simulation d'élevage de chevaux pour enfants (9-10 ans).
   Monde 2D explorable (vue de dessus) dessiné sur <canvas>.
   100% statique : aucune dépendance, sauvegarde dans le navigateur.
   ========================================================= */

"use strict";

/* ===================== Données du jeu ===================== */

const RACES = [
  { nom: "Mustang", emoji: "🐎", prix: 40 },
  { nom: "Appaloosa", emoji: "🐴", prix: 55 },
  { nom: "Poney", emoji: "🦄", prix: 35 },
  { nom: "Quarter Horse", emoji: "🏇", prix: 70 },
];

const ROBES = [
  { id: "alezan", nom: "Alezan", couleur: "#b5651d" },
  { id: "bai", nom: "Bai", couleur: "#6e4a2f" },
  { id: "noir", nom: "Noir", couleur: "#3f3a36" },
  { id: "gris", nom: "Gris", couleur: "#b9b2a9" },
  { id: "palomino", nom: "Palomino", couleur: "#e6c068" },
  { id: "pie", nom: "Pie", couleur: "#8a6f57" },
];

const DECORS = [
  { id: "cactus", nom: "Cactus", emoji: "🌵", prix: 15 },
  { id: "feu", nom: "Feu de camp", emoji: "🔥", prix: 20 },
  { id: "tonneau", nom: "Tonneau", emoji: "🛢️", prix: 18 },
  { id: "fleur", nom: "Fleurs", emoji: "🌼", prix: 16 },
  { id: "etoile", nom: "Panneau shérif", emoji: "⭐", prix: 30 },
  { id: "guitare", nom: "Guitare", emoji: "🎸", prix: 22 },
  { id: "arbre", nom: "Arbre", emoji: "🌳", prix: 28 },
  { id: "lampe", nom: "Lanterne", emoji: "🏮", prix: 24 },
];

const QUETES = [
  { id: "deuxchevaux", titre: "Premiers compagnons", desc: "Avoir 2 chevaux", recompense: 25, test: (e) => e.chevaux.length >= 2 },
  { id: "rodeo1", titre: "Premier rodéo gagné", desc: "Gagner 1 rodéo", recompense: 30, test: (e) => e.stats.rodeosGagnes >= 1 },
  { id: "poulain", titre: "Premier poulain", desc: "Faire naître un poulain", recompense: 35, test: (e) => e.stats.poulainsNes >= 1 },
  { id: "dressage50", titre: "Bon dresseur", desc: "Dresser un cheval au niveau 50", recompense: 40, test: (e) => e.chevaux.some((c) => c.entrainement >= 50) },
  { id: "decor3", titre: "Ranch coquet", desc: "Installer 3 décorations", recompense: 30, test: (e) => e.decors.length >= 3 },
  { id: "jour7", titre: "Une semaine au ranch", desc: "Atteindre le jour 7", recompense: 35, test: (e) => e.jour >= 7 },
  { id: "cinqchevaux", titre: "Grand éleveur", desc: "Avoir 5 chevaux", recompense: 60, test: (e) => e.chevaux.length >= 5 },
  { id: "rodeo5", titre: "Star du rodéo", desc: "Gagner 5 rodéos", recompense: 70, test: (e) => e.stats.rodeosGagnes >= 5 },
];

const TITRES_RANCH = [
  "🌱 Ranch débutant", "🤠 Petit ranch", "⭐ Ranch prometteur",
  "🏅 Grand ranch", "🔥 Ranch réputé", "👑 Ranch légendaire",
];

const NOMS_CHEVAUX = [
  "Éclair", "Tornade", "Caramel", "Étoile", "Tonnerre", "Cannelle",
  "Bandit", "Poussière", "Sherif", "Mistral", "Cactus", "Soleil",
  "Flèche", "Pépite", "Rusty", "Comète", "Sable", "Bravo",
];

const CONFIG = {
  pieceDepart: 60,
  foinDepart: 6,
  boxesDepart: 4,
  prixBotteFoin: 4,
  prixBox: 80,
  ageAdulte: 5,
  baisseParJour: { faim: 25, energie: 18, proprete: 16, bonheur: 12 },
};

/* ===================== Monde & décor ===================== */

const MONDE = { w: 960, h: 640 };

// Enclos (corral) où vivent les chevaux.
const CORRAL = { x1: 470, y1: 80, x2: 920, y2: 600 };

// Bâtiments / lieux avec lesquels on interagit.
const STATIONS = [
  { id: "maison", type: "dormir", x: 120, y: 150, emoji: "🏠", label: "Dormir", rayon: 95 },
  { id: "magasin", type: "boutique", x: 120, y: 345, emoji: "🏪", label: "Magasin", rayon: 95 },
  { id: "grange", type: "elevage", x: 120, y: 540, emoji: "🛖", label: "Élevage", rayon: 95 },
];

// Emplacements possibles pour poser les décorations achetées.
const SLOTS_DECOR = [
  { x: 300, y: 120 }, { x: 360, y: 250 }, { x: 250, y: 430 },
  { x: 330, y: 600 }, { x: 60, y: 60 }, { x: 900, y: 50 },
  { x: 60, y: 610 }, { x: 430, y: 470 },
];

/* ===================== État de la partie ===================== */

let etat = null;
const CLE_SAUVEGARDE = "mon-ranch-far-west-v2";

/* ===================== Utilitaires ===================== */

function aleatoire(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choisir(liste) { return liste[aleatoire(0, liste.length - 1)]; }
function borner(v) { return Math.max(0, Math.min(100, Math.round(v))); }
function $(id) { return document.getElementById(id); }
function trouverRobe(id) { return ROBES.find((r) => r.id === id) || ROBES[0]; }
function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

function positionCorral() {
  return {
    x: aleatoire(CORRAL.x1 + 40, CORRAL.x2 - 40),
    y: aleatoire(CORRAL.y1 + 50, CORRAL.y2 - 30),
  };
}

/* ===================== Création des chevaux ===================== */

let compteurId = 1;

function nouveauCheval(options = {}) {
  const race = options.race || choisir(RACES);
  const pos = positionCorral();
  return {
    id: compteurId++,
    nom: options.nom || choisir(NOMS_CHEVAUX),
    race: race.nom,
    emoji: race.emoji,
    robe: options.robe || choisir(ROBES).id,
    age: options.age != null ? options.age : aleatoire(5, 9),
    faim: 70, energie: 80, proprete: 75, bonheur: 80,
    entrainement: options.entrainement || 0,
    concoursFait: false,
    // données de déplacement dans le monde (non sauvegardées telles quelles)
    x: pos.x, y: pos.y, cx: pos.x, cy: pos.y, prochainPas: 0,
  };
}

function estPoulain(c) { return c.age < CONFIG.ageAdulte; }

function moyenneBesoins(c) {
  return (c.faim + c.energie + c.proprete + c.bonheur) / 4;
}

/* ===================== Sauvegarde / chargement ===================== */

function sauvegarder() {
  etat.compteurId = compteurId;
  try { localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etat)); } catch (e) {}
}

function charger() {
  try {
    const brut = localStorage.getItem(CLE_SAUVEGARDE);
    return brut ? JSON.parse(brut) : null;
  } catch (e) { return null; }
}

// Réattribue aux chevaux chargés leurs données de déplacement.
function reinitPositions() {
  etat.chevaux.forEach((c) => {
    if (c.x == null) {
      const p = positionCorral();
      c.x = p.x; c.y = p.y;
    }
    c.cx = c.x; c.cy = c.y; c.prochainPas = 0;
  });
}

/* ===================== Démarrage ===================== */

function nouvellePartie(nomRanch) {
  compteurId = 1;
  etat = {
    nomRanch,
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
  etat = sauv;
  if (!etat.decors) etat.decors = [];
  if (!etat.quetesFaites) etat.quetesFaites = [];
  if (!etat.stats) etat.stats = { rodeosGagnes: 0, poulainsNes: 0 };
  etat.chevaux.forEach((c) => { if (!c.robe) c.robe = choisir(ROBES).id; });
  compteurId = sauv.compteurId || (etat.chevaux.length + 1);
  reinitPositions();
  demarrerJeu();
}

function demarrerJeu() {
  $("ecran-accueil").classList.add("cache");
  $("ecran-jeu").classList.remove("cache");
  $("aff-nom-haras").textContent = etat.nomRanch;
  reinitPositions();
  joueur.x = 330; joueur.y = 320; joueur.cible = null;
  majHud();
  if (!boucleLancee) { boucleLancee = true; requestAnimationFrame(boucle); }
}

/* ===================== Niveau du ranch / HUD ===================== */

function infoNiveau() {
  const n = etat.quetesFaites.length;
  const index = Math.min(n, TITRES_RANCH.length - 1);
  return { niveau: index + 1, titre: TITRES_RANCH[index] };
}

function majHud() {
  $("aff-pieces").textContent = etat.pieces;
  $("aff-carottes").textContent = etat.foin;
  $("aff-jour").textContent = etat.jour;
  $("aff-boxes").textContent = etat.chevaux.length + "/" + etat.boxes;
  const info = infoNiveau();
  $("aff-niveau").textContent = `Niv.${info.niveau} ${info.titre}`;
  sauvegarder();
}

/* ===================== Messages ===================== */

let timerMessage = null;
function message(texte) {
  const el = $("message-jeu");
  el.textContent = texte;
  el.classList.remove("cache");
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  clearTimeout(timerMessage);
  timerMessage = setTimeout(() => el.classList.add("cache"), 2800);
}

/* ===================== Le joueur ===================== */

const joueur = {
  x: 330, y: 320, emoji: "🤠", taille: 38, vitesse: 200,
  cible: null,        // point vers lequel marcher (clic/tap)
  cibleAuto: null,    // station/cheval à activer en arrivant
};

// Vecteur de déplacement au clavier / à la manette.
const touches = { haut: false, bas: false, gauche: false, droite: false };

/* ===================== Boucle de jeu ===================== */

let boucleLancee = false;
let dernierTemps = 0;
let cibleActive = null;     // cheval ou station actuellement à portée
let idPanneauAffiche = null; // pour ne reconstruire le panneau que si ça change

function boucle(t) {
  const dt = Math.min((t - dernierTemps) / 1000, 0.05);
  dernierTemps = t;
  if (!$("ecran-jeu").classList.contains("cache")) {
    majJoueur(dt);
    majChevaux(dt);
    majInteraction();
    dessiner();
  }
  requestAnimationFrame(boucle);
}

function majJoueur(dt) {
  let vx = 0, vy = 0;
  if (touches.gauche) vx -= 1;
  if (touches.droite) vx += 1;
  if (touches.haut) vy -= 1;
  if (touches.bas) vy += 1;

  if (vx || vy) {
    // Déplacement manuel : on annule la marche automatique.
    joueur.cible = null; joueur.cibleAuto = null;
    const n = Math.hypot(vx, vy);
    joueur.x += (vx / n) * joueur.vitesse * dt;
    joueur.y += (vy / n) * joueur.vitesse * dt;
  } else if (joueur.cible) {
    const d = distance(joueur.x, joueur.y, joueur.cible.x, joueur.cible.y);
    if (d < 6) {
      joueur.cible = null;
      if (joueur.cibleAuto) { const c = joueur.cibleAuto; joueur.cibleAuto = null; interagir(c); }
    } else {
      const dx = (joueur.cible.x - joueur.x) / d;
      const dy = (joueur.cible.y - joueur.y) / d;
      joueur.x += dx * joueur.vitesse * dt;
      joueur.y += dy * joueur.vitesse * dt;
    }
  }
  // Reste dans le monde.
  joueur.x = Math.max(24, Math.min(MONDE.w - 24, joueur.x));
  joueur.y = Math.max(40, Math.min(MONDE.h - 24, joueur.y));
}

function majChevaux(dt, t) {
  const maintenant = performance.now();
  etat.chevaux.forEach((c) => {
    // Le cheval en cours d'interaction reste tranquille.
    if (cibleActive && cibleActive.id === c.id && cibleActive.race) return;
    if (maintenant > c.prochainPas) {
      const p = positionCorral();
      c.cx = p.x; c.cy = p.y;
      c.prochainPas = maintenant + aleatoire(2500, 6000);
    }
    const d = distance(c.x, c.y, c.cx, c.cy);
    if (d > 2) {
      c.x += ((c.cx - c.x) / d) * 30 * dt;
      c.y += ((c.cy - c.y) / d) * 30 * dt;
    }
  });
}

// Détermine l'objet le plus proche du joueur, à portée.
function majInteraction() {
  let meilleur = null, meilleureDist = Infinity;

  STATIONS.forEach((s) => {
    const d = distance(joueur.x, joueur.y, s.x, s.y);
    if (d < s.rayon && d < meilleureDist) { meilleureDist = d; meilleur = s; }
  });
  etat.chevaux.forEach((c) => {
    const d = distance(joueur.x, joueur.y, c.x, c.y);
    if (d < 80 && d < meilleureDist) { meilleureDist = d; meilleur = c; }
  });

  cibleActive = meilleur;
  const id = meilleur ? (meilleur.race ? "cheval-" + meilleur.id : "station-" + meilleur.id) : null;
  if (id !== idPanneauAffiche) { idPanneauAffiche = id; construirePanneau(); }
  if (meilleur && meilleur.race) majBarresPanneau(meilleur);

  // Le bouton d'action flottant ne sert que pour les bâtiments
  // (pour un cheval, les actions sont dans le panneau du bas).
  const station = meilleur && !meilleur.race;
  $("btn-action").classList.toggle("cache", !station);
  if (station) $("btn-action").textContent = meilleur.emoji + " " + meilleur.label;
}

/* ===================== Dessin ===================== */

const canvas = () => $("monde");
const ctx = () => canvas().getContext("2d");

let tufts = null; // touffes d'herbe/cailloux dessinées en fond (générées une fois)
function genererTufts() {
  tufts = [];
  for (let i = 0; i < 70; i++) {
    tufts.push({ x: Math.random() * MONDE.w, y: Math.random() * MONDE.h, t: Math.random() });
  }
}

function rectArrondi(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function dessiner() {
  const c = ctx();
  if (!tufts) genererTufts();

  // Sol désertique
  c.fillStyle = "#e8c48a";
  c.fillRect(0, 0, MONDE.w, MONDE.h);
  // Touffes / cailloux
  tufts.forEach((tf) => {
    c.font = "16px serif";
    c.globalAlpha = 0.5;
    c.fillText(tf.t > 0.5 ? "🌿" : "•", tf.x, tf.y);
    c.globalAlpha = 1;
  });

  // Enclos (corral) : herbe + clôture
  c.fillStyle = "#cfe8a3";
  rectArrondi(c, CORRAL.x1, CORRAL.y1, CORRAL.x2 - CORRAL.x1, CORRAL.y2 - CORRAL.y1, 24);
  c.fill();
  dessinerCloture(c);
  c.fillStyle = "#7a5a3a";
  c.font = "bold 20px sans-serif";
  c.textAlign = "center";
  c.fillText("🐎 Le Corral", (CORRAL.x1 + CORRAL.x2) / 2, CORRAL.y1 - 12);

  // Décorations posées
  etat.decors.forEach((id, i) => {
    const slot = SLOTS_DECOR[i % SLOTS_DECOR.length];
    const d = DECORS.find((x) => x.id === id);
    if (d && slot) dessinerEmoji(c, d.emoji, slot.x, slot.y, 34);
  });

  // Bâtiments
  STATIONS.forEach((s) => dessinerStation(c, s));

  // Chevaux (triés par y pour un rendu correct)
  const tries = [...etat.chevaux].sort((a, b) => a.y - b.y);
  tries.forEach((ch) => dessinerCheval(c, ch));

  // Joueur
  dessinerOmbre(c, joueur.x, joueur.y, 16);
  dessinerEmoji(c, joueur.emoji, joueur.x, joueur.y - 4, joueur.taille);

  // Surbrillance de la cible active
  if (cibleActive) {
    const tx = cibleActive.x, ty = cibleActive.y;
    const pulse = 6 + Math.sin(performance.now() / 200) * 3;
    c.strokeStyle = "#e8722d";
    c.lineWidth = 4;
    c.beginPath();
    c.arc(tx, ty, 34 + pulse, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = "#b5572b";
    c.font = "bold 16px sans-serif";
    c.textAlign = "center";
    const txt = cibleActive.race ? "💬 " + cibleActive.nom : "➡️ " + cibleActive.label;
    c.fillText(txt, tx, ty - 46);
  }
  c.textAlign = "left";
}

function dessinerCloture(c) {
  c.strokeStyle = "#8a5a3b";
  c.lineWidth = 6;
  c.setLineDash([2, 22]);
  c.lineCap = "round";
  c.strokeRect(CORRAL.x1, CORRAL.y1, CORRAL.x2 - CORRAL.x1, CORRAL.y2 - CORRAL.y1);
  c.setLineDash([]);
  // Rail du haut et du bas
  c.lineWidth = 4;
  [CORRAL.y1, CORRAL.y2].forEach((y) => {
    c.beginPath(); c.moveTo(CORRAL.x1, y); c.lineTo(CORRAL.x2, y); c.stroke();
  });
}

function dessinerEmoji(c, emoji, x, y, taille) {
  c.font = taille + "px serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(emoji, x, y);
  c.textBaseline = "alphabetic";
}

function dessinerOmbre(c, x, y, r) {
  c.fillStyle = "rgba(0,0,0,0.18)";
  c.beginPath();
  c.ellipse(x, y + 16, r, r * 0.45, 0, 0, Math.PI * 2);
  c.fill();
}

function dessinerStation(c, s) {
  dessinerOmbre(c, s.x, s.y + 8, 30);
  c.fillStyle = "#f6e2bd";
  rectArrondi(c, s.x - 42, s.y - 38, 84, 70, 14);
  c.fill();
  c.strokeStyle = "#8a5a3b"; c.lineWidth = 4; c.stroke();
  dessinerEmoji(c, s.emoji, s.x, s.y - 4, 40);
  c.fillStyle = "#4a2f1d";
  c.font = "bold 15px sans-serif";
  c.textAlign = "center";
  c.fillText(s.label, s.x, s.y + 26);
}

function dessinerCheval(c, ch) {
  dessinerOmbre(c, ch.x, ch.y, 18);
  const robe = trouverRobe(ch.robe);
  // petit halo de la couleur de robe
  c.fillStyle = robe.couleur;
  c.globalAlpha = 0.35;
  c.beginPath(); c.arc(ch.x, ch.y - 2, 22, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  const taille = estPoulain(ch) ? 30 : 40;
  dessinerEmoji(c, ch.emoji, ch.x, ch.y - 2, taille);
  // Humeur (frimousse) selon les besoins
  const m = moyenneBesoins(ch);
  const frimousse = m > 60 ? "😀" : m > 35 ? "😐" : "😢";
  dessinerEmoji(c, frimousse, ch.x + 16, ch.y - 22, 18);
  // Nom
  c.fillStyle = "#3a2716";
  c.font = "bold 13px sans-serif";
  c.textAlign = "center";
  c.fillText(ch.nom, ch.x, ch.y + 26);
}

/* ===================== Panneau contextuel ===================== */

function construirePanneau() {
  const p = $("panneau");
  if (!cibleActive) {
    p.innerHTML = `<p class="panneau-aide">Promène-toi 🚶 et approche-toi d'un cheval ou d'un bâtiment pour agir.</p>`;
    return;
  }
  if (cibleActive.race) {
    const c = cibleActive;
    p.innerHTML = `
      <div class="pc-tete">
        <span class="pc-emoji">${c.emoji}</span>
        <div>
          <b>${c.nom}</b> <span class="pc-sous">${c.race} · 🎖️ ${c.entrainement}</span><br/>
          <span class="pc-sous">${estPoulain(c) ? "🐣 Poulain (" + c.age + " j)" : "Adulte (" + c.age + " j)"}</span>
        </div>
      </div>
      <div class="pc-barres" id="pc-barres"></div>
      <div class="pc-actions">
        <button class="bouton" data-cheval="nourrir">🌾 Nourrir</button>
        <button class="bouton" data-cheval="brosser">🧽 Brosser</button>
        <button class="bouton" data-cheval="jouer">🎾 Jouer</button>
        <button class="bouton" data-cheval="entrainer">🤠 Dresser</button>
        <button class="bouton bouton-rodeo" data-cheval="concours">🏆 Rodéo</button>
      </div>`;
    majBarresPanneau(c);
  } else {
    const s = cibleActive;
    const libelle = { dormir: "🌙 Dormir (jour suivant)", boutique: "🛒 Entrer dans le magasin", elevage: "🐣 Élevage de poulains" }[s.type];
    p.innerHTML = `
      <div class="pc-station">
        <span class="pc-emoji">${s.emoji}</span>
        <button class="bouton bouton-geant" data-station="${s.type}">${libelle}</button>
      </div>`;
  }
}

function majBarresPanneau(c) {
  const cont = $("pc-barres");
  if (!cont) return;
  const def = [["🌾", c.faim], ["⚡", c.energie], ["🧼", c.proprete], ["😊", c.bonheur]];
  cont.innerHTML = def.map(([ic, v]) => {
    const cl = v < 25 ? "r-rouge" : v < 50 ? "r-jaune" : "r-vert";
    return `<div class="besoin"><span class="icone">${ic}</span>
      <div class="barre"><div class="barre-remplissage ${cl}" style="width:${v}%"></div></div></div>`;
  }).join("");
}

/* ===================== Interaction ===================== */

function interagir(cible) {
  if (!cible) return;
  if (cible.race) { idPanneauAffiche = null; majInteraction(); return; } // cheval : le panneau suffit
  if (cible.type === "dormir") jourSuivant();
  else if (cible.type === "boutique") ouvrirBoutique();
  else if (cible.type === "elevage") ouvrirElevage();
}

function trouverCheval(id) { return etat.chevaux.find((c) => c.id === Number(id)); }

function actionCheval(action) {
  const c = cibleActive;
  if (!c || !c.race) return;

  switch (action) {
    case "nourrir":
      if (etat.foin <= 0) { message("🌾 Plus de foin ! Va au magasin en acheter."); return; }
      etat.foin--; c.faim = borner(c.faim + 35); c.bonheur = borner(c.bonheur + 6);
      message(`${c.nom} a mangé du bon foin ! 🌾`); break;
    case "brosser":
      c.proprete = borner(c.proprete + 40); c.bonheur = borner(c.bonheur + 10); c.energie = borner(c.energie - 6);
      message(`${c.nom} est tout beau et brillant ! ✨`); break;
    case "jouer":
      if (c.energie < 15) { message(`${c.nom} est trop fatigué pour jouer. 😴`); return; }
      c.bonheur = borner(c.bonheur + 22); c.energie = borner(c.energie - 18); c.faim = borner(c.faim - 10);
      message(`${c.nom} s'est bien amusé au galop ! 🎾`); break;
    case "entrainer":
      if (estPoulain(c)) { message(`${c.nom} est un poulain, trop petit pour le dressage. 🐣`); return; }
      if (c.energie < 20) { message(`${c.nom} a besoin de repos avant de s'entraîner. 😴`); return; }
      c.entrainement = borner(c.entrainement + aleatoire(6, 12)); c.energie = borner(c.energie - 22);
      c.faim = borner(c.faim - 12); c.bonheur = borner(c.bonheur + 5);
      message(`${c.nom} progresse au dressage ! 🎖️ ${c.entrainement}`); break;
    case "concours":
      lancerConcours(c); break;
  }
  majBarresPanneau(c);
  majHud();
  verifierQuetes();
}

function lancerConcours(c) {
  if (estPoulain(c)) { message(`${c.nom} est trop jeune pour le rodéo. 🐣`); return; }
  if (c.concoursFait) { message(`${c.nom} a déjà couru aujourd'hui. Reviens demain ! 🌙`); return; }
  if (c.energie < 30) { message(`${c.nom} est trop fatigué pour le rodéo. 😴`); return; }
  if (c.bonheur < 35) { message(`${c.nom} n'est pas d'humeur. Joue avec lui d'abord ! 😟`); return; }

  c.concoursFait = true;
  c.energie = borner(c.energie - 30); c.faim = borner(c.faim - 10);
  const score = c.entrainement + c.bonheur / 2 + aleatoire(0, 30);
  let gain;
  if (score > 110) { gain = aleatoire(45, 70); c.bonheur = borner(c.bonheur + 15); etat.stats.rodeosGagnes++; message(`🥇 ${c.nom} GAGNE le rodéo ! +${gain} 💰`); }
  else if (score > 75) { gain = aleatoire(20, 40); c.bonheur = borner(c.bonheur + 8); message(`🥈 ${c.nom} monte sur le podium ! +${gain} 💰`); }
  else { gain = aleatoire(8, 18); message(`🎗️ ${c.nom} a bien participé. +${gain} 💰`); }
  etat.pieces += gain;
}

/* ===================== Jour suivant ===================== */

function jourSuivant() {
  etat.jour++;
  const negliges = [];
  const bonusDecor = Math.min(etat.decors.length * 2, 10);
  etat.chevaux.forEach((c) => {
    c.age++;
    const b = CONFIG.baisseParJour;
    c.faim = borner(c.faim - b.faim);
    c.energie = borner(c.energie + 55 - b.energie);
    c.proprete = borner(c.proprete - b.proprete);
    let aj = -b.bonheur + bonusDecor;
    if (c.faim < 25 || c.proprete < 25) aj -= 10;
    if (c.faim > 60 && c.proprete > 60) aj += 8;
    c.bonheur = borner(c.bonheur + aj);
    c.concoursFait = false;
    if (c.bonheur < 25 || c.faim < 20) negliges.push(c.nom);
  });
  majHud();
  verifierQuetes();
  if (negliges.length > 0) message(`🌅 Jour ${etat.jour}. Occupe-toi de ${negliges.join(" et ")} !`);
  else message(`🌅 Jour ${etat.jour} : tes chevaux ont bien dormi. 🐴`);
}

/* ===================== Objectifs ===================== */

function verifierQuetes() {
  const nouvelles = [];
  QUETES.forEach((q) => {
    if (!etat.quetesFaites.includes(q.id) && q.test(etat)) {
      etat.quetesFaites.push(q.id); etat.pieces += q.recompense; nouvelles.push(q);
    }
  });
  if (nouvelles.length > 0) {
    majHud();
    message("🏅 Objectif réussi : " + nouvelles.map((q) => `${q.titre} (+${q.recompense}💰)`).join(" · "));
  }
}

/* ===================== Modale générique ===================== */

function ouvrirModale(titre, html) {
  $("modale-titre").innerHTML = titre;
  $("modale-corps").innerHTML = html;
  $("modale").classList.remove("cache");
}
function fermerModale() { $("modale").classList.add("cache"); }

/* ===================== Boutique ===================== */

function ouvrirBoutique() {
  const placeLibre = etat.chevaux.length < etat.boxes;
  let html = `
    <div class="ligne-boutique">
      <div class="desc"><b>🌾 Botte de foin</b><small>Pour nourrir tes chevaux.</small></div>
      <button class="bouton" data-boutique="foin">${CONFIG.prixBotteFoin} 💰</button>
    </div>
    <div class="ligne-boutique">
      <div class="desc"><b>🏚️ Agrandir le corral (+1 box)</b><small>${etat.chevaux.length}/${etat.boxes} box occupés.</small></div>
      <button class="bouton" data-boutique="box">${CONFIG.prixBox} 💰</button>
    </div>
    <h3>🎨 Décorations pour le ranch</h3>
    <div class="grille-decor">`;
  DECORS.forEach((d) => {
    const possede = etat.decors.includes(d.id);
    html += `<button class="carte-decor ${possede ? "possede" : ""}" data-decor="${d.id}" ${possede ? "disabled" : ""}>
      <span class="d-emoji">${d.emoji}</span><span>${d.nom}</span>
      <span class="d-prix">${possede ? "✅" : d.prix + " 💰"}</span></button>`;
  });
  html += `</div><h3>🐴 Acheter et personnaliser un cheval</h3>`;
  if (!placeLibre) {
    html += `<p>⚠️ Ton corral est plein ! Agrandis-le d'abord.</p>`;
  } else {
    html += `
      <div class="formulaire-achat">
        <label>Race :</label>
        <select id="achat-race">${RACES.map((r, i) => `<option value="${i}">${r.emoji} ${r.nom} — ${r.prix} 💰</option>`).join("")}</select>
        <label>Nom :</label>
        <input id="achat-nom" type="text" maxlength="14" placeholder="Un nom rigolo" />
        <label>Robe :</label>
        <div class="choix-robes">${ROBES.map((r, i) => `<label class="swatch"><input type="radio" name="robe" value="${r.id}" ${i === 0 ? "checked" : ""}/><span class="pastille" style="background:${r.couleur}"></span>${r.nom}</label>`).join("")}</div>
        <button class="bouton bouton-geant" data-boutique="cheval">🛒 Acheter ce cheval</button>
      </div>`;
  }
  ouvrirModale("🛒 Magasin du Far West", html);
}

function acheter(quoi) {
  if (quoi === "foin") {
    if (etat.pieces < CONFIG.prixBotteFoin) return message("Pas assez de 💰 !");
    etat.pieces -= CONFIG.prixBotteFoin; etat.foin++; message("🌾 +1 botte de foin !");
  } else if (quoi === "box") {
    if (etat.pieces < CONFIG.prixBox) return message("Pas assez de 💰 !");
    etat.pieces -= CONFIG.prixBox; etat.boxes++; message("🏚️ Corral agrandi ! +1 box.");
  } else if (quoi === "cheval") {
    if (etat.chevaux.length >= etat.boxes) return message("Corral plein !");
    const r = RACES[Number($("achat-race").value)];
    if (etat.pieces < r.prix) return message("Pas assez de 💰 !");
    const radio = document.querySelector('input[name="robe"]:checked');
    const nom = $("achat-nom").value.trim() || choisir(NOMS_CHEVAUX);
    etat.pieces -= r.prix;
    etat.chevaux.push(nouveauCheval({ race: r, robe: radio ? radio.value : ROBES[0].id, nom }));
    message(`Bienvenue au ranch, ${nom} ! 🎉`);
  }
  majHud(); verifierQuetes(); ouvrirBoutique();
}

function acheterDecor(id) {
  if (etat.decors.includes(id)) return;
  const d = DECORS.find((x) => x.id === id);
  if (!d) return;
  if (etat.pieces < d.prix) return message("Pas assez de 💰 !");
  etat.pieces -= d.prix; etat.decors.push(id);
  etat.chevaux.forEach((c) => (c.bonheur = borner(c.bonheur + 5)));
  message(`${d.emoji} ${d.nom} installé dans le ranch !`);
  majHud(); verifierQuetes(); ouvrirBoutique();
}

/* ===================== Élevage ===================== */

function ouvrirElevage() {
  const adultes = etat.chevaux.filter((c) => !estPoulain(c) && c.bonheur >= 50);
  const placeLibre = etat.chevaux.length < etat.boxes;
  let html = `<p>Choisis deux chevaux adultes et heureux (bonheur ≥ 50) pour avoir un poulain ! 🐣</p>`;
  if (!placeLibre) html += `<p>⚠️ Corral plein. Agrandis-le au magasin.</p>`;
  else if (adultes.length < 2) html += `<p>Il te faut <b>2 chevaux adultes heureux</b>. Prends soin d'eux puis reviens !</p>`;
  else {
    html += `
      <label>Premier parent :</label>
      <select id="parent1" class="select-large">${adultes.map((c) => `<option value="${c.id}">${c.emoji} ${c.nom}</option>`).join("")}</select>
      <label>Deuxième parent :</label>
      <select id="parent2" class="select-large">${adultes.map((c) => `<option value="${c.id}">${c.emoji} ${c.nom}</option>`).join("")}</select>
      <button class="bouton bouton-geant" data-elevage="go">🐣 Faire naître un poulain</button>`;
  }
  ouvrirModale("🐣 Élevage de poulains", html);
}

function faireNaitre() {
  const id1 = Number($("parent1").value), id2 = Number($("parent2").value);
  if (id1 === id2) return message("Choisis deux chevaux différents ! 🙂");
  if (etat.chevaux.length >= etat.boxes) return message("Corral plein !");
  const p1 = trouverCheval(id1), p2 = trouverCheval(id2);
  const parentRace = Math.random() < 0.5 ? p1 : p2;
  const parentRobe = Math.random() < 0.5 ? p1 : p2;
  const race = RACES.find((r) => r.nom === parentRace.race) || RACES[0];
  const poulain = nouveauCheval({ race, age: 0, robe: parentRobe.robe });
  p1.bonheur = borner(p1.bonheur + 10); p2.bonheur = borner(p2.bonheur + 10);
  etat.chevaux.push(poulain); etat.stats.poulainsNes++;
  fermerModale(); majHud(); verifierQuetes();
  message(`🎉 Un poulain est né : ${poulain.nom} ! Il grandira en ${CONFIG.ageAdulte} jours.`);
}

/* ===================== Objectifs / Aide (modales) ===================== */

function ouvrirObjectifs() {
  const info = infoNiveau();
  let html = `
    <p style="font-size:1.1rem;"><b>${info.titre}</b> — Niveau ${info.niveau}</p>
    <p>Objectifs : <b>${etat.quetesFaites.length}/${QUETES.length}</b> · 🥇 Rodéos : <b>${etat.stats.rodeosGagnes}</b> · 🐣 Poulains : <b>${etat.stats.poulainsNes}</b></p>`;
  QUETES.forEach((q) => {
    const fait = etat.quetesFaites.includes(q.id);
    html += `<div class="quete-ligne ${fait ? "faite" : ""}">
      <span class="quete-coche">${fait ? "🏅" : "⬜"}</span>
      <div class="desc"><b>${q.titre}</b><small>${q.desc}</small></div>
      <span class="quete-gain">+${q.recompense} 💰</span></div>`;
  });
  ouvrirModale("🏆 Objectifs & médailles", html);
}

function ouvrirAide() {
  ouvrirModale("❓ Comment jouer", `
    <div class="aide-texte">
      <p><b>Bienvenue au ranch, cow-girl ! 🤠</b></p>
      <p><b>🚶 Se déplacer :</b></p>
      <ul>
        <li>Avec les <b>flèches</b> du clavier (ou les touches Z Q S D),</li>
        <li>en <b>cliquant / touchant</b> un endroit du ranch,</li>
        <li>ou avec la <b>manette ▲◀▶▼</b> en bas à gauche.</li>
      </ul>
      <p><b>🐴 S'occuper d'un cheval :</b> approche-toi de lui, puis utilise les boutons en bas
      (Nourrir 🌾, Brosser 🧽, Jouer 🎾, Dresser 🤠, Rodéo 🏆). Garde ses 4 barres bien remplies !</p>
      <p>La <b>frimousse</b> au-dessus de chaque cheval te montre s'il est content 😀, bof 😐 ou triste 😢.</p>
      <p><b>🏪 Magasin :</b> va devant le bâtiment pour acheter du foin, des décorations ou un nouveau cheval.</p>
      <p><b>🛖 Élevage :</b> avec 2 chevaux adultes et heureux, fais naître un poulain.</p>
      <p><b>🏠 Maison :</b> va dormir pour passer au jour suivant (les chevaux se reposent).</p>
      <p><b>🏆 Objectifs :</b> réussis des défis pour gagner des médailles et faire grandir ton ranch !</p>
      <p>💾 La partie se sauvegarde toute seule.</p>
    </div>`);
}

/* ===================== Entrées (clavier / souris / tactile) ===================== */

function coordsCanvas(ev) {
  const cv = canvas();
  const rect = cv.getBoundingClientRect();
  const cx = (ev.clientX - rect.left) * (MONDE.w / rect.width);
  const cy = (ev.clientY - rect.top) * (MONDE.h / rect.height);
  return { x: cx, y: cy };
}

function clicMonde(ev) {
  ev.preventDefault();
  const p = coordsCanvas(ev);
  // A-t-on cliqué sur un cheval ou un bâtiment ? → y aller puis interagir.
  let cible = null, dmin = Infinity;
  STATIONS.forEach((s) => { const d = distance(p.x, p.y, s.x, s.y); if (d < 55 && d < dmin) { dmin = d; cible = s; } });
  etat.chevaux.forEach((c) => { const d = distance(p.x, p.y, c.x, c.y); if (d < 40 && d < dmin) { dmin = d; cible = c; } });

  if (cible) {
    // Marche jusqu'à un point proche de la cible.
    const a = Math.atan2(joueur.y - cible.y, joueur.x - cible.x);
    joueur.cible = { x: cible.x + Math.cos(a) * 55, y: cible.y + Math.sin(a) * 55 };
    joueur.cibleAuto = cible.race ? null : cible; // les bâtiments s'ouvrent à l'arrivée ; les chevaux via le panneau
  } else {
    joueur.cible = { x: p.x, y: p.y };
    joueur.cibleAuto = null;
  }
}

function init() {
  // Accueil
  $("btn-commencer").addEventListener("click", () => nouvellePartie($("nom-haras").value.trim() || "Mon Ranch"));
  $("btn-charger").addEventListener("click", continuerPartie);
  $("nom-haras").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-commencer").click(); });
  if (charger()) $("msg-accueil").textContent = "Une partie existe : clique sur « Continuer ma partie » 🐴";

  // HUD
  $("btn-objectifs").addEventListener("click", ouvrirObjectifs);
  $("btn-aide").addEventListener("click", ouvrirAide);

  // Modale
  $("btn-fermer-modale").addEventListener("click", fermerModale);
  $("modale").addEventListener("click", (e) => { if (e.target.id === "modale") fermerModale(); });

  // Bouton d'action central + délégation des clics de panneau/modale
  $("btn-action").addEventListener("click", () => interagir(cibleActive));
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.cheval) actionCheval(btn.dataset.cheval);
    else if (btn.dataset.station) interagir({ type: btn.dataset.station });
    else if (btn.dataset.boutique) acheter(btn.dataset.boutique);
    else if (btn.dataset.decor) acheterDecor(btn.dataset.decor);
    else if (btn.dataset.elevage) faireNaitre();
  });

  // Clavier : déplacement + action
  const map = { ArrowUp: "haut", ArrowDown: "bas", ArrowLeft: "gauche", ArrowRight: "droite",
                z: "haut", s: "bas", q: "gauche", d: "droite", w: "haut", a: "gauche" };
  document.addEventListener("keydown", (e) => {
    if (!$("modale").classList.contains("cache")) return;
    const dir = map[e.key];
    if (dir) { touches[dir] = true; e.preventDefault(); }
    if (e.key === " " || e.key === "Enter") { interagir(cibleActive); e.preventDefault(); }
  });
  document.addEventListener("keyup", (e) => { const dir = map[e.key]; if (dir) touches[dir] = false; });

  // Manette tactile
  document.querySelectorAll(".dpad-btn").forEach((b) => {
    const dir = b.dataset.dir;
    const on = (e) => { e.preventDefault(); touches[dir] = true; };
    const off = (e) => { e.preventDefault(); touches[dir] = false; };
    b.addEventListener("pointerdown", on);
    b.addEventListener("pointerup", off);
    b.addEventListener("pointerleave", off);
    b.addEventListener("pointercancel", off);
  });

  // Clic / tap dans le monde
  const cv = canvas();
  cv.addEventListener("pointerdown", clicMonde);
}

document.addEventListener("DOMContentLoaded", init);
