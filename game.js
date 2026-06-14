/* =========================================================
   🤠 Mon Ranch du Far West — version 3D
   Jeu de simulation d'élevage de chevaux pour enfants (9-10 ans).
   Monde 3D explorable rendu avec Babylon.js (chargé via CDN).
   100% statique : sauvegarde dans le navigateur.
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
  pieceDepart: 60, foinDepart: 6, boxesDepart: 4,
  prixBotteFoin: 4, prixBox: 80, ageAdulte: 5,
  baisseParJour: { faim: 25, energie: 18, proprete: 16, bonheur: 12 },
};

/* ===================== Monde 3D (coordonnées) ===================== */

const VIT = 7;                  // vitesse du joueur (m/s)
const CORRAL = { x1: 3, x2: 27, z1: -15, z2: 15 }; // enclos des chevaux

const STATIONS = [
  { id: "maison", type: "dormir", x: -14, z: -10, emoji: "🏠", label: "Dormir" },
  { id: "magasin", type: "boutique", x: -14, z: 2, emoji: "🏪", label: "Magasin" },
  { id: "grange", type: "elevage", x: -14, z: 13, emoji: "🛖", label: "Élevage" },
];

const SLOTS_DECOR = [
  { x: -22, z: -12 }, { x: -22, z: 6 }, { x: -7, z: -15 }, { x: -2, z: 17 },
  { x: -20, z: 19 }, { x: -26, z: -2 }, { x: 31, z: -16 }, { x: 31, z: 17 },
];

/* ===================== État de la partie ===================== */

let etat = null;
const CLE_SAUVEGARDE = "mon-ranch-far-west-3d";

/* ===================== Utilitaires ===================== */

function aleatoire(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choisir(liste) { return liste[aleatoire(0, liste.length - 1)]; }
function borner(v) { return Math.max(0, Math.min(100, Math.round(v))); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function $(id) { return document.getElementById(id); }
function trouverRobe(id) { return ROBES.find((r) => r.id === id) || ROBES[0]; }

function positionCorral() {
  return { x: aleatoire(CORRAL.x1 + 2, CORRAL.x2 - 2), z: aleatoire(CORRAL.z1 + 2, CORRAL.z2 - 2) };
}

/* ===================== Création des chevaux ===================== */

let compteurId = 1;

function nouveauCheval(options = {}) {
  const race = options.race || choisir(RACES);
  const p = positionCorral();
  return {
    id: compteurId++,
    nom: options.nom || choisir(NOMS_CHEVAUX),
    race: race.nom, emoji: race.emoji,
    robe: options.robe || choisir(ROBES).id,
    age: options.age != null ? options.age : aleatoire(5, 9),
    faim: 70, energie: 80, proprete: 75, bonheur: 80,
    entrainement: options.entrainement || 0,
    concoursFait: false,
    wx: p.x, wz: p.z, tx: p.x, tz: p.z, prochainPas: 0,
    mesh: null, moodMat: null,
  };
}

function estPoulain(c) { return c.age < CONFIG.ageAdulte; }
function moyenneBesoins(c) { return (c.faim + c.energie + c.proprete + c.bonheur) / 4; }

/* ===================== Sauvegarde / chargement ===================== */

function sauvegarder() {
  etat.compteurId = compteurId;
  try {
    // On ne sérialise pas les objets Babylon (mesh, matériaux).
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etat, (k, v) =>
      (k === "mesh" || k === "moodMat") ? undefined : v));
  } catch (e) {}
}

function charger() {
  try { const b = localStorage.getItem(CLE_SAUVEGARDE); return b ? JSON.parse(b) : null; }
  catch (e) { return null; }
}

function normaliserChevaux() {
  etat.chevaux.forEach((c) => {
    if (!c.robe) c.robe = choisir(ROBES).id;
    if (c.wx == null) { const p = positionCorral(); c.wx = p.x; c.wz = p.z; }
    c.tx = c.wx; c.tz = c.wz; c.prochainPas = 0; c.mesh = null; c.moodMat = null;
  });
}

/* ===================== Démarrage ===================== */

function nouvellePartie(nomRanch) {
  compteurId = 1;
  etat = {
    nomRanch, pieces: CONFIG.pieceDepart, foin: CONFIG.foinDepart, jour: 1,
    boxes: CONFIG.boxesDepart,
    chevaux: [nouveauCheval({ nom: "Éclair", race: RACES[0], robe: "palomino" })],
    decors: [], quetesFaites: [], stats: { rodeosGagnes: 0, poulainsNes: 0 },
  };
  sauvegarder();
  demarrerJeu();
}

function continuerPartie() {
  const sauv = charger();
  if (!sauv) { $("msg-accueil").textContent = "Aucune partie sauvegardée. Commence une nouvelle aventure !"; return; }
  etat = sauv;
  if (!etat.decors) etat.decors = [];
  if (!etat.quetesFaites) etat.quetesFaites = [];
  if (!etat.stats) etat.stats = { rodeosGagnes: 0, poulainsNes: 0 };
  normaliserChevaux();
  compteurId = sauv.compteurId || (etat.chevaux.length + 1);
  demarrerJeu();
}

function demarrerJeu() {
  $("ecran-accueil").classList.add("cache");
  $("ecran-jeu").classList.remove("cache");
  $("aff-nom-haras").textContent = etat.nomRanch;
  normaliserChevaux();
  majHud();
  if (!sceneCreee) { sceneCreee = true; initScene(); }
}

/* ===================== Niveau / HUD ===================== */

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
  el.textContent = texte; el.classList.remove("cache");
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  clearTimeout(timerMessage);
  timerMessage = setTimeout(() => el.classList.add("cache"), 2800);
}

/* ===================== Scène Babylon ===================== */

let sceneCreee = false;
let engine, scene, camera, playerRoot, ringSel;
let moveTarget = null, pendingInteract = null;
let cibleActive = null, idPanneauAffiche = null;
let decorMeshes = [];

const touches = { haut: false, bas: false, gauche: false, droite: false };

function couleur(hex) { return BABYLON.Color3.FromHexString(hex); }

function materiau(nom, hex, emissif) {
  const m = new BABYLON.StandardMaterial(nom, scene);
  m.diffuseColor = couleur(hex);
  m.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
  if (emissif) m.emissiveColor = couleur(emissif);
  return m;
}

function initScene() {
  const cv = $("monde");
  engine = new BABYLON.Engine(cv, true, { preserveDrawingBuffer: true, stencil: true });
  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.99, 0.80, 0.55, 1);
  scene.ambientColor = new BABYLON.Color3(1, 1, 1);
  scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
  scene.fogColor = new BABYLON.Color3(0.96, 0.74, 0.52);
  scene.fogStart = 55; scene.fogEnd = 95;

  // Caméra de suivi (3e personne), non contrôlable pour rester simple.
  camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 17, -16), scene);
  camera.inputs.clear();
  camera.fov = 0.9;

  const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0.3, 1, 0.2), scene);
  hemi.intensity = 0.95;
  hemi.groundColor = new BABYLON.Color3(0.7, 0.55, 0.4);
  const dir = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-0.6, -1, -0.5), scene);
  dir.position = new BABYLON.Vector3(25, 45, 25); dir.intensity = 0.45;

  // Sol désertique
  const sol = BABYLON.MeshBuilder.CreateGround("sol", { width: 90, height: 90 }, scene);
  sol.material = materiau("matSol", "#e8c48a");

  creerCorral();
  decorsFond();
  STATIONS.forEach(creerMeshStation);
  creerJoueur();
  etat.chevaux.forEach(creerMeshCheval);
  placerDecors();

  // Anneau de sélection (sous la cible active)
  ringSel = BABYLON.MeshBuilder.CreateTorus("ring", { diameter: 3.6, thickness: 0.22, tessellation: 28 }, scene);
  ringSel.rotation.x = Math.PI / 2;
  ringSel.material = materiau("matRing", "#e8722d", "#e8722d");
  ringSel.isPickable = false; ringSel.setEnabled(false);

  scene.onPointerObservable.add(onPointer);

  engine.runRenderLoop(() => { if (!$("ecran-jeu").classList.contains("cache")) { tickMonde(); scene.render(); } });
  window.addEventListener("resize", () => engine.resize());
  engine.resize();
}

function creerCorral() {
  const cx = (CORRAL.x1 + CORRAL.x2) / 2, cz = (CORRAL.z1 + CORRAL.z2) / 2;
  const herbe = BABYLON.MeshBuilder.CreateGround("herbe",
    { width: CORRAL.x2 - CORRAL.x1, height: CORRAL.z2 - CORRAL.z1 }, scene);
  herbe.position.set(cx, 0.02, cz);
  herbe.material = materiau("matHerbe", "#bfe089");

  const matBois = materiau("matBois", "#8a5a3b");
  const poteaux = [];
  const pas = 2.2;
  for (let x = CORRAL.x1; x <= CORRAL.x2; x += pas) { poteaux.push([x, CORRAL.z1]); poteaux.push([x, CORRAL.z2]); }
  for (let z = CORRAL.z1; z <= CORRAL.z2; z += pas) { poteaux.push([CORRAL.x1, z]); poteaux.push([CORRAL.x2, z]); }
  poteaux.forEach(([x, z], i) => {
    const p = BABYLON.MeshBuilder.CreateBox("pot" + i, { width: 0.2, depth: 0.2, height: 1.2 }, scene);
    p.position.set(x, 0.6, z); p.material = matBois; p.isPickable = false;
  });
}

function billboardEmoji(emoji, x, y, z, taille) {
  const dt = new BABYLON.DynamicTexture("dt", { width: 160, height: 160 }, scene, true);
  dt.hasAlpha = true;
  const ctx2 = dt.getContext();
  ctx2.clearRect(0, 0, 160, 160);
  ctx2.font = "120px serif"; ctx2.textAlign = "center"; ctx2.textBaseline = "middle";
  ctx2.fillText(emoji, 80, 90);
  dt.update();
  const mat = new BABYLON.StandardMaterial("matbb", scene);
  mat.diffuseTexture = dt; mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
  mat.useAlphaFromDiffuseTexture = true; mat.backFaceCulling = false;
  mat.diffuseTexture.hasAlpha = true;
  const pl = BABYLON.MeshBuilder.CreatePlane("bb", { size: taille }, scene);
  pl.position.set(x, y, z); pl.material = mat;
  pl.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  pl.isPickable = false;
  return pl;
}

function decorsFond() {
  // Quelques cactus et rochers + mesas lointaines, juste pour l'ambiance.
  const matCactus = materiau("matCactus", "#5f9a4a");
  const cactus = (x, z) => {
    const t = new BABYLON.TransformNode("cac", scene);
    const corps = BABYLON.MeshBuilder.CreateCylinder("cc", { height: 2.4, diameter: 0.7 }, scene);
    corps.position.y = 1.2; corps.parent = t; corps.material = matCactus; corps.isPickable = false;
    const bras = BABYLON.MeshBuilder.CreateSphere("cb", { diameter: 0.7 }, scene);
    bras.position.set(0.45, 1.7, 0); bras.parent = t; bras.material = matCactus; bras.isPickable = false;
    t.position.set(x, 0, z);
  };
  [[-24, -18], [-30, 8], [-10, 22], [33, 4], [20, -22]].forEach(([x, z]) => cactus(x, z));

  const matMesa = materiau("matMesa", "#bd6a44");
  [[-38, -30, 10], [40, 30, 12], [10, 42, 8]].forEach(([x, z, h]) => {
    const m = BABYLON.MeshBuilder.CreateBox("mesa", { width: 14, depth: 10, height: h }, scene);
    m.position.set(x, h / 2, z); m.material = matMesa; m.isPickable = false;
  });
}

function creerMeshStation(s) {
  const root = new BABYLON.TransformNode("st" + s.id, scene);
  root.position.set(s.x, 0, s.z);
  const mur = BABYLON.MeshBuilder.CreateBox("mur" + s.id, { width: 3, depth: 3, height: 2.6 }, scene);
  mur.position.y = 1.3; mur.parent = root; mur.material = materiau("matMur" + s.id, "#f6e2bd");
  mur.metadata = { type: "station", ref: s };
  const toit = BABYLON.MeshBuilder.CreateCylinder("toit" + s.id,
    { diameterTop: 0, diameterBottom: 4.4, height: 1.6, tessellation: 4 }, scene);
  toit.position.y = 3.4; toit.rotation.y = Math.PI / 4; toit.parent = root;
  toit.material = materiau("matToit" + s.id, "#b5572b");
  toit.metadata = { type: "station", ref: s };
  billboardEmoji(s.emoji, s.x, 5.2, s.z, 2.4);
  s.mesh = root;
}

function creerJoueur() {
  playerRoot = new BABYLON.TransformNode("player", scene);
  playerRoot.position.set(-6, 0, 2);
  const corps = BABYLON.MeshBuilder.CreateCylinder("pcorps", { height: 1.1, diameterTop: 0.55, diameterBottom: 0.75 }, scene);
  corps.position.y = 1.0; corps.parent = playerRoot; corps.material = materiau("matCorps", "#4aa3b8"); corps.isPickable = false;
  const tete = BABYLON.MeshBuilder.CreateSphere("ptete", { diameter: 0.6 }, scene);
  tete.position.y = 1.85; tete.parent = playerRoot; tete.material = materiau("matTete", "#f0c9a0"); tete.isPickable = false;
  const bord = BABYLON.MeshBuilder.CreateCylinder("pbord", { height: 0.07, diameter: 1.1 }, scene);
  bord.position.y = 2.05; bord.parent = playerRoot; bord.material = materiau("matChapeau", "#7a5230"); bord.isPickable = false;
  const haut = BABYLON.MeshBuilder.CreateCylinder("phaut", { height: 0.3, diameter: 0.6 }, scene);
  haut.position.y = 2.2; haut.parent = playerRoot; haut.material = bord.material; haut.isPickable = false;
}

function creerMeshCheval(c) {
  if (c.mesh) return;
  const root = new BABYLON.TransformNode("h" + c.id, scene);
  const mat = materiau("matH" + c.id, trouverRobe(c.robe).couleur);
  const matFonce = materiau("matHf" + c.id, "#3a2c20");
  const ajout = (mesh, m) => { mesh.parent = root; mesh.material = m || mat; mesh.metadata = { type: "horse", ref: c }; return mesh; };

  ajout(BABYLON.MeshBuilder.CreateBox("corps", { width: 1.7, height: 0.9, depth: 0.75 }, scene)).position.set(0, 1.05, 0);
  ajout(BABYLON.MeshBuilder.CreateBox("cou", { width: 0.45, height: 0.9, depth: 0.5 }, scene)).position.set(0.85, 1.55, 0);
  const tete = ajout(BABYLON.MeshBuilder.CreateBox("tete", { width: 0.7, height: 0.5, depth: 0.45 }, scene));
  tete.position.set(1.15, 1.9, 0);
  // 4 pattes
  [[0.6, 0.32], [0.6, -0.32], [-0.6, 0.32], [-0.6, -0.32]].forEach(([dx, dz], i) => {
    ajout(BABYLON.MeshBuilder.CreateBox("patte" + i, { width: 0.22, height: 1.0, depth: 0.22 }, scene), matFonce)
      .position.set(dx, 0.5, dz);
  });
  ajout(BABYLON.MeshBuilder.CreateBox("queue", { width: 0.18, height: 0.7, depth: 0.18 }, scene), matFonce)
    .position.set(-0.95, 1.15, 0);

  // Bulle d'humeur au-dessus
  const moodMat = materiau("matMood" + c.id, "#7fae5a", "#7fae5a");
  const mood = BABYLON.MeshBuilder.CreateSphere("mood" + c.id, { diameter: 0.45 }, scene);
  mood.position.y = 2.6; mood.parent = root; mood.material = moodMat; mood.isPickable = false;

  if (estPoulain(c)) root.scaling.setAll(0.6);
  root.position.set(c.wx, 0, c.wz);
  c.mesh = root; c.moodMat = moodMat;
}

function placerDecors() {
  decorMeshes.forEach((m) => m.dispose());
  decorMeshes = [];
  etat.decors.forEach((id, i) => {
    const slot = SLOTS_DECOR[i % SLOTS_DECOR.length];
    const d = DECORS.find((x) => x.id === id);
    if (d && slot) decorMeshes.push(billboardEmoji(d.emoji, slot.x, 1.4, slot.z, 2.6));
  });
}

/* ===================== Boucle 3D ===================== */

function faceDir(dx, dz) {
  if (dx || dz) playerRoot.rotation.y = Math.atan2(dx, dz);
}

function tickMonde() {
  const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
  const pr = playerRoot.position;

  // Déplacement
  let vx = 0, vz = 0;
  if (touches.haut) vz += 1;
  if (touches.bas) vz -= 1;
  if (touches.gauche) vx -= 1;
  if (touches.droite) vx += 1;

  if (vx || vz) {
    moveTarget = null; pendingInteract = null;
    const n = Math.hypot(vx, vz);
    pr.x += (vx / n) * VIT * dt; pr.z += (vz / n) * VIT * dt; faceDir(vx, vz);
  } else if (moveTarget) {
    const dx = moveTarget.x - pr.x, dz = moveTarget.z - pr.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.5) {
      moveTarget = null;
      if (pendingInteract) { const c = pendingInteract; pendingInteract = null; interagir(c); }
    } else { pr.x += (dx / d) * VIT * dt; pr.z += (dz / d) * VIT * dt; faceDir(dx, dz); }
  }
  pr.x = clamp(pr.x, -34, 34); pr.z = clamp(pr.z, -34, 34);

  // Chevaux : balade + humeur
  const maintenant = performance.now();
  etat.chevaux.forEach((c) => {
    if (!c.mesh) return;
    const actif = cibleActive === c;
    if (!actif) {
      if (maintenant > c.prochainPas) { const p = positionCorral(); c.tx = p.x; c.tz = p.z; c.prochainPas = maintenant + aleatoire(2500, 6000); }
      const dx = c.tx - c.mesh.position.x, dz = c.tz - c.mesh.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.2) {
        c.mesh.position.x += (dx / d) * 1.6 * dt; c.mesh.position.z += (dz / d) * 1.6 * dt;
        c.mesh.rotation.y = Math.atan2(dx, dz);
        c.wx = c.mesh.position.x; c.wz = c.mesh.position.z;
      }
    }
    const m = moyenneBesoins(c);
    const col = m > 60 ? "#7fae5a" : m > 35 ? "#f4b942" : "#f0676a";
    c.moodMat.diffuseColor = couleur(col); c.moodMat.emissiveColor = couleur(col);
  });

  // Caméra suit le joueur
  camera.position.set(pr.x, pr.y + 18, pr.z - 17);
  camera.setTarget(new BABYLON.Vector3(pr.x, 1.2, pr.z));

  majInteraction();
}

function distPlayer(x, z) {
  return Math.hypot(playerRoot.position.x - x, playerRoot.position.z - z);
}

function majInteraction() {
  let meilleur = null, dmin = Infinity;
  STATIONS.forEach((s) => { const d = distPlayer(s.x, s.z); if (d < 5 && d < dmin) { dmin = d; meilleur = s; } });
  etat.chevaux.forEach((c) => { if (!c.mesh) return; const d = distPlayer(c.mesh.position.x, c.mesh.position.z); if (d < 4 && d < dmin) { dmin = d; meilleur = c; } });

  cibleActive = meilleur;
  const id = meilleur ? (meilleur.race ? "c" + meilleur.id : "s" + meilleur.id) : null;
  if (id !== idPanneauAffiche) { idPanneauAffiche = id; construirePanneau(); }
  if (meilleur && meilleur.race) majBarresPanneau(meilleur);

  if (meilleur) {
    const x = meilleur.race ? meilleur.mesh.position.x : meilleur.x;
    const z = meilleur.race ? meilleur.mesh.position.z : meilleur.z;
    ringSel.position.set(x, 0.06, z); ringSel.setEnabled(true);
  } else ringSel.setEnabled(false);

  const station = meilleur && !meilleur.race;
  $("btn-action").classList.toggle("cache", !station);
  if (station) $("btn-action").textContent = meilleur.emoji + " " + meilleur.label;
}

/* ===================== Entrées souris / tactile ===================== */

function posDe(ref) {
  if (ref.race) return { x: ref.mesh.position.x, z: ref.mesh.position.z };
  return { x: ref.x, z: ref.z };
}

function approche(ref) {
  const rp = posDe(ref);
  const pr = playerRoot.position;
  const dx = pr.x - rp.x, dz = pr.z - rp.z;
  const d = Math.hypot(dx, dz) || 1;
  const recul = ref.race ? 2.4 : 4;
  moveTarget = { x: rp.x + (dx / d) * recul, z: rp.z + (dz / d) * recul };
  pendingInteract = ref.race ? null : ref; // bâtiment : on l'ouvre à l'arrivée
}

function onPointer(pi) {
  if (pi.type !== BABYLON.PointerEventTypes.POINTERTAP) return;
  if (!$("modale").classList.contains("cache")) return;
  const pick = scene.pick(scene.pointerX, scene.pointerY);
  if (!pick || !pick.hit) return;
  const md = pick.pickedMesh && pick.pickedMesh.metadata;
  if (md && md.ref) approche(md.ref);
  else if (pick.pickedPoint) { moveTarget = { x: pick.pickedPoint.x, z: pick.pickedPoint.z }; pendingInteract = null; }
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
    p.innerHTML = `<div class="pc-station"><span class="pc-emoji">${s.emoji}</span>
      <button class="bouton bouton-geant" data-station="${s.type}">${libelle}</button></div>`;
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
  if (cible.race) return; // cheval : le panneau suffit
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
    case "concours": lancerConcours(c); break;
  }
  majBarresPanneau(c); majHud(); verifierQuetes();
}

function lancerConcours(c) {
  if (estPoulain(c)) { message(`${c.nom} est trop jeune pour le rodéo. 🐣`); return; }
  if (c.concoursFait) { message(`${c.nom} a déjà couru aujourd'hui. Reviens demain ! 🌙`); return; }
  if (c.energie < 30) { message(`${c.nom} est trop fatigué pour le rodéo. 😴`); return; }
  if (c.bonheur < 35) { message(`${c.nom} n'est pas d'humeur. Joue avec lui d'abord ! 😟`); return; }
  c.concoursFait = true; c.energie = borner(c.energie - 30); c.faim = borner(c.faim - 10);
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
    if (estPoulain(c) && c.mesh) { c.mesh.scaling.setAll(c.age >= CONFIG.ageAdulte ? 1 : 0.6); }
    if (c.bonheur < 25 || c.faim < 20) negliges.push(c.nom);
  });
  majHud(); verifierQuetes();
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

/* ===================== Modale ===================== */

function ouvrirModale(titre, html) {
  $("modale-titre").innerHTML = titre; $("modale-corps").innerHTML = html;
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
    <h3>🎨 Décorations pour le ranch</h3><div class="grille-decor">`;
  DECORS.forEach((d) => {
    const possede = etat.decors.includes(d.id);
    html += `<button class="carte-decor ${possede ? "possede" : ""}" data-decor="${d.id}" ${possede ? "disabled" : ""}>
      <span class="d-emoji">${d.emoji}</span><span>${d.nom}</span>
      <span class="d-prix">${possede ? "✅" : d.prix + " 💰"}</span></button>`;
  });
  html += `</div><h3>🐴 Acheter et personnaliser un cheval</h3>`;
  if (!placeLibre) html += `<p>⚠️ Ton corral est plein ! Agrandis-le d'abord.</p>`;
  else html += `
    <div class="formulaire-achat">
      <label>Race :</label>
      <select id="achat-race">${RACES.map((r, i) => `<option value="${i}">${r.emoji} ${r.nom} — ${r.prix} 💰</option>`).join("")}</select>
      <label>Nom :</label>
      <input id="achat-nom" type="text" maxlength="14" placeholder="Un nom rigolo" />
      <label>Robe :</label>
      <div class="choix-robes">${ROBES.map((r, i) => `<label class="swatch"><input type="radio" name="robe" value="${r.id}" ${i === 0 ? "checked" : ""}/><span class="pastille" style="background:${r.couleur}"></span>${r.nom}</label>`).join("")}</div>
      <button class="bouton bouton-geant" data-boutique="cheval">🛒 Acheter ce cheval</button>
    </div>`;
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
    const c = nouveauCheval({ race: r, robe: radio ? radio.value : ROBES[0].id, nom });
    etat.chevaux.push(c); creerMeshCheval(c);
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
  placerDecors();
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
  else html += `
    <label>Premier parent :</label>
    <select id="parent1" class="select-large">${adultes.map((c) => `<option value="${c.id}">${c.emoji} ${c.nom}</option>`).join("")}</select>
    <label>Deuxième parent :</label>
    <select id="parent2" class="select-large">${adultes.map((c) => `<option value="${c.id}">${c.emoji} ${c.nom}</option>`).join("")}</select>
    <button class="bouton bouton-geant" data-elevage="go">🐣 Faire naître un poulain</button>`;
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
  etat.chevaux.push(poulain); creerMeshCheval(poulain); etat.stats.poulainsNes++;
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
      <p><b>Bienvenue au ranch, cow-girl ! 🤠</b> Ton ranch est en 3D : promène-toi et occupe-toi de tes chevaux.</p>
      <p><b>🚶 Se déplacer :</b></p>
      <ul>
        <li><b>Clique / touche</b> un endroit du sol pour y aller (le plus simple !),</li>
        <li>ou utilise les <b>flèches</b> du clavier (Z Q S D),</li>
        <li>ou la <b>manette ▲◀▶▼</b> en bas à gauche.</li>
      </ul>
      <p>Tu peux aussi <b>cliquer directement sur un cheval ou un bâtiment</b> pour aller le voir.</p>
      <p><b>🐴 S'occuper d'un cheval :</b> approche-toi, puis utilise les boutons en bas (🌾🧽🎾🤠🏆).
      La <b>bulle de couleur</b> au-dessus de lui montre son humeur : verte 😀, jaune 😐, rouge 😢.</p>
      <p><b>🏪 Magasin</b> : foin, décorations, nouveaux chevaux. <b>🛖 Élevage</b> : faire un poulain.
      <b>🏠 Maison</b> : dormir pour passer au jour suivant.</p>
      <p><b>🏆 Objectifs</b> (en haut) : réussis des défis pour des médailles et monter de niveau !</p>
      <p>💾 La partie se sauvegarde toute seule.</p>
    </div>`);
}

/* ===================== Entrées clavier / manette ===================== */

function init() {
  $("btn-commencer").addEventListener("click", () => nouvellePartie($("nom-haras").value.trim() || "Mon Ranch"));
  $("btn-charger").addEventListener("click", continuerPartie);
  $("nom-haras").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-commencer").click(); });
  if (charger()) $("msg-accueil").textContent = "Une partie existe : clique sur « Continuer ma partie » 🐴";

  $("btn-objectifs").addEventListener("click", ouvrirObjectifs);
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
    else if (btn.dataset.elevage) faireNaitre();
  });

  const map = { ArrowUp: "haut", ArrowDown: "bas", ArrowLeft: "gauche", ArrowRight: "droite",
                z: "haut", s: "bas", q: "gauche", d: "droite", w: "haut", a: "gauche" };
  document.addEventListener("keydown", (e) => {
    if (!$("modale").classList.contains("cache")) return;
    const dir = map[e.key];
    if (dir) { touches[dir] = true; e.preventDefault(); }
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

document.addEventListener("DOMContentLoaded", init);
