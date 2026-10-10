/* =========================================================
   GAME DEFINITION — "Mon Centre Équestre"
   ---------------------------------------------------------
   This file is the ENTIRE game: data + asset references.
   The engine (engine.js) contains no game content; it reads
   this `window.GAME` object.

   A horse-stable care game for kids aged 9–10 (French). You
   walk around your riding centre, look after your horses
   (feed, BRUSH the mud off their coat in a close-up, play,
   restyle), ride them on the cross-country loop, jump the
   show-jumping arena, grow the herd (foals are born when two
   happy adults sleep well) and decorate the place.

   All art is generated from tools/art/stable.cjs (SVG → WebP, CC0).
   Older saves of the pre-engine version are migrated (meta.legacySave).
   ========================================================= */

window.GAME = {
  /* ---- Identity, theming, UI strings (French) ---- */
  meta: {
    title: "Mon Centre Équestre",
    titleIcon: "horse",
    logo: "assets/img/logo.webp",
    splash: "assets/img/splash.webp",
    shortName: "Mon Centre",
    tagline: "Soigne, brosse et monte tes chevaux !",
    saveKey: "mon-centre-equestre",
    // Old (pre-engine) save → engine state. Horses keep their names, coats, ages and needs;
    // coins, hay, day, paddock size, decorations, stats and completed goals carry over.
    legacySave: { key: "mon-ranch-phaser", migrate: (o) => {
      if (!o || !Array.isArray(o.chevaux)) return null;
      const s = o.stats || {};
      return {
        placeName: o.nomRanch || "Mon Centre",
        player: { avatar: o.perso && o.perso.avatar === "garcon" ? "garcon" : "fille", name: (o.perso && o.perso.nom) || "" },
        coins: o.pieces || 0, resources: { foin: o.foin || 0 }, day: o.jour || 1, capacity: o.boxes || 4,
        creatures: o.chevaux.map((c) => ({
          id: c.id, name: c.nom, variant: c.robe, age: c.age,
          faim: c.faim, energie: c.energie, proprete: c.proprete, bonheur: c.bonheur, x: c.x, y: c.y,
        })),
        decors: (o.decors || []).filter((d) => d && typeof d === "object"),
        actionsSinceRest: o.actionsDepuisDodo || 0, lastBirth: o.dernierNaissance || 0,
        stats: { nourrir: s.nourrir || 0, brosser: s.brosser || 0, jouer: s.jouer || 0, ride: s.monter || 0, jump: s.sauter || 0,
                 births: s.naissances || 0, decor: s.decors || 0, trailVisit: s.crossVisite || 0 },
        goalsDone: o.objectifsFaits || {}, level: o.niveau || 1, idCounter: o.compteurId,
      };
    } },
    audience: { minAge: 9, notes: "kids 9–10, girls AND boys, cute but NOT manga, horses & riding, no scary content, light reading" },
    assetVersion: "v14",
    theme: { home: "#bfe6f5", play: "#7cbf5a", closeup: "#e9f6ff" },

    showCoins: true,
    coinIcon: "coin",
    showDay: false,                    // keep the HUD on one line (the morning toast says the day)

    namePrompt: { label: "Le nom de ton centre :", placeholder: "Les Écuries du Pré Vert" },
    startName: "Mon Centre",
    namePromptYou: "Ton prénom",
    createTitle: "Choisis ton cavalier",
    createOkLabel: "C'est parti !",
    startLabel: "Nouvelle partie",
    continueLabel: "Continuer ma partie",
    continueHint: "Tes chevaux t'attendent !",
    helpTitle: "{i:help} Comment jouer",
    ageUnit: " j", and: "et",

    nightMessage: "{i:moon} La nuit tombe sur le centre…",
    morningMessage: "{i:sparkle} Jour {day} : tout le monde a bien dormi !",
    neglectMessage: "{i:sparkle} Jour {day}. Occupe-toi de {names} !",
    restBlockedHint: "Tu viens de te lever ! Occupe-toi d'abord de tes chevaux.",
    idleHint: "Touche un cheval ou un bâtiment pour t'en occuper",
    notEnough: "Pas assez de pièces !",
    placeHint: "Promène-toi, puis pose {item} où tu veux.",
    placeHere: "Poser ici",
    cancel: "Annuler",
    boughtDecorMessage: "{name} acheté ! Promène-toi et touche « Poser ici ».",
    placedMessage: "{i:sparkle} {name} installé !",
    refundMessage: "Placement annulé, tu es remboursé.",
    noOnBuilding: "Pas sur un bâtiment !",
    noInHome: "Pas dans le paddock !",
    nameLabel: "Nom",
    confirm: "Valider",
    nameTaken: "Un cheval s'appelle déjà {name} !",
    strings: {
      closeLabel: "Fermer", soundLabel: "Son", coinsLabel: "Pièces", dayLabel: "Jour", levelLabel: "Niveau",
      noSave: "Aucune partie sauvegardée.", refreshLabel: "Rafraîchir",
      dismountFirst: "{i:saddle} Descends de ton cheval d'abord !", placeFirst: "{i:gift} Pose d'abord ta décoration !",
      goalComplete: "{i:goals} Objectif réussi : {name} !", goalsComplete: "{i:goals} {n} objectifs réussis !",
      levelUp: "{i:trophy} Bravo ! Tu passes au niveau {n} !", goalsTitle: "{i:goals} Objectifs",
      allGoalsDone: "Tu as réussi tous les objectifs !", goalsProgress: "{done}/{total} objectifs — réussis-les tous pour passer au niveau {next}",
      topLevel: "{i:trophy} Tu es au niveau maximum : champion !",
    },
  },

  /* ---- Illustrated UI icons (tools/art/stable.cjs → assets/ui/icons). Any text can embed {i:key}. ---- */
  icons: {
    star: "assets/ui/icons/star.webp", heart: "assets/ui/icons/heart.webp", heartEmpty: "assets/ui/icons/heartEmpty.webp",
    sound: "assets/ui/icons/sound.webp", soundOff: "assets/ui/icons/soundOff.webp", help: "assets/ui/icons/help.webp",
    avatar: "assets/ui/icons/avatar.webp", goals: "assets/ui/icons/goals.webp", close: "assets/ui/icons/close.webp",
    play: "assets/ui/icons/play.webp", resume: "assets/ui/icons/resume.webp", check: "assets/ui/icons/check.webp",
    gift: "assets/ui/icons/gift.webp", hand: "assets/ui/icons/hand.webp", sparkle: "assets/ui/icons/sparkle.webp",
    refresh: "assets/ui/icons/refresh.webp", arrow: "assets/ui/icons/arrow.webp", trophy: "assets/ui/icons/trophy.webp",
    moon: "assets/ui/icons/moon.webp", calendar: "assets/ui/icons/calendar.webp", palette: "assets/ui/icons/palette.webp",
    ball: "assets/ui/icons/ball.webp", joy: "assets/ui/icons/joy.webp", bell: "assets/ui/icons/bell.webp",
    horse: "assets/ui/icons/horse.webp", coin: "assets/ui/icons/coin.webp", hay: "assets/ui/icons/hay.webp",
    carrot: "assets/ui/icons/carrot.webp", brush: "assets/ui/icons/brush.webp", saddle: "assets/ui/icons/saddle.webp",
    horseshoe: "assets/ui/icons/horseshoe.webp", jump: "assets/ui/icons/jump.webp", house: "assets/ui/icons/house.webp",
    shop: "assets/ui/icons/shop.webp", energy: "assets/ui/icons/energy.webp", clean: "assets/ui/icons/clean.webp",
    food: "assets/ui/icons/food.webp", rest: "assets/ui/icons/rest.webp", foal: "assets/ui/icons/foal.webp", stall: "assets/ui/icons/stall.webp",
  },

  /* ---- Look & feel: smooth hi-res art, sunny pollen motes ---- */
  render: {
    pixelArt: false,
    vignette: 0.12,
    selectColor: "#ffd24a",
    text: { color: "#ffffff", stroke: "#4a3428" },
    label: { bg: "#fff8ec", color: "#8a5a2b", border: "#e8a84a", alpha: 0.96, size: 22 },
    ambient: { particle: "soft", colors: ["#ffffff", "#fff3b0", "#ffe0a8"], count: 18, speed: 8, drift: "float", alpha: [0.15, 0.45], scale: [0.4, 1.0] },
    confetti: ["#ff8a65", "#ffd24a", "#7cc96a", "#6ec6f0", "#c79bff", "#ffffff"],
  },

  /* ---- Sound: soft procedural sounds + a light countryside tune ---- */
  audio: {
    volume: 0.6,
    music: { tempo: 96, root: 62, scale: "majorPenta", progression: [0, 5, 7, 5], pad: "sine", lead: "triangle", density: 0.4, volume: 0.15 },
  },

  /* ---- A bouncing arrow shows which horse needs you after a few idle seconds ---- */
  guide: { idle: 6, color: "#ff8a3d", scale: 1.3, moodBelow: 45 },

  /* ---- World: meadow with a sandy cross-country loop in a forest band ---- */
  world: { width: 2800, height: 2100, groundTile: "grass", bg: "#7cbf5a" },
  camera: { fitW: 620, fitH: 700, min: 0.52, max: 0.95 },

  /* ---- Assets (all generated, CC0) ---- */
  assets: {
    images: {
      grass: { path: "assets/img/grass.webp", res: 2 }, sand: { path: "assets/img/sand.webp", res: 2 }, arena: { path: "assets/img/arena.webp", res: 2 }, lane: { path: "assets/img/lane.webp", res: 2 },
      house: { path: "assets/img/house.webp", res: 2 }, tack: { path: "assets/img/tack.webp", res: 2 }, stable: { path: "assets/img/stable.webp", res: 2 },
      pine: { path: "assets/img/pine.webp", res: 2 }, tree: { path: "assets/img/tree.webp", res: 2 }, bush: { path: "assets/img/bush.webp", res: 2 },
      hurdle: { path: "assets/img/hurdle.webp", res: 2 }, hurdle_v: { path: "assets/img/hurdle_v.webp", res: 2 }, logs: { path: "assets/img/logs.webp", res: 2 },
      trough: { path: "assets/img/trough.webp", res: 2 }, haybale: { path: "assets/img/haybale.webp", res: 2 }, flowers: { path: "assets/img/flowers.webp", res: 2 },
      ribbon: { path: "assets/img/ribbon.webp", res: 2 }, trophy: { path: "assets/img/trophy.webp", res: 2 }, bench: { path: "assets/img/bench.webp", res: 2 },
      weathervane: { path: "assets/img/weathervane.webp", res: 2 }, carrots: { path: "assets/img/carrots.webp", res: 2 }, saddle_rack: { path: "assets/img/saddle_rack.webp", res: 2 },
      want: { path: "assets/img/want.webp", res: 2 },
      // close-up: brushing the mud off each coat (+ the gleaming "after")
      flank_brown: { path: "assets/img/flank_bai.webp", res: 2 }, flank_brown_done: { path: "assets/img/flank_bai_done.webp", res: 2 },
      flank_black: { path: "assets/img/flank_noir.webp", res: 2 }, flank_black_done: { path: "assets/img/flank_noir_done.webp", res: 2 },
      flank_gray: { path: "assets/img/flank_gris.webp", res: 2 }, flank_gray_done: { path: "assets/img/flank_gris_done.webp", res: 2 },
      flank_golden: { path: "assets/img/flank_palomino.webp", res: 2 }, flank_golden_done: { path: "assets/img/flank_palomino_done.webp", res: 2 },
      flank_white: { path: "assets/img/flank_blanc.webp", res: 2 }, flank_white_done: { path: "assets/img/flank_blanc_done.webp", res: 2 },
      mud_1: "assets/img/mud_1.webp", mud_2: "assets/img/mud_2.webp", straw: "assets/img/straw.webp", curry: "assets/img/curry.webp",
    },
    sheets: {
      kid_fille: { path: "assets/sheet/kid_fille.webp", frameWidth: 128, frameHeight: 128, res: 2 },
      kid_garcon: { path: "assets/sheet/kid_garcon.webp", frameWidth: 128, frameHeight: 128, res: 2 },
      kid_fille_ride: { path: "assets/sheet/kid_fille_ride.webp", frameWidth: 128, frameHeight: 128, res: 2 },
      kid_garcon_ride: { path: "assets/sheet/kid_garcon_ride.webp", frameWidth: 128, frameHeight: 128, res: 2 },
      horse_brown: { path: "assets/sheet/horse_bai.webp", frameWidth: 192, frameHeight: 160, res: 2 },
      horse_black: { path: "assets/sheet/horse_noir.webp", frameWidth: 192, frameHeight: 160, res: 2 },
      horse_gray: { path: "assets/sheet/horse_gris.webp", frameWidth: 192, frameHeight: 160, res: 2 },
      horse_golden: { path: "assets/sheet/horse_palomino.webp", frameWidth: 192, frameHeight: 160, res: 2 },
      horse_white: { path: "assets/sheet/horse_blanc.webp", frameWidth: 192, frameHeight: 160, res: 2 },
      fence: { path: "assets/sheet/fence.webp", frameWidth: 64, frameHeight: 64, res: 2 },
    },
  },
  fence: { sheet: "fence", frames: { post: 0, side: 1, cornerTL: 2, cornerTR: 3 }, step: 32, scale: 1 },

  /* ---- Player (a young rider) ---- */
  player: {
    scale: 1.05,
    speed: { walk: 200, run: 370, rideWalk: 340, rideRun: 560 },
    spawn: { x: 560, y: 860 },
    nameY: -136,
    shadow: { w: 34, h: 12 },
  },
  characters: [
    { id: "fille", name: "Cavalière", sheet: "kid_fille", rideSheet: "kid_fille_ride", thumb: "assets/ui/kid_fille.webp" },
    { id: "garcon", name: "Cavalier", sheet: "kid_garcon", rideSheet: "kid_garcon_ride", thumb: "assets/ui/kid_garcon.webp" },
  ],

  /* ---- Horses ---- */
  creature: {
    label: "chevaux", icon: "horse",
    sheet: "horse_brown",
    origin: { x: 0.5, y: 0.94 },
    headY: 132,
    shadow: { w: 100, h: 20 },
    spacing: 150,
    walk: { start: 0, end: 3, frameRate: 6, idleFrame: 0, speed: 40 },
    nameY: 24, nameSize: 17,
    youngLabel: "Poulain", adultLabel: "Cheval", variantLabel: "Robe",
    customizeTitle: "{i:palette} Relooker", customizedMessage: "{i:sparkle} {name} est tout beau !",
    moodNeed: "bonheur",
    moodFrom: ["faim", "energie", "proprete", "bonheur"],
    moodDay: { base: -12, lowPenalty: -10, lowAt: 25, highBonus: 8, highAt: 60 },
    needs: [
      { id: "faim", icon: "food", label: "Faim", start: 70, perDay: -25 },
      { id: "energie", icon: "energy", label: "Énergie", start: 80, perDay: 40 },
      { id: "proprete", icon: "clean", label: "Propreté", start: 75, perDay: -16 },
      { id: "bonheur", icon: "heart", label: "Bonheur", start: 80 },
    ],
    // a little carrot bubble pops up now and then above a hungry horse (with the mood heart below it)
    wantBubble: { sprite: "want", need: "faim", below: 35, scale: 0.5, lift: 26, withMood: true, intermittent: true, showFor: 2.4, hideMin: 4, hideMax: 10 },
    variants: [
      { id: "brown", name: "Bai", color: "#8a5a2b", sheet: "horse_brown", thumb: "assets/ui/horse_bai.webp", closeupBg: "flank_brown", closeupBgDone: "flank_brown_done" },
      { id: "black", name: "Noir", color: "#3a332e", sheet: "horse_black", thumb: "assets/ui/horse_noir.webp", closeupBg: "flank_black", closeupBgDone: "flank_black_done" },
      { id: "gray", name: "Gris", color: "#a3a19c", sheet: "horse_gray", thumb: "assets/ui/horse_gris.webp", closeupBg: "flank_gray", closeupBgDone: "flank_gray_done" },
      { id: "golden", name: "Palomino", color: "#d4a94e", sheet: "horse_golden", thumb: "assets/ui/horse_palomino.webp", closeupBg: "flank_golden", closeupBgDone: "flank_golden_done" },
      { id: "white", name: "Blanc", color: "#ece6da", sheet: "horse_white", thumb: "assets/ui/horse_blanc.webp", closeupBg: "flank_white", closeupBgDone: "flank_white_done" },
    ],
    actions: [
      { id: "nourrir", label: "Nourrir", icon: "food", color: "#f2a341",
        cost: { resource: "foin", amount: 1 }, outOfStock: "{i:hay} Plus de foin ! Va en acheter à la Sellerie.",
        effects: { faim: 35, bonheur: 6 }, reward: 2, stat: "nourrir",
        anim: { motion: "nod", particle: "dot", colors: ["#e8c25a", "#c9a03a", "#f4dc8a"], count: 6, fall: true, y0: 40 },
        message: "{i:hay} {name} a mangé du bon foin !" },
      { id: "brosser", type: "closeup", label: "Brosser", icon: "brush", color: "#5ab4e8",
        closeup: {
          bg: "flank_brown", bgDone: "flank_brown_done",          // per coat: variant.closeupBg / closeupBgDone
          spotSprites: ["mud_1", "mud_2", "straw"], brush: "curry", brushTip: { x: 0.379, y: 0.392 },
          spots: { base: 3, growEvery: 3, max: 7, rubs: 3, size: 110, minGap: 0.11, area: [{ x: 0.466, y: 0.474, w: 0.126, h: 0.168 }, { x: 0.592, y: 0.6, w: 0.14, h: 0.168 }] },
          finishParticles: ["sparkle", "star", "heart"], popParticles: ["sparkle"],
          foam: { colors: ["#ffffff", "#f3ead8", "#e8dcc4"] },
        },
        effects: { proprete: 100, bonheur: 12 }, reward: 2, stat: "brosser",
        message: "{i:sparkle} {name} est tout beau et brillant !" },
      { id: "jouer", label: "Jouer", icon: "ball", color: "#ff8a65",
        require: { energie: 15 }, tooLow: "{name} est trop fatigué pour jouer.",
        effects: { bonheur: 22, energie: -16, faim: -8 }, reward: 3, stat: "jouer",
        anim: { motion: "hop", particle: "heart", colors: ["#ff7eb6", "#7fd06f", "#ffd24a"], count: 6 },
        message: "{i:ball} {name} s'est bien amusé !",
        celebrateMessage: "{i:joy} {name} est au comble du bonheur, il se cabre de joie !" },
      { id: "monter", type: "ride", label: "Monter", icon: "saddle", color: "#7cc96a", dismountLabel: "Descendre", dismountIcon: "close" },
      { id: "sauter", type: "jump", label: "Sauter", icon: "jump", color: "#ffb43a" },
      { id: "relooker", type: "customize", label: "Relooker", icon: "palette", color: "#b48ae6" },
    ],
    ride: {
      adultsOnly: true, minEnergy: 20, fatigueNeed: "energie",
      sitY: -58, sitX: 32, nameY: -190,
      onMount: { bonheur: 12, energie: -6 },
      tooYoung: "{name} est un poulain, trop petit pour être monté.",
      tooTired: "{name} est trop fatigué pour te porter.",
      mountMessage: "{i:saddle} En selle sur {name} !",
      dismountMessage: "Tu descends de {name}.",
      exhaustedMessage: "{name} est épuisé, laisse-le se reposer !",
      jump: { distance: 165, cost: 8, minEnergy: 10, tooTired: "{name} est trop fatigué pour sauter !" },
    },
    // the joy rear: only adults, only when PLAYING brings happiness to the max
    celebrate: { mode: "rear", adultsOnly: true, actions: ["jouer"], particle: "heart", colors: ["#ff7eb6", "#7fd06f", "#ffd24a"], count: 6 },
    customize: { rename: true, variant: true },
    aging: { adultAge: 5, scaleBaby: 0.8, scaleAdult: 1.3 },
    breeding: { enabled: true, minMood: 80, cooldown: 3, message: "{i:foal} Bonne nouvelle ! Un poulain est né : {name} !" },
    names: ["Éclair", "Tornade", "Caramel", "Étoile", "Tonnerre", "Cannelle", "Bandit", "Mistral", "Pépite", "Comète", "Bravo", "Sable"],
    startCount: 1,
    startCreatures: [{ name: "Éclair", variant: "brown" }],
  },

  /* ---- The paddock (horses roam here; fenced, gate on the left) ---- */
  zones: [
    { id: "paddock", home: true, rect: { x: 800, y: 480, w: 820, h: 760 }, fence: true, gates: "both", gateA: 0.34, gateB: 0.62, label: "Paddock", labelLift: 40 },   // wide right gate facing the Carrière
  ],

  /* ---- Buildings ---- */
  stations: [
    { type: "maison", x: 450, y: 560, sprite: "house", scale: 0.9, label: "Maison", labelY: 40, icon: "rest", color: "#7d8fd8",
      hint: "Dormir pour passer au jour suivant", box: { dx: -120, dy: -96, w: 240, h: 96 },
      action: "nextDay", actionLabel: "Dormir" },
    { type: "sellerie", x: 450, y: 1030, sprite: "tack", scale: 0.9, label: "Sellerie", labelY: 40, icon: "shop", color: "#f2a341",
      hint: "Foin, décorations, chevaux", box: { dx: -120, dy: -96, w: 240, h: 96 },
      action: "openShop", actionLabel: "Entrer dans la Sellerie" },
  ],

  /* ---- Shop (Sellerie) ---- */
  economy: { startCoins: 40, startResources: { foin: 6 }, startCapacity: 4, dayReward: 5 },
  shop: {
    title: "{i:shop} Sellerie",
    resources: [{ id: "foin", name: "Botte de foin", desc: "Pour nourrir un cheval", icon: "hay", price: 4, amount: 1,
                  boughtMessage: "{i:hay} +1 botte de foin !" }],
    capacity: { name: "Agrandir le paddock", icon: "stall", price: 80, boughtMessage: "{i:stall} Le paddock est plus grand : une place de plus !" },
    decorHeading: "{i:gift} Décorations",
    buyCreature: { price: 45, heading: "{i:horse} Nouveau cheval", label: "Adopter un cheval", hint: "Il arrive dans le paddock", icon: "horse",
                   boughtMessage: "{i:joy} Bienvenue, {name} ! Relooke-le dans le paddock." },
    fullMessage: "Le paddock est plein ! Agrandis-le d'abord.",
  },
  decor: [
    { id: "arbre", name: "Sapin", sprite: "pine", price: 28, scale: 0.9, collision: { dx: -16, dy: -16, w: 32, h: 18 } },
    { id: "buisson", name: "Buisson", sprite: "bush", price: 16, scale: 1.0, collision: { dx: -30, dy: -14, w: 60, h: 18 } },
    { id: "abreuvoir", name: "Abreuvoir", sprite: "trough", price: 20, scale: 0.9, collision: { dx: -46, dy: -18, w: 92, h: 22 } },
    { id: "fleurs", name: "Fleurs", sprite: "flowers", price: 12, scale: 0.9 },
    { id: "banc", name: "Banc", sprite: "bench", price: 24, scale: 0.9, collision: { dx: -54, dy: -16, w: 108, h: 20 } },
    { id: "foin", name: "Botte décorative", sprite: "haybale", price: 14, scale: 0.9, collision: { dx: -36, dy: -16, w: 72, h: 20 } },
  ],

  /* ---- Show-jumping arena + cross-country loop in the forest ---- */
  environment: {
    band: 440,
    arena: { rect: { x: 1700, y: 540, w: 620, h: 640 }, tile: "arena", label: "Carrière", fence: true, gateA: 0.31, gateB: 0.64,
             // obstacles stand ACROSS the left↔right run (the horse jumps them sideways); a gap between the
             // two rows lets you ride around them
             obstacleSprite: "hurdle_v", obstacleScale: 1.15, obstacleBox: { dx: -18, dy: -170, w: 36, h: 170 },
             obstacles: [{ x: 1840, y: 760 }, { x: 2010, y: 760 }, { x: 2180, y: 760 }, { x: 1840, y: 1100 }, { x: 2010, y: 1100 }, { x: 2180, y: 1100 }] },
    forest: { tree: "pine", bush: "bush", step: 44, hedgeMargin: 80, treeScale: [0.95, 1.2], bushScale: [0.75, 0.95], hedgeBox: { dx: -22, dy: -10, w: 44, h: 14 } },
    path: { width: 240, sand: 46, inset: 90, tile: "sand", label: "Parcours de cross", labelY: 300,
            openings: [{ x: 200, y: 1320, w: 430, h: 220 }, { x: 2170, y: 1320, w: 430, h: 220 }],
            logs: { xs: [520, 820, 1120, 1700, 2000, 2300], dec: 0, sprite: "logs", scale: 1 } },
  },

  /* ---- Scenery around the centre ---- */
  scenery: [
    // the sandy lane joining the Paddock's right gate to the Carrière (drawn on the ground)
    { x: 1660, y: 845, sprite: "lane", ground: true, scale: 1 },
    { x: 1210, y: 1470, sprite: "stable", scale: 0.85, box: { dx: -150, dy: -80, w: 300, h: 80 } },
    { x: 700, y: 1290, sprite: "bush", scale: 1.0, box: { dx: -30, dy: -14, w: 60, h: 18 } },
    { x: 960, y: 1300, sprite: "tree", scale: 0.95, anim: "sway", box: { dx: -18, dy: -16, w: 36, h: 20 } },
    { x: 1500, y: 1300, sprite: "tree", scale: 0.95, anim: "sway", box: { dx: -18, dy: -16, w: 36, h: 20 } },
    { x: 1760, y: 1290, sprite: "bush", scale: 1.0, box: { dx: -30, dy: -14, w: 60, h: 18 } },
    { x: 2000, y: 1300, sprite: "pine", scale: 1.0, box: { dx: -16, dy: -16, w: 32, h: 18 } },
    { x: 2250, y: 1290, sprite: "bush", scale: 1.0, box: { dx: -30, dy: -14, w: 60, h: 18 } },
    { x: 740, y: 1160, sprite: "trough", scale: 0.85, box: { dx: -44, dy: -18, w: 88, h: 22 } },
    { x: 640, y: 1110, sprite: "saddle_rack", scale: 0.8, box: { dx: -34, dy: -14, w: 68, h: 18 } },
  ],

  /* ---- Unlocks: the centre gets richer as you look after your horses (no reading needed) ---- */
  unlocks: [
    { id: "haybale", when: (s) => (s.stats.nourrir || 0) >= 3, message: "{i:gift} Une grosse botte de foin pour le centre !",
      scenery: { x: 1450, y: 1330, sprite: "haybale", scale: 0.95, box: { dx: -38, dy: -16, w: 76, h: 20 } } },
    { id: "flowers", when: (s) => (s.stats.brosser || 0) >= 2, message: "{i:gift} Des fleurs devant la maison !",
      scenery: { x: 600, y: 690, sprite: "flowers", scale: 1.0, box: false } },
    { id: "carrots", when: (s) => (s.stats.jouer || 0) >= 3, message: "{i:carrot} Un panier de carottes pour tes chevaux !",
      scenery: { x: 690, y: 980, sprite: "carrots", scale: 0.9, box: { dx: -30, dy: -12, w: 60, h: 16 } } },
    { id: "weathervane", when: (s) => (s.stats.ride || 0) >= 3, message: "{i:gift} Une girouette cheval sur le centre !",
      scenery: { x: 1660, y: 470, sprite: "weathervane", scale: 0.9, anim: "sway", box: { dx: -10, dy: -8, w: 20, h: 12 } } },
    { id: "ribbon", when: (s) => (s.stats.jump || 0) >= 3, message: "{i:trophy} Une rosette de champion à la carrière !",
      scenery: { x: 1680, y: 1260, sprite: "ribbon", scale: 0.85, anim: "sway", box: { dx: -12, dy: -8, w: 24, h: 12 } } },
    { id: "trophy", when: (s) => (s.level || 1) >= 3, message: "{i:trophy} Le trophée du meilleur centre équestre !",
      scenery: { x: 2330, y: 1260, sprite: "trophy", scale: 0.85, glow: "#ffd24a", glowY: 50, box: { dx: -22, dy: -12, w: 44, h: 16 } } },
  ],

  /* ---- Objectives by level (same ids as the pre-engine version → progress carries over) ---- */
  objectives: {
    extraStats: ["ride", "jump", "trailVisit"],
    levels: [
      { name: "Débutant", goals: [
        { id: "repas", name: "Premier repas", desc: "Nourris un cheval", check: (s) => s.stats.nourrir >= 1 },
        { id: "brosse", name: "Tout beau", desc: "Brosse un cheval", check: (s) => s.stats.brosser >= 1 },
        { id: "jeu", name: "On s'amuse", desc: "Joue avec un cheval", check: (s) => s.stats.jouer >= 1 },
        { id: "deco", name: "Décorateur", desc: "Pose une décoration", check: (s) => s.stats.decor >= 1 },
      ] },
      { name: "Cavalier", goals: [
        { id: "cavalier", name: "En selle !", desc: "Monte un cheval", check: (s) => s.stats.ride >= 1 },
        { id: "cross", name: "Au parcours de cross", desc: "Va sur le parcours de cross", check: (s) => s.stats.trailVisit >= 1 },
        { id: "sauteur", name: "Saute l'obstacle", desc: "Saute un obstacle à cheval", check: (s) => s.stats.jump >= 1 },
        { id: "heureux", name: "Cheval très heureux", desc: "Un cheval au bonheur maximum", check: (s) => s.creatures.some((c) => c.bonheur >= 100) },
      ] },
      { name: "Éleveur", goals: [
        { id: "troupeau", name: "Trois chevaux", desc: "Aie 3 chevaux", check: (s) => s.creatures.length >= 3 },
        { id: "famille", name: "Un poulain est né", desc: "Fais naître un poulain", check: (s) => s.stats.births >= 1 },
        { id: "crosspro", name: "As du cross", desc: "Saute 5 obstacles", check: (s) => s.stats.jump >= 5 },
        { id: "riche", name: "Petite fortune", desc: "Atteins 150 pièces", check: (s) => s.coins >= 150 },
      ] },
      { name: "Champion", goals: [
        { id: "grandSaut", name: "Roi du saut", desc: "Saute 15 obstacles", check: (s) => s.stats.jump >= 15 },
        { id: "grandTroupeau", name: "Grand élevage", desc: "Aie 5 chevaux", check: (s) => s.creatures.length >= 5 },
        { id: "deuxPoulains", name: "Grande famille", desc: "Fais naître 2 poulains", check: (s) => s.stats.births >= 2 },
        { id: "fortune", name: "Grande fortune", desc: "Atteins 300 pièces", check: (s) => s.coins >= 300 },
      ] },
    ],
  },

  /* ---- Help ---- */
  help: [
    "<b>Bienvenue dans ton centre équestre !</b>",
    "{i:hand} <b>Se déplacer :</b> touche l'endroit où aller. Touche deux fois vite pour courir.",
    "{i:horse} <b>Un cheval :</b> touche-le pour t'en occuper : {i:food} nourrir, {i:brush} brosser, {i:ball} jouer, {i:palette} relooker.",
    "{i:brush} <b>Brosser :</b> frotte la boue avec ton doigt jusqu'à ce qu'il brille !",
    "{i:saddle} <b>Monter :</b> fais le tour du <b>parcours de cross</b> et saute {i:jump} les rondins et les obstacles de la <b>carrière</b>.",
    "{i:shop} <b>Sellerie :</b> achète du foin {i:hay}, des décorations et de nouveaux chevaux.",
    "{i:rest} <b>Maison :</b> dors pour passer au jour suivant. Deux chevaux très heureux peuvent avoir un poulain {i:foal} !",
    "{i:goals} <b>Objectifs :</b> réussis-les pour monter de niveau. Le jeu se sauvegarde tout seul.",
  ],
};
