/* =========================================================
   🤠 Mon Ranch du Far West — moteur Phaser 3
   Jeu de simulation pour enfants (9-10 ans).
   Phaser pour la fluidité (déplacement, caméra) + emojis pour le visuel.
   100% statique : sauvegarde dans le navigateur.
   ========================================================= */

"use strict";

/* ===================== Données ===================== */

const AVATARS = ["🤠", "🧑‍🌾", "👩‍🌾", "👨‍🌾", "👧", "👦", "🧒", "👩‍🦰", "🧑‍🦱", "👱‍♀️"];
const THEMES = ["#4aa3b8", "#e8722d", "#d94a6a", "#7fae5a", "#7a5bd0", "#f4b942"];

const HORSE_EMOJIS = ["🐴", "🐎", "🦄", "🏇"];
const ROBES = ["#caa14a", "#b5651d", "#6e4a2f", "#3f3a36", "#cfc7bd", "#8a6f57", "#ece4d6", "#7a4a2a"];
const ACCESSOIRES = [
  { id: "aucun", emoji: "" }, { id: "noeud", emoji: "🎀" }, { id: "fleur", emoji: "🌸" },
  { id: "chapeau", emoji: "🤠" }, { id: "etoile", emoji: "⭐" }, { id: "couronne", emoji: "👑" },
];

const DECORS = [
  { id: "cactus", nom: "Cactus", emoji: "🌵", prix: 15 },
  { id: "feu", nom: "Feu de camp", emoji: "🔥", prix: 20 },
  { id: "tonneau", nom: "Tonneau", emoji: "🛢️", prix: 18 },
  { id: "fleur", nom: "Fleurs", emoji: "🌼", prix: 16 },
  { id: "arbre", nom: "Arbre", emoji: "🌳", prix: 28 },
  { id: "lampe", nom: "Lanterne", emoji: "🏮", prix: 24 },
];

const NOMS = ["Éclair", "Tornade", "Caramel", "Étoile", "Tonnerre", "Cannelle", "Bandit", "Mistral", "Pépite", "Comète", "Bravo", "Sable"];

const PRIX_CHEVAL = 45, PRIX_FOIN = 4, PRIX_BOX = 80, AGE_ADULTE = 5;

/* ===================== Monde ===================== */

const WORLD = { w: 1600, h: 1180 };
const CORRAL = { x: 800, y: 150, w: 730, h: 880 };
const STATIONS = [
  { type: "dormir", x: 250, y: 320, emoji: "🏠", label: "Maison" },
  { type: "boutique", x: 250, y: 720, emoji: "🏪", label: "Magasin" },
];
const SLOTS_DECOR = [
  { x: 520, y: 180 }, { x: 600, y: 1000 }, { x: 380, y: 520 }, { x: 150, y: 1000 },
  { x: 540, y: 760 }, { x: 120, y: 140 }, { x: 1540, y: 120 }, { x: 1540, y: 1040 },
];

/* ===================== État ===================== */

let etat = null;
const CLE = "mon-ranch-phaser";

function aleatoire(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choisir(l) { return l[aleatoire(0, l.length - 1)]; }
function borner(v) { return Math.max(0, Math.min(100, Math.round(v))); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function $(id) { return document.getElementById(id); }
function couleurInt(hex) { return parseInt(hex.slice(1), 16); }

/* ===================== Chevaux ===================== */

let compteurId = 1;
function nouveauCheval(o = {}) {
  return {
    id: compteurId++,
    nom: o.nom || choisir(NOMS),
    emoji: o.emoji || choisir(HORSE_EMOJIS),
    robe: o.robe || choisir(ROBES),
    accessoire: o.accessoire || "aucun",
    age: o.age != null ? o.age : aleatoire(5, 9),
    faim: 70, energie: 80, proprete: 75, bonheur: 80,
    x: aleatoire(CORRAL.x + 80, CORRAL.x + CORRAL.w - 80),
    y: aleatoire(CORRAL.y + 80, CORRAL.y + CORRAL.h - 80),
    tx: 0, ty: 0, prochainPas: 0, obj: null,
  };
}
function estPoulain(c) { return c.age < AGE_ADULTE; }
function moyenne(c) { return (c.faim + c.energie + c.proprete + c.bonheur) / 4; }

/* ===================== Sauvegarde ===================== */

function sauvegarder() {
  etat.compteurId = compteurId;
  try { localStorage.setItem(CLE, JSON.stringify(etat, (k, v) => k === "obj" ? undefined : v)); } catch (e) {}
}
function charger() { try { const b = localStorage.getItem(CLE); return b ? JSON.parse(b) : null; } catch (e) { return null; } }

/* ===================== Flux des écrans ===================== */

let persoEnCours = null, nomRanchTemp = "Mon Ranch";

function init() {
  $("btn-commencer").addEventListener("click", () => {
    nomRanchTemp = $("nom-haras").value.trim() || "Mon Ranch";
    ouvrirCreation({ avatar: AVATARS[0], couleur: THEMES[0] }, () => nouvellePartie(nomRanchTemp, persoEnCours));
  });
  $("btn-charger").addEventListener("click", continuerPartie);
  $("nom-haras").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-commencer").click(); });
  if (charger()) $("msg-accueil").textContent = "Une partie existe : clique sur « Continuer ma partie » 🐴";

  $("btn-moi").addEventListener("click", () => ouvrirCreation({ ...etat.perso }, () => {
    etat.perso = persoEnCours; sauvegarder(); if (avatarText) avatarText.setText(etat.perso.avatar); if (joueurAura) joueurAura.fillColor = couleurInt(etat.perso.couleur);
  }));
  $("btn-aide").addEventListener("click", ouvrirAide);

  $("btn-fermer-modale").addEventListener("click", fermerModale);
  $("modale").addEventListener("click", (e) => { if (e.target.id === "modale") fermerModale(); });

  $("btn-action").addEventListener("click", () => interagir(cibleActive));
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    if (btn.dataset.cheval) actionCheval(btn.dataset.cheval);
    else if (btn.dataset.station) interagir({ type: btn.dataset.station });
    else if (btn.dataset.boutique) acheter(btn.dataset.boutique);
    else if (btn.dataset.decor) acheterDecor(btn.dataset.decor);
  });

  document.querySelectorAll(".dpad-btn").forEach((b) => {
    const dir = b.dataset.dir;
    const on = (e) => { e.preventDefault(); touches[dir] = true; };
    const off = (e) => { e.preventDefault(); touches[dir] = false; };
    b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off);
    b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
  });
}

function nouvellePartie(nom, perso) {
  compteurId = 1;
  etat = {
    nomRanch: nom, perso, pieces: 40, foin: 6, jour: 1, boxes: 4,
    chevaux: [nouveauCheval({ nom: "Éclair", emoji: "🐎", robe: ROBES[0] })],
    decors: [],
  };
  sauvegarder(); demarrerJeu();
}

function continuerPartie() {
  const s = charger();
  if (!s) { $("msg-accueil").textContent = "Aucune partie sauvegardée."; return; }
  etat = s;
  if (!etat.perso) etat.perso = { avatar: AVATARS[0], couleur: THEMES[0] };
  if (!etat.decors) etat.decors = [];
  etat.chevaux.forEach((c) => { c.obj = null; c.prochainPas = 0; });
  compteurId = s.compteurId || (etat.chevaux.length + 1);
  demarrerJeu();
}

function demarrerJeu() {
  $("ecran-accueil").classList.add("cache");
  $("ecran-creation").classList.add("cache");
  $("ecran-jeu").classList.remove("cache");
  $("aff-nom-haras").textContent = etat.nomRanch;
  majHud();
  lancerPhaser();
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

/* ===================== Création (DOM) ===================== */

function ouvrirCreation(perso, onValider) {
  persoEnCours = perso;
  $("ecran-accueil").classList.add("cache");
  $("ecran-jeu").classList.add("cache");
  $("ecran-creation").classList.remove("cache");
  $("apercu-perso").textContent = perso.avatar;

  const cont = $("creation-controles");
  cont.innerHTML = `<span class="grp-titre">Personnage</span><div class="ligne-avatars" id="grp-avatar"></div>
    <span class="grp-titre">Couleur préférée</span><div class="ligne-swatch" id="grp-couleur"></div>`;
  const ga = $("grp-avatar");
  AVATARS.forEach((a) => {
    const b = document.createElement("button");
    b.className = "btn-avatar" + (persoEnCours.avatar === a ? " choisi" : "");
    b.textContent = a;
    b.addEventListener("click", () => {
      persoEnCours.avatar = a; ga.querySelectorAll(".btn-avatar").forEach((x) => x.classList.remove("choisi"));
      b.classList.add("choisi"); $("apercu-perso").textContent = a;
    });
    ga.appendChild(b);
  });
  const gc = $("grp-couleur");
  THEMES.forEach((col) => {
    const b = document.createElement("button");
    b.className = "swatch-col" + (persoEnCours.couleur === col ? " choisi" : ""); b.style.background = col;
    b.addEventListener("click", () => { persoEnCours.couleur = col; gc.querySelectorAll(".swatch-col").forEach((x) => x.classList.remove("choisi")); b.classList.add("choisi"); });
    gc.appendChild(b);
  });

  $("btn-creation-ok").onclick = () => {
    onValider();
    if (etat) { $("ecran-creation").classList.add("cache"); $("ecran-jeu").classList.remove("cache"); }
  };
}

/* ===================== Phaser ===================== */

let jeu = null, sc = null;
let joueur = null, avatarText = null, joueurAura = null;
let cursors = null, wasd = null;
const touches = { haut: false, bas: false, gauche: false, droite: false };
let moveTarget = null, pendingInteract = null;
let cibleActive = null, idPanneau = null, monte = null;
let ringSel = null;
let decorObjs = [];

function lancerPhaser() {
  if (jeu) { construireMonde(); return; }
  jeu = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "monde",
    backgroundColor: "#e7c187",
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    scene: { create: sceneCreate, update: sceneUpdate },
  });
}

function txt(x, y, s, taille) {
  return sc.add.text(x, y, s, { fontSize: taille + "px", fontFamily: "sans-serif" }).setOrigin(0.5);
}

function sceneCreate() {
  sc = this;
  this.cameras.main.setBounds(0, 0, WORLD.w, WORLD.h);
  this.cameras.main.setBackgroundColor("#e7c187");
  construireMonde();
  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys({ haut: "Z", bas: "S", gauche: "Q", droite: "D", up: "W", left: "A" });
  this.input.on("pointerdown", (p) => onPointer(p));
}

function construireMonde() {
  sc.children.removeAll();
  decorObjs = [];

  // Sol : fond sable + corral en herbe
  const sol = sc.add.graphics();
  sol.fillStyle(0xe7c187, 1); sol.fillRect(0, 0, WORLD.w, WORLD.h);
  // quelques touffes
  for (let i = 0; i < 60; i++) {
    const t = txt(aleatoire(0, WORLD.w), aleatoire(0, WORLD.h), "🌿", 16);
    t.setAlpha(0.5).setDepth(0);
  }
  // corral
  const herbe = sc.add.graphics();
  herbe.fillStyle(0xbfe089, 1); herbe.fillRoundedRect(CORRAL.x, CORRAL.y, CORRAL.w, CORRAL.h, 30);
  herbe.lineStyle(8, 0x8a5a3b, 1); herbe.strokeRoundedRect(CORRAL.x, CORRAL.y, CORRAL.w, CORRAL.h, 30);
  herbe.setDepth(1);
  txt(CORRAL.x + CORRAL.w / 2, CORRAL.y - 26, "🐎 Le Corral", 26).setDepth(1);

  // Bâtiments
  STATIONS.forEach((s) => {
    const e = txt(s.x, s.y, s.emoji, 90); e.setDepth(s.y);
    const l = sc.add.text(s.x, s.y + 52, s.label, { fontSize: "22px", fontFamily: "sans-serif", color: "#4a2f1d", fontStyle: "bold" }).setOrigin(0.5).setDepth(s.y);
    s.obj = e; s.labelObj = l;
  });

  // Décorations
  placerDecors();

  // Chevaux
  etat.chevaux.forEach(creerObjCheval);

  // Joueur
  joueurAura = sc.add.ellipse(0, 24, 70, 30, couleurInt(etat.perso.couleur), 0.4);
  const ombre = sc.add.ellipse(0, 30, 50, 18, 0x000000, 0.18);
  avatarText = sc.add.text(0, 0, etat.perso.avatar, { fontSize: "54px" }).setOrigin(0.5);
  joueur = sc.add.container(560, 560, [joueurAura, ombre, avatarText]);
  joueur.setSize(50, 50);
  monte = null;

  // anneau de sélection
  ringSel = sc.add.ellipse(0, 0, 90, 50, 0xe8722d, 0);
  ringSel.setStrokeStyle(4, 0xe8722d, 1); ringSel.setVisible(false); ringSel.setDepth(2);

  sc.cameras.main.startFollow(joueur, true, 0.12, 0.12);
}

function creerObjCheval(c) {
  const aura = sc.add.ellipse(0, 16, 66, 28, couleurInt(c.robe), 0.45);
  const ombre = sc.add.ellipse(0, 22, 56, 18, 0x000000, 0.18);
  const corps = sc.add.text(0, 0, c.emoji, { fontSize: (estPoulain(c) ? 40 : 58) + "px" }).setOrigin(0.5);
  const acc = ACCESSOIRES.find((a) => a.id === c.accessoire);
  const accT = sc.add.text(20, -26, acc ? acc.emoji : "", { fontSize: "22px" }).setOrigin(0.5);
  const mood = sc.add.text(0, -38, "😀", { fontSize: "20px" }).setOrigin(0.5);
  const nom = sc.add.text(0, 34, c.nom, { fontSize: "16px", fontFamily: "sans-serif", color: "#3a2716", fontStyle: "bold" }).setOrigin(0.5);
  const cont = sc.add.container(c.x, c.y, [aura, ombre, corps, accT, mood, nom]);
  c.obj = cont; c.aura = aura; c.corpsT = corps; c.accT = accT; c.moodT = mood; c.nomT = nom;
}

function majVisuelCheval(c) {
  if (!c.obj) return;
  c.corpsT.setText(c.emoji).setFontSize((estPoulain(c) ? 40 : 58));
  c.aura.fillColor = couleurInt(c.robe);
  const acc = ACCESSOIRES.find((a) => a.id === c.accessoire);
  c.accT.setText(acc ? acc.emoji : "");
  c.nomT.setText(c.nom);
}

function placerDecors() {
  decorObjs.forEach((o) => o.destroy()); decorObjs = [];
  etat.decors.forEach((id, k) => {
    const sl = SLOTS_DECOR[k % SLOTS_DECOR.length];
    const d = DECORS.find((x) => x.id === id);
    if (d) { const o = txt(sl.x, sl.y, d.emoji, 42); o.setDepth(sl.y); decorObjs.push(o); }
  });
}

/* ===================== Boucle ===================== */

function sceneUpdate(time, delta) {
  if (!joueur) return;
  const dt = Math.min(delta / 1000, 0.05);
  const modaleOuverte = !$("modale").classList.contains("cache");

  let vx = 0, vy = 0;
  if (!modaleOuverte) {
    if (cursors.left.isDown || wasd.gauche.isDown || wasd.left.isDown || touches.gauche) vx -= 1;
    if (cursors.right.isDown || wasd.droite.isDown || touches.droite) vx += 1;
    if (cursors.up.isDown || wasd.haut.isDown || wasd.up.isDown || touches.haut) vy -= 1;
    if (cursors.down.isDown || wasd.bas.isDown || touches.bas) vy += 1;
  }

  const vit = (monte ? 360 : 230);
  if (vx || vy) {
    moveTarget = null; pendingInteract = null;
    const n = Math.hypot(vx, vy);
    joueur.x += (vx / n) * vit * dt; joueur.y += (vy / n) * vit * dt;
    avatarText.setScale((vx < 0) ? -1 : 1, 1);
  } else if (moveTarget && !modaleOuverte) {
    const dx = moveTarget.x - joueur.x, dy = moveTarget.y - joueur.y, d = Math.hypot(dx, dy);
    if (d < 8) { moveTarget = null; if (pendingInteract) { const r = pendingInteract; pendingInteract = null; interagir(r); } }
    else { joueur.x += (dx / d) * vit * dt; joueur.y += (dy / d) * vit * dt; avatarText.setScale(dx < 0 ? -1 : 1, 1); }
  }
  joueur.x = clamp(joueur.x, 40, WORLD.w - 40);
  joueur.y = clamp(joueur.y, 40, WORLD.h - 40);
  joueur.setDepth(joueur.y + 1000);

  // cheval monté suit le joueur
  if (monte) { monte.obj.x = joueur.x; monte.obj.y = joueur.y + 6; monte.obj.setDepth(joueur.y + 999); monte.x = joueur.x; monte.y = joueur.y; }

  // balade des chevaux + humeur
  const now = time;
  etat.chevaux.forEach((c) => {
    if (c !== monte) {
      if (now > c.prochainPas) {
        c.tx = aleatoire(CORRAL.x + 70, CORRAL.x + CORRAL.w - 70);
        c.ty = aleatoire(CORRAL.y + 70, CORRAL.y + CORRAL.h - 70);
        c.prochainPas = now + aleatoire(2500, 6000);
      }
      const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
      if (d > 3) { c.x += (dx / d) * 40 * dt; c.y += (dy / d) * 40 * dt; c.corpsT.setScale(dx < 0 ? -1 : 1, 1); }
      c.obj.x = c.x; c.obj.y = c.y; c.obj.setDepth(c.y);
    }
    const m = moyenne(c);
    c.moodT.setText(m > 60 ? "😀" : m > 35 ? "😐" : "😢");
  });

  majInteraction();
}

function distJoueur(x, y) { return Math.hypot(joueur.x - x, joueur.y - y); }

function majInteraction() {
  let meilleur = null, dmin = Infinity;
  if (monte) meilleur = monte;
  else {
    STATIONS.forEach((s) => { const d = distJoueur(s.x, s.y); if (d < 110 && d < dmin) { dmin = d; meilleur = s; } });
    etat.chevaux.forEach((c) => { const d = distJoueur(c.x, c.y); if (d < 95 && d < dmin) { dmin = d; meilleur = c; } });
  }
  cibleActive = meilleur;
  const id = meilleur ? (meilleur.emoji && meilleur.robe ? "c" + meilleur.id : "s" + meilleur.type) : null;
  if (id !== idPanneau) { idPanneau = id; construirePanneau(); }
  if (meilleur && meilleur.robe) majBarres(meilleur);

  if (meilleur && ringSel) {
    const x = meilleur.robe ? meilleur.x : meilleur.x, y = meilleur.robe ? meilleur.y : meilleur.y;
    ringSel.setPosition(x, y + 10).setVisible(true).setDepth(y - 1);
  } else if (ringSel) ringSel.setVisible(false);

  const station = meilleur && !meilleur.robe;
  $("btn-action").classList.toggle("cache", !station);
  if (station) $("btn-action").textContent = meilleur.emoji + " " + meilleur.label;
}

/* ===================== Clic ===================== */

function onPointer(p) {
  if (!$("modale").classList.contains("cache")) return;
  const wx = p.worldX, wy = p.worldY;
  let cible = null, dmin = Infinity;
  STATIONS.forEach((s) => { const d = Math.hypot(s.x - wx, s.y - wy); if (d < 70 && d < dmin) { dmin = d; cible = s; } });
  etat.chevaux.forEach((c) => { if (c === monte) return; const d = Math.hypot(c.x - wx, c.y - wy); if (d < 55 && d < dmin) { dmin = d; cible = c; } });
  if (cible) {
    const tx = cible.x, ty = cible.y;
    const dx = joueur.x - tx, dy = joueur.y - ty, d = Math.hypot(dx, dy) || 1;
    const recul = cible.robe ? 60 : 90;
    moveTarget = { x: tx + (dx / d) * recul, y: ty + (dy / d) * recul };
    pendingInteract = cible.robe ? null : cible;
  } else { moveTarget = { x: clamp(wx, 40, WORLD.w - 40), y: clamp(wy, 40, WORLD.h - 40) }; pendingInteract = null; }
}

/* ===================== Panneau ===================== */

function construirePanneau() {
  const p = $("panneau");
  if (!cibleActive) { p.innerHTML = `<p class="panneau-aide">Promène-toi 🚶 et approche-toi d'un cheval ou d'un bâtiment pour agir.</p>`; return; }
  if (cibleActive.robe) {
    const c = cibleActive, estMonte = monte === c;
    p.innerHTML = `
      <div class="pc-tete"><div><b>${c.nom}</b> <span class="pc-sous">${estPoulain(c) ? "🐣 Poulain (" + c.age + " j)" : "Adulte (" + c.age + " j)"}</span></div></div>
      <div class="pc-barres" id="pc-barres"></div>
      <div class="pc-actions">
        <button class="bouton" data-cheval="nourrir">🌾 Nourrir</button>
        <button class="bouton" data-cheval="brosser">🧽 Brosser</button>
        <button class="bouton" data-cheval="jouer">🎾 Jouer</button>
        <button class="bouton bouton-rodeo" data-cheval="monter">${estMonte ? "🛑 Descendre" : "🏇 Monter"}</button>
        <button class="bouton bouton-secondaire" data-cheval="relooker">🎨 Relooker</button>
      </div>`;
    majBarres(c);
  } else {
    const s = cibleActive;
    const lib = { dormir: "🌙 Dormir (jour suivant)", boutique: "🛒 Entrer dans le magasin" }[s.type];
    p.innerHTML = `<div class="pc-station"><span class="pc-emoji">${s.emoji}</span><button class="bouton bouton-geant" data-station="${s.type}">${lib}</button></div>`;
  }
}

function majBarres(c) {
  const cont = $("pc-barres"); if (!cont) return;
  const def = [["🌾", c.faim], ["⚡", c.energie], ["🧼", c.proprete], ["😊", c.bonheur]];
  cont.innerHTML = def.map(([ic, v]) => {
    const cl = v < 25 ? "r-rouge" : v < 50 ? "r-jaune" : "r-vert";
    return `<div class="besoin"><span class="icone">${ic}</span><div class="barre"><div class="barre-remplissage ${cl}" style="width:${v}%"></div></div></div>`;
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
      etat.foin--; c.faim = borner(c.faim + 35); c.bonheur = borner(c.bonheur + 6); etat.pieces += 2;
      bond(c); message(`${c.nom} a mangé du bon foin ! 🌾`); break;
    case "brosser":
      c.proprete = borner(c.proprete + 40); c.bonheur = borner(c.bonheur + 10); c.energie = borner(c.energie - 5); etat.pieces += 2;
      bond(c); message(`${c.nom} est tout beau et brillant ! ✨`); break;
    case "jouer":
      if (c.energie < 15) { message(`${c.nom} est trop fatigué pour jouer. 😴`); return; }
      c.bonheur = borner(c.bonheur + 22); c.energie = borner(c.energie - 16); c.faim = borner(c.faim - 8); etat.pieces += 3;
      bond(c); message(`${c.nom} s'est bien amusé ! 🎾`); break;
    case "monter":
      if (monte === c) { monte = null; message(`Tu descends de ${c.nom}. 🙂`); }
      else if (estPoulain(c)) { message(`${c.nom} est un poulain, trop petit pour être monté. 🐣`); return; }
      else if (c.energie < 20) { message(`${c.nom} est trop fatigué pour te porter. 😴`); return; }
      else { monte = c; c.bonheur = borner(c.bonheur + 12); c.energie = borner(c.energie - 12); message(`En selle sur ${c.nom} ! 🏇`); }
      idPanneau = null; majInteraction(); majHud(); return;
    case "relooker": ouvrirRelooker(c); return;
  }
  majBarres(c); majHud();
}

function bond(c) {
  if (c.obj && sc) sc.tweens.add({ targets: c.obj, y: c.y - 14, duration: 130, yoyo: true, ease: "Quad.easeOut" });
}

function jourSuivant() {
  etat.jour++; etat.pieces += 5;
  const negliges = [];
  etat.chevaux.forEach((c) => {
    c.age++;
    c.faim = borner(c.faim - 25); c.energie = borner(c.energie + 40); c.proprete = borner(c.proprete - 16);
    let aj = -12;
    if (c.faim < 25 || c.proprete < 25) aj -= 10;
    if (c.faim > 60 && c.proprete > 60) aj += 8;
    c.bonheur = borner(c.bonheur + aj);
    if (c.obj) majVisuelCheval(c);
    if (c.bonheur < 25 || c.faim < 20) negliges.push(c.nom);
  });
  monte = null; majHud();
  if (negliges.length) message(`🌅 Jour ${etat.jour}. Occupe-toi de ${negliges.join(" et ")} !`);
  else message(`🌅 Jour ${etat.jour} : tout le monde a bien dormi. 🐴 (+5 💰)`);
}

/* ===================== Modale / magasin / relooking ===================== */

function ouvrirModale(t, html) { $("modale-titre").innerHTML = t; $("modale-corps").innerHTML = html; $("modale").classList.remove("cache"); }
function fermerModale() { $("modale").classList.add("cache"); }

function ouvrirBoutique() {
  const placeLibre = etat.chevaux.length < etat.boxes;
  let html = `
    <div class="ligne-boutique"><div class="desc"><b>🌾 Botte de foin</b><small>Pour nourrir tes chevaux.</small></div>
      <button class="bouton" data-boutique="foin">${PRIX_FOIN} 💰</button></div>
    <div class="ligne-boutique"><div class="desc"><b>🏚️ Agrandir le corral (+1 box)</b><small>${etat.chevaux.length}/${etat.boxes} box occupés.</small></div>
      <button class="bouton" data-boutique="box">${PRIX_BOX} 💰</button></div>
    <h3>🎨 Décorations</h3><div class="grille-decor">`;
  DECORS.forEach((d) => {
    const ok = etat.decors.includes(d.id);
    html += `<button class="carte-decor ${ok ? "possede" : ""}" data-decor="${d.id}" ${ok ? "disabled" : ""}>
      <span class="d-emoji">${d.emoji}</span><span>${d.nom}</span><span class="d-prix">${ok ? "✅" : d.prix + " 💰"}</span></button>`;
  });
  html += `</div><h3>🐴 Adopter un cheval</h3>`;
  if (!placeLibre) html += `<p>⚠️ Ton corral est plein ! Agrandis-le d'abord.</p>`;
  else html += `<p>Adopte un cheval puis personnalise-le avec <b>🎨 Relooker</b> dans le corral.</p>
    <button class="bouton bouton-geant" data-boutique="cheval">🛒 Adopter un cheval (${PRIX_CHEVAL} 💰)</button>`;
  ouvrirModale("🛒 Magasin du Far West", html);
}

function acheter(quoi) {
  if (quoi === "foin") { if (etat.pieces < PRIX_FOIN) return message("Pas assez de 💰 !"); etat.pieces -= PRIX_FOIN; etat.foin++; message("🌾 +1 botte de foin !"); }
  else if (quoi === "box") { if (etat.pieces < PRIX_BOX) return message("Pas assez de 💰 !"); etat.pieces -= PRIX_BOX; etat.boxes++; message("🏚️ Corral agrandi !"); }
  else if (quoi === "cheval") {
    if (etat.chevaux.length >= etat.boxes) return message("Corral plein !");
    if (etat.pieces < PRIX_CHEVAL) return message("Pas assez de 💰 !");
    etat.pieces -= PRIX_CHEVAL;
    const c = nouveauCheval({}); etat.chevaux.push(c); if (sc) creerObjCheval(c);
    message(`Bienvenue, ${c.nom} ! 🎉 Relooke-le dans le corral.`);
  }
  majHud(); ouvrirBoutique();
}

function acheterDecor(id) {
  if (etat.decors.includes(id)) return;
  const d = DECORS.find((x) => x.id === id); if (!d) return;
  if (etat.pieces < d.prix) return message("Pas assez de 💰 !");
  etat.pieces -= d.prix; etat.decors.push(id);
  etat.chevaux.forEach((c) => (c.bonheur = borner(c.bonheur + 5)));
  if (sc) placerDecors();
  message(`${d.emoji} ${d.nom} installé !`); majHud(); ouvrirBoutique();
}

function ouvrirRelooker(c) {
  ouvrirModale("🎨 Relooker " + c.nom, `
    <div class="relook-apercu" id="rl-apercu" style="font-size:64px">${c.emoji}</div>
    <label class="rl-label">Nom :</label><input id="rl-nom" type="text" maxlength="14" value="${c.nom}" />
    <div class="groupe-perso"><span class="grp-titre">Cheval</span><div class="ligne-avatars" id="rl-emoji"></div></div>
    <div class="groupe-perso"><span class="grp-titre">Robe (couleur)</span><div class="ligne-swatch" id="rl-robe"></div></div>
    <div class="groupe-perso"><span class="grp-titre">Accessoire</span><div class="ligne-avatars" id="rl-acc"></div></div>
    <button class="bouton bouton-geant" id="rl-ok">✅ Valider</button>`);

  const apercu = () => { $("rl-apercu").textContent = c.emoji; $("rl-apercu").style.background = c.robe + "44"; };
  HORSE_EMOJIS.forEach((em) => {
    const b = document.createElement("button");
    b.className = "btn-avatar" + (c.emoji === em ? " choisi" : ""); b.textContent = em;
    b.addEventListener("click", () => { c.emoji = em; $("rl-emoji").querySelectorAll(".btn-avatar").forEach((x) => x.classList.remove("choisi")); b.classList.add("choisi"); apercu(); });
    $("rl-emoji").appendChild(b);
  });
  ROBES.forEach((col) => {
    const b = document.createElement("button");
    b.className = "swatch-col" + (c.robe === col ? " choisi" : ""); b.style.background = col;
    b.addEventListener("click", () => { c.robe = col; $("rl-robe").querySelectorAll(".swatch-col").forEach((x) => x.classList.remove("choisi")); b.classList.add("choisi"); apercu(); });
    $("rl-robe").appendChild(b);
  });
  ACCESSOIRES.forEach((a) => {
    const b = document.createElement("button");
    b.className = "btn-avatar" + (c.accessoire === a.id ? " choisi" : ""); b.textContent = a.emoji || "∅";
    b.addEventListener("click", () => { c.accessoire = a.id; $("rl-acc").querySelectorAll(".btn-avatar").forEach((x) => x.classList.remove("choisi")); b.classList.add("choisi"); });
    $("rl-acc").appendChild(b);
  });
  $("rl-ok").addEventListener("click", () => {
    const nom = $("rl-nom").value.trim(); if (nom) c.nom = nom;
    majVisuelCheval(c); sauvegarder(); fermerModale(); idPanneau = null; message(`${c.nom} est relooké ! 🎨`);
  });
  apercu();
}

function ouvrirAide() {
  ouvrirModale("❓ Comment jouer", `
    <div class="aide-texte">
      <p><b>Bienvenue au ranch ! 🤠</b></p>
      <p><b>🚶 Se déplacer :</b> clique/touche le sol, flèches du clavier (ou Z Q S D), ou la manette ▲◀▶▼.
      Tu peux cliquer directement sur un cheval ou un bâtiment.</p>
      <p><b>🐴 Un cheval :</b> approche-toi puis 🌾 Nourrir, 🧽 Brosser, 🎾 Jouer, 🏇 Monter, ou 🎨 Relooker
      (cheval, robe, accessoire, nom). Garde ses besoins au vert !</p>
      <p><b>🏇 Monter :</b> en selle, promène-toi à cheval (plus rapide). Re-clique « Descendre » pour t'arrêter.</p>
      <p><b>🏪 Magasin :</b> foin, décos, adopter des chevaux. <b>🏠 Maison :</b> dormir pour le jour suivant.
      <b>🧍 (en haut) :</b> change ton personnage.</p>
      <p>💰 Tu gagnes des sous en t'occupant de tes chevaux. 💾 Sauvegarde automatique.</p>
    </div>`);
}

/* ===================== Lancement ===================== */

document.addEventListener("DOMContentLoaded", init);
