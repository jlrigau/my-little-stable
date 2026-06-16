/* =========================================================
   🐴 Mon Centre Équestre — moteur Phaser 3
   Jeu de simulation pour enfants (9-10 ans).
   Visuel en pixel-art (style LPC) : sol, clôtures, bâtiments,
   personnages et chevaux animés. 100% statique (sauvegarde navigateur).
   ========================================================= */

"use strict";

// Version des assets : à incrémenter quand on change une IMAGE (force le rechargement).
const ASSET_VER = "ph56";
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

// Objectifs (gamification) en PALIERS : on accomplit ceux du palier courant ; quand
// ils sont tous faits, le palier suivant (objectifs différents et plus durs) se
// débloque. Chaque objectif rapporte de l'XP -> niveaux. verif(etat) = condition.
const XP_NIVEAU = 60;   // XP nécessaire par niveau
const PALIERS = [
  { nom: "Débutant", objectifs: [
    { id: "repas",  nom: "Premier repas", desc: "Nourris un cheval",       xp: 10, verif: (s) => s.stats.nourrir >= 1 },
    { id: "brosse", nom: "Tout beau",     desc: "Brosse un cheval",        xp: 10, verif: (s) => s.stats.brosser >= 1 },
    { id: "jeu",    nom: "On s'amuse",    desc: "Joue avec un cheval",     xp: 10, verif: (s) => s.stats.jouer >= 1 },
    { id: "deco",   nom: "Décorateur",    desc: "Pose une décoration",     xp: 10, verif: (s) => s.stats.decors >= 1 },
  ] },
  { nom: "Cavalier", objectifs: [
    { id: "cavalier", nom: "En selle !",          desc: "Monte un cheval",                 xp: 15, verif: (s) => s.stats.monter >= 1 },
    { id: "cross",    nom: "Au parcours de cross", desc: "Va sur le parcours de cross",     xp: 20, verif: (s) => s.stats.crossVisite >= 1 },
    { id: "sauteur",  nom: "Saute l'obstacle",     desc: "Saute un obstacle à cheval",      xp: 20, verif: (s) => s.stats.sauter >= 1 },
    { id: "heureux",  nom: "Cheval très heureux",  desc: "Un cheval au bonheur maximum",    xp: 15, verif: (s) => s.chevaux.some((c) => c.bonheur >= 100) },
  ] },
  { nom: "Éleveur", objectifs: [
    { id: "troupeau", nom: "Trois chevaux",   desc: "Aie 3 chevaux",            xp: 20, verif: (s) => s.chevaux.length >= 3 },
    { id: "famille",  nom: "Un poulain est né", desc: "Fais naître un poulain", xp: 30, verif: (s) => s.stats.naissances >= 1 },
    { id: "crosspro", nom: "As du cross",     desc: "Saute 5 obstacles",        xp: 25, verif: (s) => s.stats.sauter >= 5 },
    { id: "riche",    nom: "Petite fortune",  desc: "Atteins 150 pièces",       xp: 20, verif: (s) => s.pieces >= 150 },
  ] },
];
function niveauPour(xp) { return 1 + Math.floor((xp || 0) / XP_NIVEAU); }
function statsVierges() { return { nourrir: 0, brosser: 0, jouer: 0, monter: 0, sauter: 0, naissances: 0, decors: 0, crossVisite: 0 }; }
function palierCourant() { return PALIERS[Math.min(etat.palier || 0, PALIERS.length - 1)]; }

/* ===================== Monde ===================== */

const WORLD = { w: 2800, h: 2100 };
const CORRAL = { x: 800, y: 480, w: 820, h: 760 };
// Carrière de saut d'obstacles — clôturée, dans l'intérieur (en dehors de la bande forestière).
const PARCOURS = { x: 1700, y: 540, w: 620, h: 640 };
const HAIES = [
  { x: 1830, y: 770 }, { x: 2020, y: 770 }, { x: 2210, y: 770 },
  { x: 1830, y: 980 }, { x: 2020, y: 980 }, { x: 2210, y: 980 },
];
// GRAND CROSS : boucle de sable qui fait tout le tour de la map, dans une forêt.
const BAND = 440;                                   // épaisseur de la forêt périphérique
const PW = 240;                                     // largeur (épaisseur) du chemin de cross
const LOOP_SEG = [
  { x: 90, y: 90, w: WORLD.w - 180, h: PW },              // grand côté HAUT
  { x: 90, y: WORLD.h - 90 - PW, w: WORLD.w - 180, h: PW }, // grand côté BAS
  { x: 90, y: 90, w: PW, h: WORLD.h - 180 },              // côté GAUCHE (virage)
  { x: WORLD.w - 90 - PW, y: 90, w: PW, h: WORLD.h - 180 }, // côté DROIT (virage)
];
// Ouvertures = couloirs de sable reliant l'intérieur à la boucle.
// Uniquement à GAUCHE et à DROITE (les passages haut et bas sont fermés).
const OUVERTURES = [
  { x: 200, y: 1320, w: 430, h: 220 },                // GAUCHE → relie l'intérieur au côté gauche
  { x: WORLD.w - 630, y: 1320, w: 430, h: 220 },      // DROITE → relie l'intérieur au côté droit
];
// Tous les rectangles « chemin » réunis : sert à placer la végétation de façon
// déclarative (bordure continue, ouvertures et angles gérés automatiquement).
const CHEMINS = LOOP_SEG.concat(OUVERTURES);
// Rondins à sauter : au CENTRE VISIBLE des grands côtés horizontaux. La haie du bord
// intérieur (buissons dessinés vers le haut) « mord » un peu sur le sable, donc on
// remonte les rondins de RDEC pour qu'ils paraissent centrés. Chemin large => on peut
// aussi passer au-dessus / en-dessous sans rester coincé.
const RDEC = 14;
const RX = [520, 820, 1120, 1700, 2000, 2300];
const RONDINS = [
  ...RX.map((x) => ({ x, y: 90 + PW / 2 - RDEC })),          // côté HAUT
  ...RX.map((x) => ({ x, y: WORLD.h - 90 - PW / 2 - RDEC })), // côté BAS
];
const STATIONS = [
  { type: "dormir", x: 450, y: 540, sprite: "cabane_ardoise", label: "Maison" },
  { type: "boutique", x: 450, y: 1010, sprite: "cabane_chaume", label: "Sellerie" },
];
const SLOTS_DECOR = [
  { x: 640, y: 1300 }, { x: 900, y: 1300 }, { x: 1200, y: 1300 }, { x: 1500, y: 1300 },
  { x: 700, y: 1500 }, { x: 1700, y: 1300 }, { x: 1900, y: 1500 }, { x: 1100, y: 1500 },
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
  const br = $("btn-refresh"); if (br) br.addEventListener("click", viderCacheEtRecharger);
  $("nom-haras").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-commencer").click(); });
  if (charger()) $("msg-accueil").textContent = "Une partie existe : clique sur « Continuer ma partie » 🐴";

  $("btn-moi").addEventListener("click", () => ouvrirCreation({ ...etat.perso }, () => {
    etat.perso = persoEnCours; sauvegarder();
    if (joueurSprite) { joueurSprite.setTexture(persoDef(etat.perso.avatar).key); joueurFacing = "down"; joueurSprite.setFrame(18); }
    if (joueurNom) joueurNom.setText(etat.perso.nom || "");
  }));
  $("btn-aide").addEventListener("click", ouvrirAide);
  $("btn-objectifs").addEventListener("click", ouvrirObjectifs);

  $("btn-fermer-modale").addEventListener("click", fermerModale);
  $("modale").addEventListener("click", (e) => { if (e.target.id === "modale") fermerModale(); });

  $("btn-action").addEventListener("click", () => { if (placementDecor) poserDecor(); else interagir(cibleActive); });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    if (btn.dataset.cheval) actionCheval(btn.dataset.cheval);
    else if (btn.dataset.station) interagir({ type: btn.dataset.station });
    else if (btn.dataset.boutique) acheter(btn.dataset.boutique);
    else if (btn.dataset.decor) acheterDecor(btn.dataset.decor);
    else if (btn.dataset.poser) poserDecor();
    else if (btn.dataset.annulerPlace) annulerPlacement();
  });
}

// Outil de dev : vide les caches et recharge avec une URL fraîche (sans toucher à la sauvegarde).
async function viderCacheEtRecharger() {
  try {
    if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); }
    if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); }
  } catch (e) {}
  const u = new URL(location.href);
  u.searchParams.set("fresh", Date.now());
  location.replace(u.toString());
}

function nouvellePartie(nom, perso) {
  compteurId = 1;
  etat = {
    nomRanch: nom, perso, pieces: 40, foin: 6, jour: 1, boxes: 4,
    chevaux: [nouveauCheval({ nom: "Éclair", robe: COATS[0].id })],
    decors: [], vitesse: 1, actionsDepuisDodo: 0, dernierNaissance: 0,
    stats: statsVierges(), objectifsFaits: {}, palier: 0, xp: 0, niveau: 1, niveauVu: 1,
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
  if (typeof etat.dernierNaissance !== "number") etat.dernierNaissance = 0;
  etat.stats = Object.assign(statsVierges(), etat.stats || {});
  if (!etat.objectifsFaits) etat.objectifsFaits = {};
  if (typeof etat.palier !== "number") etat.palier = 0;
  if (typeof etat.xp !== "number") etat.xp = 0;
  if (typeof etat.niveau !== "number") etat.niveau = niveauPour(etat.xp);
  if (typeof etat.niveauVu !== "number") etat.niveauVu = niveauPour(etat.xp);
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
  verifierObjectifs();                                  // objectifs accomplis -> XP bonus
  etat.niveau = niveauPour(etat.xp);
  const an = $("aff-niveau"); if (an) an.textContent = etat.niveau || 1;
  // Annonce de montée de niveau (légèrement différée pour ne pas écraser le
  // message de l'action en cours). niveauVu = dernier niveau déjà fêté.
  if ((etat.niveau || 1) > (etat.niveauVu || 1)) {
    const n = etat.niveau; etat.niveauVu = n;
    setTimeout(() => message(`⭐ Bravo ! Tu passes au niveau ${n} ! 🎉`), 900);
  }
  sauvegarder();
}

// XP gagnée en jouant (en plus des objectifs) : le niveau continue de monter, la
// barre avance toujours. Le calcul du niveau + l'annonce se font dans majHud.
function gagnerXP(n) { etat.xp = (etat.xp || 0) + (n || 0); }

// Vérifie les objectifs du PALIER COURANT ; ajoute leur XP, notifie, et débloque le
// palier suivant quand ils sont tous faits. Appelé depuis majHud (ne recalcule pas le
// niveau et ne sauvegarde pas : majHud s'en charge).
function verifierObjectifs() {
  if (!etat || !etat.stats || !etat.objectifsFaits) return;
  const liste = palierCourant().objectifs;
  const faits = [];
  let gain = 0;
  liste.forEach((o) => {
    if (!etat.objectifsFaits[o.id] && o.verif(etat)) {
      etat.objectifsFaits[o.id] = true; gain += o.xp; faits.push(o);
    }
  });
  if (gain) etat.xp = (etat.xp || 0) + gain;
  if (faits.length) {
    message(faits.length === 1
      ? `🎯 Objectif accompli : ${faits[0].nom} ! +${gain} XP`
      : `🎯 ${faits.length} objectifs accomplis ! +${gain} XP`);
  }
  // Palier terminé -> débloque le suivant (objectifs différents / plus durs)
  if (liste.every((o) => etat.objectifsFaits[o.id]) && (etat.palier || 0) < PALIERS.length - 1) {
    etat.palier = (etat.palier || 0) + 1;
    const np = PALIERS[etat.palier].nom;
    setTimeout(() => message(`🏆 Nouveaux objectifs débloqués — palier « ${np} » !`), 1200);
  }
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
let moveTarget = null, pendingInteract = null, suiviCheval = null;
let placementDecor = null, ghostDecor = null, ghostCote = 1; // déco en cours de placement (fantôme à côté du joueur)
let nuitEnCours = false;   // transition nuit (dormir) — voile plein écran en HTML/CSS
let enCourse = false, dernierTapT = 0;       // double-tap rapide => le perso court
let fatigueAcc = 0;                          // accumulateur de fatigue du cheval monté
let sautEnCours = false;                     // saut d'obstacle en cours (à cheval)
const sautAnim = { h: 0 };                   // hauteur du saut (0..1) pour l'arc visuel
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
  const ajuster = () => {
    if (jeu && jeu.scale) { jeu.scale.resize(monde.clientWidth, monde.clientHeight); ajusterZoom(); }
  };
  if (window.ResizeObserver) new ResizeObserver(ajuster).observe(monde);
  window.addEventListener("resize", ajuster);
  window.addEventListener("orientationchange", () => setTimeout(ajuster, 200));
}

// Dézoome la caméra pour montrer une bonne portion de la carte (plus jouable),
// en s'adaptant à la taille de l'écran.
function ajusterZoom() {
  if (!sc) return;
  const w = sc.scale.width, h = sc.scale.height;
  const z = clamp(Math.min(w / 780, h / 820), 0.5, 0.9);
  sc.cameras.main.setZoom(z);
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
  ["pine", "bush", "trough", "cabane_ardoise", "cabane_chaume", "haie", "rondins"]
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

// Clôture en ganivelle autour du paddock (avec un portail sur le côté écuries).
function placerCloture() {
  const s = 32, x0 = CORRAL.x, y0 = CORRAL.y, x1 = CORRAL.x + CORRAL.w, y1 = CORRAL.y + CORRAL.h;
  const gateA = y0 + CORRAL.h * 0.34, gateB = y0 + CORRAL.h * 0.66;
  const add = (x, y, frame, flipY) => {
    const o = sc.add.image(x, y, "fence", frame).setOrigin(0.5, 0.7).setDepth(y);
    if (flipY) o.setFlipY(true);
  };
  for (let x = x0 + s; x < x1; x += s) { add(x, y0, 1, false); add(x, y1, 1, false); }
  for (let y = y0 + s; y < y1; y += s) {
    const dansPortail = (y > gateA && y < gateB);
    if (!dansPortail) { add(x0, y, 17, false); add(x1, y, 17, false); }  // 2 portails (gauche + droite)
  }
  add(x0, y0, 32, false); add(x1, y0, 34, false);
  add(x0, y1, 32, true); add(x1, y1, 34, true);

  // Murs de collision de la clôture (portails ouverts à gauche ET à droite, vers le parcours)
  const t = 14;
  COLLISIONS.push(
    { x: x0, y: y0 - t / 2, w: CORRAL.w, h: t },          // haut
    { x: x0, y: y1 - t / 2, w: CORRAL.w, h: t },          // bas
    { x: x0 - t / 2, y: y0, w: t, h: gateA - y0 },        // gauche (au-dessus du portail)
    { x: x0 - t / 2, y: gateB, w: t, h: y1 - gateB },     // gauche (sous le portail)
    { x: x1 - t / 2, y: y0, w: t, h: gateA - y0 },        // droite (au-dessus du portail)
    { x: x1 - t / 2, y: gateB, w: t, h: y1 - gateB },     // droite (sous le portail)
  );
}

function labelMonde(x, y, txt, depth) {
  sc.add.text(x, y, txt, { fontSize: "24px", fontFamily: "sans-serif", color: "#fff8ec", fontStyle: "bold", stroke: "#3a2716", strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(depth);
}
function arbreCollision(x, y, ech) {
  sc.add.image(x, y, "pine").setOrigin(0.5, 0.95).setScale(ech).setDepth(y);
  COLLISIONS.push({ x: x - 15, y: y - 22, w: 30, h: 24 });
}
// Clôture en ganivelle autour d'un rectangle, avec un portail sur le côté gauche.
function bordureCloture(r) {
  const s = 32, x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.h;
  const gA = y0 + r.h * 0.40, gB = y0 + r.h * 0.60;
  const add = (x, y, fr, fy) => { const o = sc.add.image(x, y, "fence", fr).setOrigin(0.5, 0.7).setDepth(y); if (fy) o.setFlipY(true); };
  for (let x = x0 + s; x < x1; x += s) { add(x, y0, 1, false); add(x, y1, 1, false); }
  for (let y = y0 + s; y < y1; y += s) { add(x1, y, 17, false); if (!(y > gA && y < gB)) add(x0, y, 17, false); }
  add(x0, y0, 32, false); add(x1, y0, 34, false); add(x0, y1, 32, true); add(x1, y1, 34, true);
  const t = 14;
  COLLISIONS.push(
    { x: x0, y: y0 - t / 2, w: r.w, h: t }, { x: x0, y: y1 - t / 2, w: r.w, h: t },
    { x: x1 - t / 2, y: y0, w: t, h: r.h },
    { x: x0 - t / 2, y: y0, w: t, h: gA - y0 }, { x: x0 - t / 2, y: gB, w: t, h: y1 - gB },
  );
}

// Carrière (obstacles) + grand parcours de cross qui fait le tour de la map.
function placerParcours() {
  // ----- Carrière (sol en terre + clôture + haies) -----
  const p = PARCOURS;
  sc.add.tileSprite(p.x, p.y, p.w, p.h, "sol_terre").setOrigin(0, 0).setDepth(-19);
  labelMonde(p.x + p.w / 2, p.y - 36, "Carrière", 99990);
  bordureCloture(p);
  HAIES.forEach((h) => {
    sc.add.image(h.x, h.y, "haie").setOrigin(0.5, 0.92).setScale(1.0).setDepth(h.y);
    COLLISIONS.push({ x: h.x - 33, y: h.y - 18, w: 66, h: 30, haie: true });
  });

  // ----- Grand cross : boucle de sable autour de la map, dans une forêt -----
  // 1) le chemin de sable (déborde un peu sous la végétation : pas de bord droit ni d'angle visible)
  const SAND = 46;
  CHEMINS.forEach((s) => sc.add.tileSprite(s.x - SAND, s.y - SAND, s.w + 2 * SAND, s.h + 2 * SAND, "sol_terre").setOrigin(0, 0).setDepth(-19));
  labelMonde(WORLD.w / 2, 300, "Parcours de cross", 99990);
  // 2) Végétation de la bande, posée par une RÈGLE UNIQUE (donc identique et continue
  //    partout) : tout près du chemin = HAIE (buisson bas), plus loin = forêt (pins).
  //    Les ouvertures et les angles se gèrent tout seuls (zones « sur le chemin » = vides).
  for (let gy = 24; gy <= WORLD.h; gy += 44) {
    for (let gx = 24; gx <= WORLD.w; gx += 44) {
      if (!dansBande(gx, gy) || procheBatiment(gx, gy) || clairiere(gx, gy)) continue;
      if (surChemin(gx, gy, 6)) continue;                 // garder le chemin dégagé
      const x = gx + aleatoire(-7, 7), y = gy + aleatoire(-6, 6);
      if (surChemin(gx, gy, 80)) {                         // bordure du chemin → HAIE (buisson)
        sc.add.image(x, y, "bush").setOrigin(0.5, 0.9).setScale(aleatoire(11, 14) / 10).setDepth(y);
        COLLISIONS.push({ x: x - 22, y: y - 10, w: 44, h: 14 });
      } else {                                             // plus loin → forêt (pins, pas de collision serrée)
        sc.add.image(x, y, "pine").setOrigin(0.5, 0.95).setScale(aleatoire(15, 19) / 10).setDepth(y);
      }
    }
  }
  // 2b) forêt décorative juste au-delà des bords du monde (pas de vide aux bords) — sans collision
  const M = 260;
  for (let gy = -M; gy <= WORLD.h + M; gy += 90) {
    for (let gx = -M; gx <= WORLD.w + M; gx += 90) {
      if (gx > -10 && gx < WORLD.w + 10 && gy > -10 && gy < WORLD.h + 10) continue;
      const x = gx + aleatoire(-13, 13), y = gy + aleatoire(-13, 13);
      sc.add.image(x, y, (gx + gy) % 4 === 0 ? "bush" : "pine").setOrigin(0.5, 0.95).setScale(aleatoire(15, 19) / 10).setDepth(y);
    }
  }
  // 3) rondins en travers des grands côtés — au CENTRE du chemin. Le chemin étant large,
  //    on peut passer au-dessus / en-dessous (collision plus courte que le chemin).
  RONDINS.forEach((r) => {
    sc.add.image(r.x, r.y, "rondins").setOrigin(0.5, 0.5).setScale(1.3).setDepth(r.y + 30);
    COLLISIONS.push({ x: r.x - 22, y: r.y - 50, w: 44, h: 100, haie: true });
  });
}

// Dégage une clairière autour des bâtiments (pas d'arbres qui les écrasent).
function procheBatiment(x, y) { return STATIONS.some((s) => Math.abs(x - s.x) < 120 && Math.abs(y - s.y) < 160); }
// Pas de végétation à l'intérieur du paddock ni de la carrière (la bande forestière
// peut en frôler le bord) — leurs clôtures bloquent déjà le joueur.
function clairiere(x, y) {
  const dans = (r) => x > r.x - 24 && x < r.x + r.w + 24 && y > r.y - 24 && y < r.y + r.h + 24;
  return dans(CORRAL) || dans(PARCOURS);
}
function dansBande(x, y) { return x < BAND || x > WORLD.w - BAND || y < BAND || y > WORLD.h - BAND; }
// « Sur le chemin » (dans un rectangle de CHEMINS élargi de m) : règle de placement de la végétation.
function surChemin(x, y, m) { return CHEMINS.some((s) => x > s.x - m && x < s.x + s.w + m && y > s.y - m && y < s.y + s.h + m); }

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

// Décor fixe d'intérieur (la forêt périphérique est gérée par placerParcours).
// [x, y, sprite, échelle]
const SCENERY = [
  [700, 1240, "bush", 1.4], [950, 1260, "pine", 1.7], [1480, 1240, "pine", 1.7],
  [1720, 1260, "bush", 1.4], [1980, 1240, "pine", 1.7], [2240, 1260, "bush", 1.4], [2440, 1250, "pine", 1.7],
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
  // Limites caméra étendues au-delà du monde : le joueur reste centré (au-dessus du
  // bandeau) même tout en bas / aux bords -> on accède partout.
  this.cameras.main.setBounds(-700, -700, WORLD.w + 1400, WORLD.h + 1400);
  this.cameras.main.setBackgroundColor("#6fae4f");
  creerAnims();
  creerCoeur();
  construireMonde();
  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys({ haut: "Z", bas: "S", gauche: "Q", droite: "D", up: "W", left: "A" }, false);
  // Ne JAMAIS confisquer les touches au navigateur (sinon impossible de taper
  // certaines lettres — A, Z, Q, S, D, W — dans les champs « nom »).
  this.input.keyboard.clearCaptures();
  // Quand un champ texte a le focus, on coupe le clavier du jeu (pas de lettre
  // bloquée ni de déplacement parasite), réactivé en sortie de champ.
  brancherFocusClavier();
  this.input.on("pointerdown", (p) => onPointer(p));
}

// Coupe le clavier Phaser tant qu'un <input>/<textarea> est en cours de saisie.
let focusClavierBranche = false;
function brancherFocusClavier() {
  if (focusClavierBranche) return;
  focusClavierBranche = true;
  const estChamp = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
  document.addEventListener("focusin", (e) => {
    if (estChamp(e.target) && sc && sc.input && sc.input.keyboard) {
      sc.input.keyboard.enabled = false;
      sc.input.keyboard.resetKeys();
    }
  });
  document.addEventListener("focusout", (e) => {
    if (estChamp(e.target) && sc && sc.input && sc.input.keyboard) {
      sc.input.keyboard.enabled = true;
    }
  });
}

function construireMonde() {
  sc.children.removeAll();
  decorObjs = [];
  COLLISIONS = [];
  placementDecor = null; ghostDecor = null; sautEnCours = false;

  // Sol : pelouse tuilée (débordant au-delà du monde pour ne pas voir de vide aux bords)
  sc.add.tileSprite(-700, -700, WORLD.w + 1400, WORLD.h + 1400, "sol_herbe").setOrigin(0, 0).setDepth(-20);

  // Chemin de terre : vertical devant les bâtiments + large chemin vers le portail du paddock
  const gateY = CORRAL.y + CORRAL.h * 0.5;
  sc.add.tileSprite(370, 775, 200, 620, "sol_terre").setOrigin(0.5, 0.5).setDepth(-19);
  // s'arrête PILE à la clôture (CORRAL.x) → la barrière est au bord du chemin, pas d'overlap dans le paddock
  sc.add.tileSprite(370, gateY, CORRAL.x - 370, 200, "sol_terre").setOrigin(0, 0.5).setDepth(-19);

  // Paddock (herbe légèrement plus claire) + clôture + panneau
  const pre = sc.add.graphics();
  pre.fillStyle(0x86c25a, 0.55); pre.fillRoundedRect(CORRAL.x, CORRAL.y, CORRAL.w, CORRAL.h, 18);
  pre.setDepth(-18);
  placerCloture();
  labelMonde(CORRAL.x + CORRAL.w / 2, CORRAL.y - 14, "Paddock", 99990);

  // Parcours d'obstacles (à droite)
  placerParcours();

  // Décor fixe (arbres, buissons)
  placerScenery();

  // Bâtiments (+ empreinte de collision à la base)
  STATIONS.forEach((s) => {
    const b = sc.add.image(s.x, s.y, s.sprite).setOrigin(0.5, 0.88).setScale(1.2).setDepth(s.y);
    const l = sc.add.text(s.x, s.y + 28, s.label, { fontSize: "22px", fontFamily: "sans-serif", color: "#fff8ec", fontStyle: "bold", stroke: "#3a2716", strokeThickness: 5 }).setOrigin(0.5).setDepth(99990);
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

  sc.cameras.main.startFollow(joueur, true, 0.5, 0.5);   // suivi réactif (peu d'élan à l'arrêt)
  ajusterZoom();
}

// Échelle : un poulain naît petit (~1.15) et grandit progressivement jusqu'à
// l'âge adulte (2.0 à AGE_ADULTE). majVisuelCheval réapplique l'échelle chaque jour.
function echelleCheval(c) {
  if (!estPoulain(c)) return 2.0;
  const t = clamp(c.age / AGE_ADULTE, 0, 1);
  return 1.15 + (2.0 - 1.15) * t;
}
function coeurY(c) { return -(61 * echelleCheval(c) + 14); }

function creerObjCheval(c) {
  const coat = robeCoat(c), ech = echelleCheval(c);
  const ombre = sc.add.ellipse(0, 0, 58, 16, 0x000000, 0.25).setScale(ech);
  const corps = sc.add.sprite(0, 0, "horse-" + coat).setOrigin(0.46, 0.734).setScale(ech);
  corps.play("horse-" + coat + "-walk");
  const coeur = sc.add.image(0, coeurY(c), "coeur").setOrigin(0.5).setScale(0.95).setTint(0x6fcf5f);
  const nom = sc.add.text(0, 22, c.nom, { fontSize: "16px", fontFamily: "sans-serif", color: "#fff8ec", fontStyle: "bold", stroke: "#3a2716", strokeThickness: 4 }).setOrigin(0.5);
  const cont = sc.add.container(c.x, c.y, [ombre, corps, coeur, nom]);
  c.obj = cont; c.corpsT = corps; c.coeur = coeur; c.nomT = nom; c.ombreT = ombre;
}

function majVisuelCheval(c) {
  if (!c.obj) return;
  const coat = robeCoat(c), ech = echelleCheval(c);
  c.corpsT.setTexture("horse-" + coat);
  c.corpsT.play("horse-" + coat + "-walk");
  c.corpsT.setScale(ech);
  if (c.ombreT) c.ombreT.setScale(ech);
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

  // Suivi d'un cheval (qui peut se déplacer) : on recale la cible vers sa position
  // courante et on s'arrête dès qu'on est assez proche pour s'en occuper.
  if (vx || vy) suiviCheval = null;
  if (suiviCheval && !monte && !modaleOuverte) {
    const c = suiviCheval, dx = joueur.x - c.x, dy = joueur.y - c.y, d = Math.hypot(dx, dy) || 1;
    if (d < 92) { suiviCheval = null; moveTarget = null; }
    else moveTarget = { x: c.x + (dx / d) * 72, y: c.y + (dy / d) * 72 };
  }

  let mvx = 0, mvy = 0;
  if (!sautEnCours) {
    const vit = monte ? (enCourse ? 560 : 340) : (enCourse ? 370 : 200);
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
  } else {
    majAnimJoueur(0, 0);   // pose figée pendant le saut (le tween gère la position)
  }
  joueur.setDepth(joueur.y);

  // Déco en cours de placement : le fantôme se tient À CÔTÉ du joueur (gauche/droite
  // selon le déplacement), et devient rouge si l'endroit est interdit.
  if (placementDecor && ghostDecor) {
    if (joueurFacing === "left") ghostCote = -1; else if (joueurFacing === "right") ghostCote = 1;
    const g = ghostXY();
    ghostDecor.x = g.x; ghostDecor.y = g.y; ghostDecor.setDepth(g.y + 0.5);
    if (placementInterdit(placementDecor, g.x, g.y)) ghostDecor.setTint(0xff5555); else ghostDecor.clearTint();
  }

  // À cheval : le cheval est au sol sous le joueur, l'enfant est assis sur son dos.
  if (monte) {
    const arc = sautAnim.h * 70;   // hauteur du saut d'obstacle
    monte.obj.x = joueur.x; monte.obj.y = joueur.y - arc; monte.x = joueur.x; monte.y = joueur.y;
    monte.obj.setDepth(joueur.y - 1);
    monte.corpsT.setFlipX(joueurFacing === "right");
    joueurSprite.y = -58 - arc; joueurOmbre.setVisible(false);
    if (joueurNom) joueurNom.y = -138 - arc;
    // Le cheval se fatigue quand on le monte (doucement ; plus vite au galop).
    const taux = (mvx || mvy) ? (enCourse ? 2.4 : 1.1) : 0.3;
    fatigueAcc += taux * dt;
    if (fatigueAcc >= 1) {
      const d = Math.floor(fatigueAcc); fatigueAcc -= d;
      monte.energie = borner(monte.energie - d);
      if (monte.energie <= 0) descendreCheval(monte, true);
    }
  } else {
    if (joueurSprite.y !== 0) { joueurSprite.y = 0; joueurOmbre.setVisible(true); }
    if (joueurNom && joueurNom.y !== -80) joueurNom.y = -80;
  }

  // Objectif « parcours de cross » : marqué une seule fois quand le joueur y entre.
  if (etat.stats && !etat.stats.crossVisite && joueur && surChemin(joueur.x, joueur.y, 0)) {
    etat.stats.crossVisite = 1; majHud();
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
    $("btn-action").classList.add("cache");
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

  // Le bouton flottant ne sert plus que pour « Poser ici » (placement déco) :
  // pour les bâtiments, le grand bouton du bandeau du bas suffit.
  $("btn-action").classList.add("cache");
}

/* ===================== Clic ===================== */

function onPointer(p) {
  if (!$("modale").classList.contains("cache")) return;
  const wx = p.worldX, wy = p.worldY;

  // Double-tap rapide (< 350 ms) => le personnage se met à courir.
  const tnow = (typeof performance !== "undefined" ? performance.now() : Date.now());
  enCourse = (tnow - dernierTapT) < 350;
  dernierTapT = tnow;

  suiviCheval = null;
  let cible = null, dmin = Infinity;
  STATIONS.forEach((s) => { const d = Math.hypot(s.x - wx, s.y - wy); if (d < 70 && d < dmin) { dmin = d; cible = s; } });
  etat.chevaux.forEach((c) => { if (c === monte) return; const d = Math.hypot(c.x - wx, c.y - wy); if (d < 55 && d < dmin) { dmin = d; cible = c; } });
  if (cible && cible.robe) {
    // Cheval : on le suit (il peut bouger) jusqu'à s'arrêter juste à côté.
    suiviCheval = cible; pendingInteract = null;
  } else if (cible) {
    const tx = cible.x, ty = cible.y;
    const dx = joueur.x - tx, dy = joueur.y - ty, d = Math.hypot(dx, dy) || 1;
    moveTarget = { x: tx + (dx / d) * 90, y: ty + (dy / d) * 90 };
    pendingInteract = cible;
  } else { moveTarget = { x: clamp(wx, 40, WORLD.w - 40), y: clamp(wy, 40, WORLD.h - 40) }; pendingInteract = null; }
}

/* ===================== Panneau ===================== */

function construirePanneau() {
  const p = $("panneau");
  if (placementDecor) {
    p.innerHTML = `<div class="pc-station">
      <p class="panneau-aide">Promène-toi où tu veux, puis pose ${placementDecor.nom}.</p>
      <div class="pc-actions">
        <button class="bouton bouton-rodeo" data-poser="1">✅ Poser ici</button>
        <button class="bouton bouton-secondaire" data-annuler-place="1">❌ Annuler</button>
      </div></div>`;
    return;
  }
  if (!cibleActive) { p.innerHTML = `<p class="panneau-aide">Promène-toi 🚶 et approche-toi d'un cheval ou d'un bâtiment pour agir.</p>`; return; }
  if (cibleActive.robe) {
    const c = cibleActive, estMonte = monte === c;
    // À cheval : actions de monte (Sauter / Descendre). Au sol : s'occuper du cheval.
    const actions = estMonte
      ? `<button class="bouton bouton-rodeo" data-cheval="sauter">🦘 Sauter</button>
         <button class="bouton bouton-secondaire" data-cheval="monter">🛑 Descendre</button>`
      : `<button class="bouton" data-cheval="nourrir">🌾 Nourrir</button>
         <button class="bouton" data-cheval="brosser">🧽 Brosser</button>
         <button class="bouton" data-cheval="jouer">🎾 Jouer</button>
         <button class="bouton bouton-rodeo" data-cheval="monter">🏇 Monter</button>
         <button class="bouton bouton-secondaire" data-cheval="relooker">🎨 Relooker</button>`;
    p.innerHTML = `
      <div class="pc-tete"><div><b>${c.nom}</b> <span class="pc-sous">${estPoulain(c) ? "🐣 Poulain (" + c.age + " j)" : "Adulte (" + c.age + " j)"}</span></div></div>
      <div class="pc-barres" id="pc-barres"></div>
      <div class="pc-actions">${actions}</div>`;
    majBarres(c);
  } else {
    const s = cibleActive;
    const lib = { dormir: "🌙 Dormir (jour suivant)", boutique: "🛒 Entrer dans la sellerie" }[s.type];
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
      if (etat.foin <= 0) { message("🌾 Plus de foin ! Va à la sellerie."); return; }
      etat.foin--; c.faim = borner(c.faim + 35); c.bonheur = borner(c.bonheur + 6); etat.pieces += 2;
      etat.actionsDepuisDodo++; etat.stats.nourrir++; gagnerXP(3); animAction(c, "nourrir"); message(`${c.nom} a mangé du bon foin ! 🌾`); break;
    case "brosser":
      c.proprete = borner(c.proprete + 40); c.bonheur = borner(c.bonheur + 12); etat.pieces += 2;
      etat.actionsDepuisDodo++; etat.stats.brosser++; gagnerXP(3); bond(c); message(`${c.nom} est tout beau et brillant ! ✨`); break;
    case "jouer":
      if (c.energie < 15) { message(`${c.nom} est trop fatigué pour jouer. 😴`); return; }
      c.bonheur = borner(c.bonheur + 22); c.energie = borner(c.energie - 16); c.faim = borner(c.faim - 8); etat.pieces += 3;
      etat.actionsDepuisDodo++; etat.stats.jouer++; gagnerXP(4); animAction(c, "jouer"); message(`${c.nom} s'est bien amusé ! 🎾`); break;
    case "monter":
      if (monte === c) { descendreCheval(c, false); return; }
      if (estPoulain(c)) { message(`${c.nom} est un poulain, trop petit pour être monté. 🐣`); return; }
      if (c.energie < 20) { message(`${c.nom} est trop fatigué pour te porter. 😴`); return; }
      monte = c; c.bonheur = borner(c.bonheur + 12); c.energie = borner(c.energie - 6); etat.actionsDepuisDodo++; etat.stats.monter++; gagnerXP(5); fatigueAcc = 0;
      message(`En selle sur ${c.nom} ! 🏇`);
      idPanneau = null; majInteraction(); majHud(); return;
    case "sauter": sauter(); return;
    case "relooker": ouvrirRelooker(c); return;
  }
  majBarres(c); majHud();
}

// Saut d'obstacle (à cheval) : bond en avant qui franchit les haies (et toute collision).
function sauter() {
  if (!monte || sautEnCours || !sc) return;
  const c = monte;
  if (c.energie < 10) { message(`${c.nom} est trop fatigué pour sauter ! 😴`); return; }
  c.energie = borner(c.energie - 8); fatigueAcc = 0; etat.actionsDepuisDodo++; etat.stats.sauter++; gagnerXP(6);
  sautEnCours = true; moveTarget = null; suiviCheval = null;
  const dir = (joueurFacing === "left") ? -1 : 1;
  const cibleX = clamp(joueur.x + dir * 165, 40, WORLD.w - 40);
  sc.tweens.add({ targets: joueur, x: cibleX, duration: 560, ease: "Quad.easeOut", onComplete: () => { sautEnCours = false; } });
  sautAnim.h = 0;
  sc.tweens.add({ targets: sautAnim, h: 1, duration: 290, yoyo: true, ease: "Sine.easeOut" });
  c.bonheur = borner(c.bonheur + 4); majHud();
}

// Descend du cheval (et l'écarte du joueur). epuise = descente forcée car énergie à 0.
function descendreCheval(c, epuise) {
  monte = null; moveTarget = null; enCourse = false; fatigueAcc = 0; sautEnCours = false;
  if (joueurSprite) joueurSprite.y = 0;
  if (joueurOmbre) joueurOmbre.setVisible(true);
  c.x = clamp(joueur.x + 135, 40, WORLD.w - 40);   // reste là où on descend (parcours inclus)
  c.y = clamp(joueur.y, 40, WORLD.h - 40);
  c.tx = c.x; c.ty = c.y; c.prochainPas = 0;
  if (c.obj) { c.obj.x = c.x; c.obj.y = c.y; }
  idPanneau = null; majInteraction(); majHud();
  message(epuise ? `${c.nom} est épuisé, laisse-le se reposer ! 😴` : `Tu descends de ${c.nom}. 🙂`);
}

// Petit sursaut : on anime le CORPS (local au conteneur), pas le conteneur lui-même,
// car l'update réécrit c.obj.y à chaque frame quand le joueur est proche.
function bond(c) {
  if (c.corpsT && sc) sc.tweens.add({
    targets: c.corpsT, y: -12, duration: 130, yoyo: true, ease: "Quad.easeOut",
    onComplete: () => { if (c.corpsT) c.corpsT.y = 0; },
  });
}

// Petite texture ronde « miette » (particule de nourriture), créée une seule fois.
function assurerMiette() {
  if (!sc || sc.textures.exists("miette")) return;
  const g = sc.add.graphics();
  g.fillStyle(0xe8b34a, 1); g.fillCircle(5, 5, 5);
  g.fillStyle(0xc98a2e, 1); g.fillCircle(5, 5, 2.4);
  g.generateTexture("miette", 10, 10); g.destroy();
}

// Animation d'action distincte selon le type (nourrir / jouer). Particules en
// coordonnées MONDE (hors conteneur), corps animé en LOCAL (non écrasé par l'update).
function animAction(c, type) {
  if (!c.obj || !c.corpsT || !sc) return;
  const x = c.x, y = c.y;
  if (type === "nourrir") {
    // hochement « il mange » : le corps plonge deux fois vers le sol
    sc.tweens.add({
      targets: c.corpsT, y: 7, duration: 120, yoyo: true, repeat: 1, ease: "Sine.easeInOut",
      onComplete: () => { if (c.corpsT) c.corpsT.y = 0; },
    });
    assurerMiette();
    for (let i = 0; i < 5; i++) {
      const p = sc.add.image(x + aleatoire(-20, 20), y - 36, "miette")
        .setDepth(99998).setScale(aleatoire(7, 12) / 10);
      sc.tweens.add({
        targets: p, y: p.y + aleatoire(16, 30), alpha: 0, duration: aleatoire(420, 700),
        ease: "Quad.easeIn", onComplete: () => p.destroy(),
      });
    }
  } else if (type === "jouer") {
    // bond joyeux plus ample + petits cœurs colorés qui montent
    sc.tweens.add({
      targets: c.corpsT, y: -24, duration: 210, yoyo: true, ease: "Quad.easeOut",
      onComplete: () => { if (c.corpsT) c.corpsT.y = 0; },
    });
    const teintes = [0xff7eb6, 0x7fd06f, 0xffd24a];
    for (let i = 0; i < 5; i++) {
      const h = sc.add.image(x + aleatoire(-26, 26), y - 42, "coeur")
        .setDepth(99998).setScale(aleatoire(7, 11) / 10).setTint(teintes[i % teintes.length]);
      sc.tweens.add({
        targets: h, y: h.y - aleatoire(46, 80), alpha: 0, duration: aleatoire(600, 900),
        ease: "Sine.easeOut", onComplete: () => h.destroy(),
      });
    }
  }
}

function jourSuivant() {
  if (nuitEnCours) return;
  // Empêche d'enchaîner les nuits : il faut s'être occupé d'un cheval depuis le dernier dodo.
  if ((etat.actionsDepuisDodo || 0) === 0) {
    message("Tu viens de te lever ! Occupe-toi d'abord de tes chevaux. 🐴");
    return;
  }
  nuitEnCours = true; moveTarget = null; message("🌙 La nuit tombe…");
  // Voile plein écran en HTML (immunisé au zoom/scroll de la caméra).
  const v = $("nuit-voile");
  if (v) {
    v.style.transition = "opacity 1s ease";
    v.style.opacity = "0.78";                                  // la nuit tombe
    setTimeout(appliquerJour, 1150);                           // au plus sombre : on passe le jour
    setTimeout(() => { v.style.opacity = "0"; }, 1850);        // le soleil revient
    setTimeout(() => { nuitEnCours = false; }, 2900);
  } else { appliquerJour(); nuitEnCours = false; }
}

function appliquerJour() {
  etat.jour++; etat.pieces += 5; etat.actionsDepuisDodo = 0; gagnerXP(3);
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
  const bebe = tenterNaissance();
  majHud(); sauvegarder();
  if (bebe) message(`🐣 Bonne nouvelle ! Un poulain est né : ${bebe.nom} ! 💕`);
  else if (negliges.length) message(`🌅 Jour ${etat.jour}. Occupe-toi de ${listeFr(negliges)} !`);
  else message(`🌅 Jour ${etat.jour} : tout le monde a bien dormi. 🐴 (+5 💰)`);
}

// Reproduction : deux chevaux adultes HEUREUX peuvent donner un poulain pendant la
// nuit. Garde-fous : place libre dans le corral, un seul poulain à la fois, et un
// délai (cooldown) entre deux naissances pour éviter l'explosion de population.
function tenterNaissance() {
  const adultesHeureux = etat.chevaux.filter((c) => !estPoulain(c) && c.bonheur >= 80);
  const dejaPoulain = etat.chevaux.some(estPoulain);
  const placeLibre = etat.chevaux.length < etat.boxes;
  const cooldownOk = (etat.jour - (etat.dernierNaissance || 0)) >= 3;
  if (adultesHeureux.length < 2 || dejaPoulain || !placeLibre || !cooldownOk) return null;
  const parent = choisir(adultesHeureux);
  // robe héritée d'un des parents heureux
  const bebe = nouveauCheval({ age: 0, robe: choisir(adultesHeureux).robe });
  bebe.x = clamp(parent.x + aleatoire(-50, 50), CORRAL.x + 60, CORRAL.x + CORRAL.w - 60);
  bebe.y = clamp(parent.y + aleatoire(-50, 50), CORRAL.y + 60, CORRAL.y + CORRAL.h - 60);
  bebe.tx = bebe.x; bebe.ty = bebe.y;
  etat.chevaux.push(bebe);
  etat.dernierNaissance = etat.jour;
  etat.stats.naissances++;
  if (sc) { creerObjCheval(bebe); animAction(bebe, "jouer"); }   // petite fête de naissance
  return bebe;
}

// Liste « à la française » : "A", "A et B", "A, B et C", "A, B, C et D"…
function listeFr(arr) {
  if (arr.length <= 1) return arr.join("");
  return arr.slice(0, -1).join(", ") + " et " + arr[arr.length - 1];
}

/* ===================== Modale / sellerie / relooking ===================== */

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
  ouvrirModale("🛒 Sellerie", html);
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
  placementDecor = d; ghostCote = 1;
  fermerModale();
  if (sc) {
    if (ghostDecor) ghostDecor.destroy();
    ghostDecor = sc.add.image(joueur.x, joueur.y, d.sprite).setOrigin(0.5, 0.95).setScale(1.2).setAlpha(0.6).setDepth(99999);
  }
  majHud(); idPanneau = null; majInteraction();
  message(`${d.nom} acheté ! Promène-toi et touche « ✅ Poser ici ».`);
}

// Position de pose courante = celle du fantôme (à côté du joueur).
function ghostXY() {
  const x = joueur.x + ghostCote * 60, y = joueur.y + 6;
  return { x: clamp(x, 40, WORLD.w - 40), y: clamp(y, 70, WORLD.h - 30) };
}

// Règles de placement. Retourne null si OK, sinon un message d'erreur.
function placementInterdit(d, x, y) {
  for (const s of STATIONS) {
    if (x > s.x - 80 && x < s.x + 80 && y > s.y - 150 && y < s.y + 24) return "🏠 Pas sur un bâtiment !";
  }
  const dansCorral = x > CORRAL.x && x < CORRAL.x + CORRAL.w && y > CORRAL.y && y < CORRAL.y + CORRAL.h;
  if (dansCorral && d.id !== "abreuvoir") return "🐴 Les arbres et buissons gênent les chevaux dans le paddock !";
  return null;
}

// Pose la déco à l'endroit du fantôme (si l'emplacement est autorisé).
function poserDecor() {
  if (!placementDecor) return;
  const { x, y } = ghostXY();
  const err = placementInterdit(placementDecor, x, y);
  if (err) { message(err); return; }
  etat.decors.push({ id: placementDecor.id, x, y });
  etat.stats.decors++; gagnerXP(4);
  etat.chevaux.forEach((c) => (c.bonheur = borner(c.bonheur + 5)));
  const nom = placementDecor.nom; placementDecor = null;
  if (ghostDecor) { ghostDecor.destroy(); ghostDecor = null; }
  placerDecors(); sauvegarder(); majHud(); idPanneau = "maj"; majInteraction();
  message(`${nom} installé ! ✨`);
}

function annulerPlacement() {
  if (!placementDecor) return;
  etat.pieces += placementDecor.prix;   // remboursé
  placementDecor = null;
  if (ghostDecor) { ghostDecor.destroy(); ghostDecor = null; }
  majHud(); idPanneau = "maj"; majInteraction();
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

function ouvrirObjectifs() {
  const niv = etat.niveau || 1, xp = etat.xp || 0;
  const dansNiv = xp - (niv - 1) * XP_NIVEAU;
  const pct = Math.max(0, Math.min(100, Math.round((dansNiv / XP_NIVEAU) * 100)));
  const idxPalier = Math.min(etat.palier || 0, PALIERS.length - 1);
  const palier = PALIERS[idxPalier];
  const liste = palier.objectifs;
  const faits = liste.filter((o) => etat.objectifsFaits[o.id]).length;
  const tousFinis = idxPalier === PALIERS.length - 1 && faits === liste.length;
  const lignes = liste.map((o) => {
    const ok = !!etat.objectifsFaits[o.id];
    return `<div class="obj-ligne ${ok ? "obj-ok" : ""}">
      <span class="obj-coche">${ok ? "✅" : "⬜"}</span>
      <span class="obj-txt"><b>${o.nom}</b><small>${o.desc}</small></span>
      <span class="obj-xp">+${o.xp}&nbsp;XP</span></div>`;
  }).join("");
  ouvrirModale("🎯 Objectifs", `
    <div class="niveau-bloc">
      <div class="niveau-haut"><b>⭐ Niveau ${niv}</b><span>${dansNiv}/${XP_NIVEAU} XP</span></div>
      <div class="xp-barre"><div class="xp-remplissage" style="width:${pct}%"></div></div>
      <p class="niveau-sous">Palier ${idxPalier + 1}/${PALIERS.length} — « ${palier.nom} » · ${faits}/${liste.length} accomplis</p>
    </div>
    ${tousFinis ? `<p class="obj-fini">🏆 Bravo, tu as accompli tous les paliers&nbsp;! Continue de jouer pour monter en niveau.</p>` : ""}
    <div class="obj-liste">${lignes}</div>`);
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
      <p><b>🦘 Sauter / parcours :</b> à cheval, approche un obstacle puis touche <b>« Sauter »</b> pour le
      franchir (sinon le cheval est bloqué devant). Il y a la <b>🏇 carrière</b> (à droite du paddock) et
      un grand <b>🌲 parcours de cross</b> qui fait le tour de la map (rondins). Sauter fatigue le cheval.</p>
      <p><b>🏃 Courir :</b> tape <b>deux fois rapidement</b> vers un endroit et le personnage (ou le cheval) court !</p>
      <p><b>🏪 Sellerie :</b> foin, décos, adopter des chevaux. Après l'achat d'une déco, promène-toi où tu veux puis touche <b>« ✅ Poser ici »</b>.</p>
      <p><b>🏡 Maison :</b> dormir passe au jour suivant (occupe-toi d'abord d'un cheval). <b>🧍 (en haut) :</b> change ton personnage.</p>
      <p>💰 Tu gagnes des sous en t'occupant de tes chevaux. 💾 Sauvegarde automatique.</p>
    </div>`);
}

/* ===================== Lancement ===================== */

document.addEventListener("DOMContentLoaded", init);
