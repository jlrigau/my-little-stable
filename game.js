/* =========================================================
   🤠 Mon Ranch du Far West — version isométrique 2.5D
   Jeu de simulation d'élevage de chevaux pour enfants (9-10 ans).
   Rendu isométrique sur <canvas> avec sprites dessinés (vectoriels),
   personnage et chevaux entièrement personnalisables.
   100% statique : sauvegarde dans le navigateur.
   ========================================================= */

"use strict";

/* ===================== Palettes & données ===================== */

const PEAUX = ["#f7c89c", "#e7a877", "#c98a5a", "#8d5a36"];
const CHEVEUX = ["#33271a", "#6b4a2b", "#caa14a", "#d9d4cc", "#b5512b", "#1d1d1d"];
const HAUTS = ["#4aa3b8", "#e8722d", "#d94a6a", "#7fae5a", "#7a5bd0", "#f4b942"];
const PANTALONS = ["#3a4a6b", "#5a3a2a", "#444444", "#2a6b4a"];
const CHAPEAUX = ["#7a5230", "#b5572b", "#3f3a36", "#d94a6a", "#4aa3b8", "#caa14a"];

const ROBES = ["#caa14a", "#b5651d", "#6e4a2f", "#3f3a36", "#cfc7bd", "#8a6f57", "#ece4d6", "#7a4a2a"];
const CRINIERES = ["#33271a", "#6b4a2b", "#caa14a", "#d9d4cc", "#1d1d1d", "#b5512b"];
const ACCESSOIRES = [
  { id: "aucun", emoji: "", nom: "Aucun" },
  { id: "noeud", emoji: "🎀", nom: "Nœud" },
  { id: "fleur", emoji: "🌸", nom: "Fleur" },
  { id: "chapeau", emoji: "🤠", nom: "Chapeau" },
  { id: "etoile", emoji: "⭐", nom: "Étoile" },
];

const DECORS = [
  { id: "cactus", nom: "Cactus", emoji: "🌵", prix: 15 },
  { id: "feu", nom: "Feu de camp", emoji: "🔥", prix: 20 },
  { id: "tonneau", nom: "Tonneau", emoji: "🛢️", prix: 18 },
  { id: "fleur", nom: "Fleurs", emoji: "🌼", prix: 16 },
  { id: "arbre", nom: "Arbre", emoji: "🌳", prix: 28 },
  { id: "lampe", nom: "Lanterne", emoji: "🏮", prix: 24 },
];

const NOMS_CHEVAUX = [
  "Éclair", "Tornade", "Caramel", "Étoile", "Tonnerre", "Cannelle",
  "Bandit", "Poussière", "Mistral", "Pépite", "Comète", "Bravo",
];

const PRIX_CHEVAL = 45;
const PRIX_FOIN = 4;
const PRIX_BOX = 80;
const AGE_ADULTE = 5;
const OUT = "#3a2a1a"; // couleur de contour des sprites

/* ===================== Monde isométrique ===================== */

const TW2 = 32, TH2 = 16;       // demi-largeur / demi-hauteur d'une tuile
const GRID = 16;
const CORRAL = { i1: 8, i2: 15, j1: 2, j2: 13 };

const STATIONS = [
  { type: "dormir", i: 2, j: 4, emoji: "🏠", label: "Dormir", couleur: "#d98a5f" },
  { type: "boutique", i: 2, j: 9, emoji: "🏪", label: "Magasin", couleur: "#e8b25a" },
];

const SLOTS_DECOR = [
  { i: 5, j: 2 }, { i: 6, j: 13 }, { i: 4, j: 6 }, { i: 1, j: 12 },
  { i: 5, j: 9 }, { i: 1, j: 1 }, { i: 14, j: 1 }, { i: 14, j: 14 },
];

/* ===================== État ===================== */

let etat = null;
const CLE = "mon-ranch-iso";

/* ===================== Utilitaires ===================== */

function aleatoire(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choisir(l) { return l[aleatoire(0, l.length - 1)]; }
function borner(v) { return Math.max(0, Math.min(100, Math.round(v))); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function $(id) { return document.getElementById(id); }

/* ===================== Chevaux ===================== */

let compteurId = 1;

function nouveauCheval(o = {}) {
  const i = aleatoire(CORRAL.i1 + 1, CORRAL.i2 - 1);
  const j = aleatoire(CORRAL.j1 + 1, CORRAL.j2 - 1);
  return {
    id: compteurId++,
    nom: o.nom || choisir(NOMS_CHEVAUX),
    robe: o.robe || choisir(ROBES),
    crin: o.crin || choisir(CRINIERES),
    accessoire: o.accessoire || "aucun",
    age: o.age != null ? o.age : aleatoire(5, 9),
    faim: 70, energie: 80, proprete: 75, bonheur: 80,
    gi: i, gj: j, ti: i, tj: j, prochainPas: 0, flip: false,
  };
}

function estPoulain(c) { return c.age < AGE_ADULTE; }
function moyenne(c) { return (c.faim + c.energie + c.proprete + c.bonheur) / 4; }

/* ===================== Sauvegarde ===================== */

function sauvegarder() {
  etat.compteurId = compteurId;
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {}
}
function charger() {
  try { const b = localStorage.getItem(CLE); return b ? JSON.parse(b) : null; } catch (e) { return null; }
}

function persoParDefaut() {
  return { peau: PEAUX[0], cheveux: CHEVEUX[1], haut: HAUTS[0], pantalon: PANTALONS[0], chapeau: CHAPEAUX[1], chapeauOn: true };
}

/* ===================== Flux des écrans ===================== */

let persoEnCours = null;

function init() {
  $("btn-commencer").addEventListener("click", () => {
    nomRanchTemp = $("nom-haras").value.trim() || "Mon Ranch";
    ouvrirCreation(persoParDefaut(), () => nouvellePartie(nomRanchTemp, persoEnCours));
  });
  $("btn-charger").addEventListener("click", continuerPartie);
  $("nom-haras").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-commencer").click(); });
  if (charger()) $("msg-accueil").textContent = "Une partie existe : clique sur « Continuer ma partie » 🐴";

  $("btn-moi").addEventListener("click", () => {
    ouvrirCreation({ ...etat.perso }, () => { etat.perso = persoEnCours; sauvegarder(); });
  });
  $("btn-aide").addEventListener("click", ouvrirAide);

  $("btn-fermer-modale").addEventListener("click", fermerModale);
  $("modale").addEventListener("click", (e) => { if (e.target.id === "modale") fermerModale(); });

  $("btn-action").addEventListener("click", () => interagir(cibleActive));
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.cheval) actionCheval(btn.dataset.cheval);
    else if (btn.dataset.station) interagir({ type: btn.dataset.station });
    else if (btn.dataset.boutique) acheter(btn.dataset.boutique);
    else if (btn.dataset.decor) acheterDecor(btn.dataset.decor);
  });

  const map = { ArrowUp: "haut", ArrowDown: "bas", ArrowLeft: "gauche", ArrowRight: "droite",
                z: "haut", s: "bas", q: "gauche", d: "droite", w: "haut", a: "gauche" };
  document.addEventListener("keydown", (e) => {
    if (!$("modale").classList.contains("cache")) return;
    const dir = map[e.key]; if (dir) { touches[dir] = true; e.preventDefault(); }
  });
  document.addEventListener("keyup", (e) => { const dir = map[e.key]; if (dir) touches[dir] = false; });

  document.querySelectorAll(".dpad-btn").forEach((b) => {
    const dir = b.dataset.dir;
    const on = (e) => { e.preventDefault(); touches[dir] = true; };
    const off = (e) => { e.preventDefault(); touches[dir] = false; };
    b.addEventListener("pointerdown", on);
    b.addEventListener("pointerup", off);
    b.addEventListener("pointerleave", off);
    b.addEventListener("pointercancel", off);
  });
}

let nomRanchTemp = "Mon Ranch";

function nouvellePartie(nom, perso) {
  compteurId = 1;
  etat = {
    nomRanch: nom, perso: perso, pieces: 40, foin: 6, jour: 1, boxes: 4,
    chevaux: [nouveauCheval({ nom: "Éclair", robe: ROBES[0] })],
    decors: [],
  };
  sauvegarder();
  demarrerJeu();
}

function continuerPartie() {
  const s = charger();
  if (!s) { $("msg-accueil").textContent = "Aucune partie sauvegardée. Commence une nouvelle aventure !"; return; }
  etat = s;
  if (!etat.perso) etat.perso = persoParDefaut();
  if (!etat.decors) etat.decors = [];
  etat.chevaux.forEach((c) => { if (c.ti == null) { c.ti = c.gi; c.tj = c.gj; } c.prochainPas = 0; });
  compteurId = s.compteurId || (etat.chevaux.length + 1);
  demarrerJeu();
}

function demarrerJeu() {
  $("ecran-accueil").classList.add("cache");
  $("ecran-creation").classList.add("cache");
  $("ecran-jeu").classList.remove("cache");
  $("aff-nom-haras").textContent = etat.nomRanch;
  joueur.gi = 6; joueur.gj = 7; joueur.monte = null;
  majHud();
  if (!boucleLancee) { boucleLancee = true; redimensionner(); window.addEventListener("resize", redimensionner); requestAnimationFrame(boucle); }
}

/* ===================== HUD / messages ===================== */

function majHud() {
  $("aff-pieces").textContent = etat.pieces;
  $("aff-foin").textContent = etat.foin;
  $("aff-jour").textContent = etat.jour;
  $("aff-boxes").textContent = etat.chevaux.length + "/" + etat.boxes;
  sauvegarder();
}

let timerMessage = null;
function message(t) {
  const el = $("message-jeu");
  el.textContent = t; el.classList.remove("cache");
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  clearTimeout(timerMessage); timerMessage = setTimeout(() => el.classList.add("cache"), 2800);
}

/* ===================== Helpers de dessin ===================== */

function ellipse(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
function rrect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function remplir(c, fill, stroke, lw) {
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke !== null) { c.strokeStyle = stroke || OUT; c.lineWidth = lw || 2; c.stroke(); }
}
function assombrir(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* ----- Sprite personnage (vue de face) ----- */
function dessinerPerso(c, cx, cy, s, p) {
  c.save();
  c.translate(cx, cy); c.scale(s, s);
  c.lineJoin = "round";
  // ombre
  ellipse(c, 0, 2, 16, 5); c.fillStyle = "rgba(0,0,0,0.18)"; c.fill();
  // jambes
  rrect(c, -7, -16, 6, 16, 3); remplir(c, p.pantalon);
  rrect(c, 1, -16, 6, 16, 3); remplir(c, p.pantalon);
  // bottes
  rrect(c, -7, -5, 6, 6, 2); remplir(c, "#5a3a22");
  rrect(c, 1, -5, 6, 6, 2); remplir(c, "#5a3a22");
  // corps
  rrect(c, -11, -34, 22, 21, 8); remplir(c, p.haut);
  // bras
  rrect(c, -15, -33, 5, 16, 2.5); remplir(c, p.haut);
  rrect(c, 10, -33, 5, 16, 2.5); remplir(c, p.haut);
  ellipse(c, -12.5, -17, 3, 3); remplir(c, p.peau);
  ellipse(c, 12.5, -17, 3, 3); remplir(c, p.peau);
  // cheveux (derrière la tête)
  ellipse(c, 0, -45, 13, 11); remplir(c, p.cheveux);
  // tête
  ellipse(c, 0, -44, 11, 11); remplir(c, p.peau);
  // frange
  c.beginPath(); c.arc(0, -45, 11, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(0, -45); c.closePath();
  c.fillStyle = p.cheveux; c.fill();
  // yeux + sourire
  ellipse(c, -4, -44, 1.5, 1.8); c.fillStyle = OUT; c.fill();
  ellipse(c, 4, -44, 1.5, 1.8); c.fillStyle = OUT; c.fill();
  c.beginPath(); c.arc(0, -41, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); c.strokeStyle = OUT; c.lineWidth = 1.4; c.stroke();
  // chapeau
  if (p.chapeauOn) {
    ellipse(c, 0, -52, 18, 5.5); remplir(c, p.chapeau);
    rrect(c, -9, -63, 18, 12, 4); remplir(c, p.chapeau);
    rrect(c, -9, -55, 18, 3, 1.5); remplir(c, assombrir(p.chapeau, 0.7), null);
  }
  c.restore();
}

/* ----- Sprite cheval (vue de profil, vers la droite) ----- */
function dessinerCheval3d(c, cx, cy, s, h, flip) {
  c.save();
  c.translate(cx, cy); c.scale(flip ? -s : s, s);
  c.lineJoin = "round";
  const robe = h.robe, crin = h.crin, jambe = assombrir(robe, 0.78);
  // ombre
  ellipse(c, 0, 2, 26, 7); c.fillStyle = "rgba(0,0,0,0.18)"; c.fill();
  // pattes
  [-16, -8, 8, 16].forEach((x) => { rrect(c, x, -18, 6, 18, 2.5); remplir(c, jambe); });
  // queue
  c.beginPath(); c.moveTo(-24, -34); c.quadraticCurveTo(-34, -26, -28, -10);
  c.quadraticCurveTo(-24, -20, -22, -30); c.closePath(); remplir(c, crin);
  // corps
  ellipse(c, 0, -26, 26, 15); remplir(c, robe);
  // encolure
  c.beginPath(); c.moveTo(12, -36); c.lineTo(24, -54); c.lineTo(33, -50); c.lineTo(22, -28); c.closePath();
  remplir(c, robe);
  // crinière
  c.beginPath(); c.moveTo(13, -37); c.lineTo(25, -55); c.lineTo(29, -53); c.lineTo(17, -34); c.closePath();
  remplir(c, crin);
  // tête
  ellipse(c, 33, -52, 11, 8); remplir(c, robe);
  ellipse(c, 41, -47, 5.5, 5); remplir(c, assombrir(robe, 0.9));
  // oreille
  c.beginPath(); c.moveTo(27, -58); c.lineTo(30, -66); c.lineTo(33, -58); c.closePath(); remplir(c, robe);
  // œil
  ellipse(c, 34, -53, 1.5, 1.8); c.fillStyle = OUT; c.fill();
  c.restore();
}

/* ===================== Écran de création ===================== */

function ouvrirCreation(perso, onValider) {
  persoEnCours = perso;
  $("ecran-accueil").classList.add("cache");
  $("ecran-jeu").classList.add("cache");
  $("ecran-creation").classList.remove("cache");

  const cont = $("creation-controles");
  cont.innerHTML = "";
  const groupe = (titre, palette, champ) => {
    const div = document.createElement("div"); div.className = "groupe-perso";
    div.innerHTML = `<span class="grp-titre">${titre}</span>`;
    const ligne = document.createElement("div"); ligne.className = "ligne-swatch";
    palette.forEach((col) => {
      const b = document.createElement("button");
      b.className = "swatch-col" + (persoEnCours[champ] === col ? " choisi" : "");
      b.style.background = col;
      b.addEventListener("click", () => {
        persoEnCours[champ] = col;
        ligne.querySelectorAll(".swatch-col").forEach((x) => x.classList.remove("choisi"));
        b.classList.add("choisi"); apercuPerso();
      });
      ligne.appendChild(b);
    });
    div.appendChild(ligne); cont.appendChild(div);
  };
  groupe("Peau", PEAUX, "peau");
  groupe("Cheveux", CHEVEUX, "cheveux");
  groupe("Habit", HAUTS, "haut");
  groupe("Pantalon", PANTALONS, "pantalon");
  groupe("Chapeau", CHAPEAUX, "chapeau");
  // bouton chapeau on/off
  const div = document.createElement("div"); div.className = "groupe-perso";
  const b = document.createElement("button");
  b.className = "bouton bouton-secondaire";
  const maj = () => { b.textContent = persoEnCours.chapeauOn ? "🤠 Chapeau : oui" : "🚫 Chapeau : non"; };
  maj();
  b.addEventListener("click", () => { persoEnCours.chapeauOn = !persoEnCours.chapeauOn; maj(); apercuPerso(); });
  div.appendChild(b); cont.appendChild(div);

  apercuPerso();
  const ok = $("btn-creation-ok");
  ok.onclick = () => { onValider(); if (etat) { $("ecran-creation").classList.add("cache"); $("ecran-jeu").classList.remove("cache"); } };
}

function apercuPerso() {
  const cv = $("apercu"); const c = cv.getContext("2d");
  c.clearRect(0, 0, cv.width, cv.height);
  c.fillStyle = "#cfe8a3"; c.fillRect(0, 0, cv.width, cv.height);
  dessinerPerso(c, cv.width / 2, 210, 2.4, persoEnCours);
}

/* ===================== Boucle & rendu du monde ===================== */

let boucleLancee = false;
let CW = 0, CH = 0, dpr = 1;
const touches = { haut: false, bas: false, gauche: false, droite: false };
const joueur = { gi: 6, gj: 7, vitesse: 4.2, monte: null };
let moveTarget = null, pendingInteract = null;
let cibleActive = null, idPanneau = null;

function redimensionner() {
  const cv = $("monde"); const r = cv.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  CW = Math.max(1, Math.floor(r.width)); CH = Math.max(1, Math.floor(r.height));
  cv.width = CW * dpr; cv.height = CH * dpr;
}

function isoMonde(gi, gj) { return { x: (gi - gj) * TW2, y: (gi + gj) * TH2 }; }

function ecranDe(gi, gj) {
  const cam = isoMonde(joueur.gi, joueur.gj);
  const w = isoMonde(gi, gj);
  return { x: CW / 2 + w.x - cam.x, y: CH / 2 + w.y - cam.y - 24 };
}

function ecranVersGrille(sx, sy) {
  const cam = isoMonde(joueur.gi, joueur.gj);
  const wx = sx - CW / 2 + cam.x;
  const wy = sy - CH / 2 + cam.y + 24;
  const a = wx / TW2, b = wy / TH2;
  return { gi: (a + b) / 2, gj: (b - a) / 2 };
}

function boucle() {
  if (!$("ecran-jeu").classList.contains("cache")) { tick(); dessiner(); }
  requestAnimationFrame(boucle);
}

let dernier = performance.now();
function tick() {
  const now = performance.now();
  const dt = Math.min((now - dernier) / 1000, 0.05); dernier = now;

  let vi = 0, vj = 0;
  if (touches.haut) { vi -= 1; vj -= 1; }
  if (touches.bas) { vi += 1; vj += 1; }
  if (touches.gauche) { vi -= 1; vj += 1; }
  if (touches.droite) { vi += 1; vj -= 1; }

  const vit = joueur.monte ? joueur.vitesse * 1.7 : joueur.vitesse;
  if (vi || vj) {
    moveTarget = null; pendingInteract = null;
    const n = Math.hypot(vi, vj);
    joueur.gi += (vi / n) * vit * dt; joueur.gj += (vj / n) * vit * dt;
    joueur.flip = (vi - vj) < 0;
  } else if (moveTarget) {
    const di = moveTarget.gi - joueur.gi, dj = moveTarget.gj - joueur.gj;
    const d = Math.hypot(di, dj);
    if (d < 0.15) {
      moveTarget = null;
      if (pendingInteract) { const r = pendingInteract; pendingInteract = null; interagir(r); }
    } else { joueur.gi += (di / d) * vit * dt; joueur.gj += (dj / d) * vit * dt; joueur.flip = (di - dj) < 0; }
  }
  joueur.gi = clamp(joueur.gi, 0, GRID); joueur.gj = clamp(joueur.gj, 0, GRID);

  // cheval monté suit le joueur
  if (joueur.monte) { joueur.monte.gi = joueur.gi; joueur.monte.gj = joueur.gj; }

  // balade des chevaux
  etat.chevaux.forEach((c) => {
    if (c === joueur.monte) return;
    if (now > c.prochainPas) {
      c.ti = aleatoire(CORRAL.i1 + 1, CORRAL.i2 - 1);
      c.tj = aleatoire(CORRAL.j1 + 1, CORRAL.j2 - 1);
      c.prochainPas = now + aleatoire(2500, 6000);
    }
    const di = c.ti - c.gi, dj = c.tj - c.gj, d = Math.hypot(di, dj);
    if (d > 0.05) { c.gi += (di / d) * 0.7 * dt; c.gj += (dj / d) * 0.7 * dt; c.flip = (di - dj) < 0; }
  });

  majInteraction();
}

function distJoueur(gi, gj) { return Math.hypot(joueur.gi - gi, joueur.gj - gj); }

function majInteraction() {
  let meilleur = null, dmin = Infinity;
  if (!joueur.monte) {
    STATIONS.forEach((s) => { const d = distJoueur(s.i, s.j); if (d < 1.6 && d < dmin) { dmin = d; meilleur = s; } });
    etat.chevaux.forEach((c) => { const d = distJoueur(c.gi, c.gj); if (d < 1.4 && d < dmin) { dmin = d; meilleur = c; } });
  } else {
    meilleur = joueur.monte; // si on est monté, on agit sur le cheval monté
  }

  cibleActive = meilleur;
  const id = meilleur ? (meilleur.robe ? "c" + meilleur.id : "s" + meilleur.type) : null;
  if (id !== idPanneau) { idPanneau = id; construirePanneau(); }
  if (meilleur && meilleur.robe) majBarres(meilleur);

  const station = meilleur && !meilleur.robe;
  $("btn-action").classList.toggle("cache", !station);
  if (station) $("btn-action").textContent = meilleur.emoji + " " + meilleur.label;
}

function dessiner() {
  const cv = $("monde"); const c = cv.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  // ciel / sol de base
  const g = c.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "#ffd9a3"); g.addColorStop(1, "#e8a35a");
  c.fillStyle = g; c.fillRect(0, 0, CW, CH);

  // tuiles du sol
  for (let i = 0; i <= GRID; i++) {
    for (let j = 0; j <= GRID; j++) {
      const p = ecranDe(i, j);
      if (p.x < -TW2 || p.x > CW + TW2 || p.y < -TH2 || p.y > CH + TH2 + 30) continue;
      const dansCorral = i >= CORRAL.i1 && i <= CORRAL.i2 && j >= CORRAL.j1 && j <= CORRAL.j2;
      let col = dansCorral ? ((i + j) % 2 ? "#bfe089" : "#b3d97e") : ((i + j) % 2 ? "#ecc98e" : "#e6c084");
      c.beginPath();
      c.moveTo(p.x, p.y - TH2); c.lineTo(p.x + TW2, p.y); c.lineTo(p.x, p.y + TH2); c.lineTo(p.x - TW2, p.y); c.closePath();
      c.fillStyle = col; c.fill();
      c.strokeStyle = "rgba(0,0,0,0.06)"; c.lineWidth = 1; c.stroke();
    }
  }
  // clôture du corral
  dessinerCloture(c);

  // entités (bâtiments, déco, chevaux, joueur) triées par profondeur
  const ents = [];
  STATIONS.forEach((s) => ents.push({ gi: s.i, gj: s.j, z: s.i + s.j, type: "station", ref: s }));
  etat.decors.forEach((id, k) => { const sl = SLOTS_DECOR[k % SLOTS_DECOR.length]; ents.push({ gi: sl.i, gj: sl.j, z: sl.i + sl.j, type: "decor", ref: id }); });
  etat.chevaux.forEach((ch) => { if (ch !== joueur.monte) ents.push({ gi: ch.gi, gj: ch.gj, z: ch.gi + ch.gj, type: "cheval", ref: ch }); });
  ents.push({ gi: joueur.gi, gj: joueur.gj, z: joueur.gi + joueur.gj + 0.5, type: "joueur" });
  ents.sort((a, b) => a.z - b.z);

  ents.forEach((e) => {
    const p = ecranDe(e.gi, e.gj);
    if (e.type === "station") dessinerStation(c, p, e.ref);
    else if (e.type === "decor") { const d = DECORS.find((x) => x.id === e.ref); if (d) emojiAt(c, d.emoji, p.x, p.y - 6, 30); }
    else if (e.type === "cheval") dessinerEntiteCheval(c, p, e.ref);
    else if (e.type === "joueur") dessinerEntiteJoueur(c, p);
  });

  // surbrillance de la cible
  if (cibleActive) {
    const gi = cibleActive.robe ? cibleActive.gi : cibleActive.i;
    const gj = cibleActive.robe ? cibleActive.gj : cibleActive.j;
    const p = ecranDe(gi, gj);
    c.save(); c.translate(p.x, p.y + 2);
    c.beginPath(); c.ellipse(0, 0, 30, 14, 0, 0, Math.PI * 2);
    c.strokeStyle = "#e8722d"; c.lineWidth = 3; c.setLineDash([5, 5]);
    c.lineDashOffset = -(performance.now() / 60) % 10; c.stroke(); c.restore();
  }
}

function emojiAt(c, emoji, x, y, taille) {
  c.font = taille + "px serif"; c.textAlign = "center"; c.textBaseline = "alphabetic";
  c.fillText(emoji, x, y);
}

function dessinerCloture(c) {
  const pts = [];
  for (let i = CORRAL.i1; i <= CORRAL.i2; i++) { pts.push([i, CORRAL.j1]); pts.push([i, CORRAL.j2]); }
  for (let j = CORRAL.j1; j <= CORRAL.j2; j++) { pts.push([CORRAL.i1, j]); pts.push([CORRAL.i2, j]); }
  pts.forEach(([i, j]) => {
    const p = ecranDe(i, j);
    c.fillStyle = "#8a5a3b"; c.fillRect(p.x - 1.5, p.y - 12, 3, 14);
    c.fillStyle = "#a06a44"; c.fillRect(p.x - 1.5, p.y - 12, 3, 3);
  });
}

function dessinerStation(c, p, s) {
  // bâtiment isométrique simple (cube + toit)
  const w = 34, h = 30;
  c.save(); c.translate(p.x, p.y);
  // faces
  c.beginPath(); c.moveTo(-w, -10); c.lineTo(0, -10 - 18); c.lineTo(0, -10 - 18 + h); c.lineTo(-w, -10 + h); c.closePath();
  c.fillStyle = assombrir(s.couleur, 0.8); c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
  c.beginPath(); c.moveTo(w, -10); c.lineTo(0, -10 - 18); c.lineTo(0, -10 - 18 + h); c.lineTo(w, -10 + h); c.closePath();
  c.fillStyle = s.couleur; c.fill(); c.stroke();
  // toit
  c.beginPath(); c.moveTo(0, -10 - 18 - 16); c.lineTo(w + 4, -8); c.lineTo(0, -10 - 18 + 2); c.lineTo(-w - 4, -8); c.closePath();
  c.fillStyle = "#b5572b"; c.fill(); c.stroke();
  c.restore();
  emojiAt(c, s.emoji, p.x, p.y + 6, 24);
  c.fillStyle = OUT; c.font = "bold 13px sans-serif"; c.textAlign = "center";
  c.fillText(s.label, p.x, p.y + 26);
}

function dessinerEntiteCheval(c, p, ch) {
  dessinerCheval3d(c, p.x, p.y, estPoulain(ch) ? 0.62 : 0.92, ch, ch.flip);
  // accessoire
  const acc = ACCESSOIRES.find((a) => a.id === ch.accessoire);
  if (acc && acc.emoji) emojiAt(c, acc.emoji, p.x + (ch.flip ? -26 : 26) * 0.9, p.y - 48 * 0.9, 18);
  // humeur + nom
  const m = moyenne(ch);
  emojiAt(c, m > 60 ? "😀" : m > 35 ? "😐" : "😢", p.x, p.y - 62, 16);
  c.fillStyle = OUT; c.font = "bold 12px sans-serif"; c.textAlign = "center";
  c.fillText(ch.nom, p.x, p.y + 16);
}

function dessinerEntiteJoueur(c, p) {
  if (joueur.monte) {
    dessinerCheval3d(c, p.x, p.y, 0.95, joueur.monte, joueur.flip);
    dessinerPerso(c, p.x + (joueur.flip ? 6 : -6), p.y - 30, 0.85, etat.perso);
  } else {
    dessinerPerso(c, p.x, p.y, 1.0, etat.perso);
  }
}

/* ===================== Clic / tap ===================== */

function gererClic(ev) {
  if (!$("modale").classList.contains("cache")) return;
  const cv = $("monde"); const r = cv.getBoundingClientRect();
  const sx = ev.clientX - r.left, sy = ev.clientY - r.top;

  // a-t-on cliqué un cheval ou un bâtiment ? (proche à l'écran)
  let cible = null, dmin = Infinity;
  STATIONS.forEach((s) => { const p = ecranDe(s.i, s.j); const d = Math.hypot(p.x - sx, p.y - sy); if (d < 40 && d < dmin) { dmin = d; cible = s; } });
  etat.chevaux.forEach((ch) => { if (ch === joueur.monte) return; const p = ecranDe(ch.gi, ch.gj); const d = Math.hypot(p.x - sx, p.y - sy); if (d < 36 && d < dmin) { dmin = d; cible = ch; } });

  if (cible) {
    const tgi = cible.robe ? cible.gi : cible.i;
    const tgj = cible.robe ? cible.gj : cible.j;
    // se placer à côté de la cible
    const di = joueur.gi - tgi, dj = joueur.gj - tgj, d = Math.hypot(di, dj) || 1;
    const recul = cible.robe ? 1.1 : 1.5;
    moveTarget = { gi: tgi + (di / d) * recul, gj: tgj + (dj / d) * recul };
    pendingInteract = cible.robe ? null : cible;
  } else {
    const g = ecranVersGrille(sx, sy);
    moveTarget = { gi: clamp(g.gi, 0, GRID), gj: clamp(g.gj, 0, GRID) };
    pendingInteract = null;
  }
}

/* ===================== Panneau ===================== */

function construirePanneau() {
  const p = $("panneau");
  if (!cibleActive) { p.innerHTML = `<p class="panneau-aide">Promène-toi 🚶 et approche-toi d'un cheval ou d'un bâtiment pour agir.</p>`; return; }
  if (cibleActive.robe) {
    const c = cibleActive;
    const monte = joueur.monte === c;
    p.innerHTML = `
      <div class="pc-tete">
        <div>
          <b>${c.nom}</b> <span class="pc-sous">${estPoulain(c) ? "🐣 Poulain (" + c.age + " j)" : "Adulte (" + c.age + " j)"}</span>
        </div>
      </div>
      <div class="pc-barres" id="pc-barres"></div>
      <div class="pc-actions">
        <button class="bouton" data-cheval="nourrir">🌾 Nourrir</button>
        <button class="bouton" data-cheval="brosser">🧽 Brosser</button>
        <button class="bouton" data-cheval="jouer">🎾 Jouer</button>
        <button class="bouton bouton-rodeo" data-cheval="monter">${monte ? "🛑 Descendre" : "🏇 Monter"}</button>
        <button class="bouton bouton-secondaire" data-cheval="relooker">🎨 Relooker</button>
      </div>`;
    majBarres(c);
  } else {
    const s = cibleActive;
    const lib = { dormir: "🌙 Dormir (jour suivant)", boutique: "🛒 Entrer dans le magasin" }[s.type];
    p.innerHTML = `<div class="pc-station"><span class="pc-emoji">${s.emoji}</span>
      <button class="bouton bouton-geant" data-station="${s.type}">${lib}</button></div>`;
  }
}

function majBarres(c) {
  const cont = $("pc-barres"); if (!cont) return;
  const def = [["🌾", c.faim], ["⚡", c.energie], ["🧼", c.proprete], ["😊", c.bonheur]];
  cont.innerHTML = def.map(([ic, v]) => {
    const cl = v < 25 ? "r-rouge" : v < 50 ? "r-jaune" : "r-vert";
    return `<div class="besoin"><span class="icone">${ic}</span>
      <div class="barre"><div class="barre-remplissage ${cl}" style="width:${v}%"></div></div></div>`;
  }).join("");
}

/* ===================== Interactions ===================== */

function interagir(cible) {
  if (!cible) return;
  if (cible.robe) return;
  if (cible.type === "dormir") jourSuivant();
  else if (cible.type === "boutique") ouvrirBoutique();
}

function actionCheval(action) {
  const c = cibleActive; if (!c || !c.robe) return;
  switch (action) {
    case "nourrir":
      if (etat.foin <= 0) { message("🌾 Plus de foin ! Va au magasin."); return; }
      etat.foin--; c.faim = borner(c.faim + 35); c.bonheur = borner(c.bonheur + 6);
      gagner(2); message(`${c.nom} a mangé du bon foin ! 🌾`); break;
    case "brosser":
      c.proprete = borner(c.proprete + 40); c.bonheur = borner(c.bonheur + 10); c.energie = borner(c.energie - 5);
      gagner(2); message(`${c.nom} est tout beau et brillant ! ✨`); break;
    case "jouer":
      if (c.energie < 15) { message(`${c.nom} est trop fatigué pour jouer. 😴`); return; }
      c.bonheur = borner(c.bonheur + 22); c.energie = borner(c.energie - 16); c.faim = borner(c.faim - 8);
      gagner(3); message(`${c.nom} s'est bien amusé ! 🎾`); break;
    case "monter":
      if (joueur.monte === c) { joueur.monte = null; message(`Tu descends de ${c.nom}. 🙂`); }
      else if (estPoulain(c)) { message(`${c.nom} est un poulain, trop petit pour être monté. 🐣`); return; }
      else if (c.energie < 20) { message(`${c.nom} est trop fatigué pour te porter. 😴`); return; }
      else { joueur.monte = c; c.bonheur = borner(c.bonheur + 12); c.energie = borner(c.energie - 12); message(`En selle sur ${c.nom} ! 🏇 Promène-toi !`); }
      idPanneau = null; majInteraction(); majHud(); return;
    case "relooker": ouvrirRelooker(c); return;
  }
  majBarres(c); majHud();
}

function gagner(n) { etat.pieces += n; }

/* ===================== Jour suivant ===================== */

function jourSuivant() {
  etat.jour++;
  etat.pieces += 5; // petite rente quotidienne
  const negliges = [];
  etat.chevaux.forEach((c) => {
    c.age++;
    c.faim = borner(c.faim - 25);
    c.energie = borner(c.energie + 40);
    c.proprete = borner(c.proprete - 16);
    let aj = -12;
    if (c.faim < 25 || c.proprete < 25) aj -= 10;
    if (c.faim > 60 && c.proprete > 60) aj += 8;
    c.bonheur = borner(c.bonheur + aj);
    if (c.bonheur < 25 || c.faim < 20) negliges.push(c.nom);
  });
  joueur.monte = null;
  majHud();
  if (negliges.length) message(`🌅 Jour ${etat.jour}. Occupe-toi de ${negliges.join(" et ")} !`);
  else message(`🌅 Jour ${etat.jour} : tout le monde a bien dormi. 🐴 (+5 💰)`);
}

/* ===================== Modale, magasin, relooking ===================== */

function ouvrirModale(t, html) { $("modale-titre").innerHTML = t; $("modale-corps").innerHTML = html; $("modale").classList.remove("cache"); }
function fermerModale() { $("modale").classList.add("cache"); }

function ouvrirBoutique() {
  const placeLibre = etat.chevaux.length < etat.boxes;
  let html = `
    <div class="ligne-boutique">
      <div class="desc"><b>🌾 Botte de foin</b><small>Pour nourrir tes chevaux.</small></div>
      <button class="bouton" data-boutique="foin">${PRIX_FOIN} 💰</button>
    </div>
    <div class="ligne-boutique">
      <div class="desc"><b>🏚️ Agrandir le corral (+1 box)</b><small>${etat.chevaux.length}/${etat.boxes} box occupés.</small></div>
      <button class="bouton" data-boutique="box">${PRIX_BOX} 💰</button>
    </div>
    <h3>🎨 Décorations</h3><div class="grille-decor">`;
  DECORS.forEach((d) => {
    const ok = etat.decors.includes(d.id);
    html += `<button class="carte-decor ${ok ? "possede" : ""}" data-decor="${d.id}" ${ok ? "disabled" : ""}>
      <span class="d-emoji">${d.emoji}</span><span>${d.nom}</span><span class="d-prix">${ok ? "✅" : d.prix + " 💰"}</span></button>`;
  });
  html += `</div><h3>🐴 Adopter un nouveau cheval (${PRIX_CHEVAL} 💰)</h3>`;
  if (!placeLibre) html += `<p>⚠️ Ton corral est plein ! Agrandis-le d'abord.</p>`;
  else html += `<p>Achète un cheval, puis personnalise-le avec le bouton <b>🎨 Relooker</b> une fois dans le corral.</p>
    <button class="bouton bouton-geant" data-boutique="cheval">🛒 Adopter un cheval (${PRIX_CHEVAL} 💰)</button>`;
  ouvrirModale("🛒 Magasin du Far West", html);
}

function acheter(quoi) {
  if (quoi === "foin") {
    if (etat.pieces < PRIX_FOIN) return message("Pas assez de 💰 !");
    etat.pieces -= PRIX_FOIN; etat.foin++; message("🌾 +1 botte de foin !");
  } else if (quoi === "box") {
    if (etat.pieces < PRIX_BOX) return message("Pas assez de 💰 !");
    etat.pieces -= PRIX_BOX; etat.boxes++; message("🏚️ Corral agrandi ! +1 box.");
  } else if (quoi === "cheval") {
    if (etat.chevaux.length >= etat.boxes) return message("Corral plein !");
    if (etat.pieces < PRIX_CHEVAL) return message("Pas assez de 💰 !");
    etat.pieces -= PRIX_CHEVAL;
    const c = nouveauCheval({});
    etat.chevaux.push(c);
    message(`Bienvenue, ${c.nom} ! 🎉 Va le relooker dans le corral.`);
  }
  majHud(); ouvrirBoutique();
}

function acheterDecor(id) {
  if (etat.decors.includes(id)) return;
  const d = DECORS.find((x) => x.id === id); if (!d) return;
  if (etat.pieces < d.prix) return message("Pas assez de 💰 !");
  etat.pieces -= d.prix; etat.decors.push(id);
  etat.chevaux.forEach((c) => (c.bonheur = borner(c.bonheur + 5)));
  message(`${d.emoji} ${d.nom} installé !`); majHud(); ouvrirBoutique();
}

function ouvrirRelooker(c) {
  let html = `<div class="relook-apercu"><canvas id="apercu-cheval" width="200" height="150"></canvas></div>
    <label class="rl-label">Nom :</label>
    <input id="rl-nom" type="text" maxlength="14" value="${c.nom}" />
    <div class="groupe-perso"><span class="grp-titre">Robe</span><div class="ligne-swatch" id="rl-robe"></div></div>
    <div class="groupe-perso"><span class="grp-titre">Crinière</span><div class="ligne-swatch" id="rl-crin"></div></div>
    <div class="groupe-perso"><span class="grp-titre">Accessoire</span><div class="ligne-swatch" id="rl-acc"></div></div>
    <button class="bouton bouton-geant" id="rl-ok">✅ Valider</button>`;
  ouvrirModale("🎨 Relooker " + c.nom, html);

  const dessine = () => {
    const cv = $("apercu-cheval"); const x = cv.getContext("2d");
    x.clearRect(0, 0, cv.width, cv.height); x.fillStyle = "#cfe8a3"; x.fillRect(0, 0, cv.width, cv.height);
    dessinerCheval3d(x, cv.width / 2 - 10, 120, 1.4, c, false);
    const acc = ACCESSOIRES.find((a) => a.id === c.accessoire);
    if (acc && acc.emoji) emojiAt(x, acc.emoji, cv.width / 2 + 26, 50, 22);
  };
  const swatches = (contId, palette, champ) => {
    const cont = $(contId);
    palette.forEach((col) => {
      const b = document.createElement("button");
      b.className = "swatch-col" + (c[champ] === col ? " choisi" : ""); b.style.background = col;
      b.addEventListener("click", () => { c[champ] = col; cont.querySelectorAll(".swatch-col").forEach((x) => x.classList.remove("choisi")); b.classList.add("choisi"); dessine(); });
      cont.appendChild(b);
    });
  };
  swatches("rl-robe", ROBES, "robe");
  swatches("rl-crin", CRINIERES, "crin");
  const accCont = $("rl-acc");
  ACCESSOIRES.forEach((a) => {
    const b = document.createElement("button");
    b.className = "swatch-acc" + (c.accessoire === a.id ? " choisi" : "");
    b.textContent = a.emoji || "∅"; b.title = a.nom;
    b.addEventListener("click", () => { c.accessoire = a.id; accCont.querySelectorAll(".swatch-acc").forEach((x) => x.classList.remove("choisi")); b.classList.add("choisi"); dessine(); });
    accCont.appendChild(b);
  });
  $("rl-ok").addEventListener("click", () => {
    const nom = $("rl-nom").value.trim(); if (nom) c.nom = nom;
    sauvegarder(); fermerModale(); idPanneau = null; message(`${c.nom} est relooké ! 🎨`);
  });
  dessine();
}

/* ===================== Aide ===================== */

function ouvrirAide() {
  ouvrirModale("❓ Comment jouer", `
    <div class="aide-texte">
      <p><b>Bienvenue au ranch ! 🤠</b></p>
      <p><b>🚶 Se déplacer :</b> clique/touche le sol, ou flèches du clavier, ou la manette ▲◀▶▼.</p>
      <p>Clique directement sur un <b>cheval</b> ou un <b>bâtiment</b> pour aller le voir.</p>
      <p><b>🐴 Un cheval :</b> approche-toi puis choisis 🌾 Nourrir, 🧽 Brosser, 🎾 Jouer, 🏇 Monter, ou 🎨 Relooker (robe, crinière, accessoire, nom).</p>
      <p><b>🏇 Monter :</b> une fois en selle, promène-toi à cheval (plus rapide). Re-clique « Descendre » pour mettre pied à terre.</p>
      <p><b>🏪 Magasin :</b> foin, décorations, et adopter de nouveaux chevaux. <b>🏠 Maison :</b> dormir pour passer au jour suivant.</p>
      <p><b>🧍 (en haut) :</b> change ton apparence quand tu veux.</p>
      <p>Garde les 4 besoins au vert, et gagne des 💰 en t'occupant bien de tes chevaux. 💾 Sauvegarde automatique.</p>
    </div>`);
}

/* ===================== Lancement ===================== */

document.addEventListener("DOMContentLoaded", () => {
  init();
  $("monde").addEventListener("pointerdown", gererClic);
});
