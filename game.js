/* =========================================================
   🐴 Mon Ranch — moteur Phaser 3 + vrais sprites
   Personnages enfants (PIPOYA), chevaux (LPC), ferme (Sprout Lands).
   Jeu pour enfants : élever, soigner, monter et personnaliser des chevaux.
   100% statique. Voir CREDITS.md pour les licences des assets.
   ========================================================= */

"use strict";

/* ===================== Données ===================== */

// Personnages disponibles (fichiers dans assets/char/, sprites 32x32, 3x4).
const PERSOS = [
  { id: "fille_01", type: "fille" }, { id: "fille_02", type: "fille" },
  { id: "fille_04", type: "fille" }, { id: "fille_06", type: "fille" },
  { id: "garcon_01", type: "garcon" }, { id: "garcon_03", type: "garcon" },
  { id: "garcon_05", type: "garcon" }, { id: "garcon_07", type: "garcon" },
];

// Robes de cheval = textures (assets/horse/*.png).
const ROBES = [
  { id: "brun", nom: "Brun", tex: "brun" },
  { id: "blanc", nom: "Blanc", tex: "blanc" },
  { id: "licorne", nom: "Licorne 🦄", tex: "licorne" },
];

const NOMS = ["Éclair", "Tornade", "Caramel", "Étoile", "Tonnerre", "Cannelle", "Bandit", "Mistral", "Pépite", "Comète", "Bravo", "Sable"];

const PRIX_CHEVAL = 45, PRIX_FOIN = 4, PRIX_BOX = 80, AGE_ADULTE = 5;

// Ordre des lignes (directions) selon le type de planche.
const ROWS = {
  perso: { down: [0, 1, 2], left: [3, 4, 5], right: [6, 7, 8], up: [9, 10, 11] },
  horse: { up: [0, 1, 2], left: [3, 4, 5], down: [6, 7, 8], right: [9, 10, 11] },
  foal: { up: [0, 1, 2], right: [3, 4, 5], down: [6, 7, 8], left: [9, 10, 11] },
};

/* ===================== Monde ===================== */

const WORLD = { w: 1280, h: 960 };
const CORRAL = { x: 560, y: 130, w: 660, h: 720 };
const STATIONS = [
  { type: "dormir", x: 200, y: 250, tex: "maison", label: "🏠 Maison", sc: 2.2, r: 110 },
  { type: "boutique", x: 200, y: 620, tex: "poulailler", label: "🏪 Magasin", sc: 2.6, r: 110 },
];

/* ===================== État ===================== */

let etat = null;
const CLE = "mon-ranch-lpc";

function aleatoire(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choisir(l) { return l[aleatoire(0, l.length - 1)]; }
function borner(v) { return Math.max(0, Math.min(100, Math.round(v))); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function $(id) { return document.getElementById(id); }

let compteurId = 1;
function nouveauCheval(o = {}) {
  return {
    id: compteurId++,
    nom: o.nom || choisir(NOMS),
    robe: o.robe || choisir(ROBES).id,
    age: o.age != null ? o.age : aleatoire(5, 9),
    faim: 70, energie: 80, proprete: 75, bonheur: 80,
    x: aleatoire(CORRAL.x + 90, CORRAL.x + CORRAL.w - 90),
    y: aleatoire(CORRAL.y + 90, CORRAL.y + CORRAL.h - 90),
    tx: 0, ty: 0, prochainPas: 0, dir: "down", spr: null, ombre: null, nomT: null, moodT: null,
  };
}
function estPoulain(c) { return c.age < AGE_ADULTE; }
function moyenne(c) { return (c.faim + c.energie + c.proprete + c.bonheur) / 4; }

function sauvegarder() {
  etat.compteurId = compteurId;
  try {
    localStorage.setItem(CLE, JSON.stringify(etat, (k, v) =>
      ["spr", "ombre", "nomT", "moodT"].includes(k) ? undefined : v));
  } catch (e) {}
}
function charger() { try { const b = localStorage.getItem(CLE); return b ? JSON.parse(b) : null; } catch (e) { return null; } }

/* ===================== Flux des écrans ===================== */

let persoChoisi = "fille_01", nomRanchTemp = "Mon Ranch";

function init() {
  $("btn-commencer").addEventListener("click", () => {
    nomRanchTemp = $("nom-haras").value.trim() || "Mon Ranch";
    ouvrirCreation((id) => nouvellePartie(nomRanchTemp, id));
  });
  $("btn-charger").addEventListener("click", continuerPartie);
  $("nom-haras").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-commencer").click(); });
  if (charger()) $("msg-accueil").textContent = "Une partie existe : clique sur « Continuer ma partie » 🐴";

  $("btn-moi").addEventListener("click", () => ouvrirCreation((id) => {
    etat.perso = id; sauvegarder();
    if (joueur && sc) { joueur.setTexture(id); joueur.play(id + "-down"); joueur.anims.stop(); }
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
  });
  document.querySelectorAll(".dpad-btn").forEach((b) => {
    const dir = b.dataset.dir;
    const on = (e) => { e.preventDefault(); touches[dir] = true; };
    const off = (e) => { e.preventDefault(); touches[dir] = false; };
    b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off);
    b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
  });
}

function ouvrirCreation(onValider) {
  $("ecran-accueil").classList.add("cache");
  $("ecran-jeu").classList.add("cache");
  $("ecran-creation").classList.remove("cache");
  const grid = $("char-grid"); grid.innerHTML = "";
  persoChoisi = (etat && etat.perso) || PERSOS[0].id;
  PERSOS.forEach((p) => {
    const b = document.createElement("button");
    b.className = "char-choice" + (p.id === persoChoisi ? " choisi" : "");
    b.style.backgroundImage = `url('assets/char/${p.id}.png?v=lpc1')`;
    b.title = p.type;
    b.addEventListener("click", () => {
      persoChoisi = p.id;
      grid.querySelectorAll(".char-choice").forEach((x) => x.classList.remove("choisi"));
      b.classList.add("choisi");
    });
    grid.appendChild(b);
  });
  $("btn-creation-ok").onclick = () => {
    onValider(persoChoisi);
    if (etat) { $("ecran-creation").classList.add("cache"); $("ecran-jeu").classList.remove("cache"); }
  };
}

function nouvellePartie(nom, perso) {
  compteurId = 1;
  etat = {
    nomRanch: nom, perso: perso, pieces: 40, foin: 6, jour: 1, boxes: 4,
    chevaux: [nouveauCheval({ nom: "Éclair", robe: "brun" })],
  };
  sauvegarder(); demarrerJeu();
}
function continuerPartie() {
  const s = charger();
  if (!s) { $("msg-accueil").textContent = "Aucune partie sauvegardée."; return; }
  etat = s;
  if (!etat.perso) etat.perso = PERSOS[0].id;
  etat.chevaux.forEach((c) => { c.spr = null; c.prochainPas = 0; if (!c.dir) c.dir = "down"; });
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

/* ===================== Phaser ===================== */

let jeu = null, sc = null, joueur = null, joueurOmbre = null;
let cursors = null, wasd = null;
const touches = { haut: false, bas: false, gauche: false, droite: false };
let moveTarget = null, pendingInteract = null;
let cibleActive = null, idPanneau = null, monte = null;
let ringSel = null;

function lancerPhaser() {
  if (jeu) { construireMonde(); return; }
  jeu = new Phaser.Game({
    type: Phaser.AUTO, parent: "monde", backgroundColor: "#8fc45a",
    pixelArt: true,
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    scene: { preload: scenePreload, create: sceneCreate, update: sceneUpdate },
  });
}

function scenePreload() {
  const V = "?v=lpc1";
  PERSOS.forEach((p) => this.load.spritesheet(p.id, `assets/char/${p.id}.png${V}`, { frameWidth: 32, frameHeight: 32 }));
  ["brun", "blanc", "licorne"].forEach((h) => this.load.spritesheet(h, `assets/horse/${h}.png${V}`, { frameWidth: 64, frameHeight: 64 }));
  this.load.spritesheet("poulain", `assets/horse/poulain.png${V}`, { frameWidth: 48, frameHeight: 64 });
  this.load.spritesheet("poule", `assets/world/poule.png${V}`, { frameWidth: 32, frameHeight: 32 });
  this.load.image("maison", `assets/world/maison.png${V}`);
  this.load.image("poulailler", `assets/world/poulailler.png${V}`);
  this.load.image("plantes", `assets/world/plantes.png${V}`);
}

function creerAnims(tex, rows) {
  ["down", "left", "right", "up"].forEach((dir) => {
    const key = tex + "-" + dir;
    if (sc.anims.exists(key)) return;
    sc.anims.create({ key, frames: sc.anims.generateFrameNumbers(tex, { frames: rows[dir] }), frameRate: 7, repeat: -1 });
  });
}
function frameRepos(rows, dir) { const a = rows[dir]; return a[Math.floor(a.length / 2)]; }

function sceneCreate() {
  sc = this;
  this.cameras.main.setBounds(0, 0, WORLD.w, WORLD.h);
  PERSOS.forEach((p) => creerAnims(p.id, ROWS.perso));
  ["brun", "blanc", "licorne"].forEach((h) => creerAnims(h, ROWS.horse));
  creerAnims("poulain", ROWS.foal);
  creerAnims("poule", ROWS.perso);
  construireMonde();
  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys({ haut: "Z", bas: "S", gauche: "Q", droite: "D", up: "W", left: "A" });
  this.input.on("pointerdown", (p) => onPointer(p));
}

let groupeDecor = [];
function construireMonde() {
  if (sc.children) sc.children.removeAll();
  groupeDecor = [];

  // Sol vert + parterres de fleurs
  const g = sc.add.graphics();
  g.fillStyle(0x8fc45a, 1); g.fillRect(0, 0, WORLD.w, WORLD.h);
  // motifs d'herbe légers
  for (let i = 0; i < 80; i++) {
    g.fillStyle(0x84b94f, 1);
    g.fillRect(aleatoire(0, WORLD.w), aleatoire(0, WORLD.h), aleatoire(4, 10), 3);
  }
  // Corral : terre claire + bordure
  g.fillStyle(0xcdb185, 1);
  g.fillRoundedRect(CORRAL.x, CORRAL.y, CORRAL.w, CORRAL.h, 26);
  g.lineStyle(7, 0x8a5a3b, 1);
  g.strokeRoundedRect(CORRAL.x, CORRAL.y, CORRAL.w, CORRAL.h, 26);
  g.setDepth(0);
  const titre = sc.add.text(CORRAL.x + CORRAL.w / 2, CORRAL.y - 22, "🐴 Le Corral",
    { fontSize: "26px", fontFamily: "sans-serif", color: "#5a3a1f", fontStyle: "bold" }).setOrigin(0.5).setDepth(1);
  groupeDecor.push(titre);

  // quelques parterres de fleurs
  [[380, 160], [380, 880], [120, 470], [1230, 120], [1240, 880]].forEach(([x, y]) => {
    const p = sc.add.image(x, y, "plantes").setScale(2).setDepth(y);
    groupeDecor.push(p);
  });

  // Bâtiments
  STATIONS.forEach((s) => {
    s.spr = sc.add.image(s.x, s.y, s.tex).setScale(s.sc).setDepth(s.y);
    s.lab = sc.add.text(s.x, s.y + 46, s.label, { fontSize: "20px", fontFamily: "sans-serif", color: "#3a2716", fontStyle: "bold" }).setOrigin(0.5).setDepth(s.y);
  });

  // Poules décoratives
  poules = [];
  for (let i = 0; i < 3; i++) {
    const px = aleatoire(CORRAL.x + 60, CORRAL.x + CORRAL.w - 60);
    const py = aleatoire(CORRAL.y + 60, CORRAL.y + CORRAL.h - 60);
    const pl = sc.add.sprite(px, py, "poule").setScale(1.4);
    pl.play("poule-down"); pl.gx = px; pl.gy = py; pl.t = 0;
    poules.push(pl);
  }

  // Chevaux
  etat.chevaux.forEach(creerSpriteCheval);

  // Joueur
  joueurOmbre = sc.add.ellipse(0, 0, 34, 14, 0x000000, 0.25);
  joueur = sc.add.sprite(640, 500, etat.perso).setScale(1.7);
  joueur.play(etat.perso + "-down"); joueur.anims.stop(); joueur.dir = "down";
  monte = null;

  ringSel = sc.add.ellipse(0, 0, 80, 40, 0xf4b942, 0);
  ringSel.setStrokeStyle(4, 0xf4b942, 1); ringSel.setVisible(false);

  sc.cameras.main.startFollow(joueur, true, 0.12, 0.12);
}

let poules = [];

function texCheval(c) { return estPoulain(c) ? "poulain" : c.robe; }
function creerSpriteCheval(c) {
  const tex = texCheval(c);
  c.ombre = sc.add.ellipse(c.x, c.y + 18, 50, 18, 0x000000, 0.22);
  c.spr = sc.add.sprite(c.x, c.y, tex).setScale(estPoulain(c) ? 0.9 : 1.05);
  c.spr.play(tex + "-down"); c.spr.anims.stop();
  c.nomT = sc.add.text(c.x, c.y + 26, c.nom, { fontSize: "15px", fontFamily: "sans-serif", color: "#2a1c0f", fontStyle: "bold" }).setOrigin(0.5);
  c.moodT = sc.add.text(c.x + 20, c.y - 34, "😀", { fontSize: "18px" }).setOrigin(0.5);
}
function majSpriteCheval(c) {
  const tex = texCheval(c);
  if (c.spr.texture.key !== tex) { c.spr.setTexture(tex); c.spr.setScale(estPoulain(c) ? 0.9 : 1.05); }
  c.nomT.setText(c.nom);
}

/* ===================== Direction & animation ===================== */

function dirDe(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "up" : "down";
}
function animer(spr, tex, dir, bouge, rows) {
  if (bouge) { const k = tex + "-" + dir; if (spr.anims.currentAnim?.key !== k || !spr.anims.isPlaying) spr.play(k); }
  else { spr.anims.stop(); spr.setFrame(frameRepos(rows, dir)); }
}

/* ===================== Boucle ===================== */

let dernier = 0;
function sceneUpdate(time) {
  if (!joueur) return;
  const dt = Math.min((time - dernier) / 1000, 0.05); dernier = time;
  const modale = !$("modale").classList.contains("cache");

  let vx = 0, vy = 0;
  if (!modale) {
    if (cursors.left.isDown || wasd.gauche.isDown || wasd.left.isDown || touches.gauche) vx -= 1;
    if (cursors.right.isDown || wasd.droite.isDown || touches.droite) vx += 1;
    if (cursors.up.isDown || wasd.haut.isDown || wasd.up.isDown || touches.haut) vy -= 1;
    if (cursors.down.isDown || wasd.bas.isDown || touches.bas) vy += 1;
  }
  const vit = monte ? 250 : 170;
  let bouge = false;
  if (vx || vy) {
    moveTarget = null; pendingInteract = null;
    const n = Math.hypot(vx, vy);
    joueur.x += (vx / n) * vit * dt; joueur.y += (vy / n) * vit * dt;
    joueur.dir = dirDe(vx, vy); bouge = true;
  } else if (moveTarget && !modale) {
    const dx = moveTarget.x - joueur.x, dy = moveTarget.y - joueur.y, d = Math.hypot(dx, dy);
    if (d < 6) { moveTarget = null; if (pendingInteract) { const r = pendingInteract; pendingInteract = null; interagir(r); } }
    else { joueur.x += (dx / d) * vit * dt; joueur.y += (dy / d) * vit * dt; joueur.dir = dirDe(dx, dy); bouge = true; }
  }
  joueur.x = clamp(joueur.x, 30, WORLD.w - 30); joueur.y = clamp(joueur.y, 30, WORLD.h - 30);
  animer(joueur, etat.perso, joueur.dir, bouge, ROWS.perso);
  joueur.setDepth(joueur.y);
  joueurOmbre.setPosition(joueur.x, joueur.y + 22).setDepth(joueur.y - 1);

  // cheval monté suit
  if (monte && monte.spr) {
    monte.x = joueur.x; monte.y = joueur.y + 4;
    monte.spr.setPosition(joueur.x, joueur.y - 6).setDepth(joueur.y - 1);
    monte.ombre.setPosition(joueur.x, joueur.y + 22).setDepth(joueur.y - 2);
    monte.nomT.setPosition(-999, -999); monte.moodT.setPosition(-999, -999);
    animer(monte.spr, texCheval(monte), joueur.dir, bouge, estPoulain(monte) ? ROWS.foal : ROWS.horse);
    joueur.setDepth(joueur.y + 1);
  }

  // chevaux : balade + humeur
  etat.chevaux.forEach((c) => {
    if (!c.spr) return;
    if (c === monte) { const m = moyenne(c); return; }
    let bv = false;
    if (time > c.prochainPas) {
      c.tx = aleatoire(CORRAL.x + 70, CORRAL.x + CORRAL.w - 70);
      c.ty = aleatoire(CORRAL.y + 70, CORRAL.y + CORRAL.h - 70);
      c.prochainPas = time + aleatoire(2500, 6000);
    }
    const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
    if (d > 4) { c.x += (dx / d) * 32 * dt; c.y += (dy / d) * 32 * dt; c.dir = dirDe(dx, dy); bv = true; }
    animer(c.spr, texCheval(c), c.dir, bv, estPoulain(c) ? ROWS.foal : ROWS.horse);
    c.spr.setPosition(c.x, c.y).setDepth(c.y);
    c.ombre.setPosition(c.x, c.y + 18).setDepth(c.y - 1);
    c.nomT.setPosition(c.x, c.y + 26).setDepth(c.y);
    const m = moyenne(c);
    c.moodT.setText(m > 60 ? "😀" : m > 35 ? "😐" : "😢").setPosition(c.x + 20, c.y - 34).setDepth(c.y);
  });

  // poules
  poules.forEach((pl) => {
    if (time > pl.t) { pl.gx = aleatoire(CORRAL.x + 50, CORRAL.x + CORRAL.w - 50); pl.gy = aleatoire(CORRAL.y + 50, CORRAL.y + CORRAL.h - 50); pl.t = time + aleatoire(2000, 5000); }
    const dx = pl.gx - pl.x, dy = pl.gy - pl.y, d = Math.hypot(dx, dy);
    if (d > 3) { pl.x += (dx / d) * 22 * dt; pl.y += (dy / d) * 22 * dt; }
    pl.setDepth(pl.y);
  });

  majInteraction();
}

function distJoueur(x, y) { return Math.hypot(joueur.x - x, joueur.y - y); }
function majInteraction() {
  let meilleur = null, dmin = Infinity;
  if (monte) meilleur = monte;
  else {
    STATIONS.forEach((s) => { const d = distJoueur(s.x, s.y); if (d < s.r && d < dmin) { dmin = d; meilleur = s; } });
    etat.chevaux.forEach((c) => { if (!c.spr) return; const d = distJoueur(c.x, c.y); if (d < 80 && d < dmin) { dmin = d; meilleur = c; } });
  }
  cibleActive = meilleur;
  const id = meilleur ? (meilleur.robe ? "c" + meilleur.id : "s" + meilleur.type) : null;
  if (id !== idPanneau) { idPanneau = id; construirePanneau(); }
  if (meilleur && meilleur.robe) majBarres(meilleur);

  if (meilleur && ringSel) {
    const x = meilleur.robe ? meilleur.x : meilleur.x, y = meilleur.robe ? meilleur.y : meilleur.y;
    ringSel.setPosition(x, y + 14).setVisible(true).setDepth(y - 2);
  } else if (ringSel) ringSel.setVisible(false);

  const station = meilleur && !meilleur.robe;
  $("btn-action").classList.toggle("cache", !station);
  if (station) $("btn-action").textContent = meilleur.label;
}

function onPointer(p) {
  if (!$("modale").classList.contains("cache")) return;
  const wx = p.worldX, wy = p.worldY;
  let cible = null, dmin = Infinity;
  STATIONS.forEach((s) => { const d = Math.hypot(s.x - wx, s.y - wy); if (d < 80 && d < dmin) { dmin = d; cible = s; } });
  etat.chevaux.forEach((c) => { if (c === monte) return; const d = Math.hypot(c.x - wx, c.y - wy); if (d < 55 && d < dmin) { dmin = d; cible = c; } });
  if (cible) {
    const tx = cible.x, ty = cible.y;
    const dx = joueur.x - tx, dy = joueur.y - ty, d = Math.hypot(dx, dy) || 1;
    const recul = cible.robe ? 56 : 96;
    moveTarget = { x: tx + (dx / d) * recul, y: ty + (dy / d) * recul };
    pendingInteract = cible.robe ? null : cible;
  } else { moveTarget = { x: clamp(wx, 30, WORLD.w - 30), y: clamp(wy, 30, WORLD.h - 30) }; pendingInteract = null; }
}

/* ===================== Panneau ===================== */

function construirePanneau() {
  const p = $("panneau");
  if (!cibleActive) { p.innerHTML = `<p class="panneau-aide">Promène-toi 🚶 et approche-toi d'un cheval ou d'un bâtiment.</p>`; return; }
  if (cibleActive.robe) {
    const c = cibleActive, m = monte === c;
    p.innerHTML = `
      <div class="pc-tete"><div><b>${c.nom}</b> <span class="pc-sous">${estPoulain(c) ? "🐣 Poulain (" + c.age + " j)" : "Adulte (" + c.age + " j)"}</span></div></div>
      <div class="pc-barres" id="pc-barres"></div>
      <div class="pc-actions">
        <button class="bouton" data-cheval="nourrir">🌾 Nourrir</button>
        <button class="bouton" data-cheval="brosser">🧽 Brosser</button>
        <button class="bouton" data-cheval="jouer">🎾 Jouer</button>
        <button class="bouton bouton-rodeo" data-cheval="monter">${m ? "🛑 Descendre" : "🏇 Monter"}</button>
        <button class="bouton bouton-secondaire" data-cheval="relooker">🎨 Relooker</button>
      </div>`;
    majBarres(c);
  } else {
    const s = cibleActive;
    const lib = { dormir: "🌙 Dormir (jour suivant)", boutique: "🛒 Entrer dans le magasin" }[s.type];
    p.innerHTML = `<div class="pc-station"><button class="bouton bouton-geant" data-station="${s.type}">${lib}</button></div>`;
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
      message(`${c.nom} a mangé du bon foin ! 🌾`); break;
    case "brosser":
      c.proprete = borner(c.proprete + 40); c.bonheur = borner(c.bonheur + 10); c.energie = borner(c.energie - 5); etat.pieces += 2;
      message(`${c.nom} est tout beau ! ✨`); break;
    case "jouer":
      if (c.energie < 15) { message(`${c.nom} est trop fatigué. 😴`); return; }
      c.bonheur = borner(c.bonheur + 22); c.energie = borner(c.energie - 16); c.faim = borner(c.faim - 8); etat.pieces += 3;
      message(`${c.nom} s'est bien amusé ! 🎾`); break;
    case "monter":
      if (monte === c) { monte = null; message(`Tu descends de ${c.nom}. 🙂`); }
      else if (estPoulain(c)) { message(`${c.nom} est un poulain, trop petit pour être monté. 🐣`); return; }
      else if (c.energie < 20) { message(`${c.nom} est trop fatigué pour te porter. 😴`); return; }
      else { monte = c; c.bonheur = borner(c.bonheur + 12); c.energie = borner(c.energie - 12); c.nomT.setVisible(false); c.moodT.setVisible(false); message(`En selle sur ${c.nom} ! 🏇`); }
      if (monte === null && c.nomT) { c.nomT.setVisible(true); c.moodT.setVisible(true); }
      idPanneau = null; majInteraction(); majHud(); return;
    case "relooker": ouvrirRelooker(c); return;
  }
  majBarres(c); majHud();
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
    if (c.spr) majSpriteCheval(c);
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
    <div class="ligne-boutique"><div class="desc"><b>🏚️ Agrandir le corral (+1 box)</b><small>${etat.chevaux.length}/${etat.boxes} box.</small></div>
      <button class="bouton" data-boutique="box">${PRIX_BOX} 💰</button></div>
    <h3>🐴 Adopter un cheval</h3>`;
  if (!placeLibre) html += `<p>⚠️ Ton corral est plein ! Agrandis-le d'abord.</p>`;
  else html += `<p>Un nouveau cheval rejoint ton ranch (tu pourras le relooker).</p>
    <button class="bouton bouton-geant" data-boutique="cheval">🛒 Adopter (${PRIX_CHEVAL} 💰)</button>`;
  ouvrirModale("🛒 Magasin", html);
}
function acheter(quoi) {
  if (quoi === "foin") { if (etat.pieces < PRIX_FOIN) return message("Pas assez de 💰 !"); etat.pieces -= PRIX_FOIN; etat.foin++; message("🌾 +1 botte de foin !"); }
  else if (quoi === "box") { if (etat.pieces < PRIX_BOX) return message("Pas assez de 💰 !"); etat.pieces -= PRIX_BOX; etat.boxes++; message("🏚️ Corral agrandi !"); }
  else if (quoi === "cheval") {
    if (etat.chevaux.length >= etat.boxes) return message("Corral plein !");
    if (etat.pieces < PRIX_CHEVAL) return message("Pas assez de 💰 !");
    etat.pieces -= PRIX_CHEVAL;
    const c = nouveauCheval({}); etat.chevaux.push(c); if (sc) creerSpriteCheval(c);
    message(`Bienvenue, ${c.nom} ! 🎉`);
  }
  majHud(); ouvrirBoutique();
}

function ouvrirRelooker(c) {
  ouvrirModale("🎨 Relooker " + c.nom, `
    <label class="rl-label">Nom :</label><input id="rl-nom" type="text" maxlength="14" value="${c.nom}" />
    <div class="groupe-perso"><span class="grp-titre">Robe</span><div class="ligne-robes" id="rl-robe"></div></div>
    <button class="bouton bouton-geant" id="rl-ok">✅ Valider</button>`);
  const cont = $("rl-robe");
  ROBES.forEach((r) => {
    const b = document.createElement("button");
    b.className = "btn-robe" + (c.robe === r.id ? " choisi" : "");
    b.textContent = r.nom;
    b.addEventListener("click", () => { c.robe = r.id; cont.querySelectorAll(".btn-robe").forEach((x) => x.classList.remove("choisi")); b.classList.add("choisi"); if (!estPoulain(c) && c.spr) majSpriteCheval(c); });
    cont.appendChild(b);
  });
  $("rl-ok").addEventListener("click", () => {
    const nom = $("rl-nom").value.trim(); if (nom) c.nom = nom;
    if (c.spr) majSpriteCheval(c);
    sauvegarder(); fermerModale(); idPanneau = null; message(`${c.nom} est relooké ! 🎨`);
  });
}

function ouvrirAide() {
  ouvrirModale("❓ Comment jouer", `
    <div class="aide-texte">
      <p><b>Bienvenue dans ton ranch ! 🐴</b></p>
      <p><b>🚶 Se déplacer :</b> clique/touche le sol, flèches du clavier (ou Z Q S D), ou la manette ▲◀▶▼. Tu peux cliquer directement sur un cheval ou un bâtiment.</p>
      <p><b>🐴 Un cheval :</b> approche-toi puis 🌾 Nourrir, 🧽 Brosser, 🎾 Jouer, 🏇 Monter (promène-toi à cheval !) ou 🎨 Relooker (robe + nom). Garde ses besoins au vert ; sa frimousse 😀/😐/😢 montre son humeur.</p>
      <p><b>🏪 Magasin :</b> foin, agrandir le corral, adopter des chevaux. <b>🏠 Maison :</b> dormir pour passer au jour suivant. <b>🧒 (en haut) :</b> changer de personnage.</p>
      <p>💰 Tu gagnes des pièces en t'occupant de tes chevaux. 💾 Sauvegarde automatique.</p>
    </div>`);
}

document.addEventListener("DOMContentLoaded", init);
