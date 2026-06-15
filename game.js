/* =========================================================
   🐴 Mon Centre Équestre — moteur Phaser 3
   Jeu de simulation pour enfants (9-10 ans).
   Visuel en pixel-art (style LPC) : sol, clôtures, bâtiments,
   personnages et chevaux animés. 100% statique (sauvegarde navigateur).
   ========================================================= */

"use strict";

// Version des assets : à incrémenter quand on change une IMAGE (force le rechargement).
const ASSET_VER = "ph14";
function av(p) { return p + "?v=" + ASSET_VER; }

/* ===================== Données ===================== */

// Personnages joueurs : enfants (sprites LPC composés). thumb = vignette menus.
const PERSOS = [
  { id: "fille", nom: "Cavalière", key: "kid_fille", thumb: "avatar_fille" },
  { id: "garcon", nom: "Cavalier", key: "kid_garcon", thumb: "avatar_garcon" },
];
const THEMES = ["#4aa3b8", "#e8722d", "#d94a6a", "#7fae5a", "#7a5bd0", "#f4b942"];

// Robes des chevaux = variantes de pelage (sprites LPC). col = pastille pour les menus.
const COATS = [
  { id: "brown", nom: "Bai", col: "#8a5a2b" },
  { id: "black", nom: "Noir", col: "#332e2a" },
  { id: "gray", nom: "Gris", col: "#9a9893" },
  { id: "golden", nom: "Palomino", col: "#caa14a" },
  { id: "white", nom: "Blanc", col: "#e7e2d8" },
];

const DECORS = [
  { id: "arbre", nom: "Sapin", sprite: "pine", prix: 28 },
  { id: "buisson", nom: "Buisson", sprite: "bush", prix: 16 },
  { id: "abreuvoir", nom: "Abreuvoir", sprite: "trough", prix: 20 },
];

const NOMS = ["Éclair", "Tornade", "Caramel", "Étoile", "Tonnerre", "Cannelle", "Bandit", "Mistral", "Pépite", "Comète", "Bravo", "Sable"];

const PRIX_CHEVAL = 45, PRIX_FOIN = 4, PRIX_BOX = 80, AGE_ADULTE = 5;

/* ===================== Monde ===================== */

const WORLD = { w: 2000, h: 1320 };
const CORRAL = { x: 800, y: 250, w: 820, h: 820 };
const STATIONS = [
  { type: "dormir", x: 250, y: 380, sprite: "cabane_ardoise", label: "Maison" },
  { type: "boutique", x: 250, y: 860, sprite: "cabane_chaume", label: "Magasin" },
];
const SLOTS_DECOR = [
  { x: 560, y: 200 }, { x: 560, y: 1180 }, { x: 470, y: 600 }, { x: 120, y: 1180 },
  { x: 1820, y: 220 }, { x: 1820, y: 1120 }, { x: 1700, y: 660 }, { x: 120, y: 200 },
];

/* ===================== État ===================== */

let etat = null;
const CLE = "mon-ranch-phaser";

function aleatoire(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choisir(l) { return l[aleatoire(0, l.length - 1)]; }
function borner(v) { return Math.max(0, Math.min(100, Math.round(v))); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function $(id) { return document.getElementById(id); }
// Couleur de la barre d'état iOS (Safari) = couleur du haut de l'écran courant (continuité).
function themeColor(c) { const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", c); }
const TEINTE_ACCUEIL = "#ffce8f", TEINTE_JEU = "#b5572b";
function couleurInt(hex) { return parseInt(hex.slice(1), 16); }

// Robe -> identifiant de pelage valide (avec migration des anciennes sauvegardes en hex).
function robeCoat(c) {
  if (c && COATS.some((x) => x.id === c.robe)) return c.robe;
  return COATS[0].id;
}
function persoDef(id) { return PERSOS.find((p) => p.id === id) || PERSOS[0]; }

/* ===================== Chevaux ===================== */

let compteurId = 1;
function nomUtilise(nom, sauf) {
  const list = (etat && etat.chevaux) || [];
  return list.some((c) => c !== sauf && (c.nom || "").toLowerCase() === nom.toLowerCase());
}
function nomLibre() {
  const dispo = NOMS.filter((n) => !nomUtilise(n, null));
  if (dispo.length) return choisir(dispo);
  let base = choisir(NOMS), i = 2;
  while (nomUtilise(base + " " + i, null)) i++;
  return base + " " + i;
}
function nouveauCheval(o = {}) {
  return {
    id: compteurId++,
    nom: o.nom || nomLibre(),
    robe: o.robe || choisir(COATS).id,
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

let persoEnCours = null, nomRanchTemp = "Mon Centre";

function init() {
  $("btn-commencer").addEventListener("click", () => {
    nomRanchTemp = $("nom-haras").value.trim() || "Mon Centre";
    ouvrirCreation({ avatar: PERSOS[0].id, couleur: THEMES[0] }, () => nouvellePartie(nomRanchTemp, persoEnCours));
  });
  $("btn-charger").addEventListener("click", continuerPartie);
  $("nom-haras").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-commencer").click(); });
  if (charger()) $("msg-accueil").textContent = "Une partie existe : clique sur « Continuer ma partie » 🐴";

  $("btn-moi").addEventListener("click", () => ouvrirCreation({ ...etat.perso }, () => {
    etat.perso = persoEnCours; sauvegarder();
    if (joueurSprite) { joueurSprite.setTexture(persoDef(etat.perso.avatar).key); joueurFacing = "down"; joueurSprite.setFrame(18); }
    if (joueurNom) joueurNom.setText(etat.perso.nom || "");
  }));
  $("btn-aide").addEventListener("click", ouvrirAide);

  $("btn-fermer-modale").addEventListener("click", fermerModale);
  $("modale").addEventListener("click", (e) => { if (e.target.id === "modale") fermerModale(); });

  $("btn-action").addEventListener("click", () => { if (placementDecor) poserDecor(); else interagir(cibleActive); });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    if (btn.dataset.cheval) actionCheval(btn.dataset.cheval);
    else if (btn.dataset.station) interagir({ type: btn.dataset.station });
    else if (btn.dataset.boutique) acheter(btn.dataset.boutique);
    else if (btn.dataset.decor) acheterDecor(btn.dataset.decor);
    else if (btn.dataset.annulerPlace) annulerPlacement();
  });
}

function nouvellePartie(nom, perso) {
  compteurId = 1;
  etat = {
    nomRanch: nom, perso, pieces: 40, foin: 6, jour: 1, boxes: 4,
    chevaux: [nouveauCheval({ nom: "Éclair", robe: COATS[0].id })],
    decors: [], vitesse: 1, actionsDepuisDodo: 0,
  };
  sauvegarder(); demarrerJeu();
}

function continuerPartie() {
  const s = charger();
  if (!s) { $("msg-accueil").textContent = "Aucune partie sauvegardée."; return; }
  etat = s;
  if (!etat.perso) etat.perso = { avatar: PERSOS[0].id, couleur: THEMES[0] };
  if (!persoDef(etat.perso.avatar) || !PERSOS.some((p) => p.id === etat.perso.avatar)) etat.perso.avatar = PERSOS[0].id;
  if (!etat.decors) etat.decors = [];
  // Migration : ancien format = liste d'identifiants (placés sur des emplacements fixes)
  etat.decors = etat.decors.map((d, k) => {
    if (typeof d === "string") { const sl = SLOTS_DECOR[k % SLOTS_DECOR.length]; return { id: d, x: sl.x, y: sl.y }; }
    return d;
  }).filter((d) => DECORS.some((x) => x.id === d.id));
  if (typeof etat.vitesse !== "number") etat.vitesse = 1;
  if (typeof etat.actionsDepuisDodo !== "number") etat.actionsDepuisDodo = 0;
  etat.chevaux.forEach((c) => { c.obj = null; c.prochainPas = 0; c.robe = robeCoat(c); });
  compteurId = s.compteurId || (etat.chevaux.length + 1);
  demarrerJeu();
}

function demarrerJeu() {
  $("ecran-accueil").classList.add("cache");
  $("ecran-creation").classList.add("cache");
  $("ecran-jeu").classList.remove("cache");
  themeColor(TEINTE_JEU);
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
  themeColor(TEINTE_ACCUEIL);
  const apercuPerso = () => { $("apercu-perso").innerHTML = `<img class="vignette-grande" src="${av("assets/sprite/" + persoDef(persoEnCours.avatar).thumb + ".png")}" alt="" />`; };
  apercuPerso();

  const cont = $("creation-controles");
  cont.innerHTML = `<span class="grp-titre">Ton prénom</span>
    <input id="creation-nom" type="text" maxlength="14" placeholder="Ton prénom" value="${(persoEnCours.nom || "").replace(/"/g, "&quot;")}" />
    <span class="grp-titre">Fille ou garçon&nbsp;?</span><div class="ligne-avatars" id="grp-avatar"></div>`;
  const ga = $("grp-avatar");
  PERSOS.forEach((p) => {
    const b = document.createElement("button");
    b.className = "btn-avatar btn-vignette" + (persoEnCours.avatar === p.id ? " choisi" : "");
    b.innerHTML = `<img src="${av("assets/sprite/" + p.thumb + ".png")}" alt="${p.nom}" />`;
    b.title = p.nom;
    b.addEventListener("click", () => {
      persoEnCours.avatar = p.id; ga.querySelectorAll(".btn-avatar").forEach((x) => x.classList.remove("choisi"));
      b.classList.add("choisi"); apercuPerso();
    });
    ga.appendChild(b);
  });

  $("btn-creation-ok").onclick = () => {
    const n = $("creation-nom").value.trim();
    persoEnCours.nom = n || persoEnCours.nom || persoDef(persoEnCours.avatar).nom;
    onValider();
    if (etat) { $("ecran-creation").classList.add("cache"); $("ecran-jeu").classList.remove("cache"); themeColor(TEINTE_JEU); }
  };
}

/* ===================== Phaser ===================== */

let jeu = null, sc = null;
let joueur = null, joueurSprite = null, joueurOmbre = null, joueurNom = null, joueurFacing = "down";
let cursors = null, wasd = null;
let moveTarget = null, pendingInteract = null;
let placementDecor = null, ghostDecor = null; // déco en cours de placement (fantôme qui suit le joueur)
let nuitEnCours = false, nuitVoile = null;   // transition nuit (dormir)
let enCourse = false, dernierTapT = 0;       // double-tap rapide => le perso court
let cibleActive = null, idPanneau = null, monte = null;
let ringSel = null;
let decorObjs = [];
let COLLISIONS = [];

function lancerPhaser() {
  if (jeu) { construireMonde(); return; }
  const monde = $("monde");
  jeu = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "monde",
    backgroundColor: "#6fae4f",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.NONE,
      width: monde.clientWidth || window.innerWidth,
      height: monde.clientHeight || window.innerHeight,
    },
    scene: { preload: scenePreload, create: sceneCreate, update: sceneUpdate },
  });
  // Le canvas doit suivre EXACTEMENT la taille de son conteneur (le panneau du bas
  // change de hauteur → sinon des bandes de fond apparaissent en haut/bas).
  const ajuster = () => { if (jeu && jeu.scale) jeu.scale.resize(monde.clientWidth, monde.clientHeight); };
  if (window.ResizeObserver) new ResizeObserver(ajuster).observe(monde);
  window.addEventListener("resize", ajuster);
  window.addEventListener("orientationchange", () => setTimeout(ajuster, 200));
}

function txt(x, y, s, taille) {
  return sc.add.text(x, y, s, { fontSize: taille + "px", fontFamily: "sans-serif" }).setOrigin(0.5);
}

/* ===================== Assets graphiques (pixel-art LPC, libres) =====================
   Style « Liberated Pixel Cup ». Sol, clôtures, bâtiments, arbres, personnages et
   chevaux animés. Auteurs et licences (CC-BY / CC-BY-SA) : voir assets/CREDITS.md. */

function scenePreload() {
  this.load.image("sol_herbe", av("assets/sprite/tile_grass.png"));
  this.load.image("sol_terre", av("assets/sprite/tile_dirt.png"));
  ["pine", "bush", "trough", "cabane_ardoise", "cabane_chaume"]
    .forEach((k) => this.load.image(k, av(`assets/sprite/${k}.png`)));
  this.load.spritesheet("fence", av("assets/lpc/fence_medieval.png"), { frameWidth: 32, frameHeight: 32 });
  PERSOS.forEach((p) => this.load.spritesheet(p.key, av(`assets/lpc/${p.key}.png`), { frameWidth: 64, frameHeight: 64 }));
  COATS.forEach((c) => this.load.spritesheet("horse-" + c.id, av(`assets/lpc/horse-${c.id}_0.png`), { frameWidth: 128, frameHeight: 128 }));
}

// Animations : marche du joueur (4 directions) et marche latérale des chevaux.
const DIRS = { up: 0, left: 1, down: 2, right: 3 }; // lignes du walkcycle LPC (9 frames/ligne)
function creerAnims() {
  PERSOS.forEach((p) => {
    Object.entries(DIRS).forEach(([dir, row]) => {
      const key = `${p.key}-${dir}`;
      if (!sc.anims.exists(key)) sc.anims.create({
        key, frames: sc.anims.generateFrameNumbers(p.key, { start: row * 9 + 1, end: row * 9 + 8 }),
        frameRate: 10, repeat: -1,
      });
    });
  });
  COATS.forEach((c) => {
    const key = "horse-" + c.id + "-walk";
    if (!sc.anims.exists(key)) sc.anims.create({
      key, frames: sc.anims.generateFrameNumbers("horse-" + c.id, { start: 20, end: 23 }),
      frameRate: 6, repeat: -1,
    });
  });
}

// Petit cœur (humeur), dessiné une fois puis teinté selon le moral.
function creerCoeur() {
  if (sc.textures.exists("coeur")) return;
  const g = sc.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillCircle(6, 7, 6); g.fillCircle(16, 7, 6);
  g.fillTriangle(0, 9, 22, 9, 11, 23);
  g.generateTexture("coeur", 22, 24); g.destroy();
}

// Clôture en ganivelle autour de l'enclos (avec un portail sur le côté écuries).
function placerCloture() {
  const s = 32, x0 = CORRAL.x, y0 = CORRAL.y, x1 = CORRAL.x + CORRAL.w, y1 = CORRAL.y + CORRAL.h;
  const gateA = y0 + CORRAL.h * 0.42, gateB = y0 + CORRAL.h * 0.58;
  const add = (x, y, frame, flipY) => {
    const o = sc.add.image(x, y, "fence", frame).setOrigin(0.5, 0.7).setDepth(y);
    if (flipY) o.setFlipY(true);
  };
  for (let x = x0 + s; x < x1; x += s) { add(x, y0, 1, false); add(x, y1, 1, false); }
  for (let y = y0 + s; y < y1; y += s) {
    if (!(y > gateA && y < gateB)) add(x0, y, 17, false);
    add(x1, y, 17, false);
  }
  add(x0, y0, 32, false); add(x1, y0, 34, false);
  add(x0, y1, 32, true); add(x1, y1, 34, true);

  // Murs de collision de la clôture (le portail gauche reste ouvert)
  const t = 14;
  COLLISIONS.push(
    { x: x0, y: y0 - t / 2, w: CORRAL.w, h: t },          // haut
    { x: x0, y: y1 - t / 2, w: CORRAL.w, h: t },          // bas
    { x: x1 - t / 2, y: y0, w: t, h: CORRAL.h },          // droite
    { x: x0 - t / 2, y: y0, w: t, h: gateA - y0 },        // gauche (au-dessus du portail)
    { x: x0 - t / 2, y: gateB, w: t, h: y1 - gateB },     // gauche (sous le portail)
  );
}

// Empêche le joueur de traverser les obstacles (clôture, arbres, bâtiments) — AABB par axe.
function bloquerObstacles() {
  // À cheval, l'empreinte est plus grande (le cheval respecte les mêmes obstacles).
  const hw = monte ? 30 : 15, hh = monte ? 18 : 10, px = joueur.x, py = joueur.y;
  COLLISIONS.forEach((m) => {
    if (px + hw > m.x && px - hw < m.x + m.w && py + hh > m.y && py - hh < m.y + m.h) {
      const penX = Math.min(px + hw - m.x, m.x + m.w - (px - hw));
      const penY = Math.min(py + hh - m.y, m.y + m.h - (py - hh));
      if (penX < penY) joueur.x += (joueur.x < m.x + m.w / 2 ? -penX : penX);
      else joueur.y += (joueur.y < m.y + m.h / 2 ? -penY : penY);
    }
  });
}

function dansCorral(x, y) {
  return x > CORRAL.x - 40 && x < CORRAL.x + CORRAL.w + 40 &&
         y > CORRAL.y - 40 && y < CORRAL.y + CORRAL.h + 40;
}

// Arbres et buissons fixes — placés HORS de l'anneau praticable autour de l'enclos.
// [x, y, sprite, échelle]
const SCENERY = [
  // côté gauche
  [110, 320, "pine", 1.7], [180, 1130, "pine", 1.8], [90, 700, "bush", 1.4],
  [120, 1190, "bush", 1.3], [520, 130, "pine", 1.6], [620, 1240, "bush", 1.3],
  // côté droit (au-delà de l'anneau, x > 1740)
  [1850, 330, "pine", 1.8], [1900, 840, "pine", 1.7], [1820, 1190, "bush", 1.4],
  [1890, 560, "bush", 1.4], [1830, 1060, "pine", 1.7], [1900, 150, "pine", 1.6],
  // coins
  [110, 140, "bush", 1.3], [1740, 1250, "bush", 1.3],
];

function placerScenery() {
  SCENERY.forEach(([x, y, sprite, ech]) => {
    sc.add.image(x, y, sprite).setOrigin(0.5, 0.95).setScale(ech).setDepth(y);
    // empreinte de collision à la base (tronc / pied du buisson)
    if (sprite === "pine") COLLISIONS.push({ x: x - 15, y: y - 22, w: 30, h: 24 });
    else COLLISIONS.push({ x: x - 26 * ech, y: y - 16, w: 52 * ech, h: 20 });
  });
}

function sceneCreate() {
  sc = this;
  this.cameras.main.setBounds(0, 0, WORLD.w, WORLD.h);
  this.cameras.main.setBackgroundColor("#6fae4f");
  creerAnims();
  creerCoeur();
  construireMonde();
  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys({ haut: "Z", bas: "S", gauche: "Q", droite: "D", up: "W", left: "A" });
  this.input.on("pointerdown", (p) => onPointer(p));
}

function construireMonde() {
  sc.children.removeAll();
  decorObjs = [];
  COLLISIONS = [];
  placementDecor = null; ghostDecor = null;

  // Sol : pelouse tuilée sur tout le monde
  sc.add.tileSprite(0, 0, WORLD.w, WORLD.h, "sol_herbe").setOrigin(0, 0).setDepth(-20);

  // Chemin de terre : vertical devant les bâtiments + horizontal vers le portail de l'enclos
  const gateY = CORRAL.y + CORRAL.h * 0.5;
  sc.add.tileSprite(160, 380, 200, 520, "sol_terre").setOrigin(0, 0.5).setDepth(-19);
  sc.add.tileSprite(260, gateY - 45, CORRAL.x - 260, 90, "sol_terre").setOrigin(0, 0.5).setDepth(-19);

  // Enclos (herbe légèrement plus claire) + clôture
  const pre = sc.add.graphics();
  pre.fillStyle(0x86c25a, 0.55); pre.fillRoundedRect(CORRAL.x, CORRAL.y, CORRAL.w, CORRAL.h, 18);
  pre.setDepth(-18);
  placerCloture();

  // Décor fixe (arbres, buissons)
  placerScenery();

  // Bâtiments (+ empreinte de collision à la base)
  STATIONS.forEach((s) => {
    const b = sc.add.image(s.x, s.y, s.sprite).setOrigin(0.5, 0.88).setScale(1.2).setDepth(s.y);
    const l = sc.add.text(s.x, s.y + 30, s.label, { fontSize: "22px", fontFamily: "sans-serif", color: "#fff8ec", fontStyle: "bold", stroke: "#3a2716", strokeThickness: 5 }).setOrigin(0.5).setDepth(s.y + 1);
    s.obj = b; s.labelObj = l;
    COLLISIONS.push({ x: s.x - 70, y: s.y - 60, w: 140, h: 75 });
  });

  // Décorations achetées
  placerDecors();

  // Chevaux
  etat.chevaux.forEach(creerObjCheval);

  // Joueur (enfant)
  joueurOmbre = sc.add.ellipse(0, 0, 30, 11, 0x000000, 0.25);
  const key = persoDef(etat.perso.avatar).key;
  joueurSprite = sc.add.sprite(0, 0, key, 18).setOrigin(0.5, 0.97).setScale(1.7);
  joueurFacing = "down";
  joueurNom = sc.add.text(0, -80, etat.perso.nom || "", { fontSize: "15px", fontFamily: "sans-serif", color: "#fff8ec", fontStyle: "bold", stroke: "#3a2716", strokeThickness: 4 }).setOrigin(0.5);
  joueur = sc.add.container(560, CORRAL.y + CORRAL.h * 0.5, [joueurOmbre, joueurSprite, joueurNom]);
  joueur.setSize(40, 40);
  monte = null;

  // anneau de sélection
  ringSel = sc.add.ellipse(0, 0, 90, 50, 0xffd54a, 0);
  ringSel.setStrokeStyle(4, 0xffd54a, 1); ringSel.setVisible(false); ringSel.setDepth(2);

  // voile de nuit (fixé à l'écran) pour la transition « dormir » — invisible au départ
  nuitVoile = sc.add.rectangle(0, 0, 4000, 3000, 0x0a1633).setOrigin(0, 0).setScrollFactor(0).setDepth(9000).setAlpha(0);

  sc.cameras.main.startFollow(joueur, true, 0.12, 0.12);
}

function echelleCheval(c) { return estPoulain(c) ? 1.3 : 2.0; }
function coeurY(c) { return -(61 * echelleCheval(c) + 14); }

function creerObjCheval(c) {
  const coat = robeCoat(c), ech = echelleCheval(c);
  const ombre = sc.add.ellipse(0, 0, 58 * ech, 16 * ech, 0x000000, 0.25);
  const corps = sc.add.sprite(0, 0, "horse-" + coat).setOrigin(0.46, 0.734).setScale(ech);
  corps.play("horse-" + coat + "-walk");
  const coeur = sc.add.image(0, coeurY(c), "coeur").setOrigin(0.5).setScale(0.95).setTint(0x6fcf5f);
  const nom = sc.add.text(0, 22, c.nom, { fontSize: "16px", fontFamily: "sans-serif", color: "#fff8ec", fontStyle: "bold", stroke: "#3a2716", strokeThickness: 4 }).setOrigin(0.5);
  const cont = sc.add.container(c.x, c.y, [ombre, corps, coeur, nom]);
  c.obj = cont; c.corpsT = corps; c.coeur = coeur; c.nomT = nom;
}

function majVisuelCheval(c) {
  if (!c.obj) return;
  const coat = robeCoat(c), ech = echelleCheval(c);
  c.corpsT.setTexture("horse-" + coat);
  c.corpsT.play("horse-" + coat + "-walk");
  c.corpsT.setScale(ech);
  c.coeur.y = coeurY(c);
  c.nomT.setText(c.nom);
}

function placerDecors() {
  decorObjs.forEach((o) => o.destroy()); decorObjs = [];
  COLLISIONS = COLLISIONS.filter((m) => !m.deco);   // retire les collisions de déco précédentes
  etat.decors.forEach((it) => {
    const d = DECORS.find((x) => x.id === it.id);
    if (!d) return;
    const o = sc.add.image(it.x, it.y, d.sprite).setOrigin(0.5, 0.95).setScale(1.2).setDepth(it.y);
    decorObjs.push(o);
    // collision à la base (l'abreuvoir reste franchissable)
    if (d.sprite === "pine") COLLISIONS.push({ x: it.x - 16, y: it.y - 22, w: 32, h: 24, deco: true });
    else if (d.sprite === "bush") COLLISIONS.push({ x: it.x - 28, y: it.y - 16, w: 56, h: 20, deco: true });
  });
}

// Anime le joueur selon sa direction (ou pose d'arrêt face à sa dernière direction).
function majAnimJoueur(mvx, mvy) {
  if (!joueurSprite) return;
  const key = persoDef(etat.perso.avatar).key;
  // À cheval : l'enfant ne « marche » pas et ne regarde QUE gauche/droite
  // (le cheval n'a que ces 2 profils → on évite l'enfant qui regarde en haut/bas).
  if (monte) {
    if (mvx) joueurFacing = mvx < 0 ? "left" : "right";
    else if (joueurFacing !== "left" && joueurFacing !== "right") joueurFacing = "right";
    joueurSprite.anims.stop();
    joueurSprite.setFrame(DIRS[joueurFacing] * 9);
    return;
  }
  if (mvx || mvy) {
    const dir = Math.abs(mvx) > Math.abs(mvy) ? (mvx < 0 ? "left" : "right") : (mvy < 0 ? "up" : "down");
    joueurFacing = dir;
    const ak = `${key}-${dir}`;
    const cur = joueurSprite.anims.currentAnim;
    if (!joueurSprite.anims.isPlaying || !cur || cur.key !== ak) joueurSprite.play(ak, true);
  } else {
    joueurSprite.anims.stop();
    joueurSprite.setFrame(DIRS[joueurFacing] * 9);
  }
}

/* ===================== Boucle ===================== */

function sceneUpdate(time, delta) {
  if (!joueur) return;
  const dt = Math.min(delta / 1000, 0.05);
  const modaleOuverte = !$("modale").classList.contains("cache") || nuitEnCours;

  let vx = 0, vy = 0;
  if (!modaleOuverte) {
    if (cursors.left.isDown || wasd.gauche.isDown || wasd.left.isDown) vx -= 1;
    if (cursors.right.isDown || wasd.droite.isDown) vx += 1;
    if (cursors.up.isDown || wasd.haut.isDown || wasd.up.isDown) vy -= 1;
    if (cursors.down.isDown || wasd.bas.isDown) vy += 1;
  }

  const vit = monte ? (enCourse ? 560 : 340) : (enCourse ? 370 : 200);
  let mvx = 0, mvy = 0;
  if (vx || vy) {
    moveTarget = null; pendingInteract = null; enCourse = false;
    const n = Math.hypot(vx, vy); mvx = vx / n; mvy = vy / n;
  } else if (moveTarget && !modaleOuverte) {
    const dx = moveTarget.x - joueur.x, dy = moveTarget.y - joueur.y, d = Math.hypot(dx, dy);
    if (d < 8) { moveTarget = null; enCourse = false; if (pendingInteract) { const r = pendingInteract; pendingInteract = null; interagir(r); } }
    else { mvx = dx / d; mvy = dy / d; }
  }
  if (mvx || mvy) { joueur.x += mvx * vit * dt; joueur.y += mvy * vit * dt; }
  majAnimJoueur(mvx, mvy);
  joueur.x = clamp(joueur.x, 40, WORLD.w - 40);
  joueur.y = clamp(joueur.y, 40, WORLD.h - 40);
  bloquerObstacles();
  joueur.setDepth(joueur.y);

  // Déco en cours de placement : le fantôme suit le joueur (aperçu de l'emplacement).
  if (placementDecor && ghostDecor) { ghostDecor.x = joueur.x; ghostDecor.y = joueur.y; ghostDecor.setDepth(joueur.y + 0.5); }

  // À cheval : le cheval est au sol sous le joueur, l'enfant est assis sur son dos.
  if (monte) {
    monte.obj.x = joueur.x; monte.obj.y = joueur.y; monte.x = joueur.x; monte.y = joueur.y;
    monte.obj.setDepth(joueur.y - 1);
    monte.corpsT.setFlipX(joueurFacing === "right");
    joueurSprite.y = -58; joueurOmbre.setVisible(false);
    if (joueurNom) joueurNom.y = -138;
  } else {
    if (joueurSprite.y !== 0) { joueurSprite.y = 0; joueurOmbre.setVisible(true); }
    if (joueurNom && joueurNom.y !== -80) joueurNom.y = -80;
  }

  // balade des chevaux + humeur
  const now = time;
  etat.chevaux.forEach((c) => {
    if (!c.obj) return;
    if (c !== monte) {
      // Le cheval s'arrête quand le joueur est proche (pour pouvoir s'en occuper).
      if (distJoueur(c.x, c.y) < 115) {
        c.prochainPas = now + 800;
        c.corpsT.setFlipX(joueur.x > c.x);
        c.obj.x = c.x; c.obj.y = c.y; c.obj.setDepth(c.y);
        const mp = moyenne(c);
        c.coeur.setTint(mp > 60 ? 0x6fcf5f : mp > 35 ? 0xf4b942 : 0xe05656);
        return;
      }
      if (now > c.prochainPas) {
        c.tx = aleatoire(CORRAL.x + 70, CORRAL.x + CORRAL.w - 70);
        c.ty = aleatoire(CORRAL.y + 70, CORRAL.y + CORRAL.h - 70);
        c.prochainPas = now + aleatoire(2500, 6000);
      }
      const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
      if (d > 3) { c.x += (dx / d) * 40 * dt; c.y += (dy / d) * 40 * dt; c.corpsT.setFlipX(dx > 0); }
      c.obj.x = c.x; c.obj.y = c.y; c.obj.setDepth(c.y);
    } else {
      c.corpsT.setFlipX(joueurFacing === "right");
    }
    const m = moyenne(c);
    c.coeur.setTint(m > 60 ? 0x6fcf5f : m > 35 ? 0xf4b942 : 0xe05656);
  });

  majInteraction();
}

function distJoueur(x, y) { return Math.hypot(joueur.x - x, joueur.y - y); }

function majInteraction() {
  // Mode placement de déco : on cache la sélection, on propose « Poser ici ».
  if (placementDecor) {
    cibleActive = null;
    if (ringSel) ringSel.setVisible(false);
    if (idPanneau !== "place") { idPanneau = "place"; construirePanneau(); }
    $("btn-action").classList.remove("cache");
    $("btn-action").textContent = "✅ Poser ici";
    return;
  }
  let meilleur = null, dmin = Infinity;
  if (monte) meilleur = monte;
  else {
    STATIONS.forEach((s) => { const d = distJoueur(s.x, s.y); if (d < 110 && d < dmin) { dmin = d; meilleur = s; } });
    etat.chevaux.forEach((c) => { const d = distJoueur(c.x, c.y); if (d < 95 && d < dmin) { dmin = d; meilleur = c; } });
  }
  cibleActive = meilleur;
  const id = meilleur ? (meilleur.robe ? "c" + meilleur.id : "s" + meilleur.type) : null;
  if (id !== idPanneau) { idPanneau = id; construirePanneau(); }
  if (meilleur && meilleur.robe) majBarres(meilleur);

  if (meilleur && ringSel) {
    const x = meilleur.robe ? meilleur.x : meilleur.x, y = meilleur.robe ? meilleur.y : meilleur.y;
    ringSel.setPosition(x, y + 10).setVisible(true).setDepth(y - 1);
  } else if (ringSel) ringSel.setVisible(false);

  const station = meilleur && !meilleur.robe;
  $("btn-action").classList.toggle("cache", !station);
  if (station) $("btn-action").textContent = meilleur.label;
}

/* ===================== Clic ===================== */

function onPointer(p) {
  if (!$("modale").classList.contains("cache")) return;
  const wx = p.worldX, wy = p.worldY;

  // Double-tap rapide (< 350 ms) => le personnage se met à courir.
  const tnow = (typeof performance !== "undefined" ? performance.now() : Date.now());
  enCourse = (tnow - dernierTapT) < 350;
  dernierTapT = tnow;

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
  if (placementDecor) {
    p.innerHTML = `<div class="pc-station">
      <p class="panneau-aide">Promène-toi où tu veux, puis touche <b>« ✅ Poser ici »</b> pour installer ${placementDecor.nom}.</p>
      <button class="bouton bouton-secondaire" data-annuler-place="1">❌ Annuler</button></div>`;
    return;
  }
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
      etat.actionsDepuisDodo++; bond(c); message(`${c.nom} a mangé du bon foin ! 🌾`); break;
    case "brosser":
      c.proprete = borner(c.proprete + 40); c.bonheur = borner(c.bonheur + 10); c.energie = borner(c.energie - 5); etat.pieces += 2;
      etat.actionsDepuisDodo++; bond(c); message(`${c.nom} est tout beau et brillant ! ✨`); break;
    case "jouer":
      if (c.energie < 15) { message(`${c.nom} est trop fatigué pour jouer. 😴`); return; }
      c.bonheur = borner(c.bonheur + 22); c.energie = borner(c.energie - 16); c.faim = borner(c.faim - 8); etat.pieces += 3;
      etat.actionsDepuisDodo++; bond(c); message(`${c.nom} s'est bien amusé ! 🎾`); break;
    case "monter":
      if (monte === c) {
        monte = null; moveTarget = null; enCourse = false;
        // On écarte le cheval pour qu'il ne reste pas collé au joueur (sinon il capte les clics).
        c.x = clamp(joueur.x + 135, CORRAL.x + 70, CORRAL.x + CORRAL.w - 70);
        c.y = clamp(joueur.y, CORRAL.y + 70, CORRAL.y + CORRAL.h - 70);
        c.tx = c.x; c.ty = c.y; c.prochainPas = 0;
        if (c.obj) { c.obj.x = c.x; c.obj.y = c.y; }
        message(`Tu descends de ${c.nom}. 🙂`);
      }
      else if (estPoulain(c)) { message(`${c.nom} est un poulain, trop petit pour être monté. 🐣`); return; }
      else if (c.energie < 20) { message(`${c.nom} est trop fatigué pour te porter. 😴`); return; }
      else { monte = c; c.bonheur = borner(c.bonheur + 12); c.energie = borner(c.energie - 12); etat.actionsDepuisDodo++; message(`En selle sur ${c.nom} ! 🏇`); }
      idPanneau = null; majInteraction(); majHud(); return;
    case "relooker": ouvrirRelooker(c); return;
  }
  majBarres(c); majHud();
}

function bond(c) {
  if (c.obj && sc) sc.tweens.add({ targets: c.obj, y: c.y - 14, duration: 130, yoyo: true, ease: "Quad.easeOut" });
}

function jourSuivant() {
  if (nuitEnCours) return;
  // Empêche d'enchaîner les nuits : il faut s'être occupé d'un cheval depuis le dernier dodo.
  if ((etat.actionsDepuisDodo || 0) === 0) {
    message("Tu viens de te lever ! Occupe-toi d'abord de tes chevaux. 🐴");
    return;
  }
  nuitEnCours = true; moveTarget = null; message("🌙 La nuit tombe…");
  if (nuitVoile && sc) {
    sc.tweens.add({
      targets: nuitVoile, alpha: 0.72, duration: 1100, hold: 700, yoyo: true,
      onYoyo: appliquerJour, onComplete: () => { nuitEnCours = false; },
    });
  } else { appliquerJour(); nuitEnCours = false; }
}

function appliquerJour() {
  etat.jour++; etat.pieces += 5; etat.actionsDepuisDodo = 0;
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
  monte = null;
  if (joueurSprite) joueurSprite.y = 0;
  if (joueurOmbre) joueurOmbre.setVisible(true);
  majHud(); sauvegarder();
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
    html += `<button class="carte-decor" data-decor="${d.id}">
      <img class="d-img" src="${av("assets/sprite/" + d.sprite + ".png")}" alt="" /><span>${d.nom}</span><span class="d-prix">${d.prix} 💰</span></button>`;
  });
  html += `</div><h3>🐴 Adopter un cheval</h3>`;
  if (!placeLibre) html += `<p>⚠️ Ton corral est plein ! Agrandis-le d'abord.</p>`;
  else html += `<p>Adopte un cheval puis personnalise-le avec <b>🎨 Relooker</b> dans le corral.</p>
    <button class="bouton bouton-geant" data-boutique="cheval">🛒 Adopter un cheval (${PRIX_CHEVAL} 💰)</button>`;
  ouvrirModale("🛒 Magasin", html);
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
  const d = DECORS.find((x) => x.id === id); if (!d) return;
  if (etat.pieces < d.prix) return message("Pas assez de 💰 !");
  etat.pieces -= d.prix;
  placementDecor = d;
  fermerModale();
  if (sc) {
    if (ghostDecor) ghostDecor.destroy();
    ghostDecor = sc.add.image(joueur.x, joueur.y, d.sprite).setOrigin(0.5, 0.95).setScale(1.2).setAlpha(0.55).setDepth(99999);
  }
  majHud(); idPanneau = null; majInteraction();
  message(`${d.nom} acheté ! Promène-toi et touche « ✅ Poser ici ».`);
}

// Pose la déco en cours à l'endroit où se trouve le joueur.
function poserDecor() {
  if (!placementDecor) return;
  const x = clamp(joueur.x, 40, WORLD.w - 40), y = clamp(joueur.y, 70, WORLD.h - 30);
  etat.decors.push({ id: placementDecor.id, x, y });
  etat.chevaux.forEach((c) => (c.bonheur = borner(c.bonheur + 5)));
  const nom = placementDecor.nom; placementDecor = null;
  if (ghostDecor) { ghostDecor.destroy(); ghostDecor = null; }
  placerDecors(); sauvegarder(); majHud(); idPanneau = null; majInteraction();
  message(`${nom} installé ! ✨`);
}

function annulerPlacement() {
  if (!placementDecor) return;
  etat.pieces += placementDecor.prix;   // remboursé
  placementDecor = null;
  if (ghostDecor) { ghostDecor.destroy(); ghostDecor = null; }
  majHud(); idPanneau = null; majInteraction();
  message("Placement annulé, tu es remboursé. 💰");
}

function ouvrirRelooker(c) {
  ouvrirModale("🎨 Relooker " + c.nom, `
    <div class="relook-apercu" id="rl-apercu"></div>
    <label class="rl-label">Nom :</label><input id="rl-nom" type="text" maxlength="14" value="${c.nom}" />
    <div class="groupe-perso"><span class="grp-titre">Robe du cheval</span><div class="ligne-avatars" id="rl-robe"></div></div>
    <button class="bouton bouton-geant" id="rl-ok">✅ Valider</button>`);

  const apercu = () => { $("rl-apercu").innerHTML = `<img class="vignette-grande" src="${av("assets/sprite/coat_" + robeCoat(c) + ".png")}" alt="" />`; };
  COATS.forEach((co) => {
    const b = document.createElement("button");
    b.className = "btn-avatar btn-vignette" + (robeCoat(c) === co.id ? " choisi" : "");
    b.innerHTML = `<img src="${av("assets/sprite/coat_" + co.id + ".png")}" alt="${co.nom}" />`;
    b.title = co.nom;
    b.addEventListener("click", () => { c.robe = co.id; $("rl-robe").querySelectorAll(".btn-avatar").forEach((x) => x.classList.remove("choisi")); b.classList.add("choisi"); apercu(); });
    $("rl-robe").appendChild(b);
  });
  $("rl-ok").addEventListener("click", () => {
    const nom = $("rl-nom").value.trim();
    if (nom && nomUtilise(nom, c)) { message(`Un autre cheval s'appelle déjà ${nom} ! Choisis un autre nom.`); return; }
    if (nom) c.nom = nom;
    majVisuelCheval(c); sauvegarder(); fermerModale(); idPanneau = null; message(`${c.nom} est relooké ! 🎨`);
  });
  apercu();
}

function ouvrirAide() {
  ouvrirModale("❓ Comment jouer", `
    <div class="aide-texte">
      <p><b>Bienvenue dans ton centre équestre !</b></p>
      <p><b>🚶 Se déplacer :</b> clique ou touche l'endroit où aller (le personnage s'y rend tout seul).
      Tu peux aussi cliquer directement sur un cheval ou un bâtiment. (Au clavier : flèches ou Z Q S D.)</p>
      <p><b>🐴 Un cheval :</b> approche-toi puis 🌾 Nourrir, 🧽 Brosser, 🎾 Jouer, 🏇 Monter, ou 🎨 Relooker
      (robe, nom). Garde ses besoins au vert !</p>
      <p><b>🏇 Monter :</b> en selle, promène-toi à cheval. Re-clique « Descendre » pour t'arrêter.</p>
      <p><b>🏃 Courir :</b> tape <b>deux fois rapidement</b> vers un endroit et le personnage (ou le cheval) court !</p>
      <p><b>🏪 Magasin :</b> foin, décos, adopter des chevaux. Après l'achat d'une déco, promène-toi où tu veux puis touche <b>« ✅ Poser ici »</b>.</p>
      <p><b>🏡 Maison :</b> dormir passe au jour suivant (occupe-toi d'abord d'un cheval). <b>🧍 (en haut) :</b> change ton personnage.</p>
      <p>💰 Tu gagnes des sous en t'occupant de tes chevaux. 💾 Sauvegarde automatique.</p>
    </div>`);
}

/* ===================== Lancement ===================== */

document.addEventListener("DOMContentLoaded", init);
