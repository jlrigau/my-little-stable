/*
 * icon-kit — a set of illustrated UI icons (mobile-game style: thick outline, two-tone
 * gradient, glossy highlight), drawn as SVG and themed by a palette. Used by a game's
 * art module to produce assets/ui/icons/<name>.png, which the engine shows wherever
 * GAME.icons lists them (HUD, buttons, panel, toasts, help, close-up…).
 *
 *   const IK = require("../../.claude/skills/_shared/icon-kit.cjs");
 *   IK.jobs({ ink: "#2a2350" }, ["star","sound","help", …], "assets/ui/icons")   // render jobs
 *   IK.ICONS.star(pal)   → { defs, body } in a 128×128 box (to compose your own)
 *
 * Every icon fits inside 128×128 with ~8 px margin (no clipping). Add game-specific
 * icons in the game's own art module with the same helpers (see `badge`).
 */
const K = require("./svg-kit.cjs");
const { shade, lin, rad, star } = K;

const DEF = { ink: "#2b2450", gold: "#ffc93c", pink: "#ff6fa5", blue: "#4fb6ff", green: "#5fd38a", red: "#ff6b6b", purple: "#a77bff", white: "#ffffff", teal: "#3ec9bd", orange: "#ff9f43" };
let uid = 0;
// two-tone vertical gradient for a base colour → returns [defs, url]
function fill(c) { const id = "g" + (uid++); return [lin(id, [[0, shade(c, 0.35)], [0.55, c], [1, shade(c, -0.18)]]), `url(#${id})`]; }
const st = (p, w) => `stroke="${p.ink}" stroke-width="${w || 7}" stroke-linejoin="round" stroke-linecap="round"`;
const shine = (d) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/>`;

const ICONS = {
  star: (p) => { const [d, f] = fill(p.gold); return { defs: d, body: `<path d="${star(64, 68, 54, 24)}" fill="${f}" ${st(p)}/>${shine("M44 50 L54 34")}` }; },
  heart: (p) => { const [d, f] = fill(p.pink); return { defs: d, body: `<path d="M64 112 C24 86 10 62 16 42 C22 20 50 14 64 36 C78 14 106 20 112 42 C118 62 104 86 64 112 Z" fill="${f}" ${st(p)}/>${shine("M30 44 Q34 32 46 30")}` }; },
  heartEmpty: (p) => ({ defs: "", body: `<path d="M64 112 C24 86 10 62 16 42 C22 20 50 14 64 36 C78 14 106 20 112 42 C118 62 104 86 64 112 Z" fill="#000" fill-opacity=".12" ${st(p)}/>` }),
  sound: (p) => { const [d, f] = fill(p.blue); return { defs: d, body: `<path d="M18 50 H40 L68 26 V102 L40 78 H18 Z" fill="${f}" ${st(p)}/><path d="M82 46 Q94 64 82 82 M94 34 Q116 64 94 94" fill="none" ${st(p, 8)}/>` }; },
  soundOff: (p) => { const [d, f] = fill("#9aa6c4"); return { defs: d, body: `<path d="M18 50 H40 L68 26 V102 L40 78 H18 Z" fill="${f}" ${st(p)}/><path d="M84 48 L112 80 M112 48 L84 80" stroke="${p.ink}" stroke-width="20" stroke-linecap="round"/><path d="M84 48 L112 80 M112 48 L84 80" stroke="${p.red}" stroke-width="9" stroke-linecap="round"/>` }; },
  help: (p) => { const [d, f] = fill(p.purple); return { defs: d, body: `<circle cx="64" cy="64" r="50" fill="${f}" ${st(p)}/><path d="M48 50 Q48 32 64 32 Q82 32 82 48 Q82 60 68 64 L66 74" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/><circle cx="66" cy="92" r="7" fill="#fff"/>` }; },
  avatar: (p) => { const [d, f] = fill(p.teal); const [d2, f2] = fill("#ffd7b5"); return { defs: d + d2, body: `<path d="M20 112 Q22 74 64 74 Q106 74 108 112 Z" fill="${f}" ${st(p)}/><circle cx="64" cy="46" r="26" fill="${f2}" ${st(p)}/><circle cx="55" cy="46" r="3.5" fill="${p.ink}"/><circle cx="73" cy="46" r="3.5" fill="${p.ink}"/><path d="M56 56 Q64 62 72 56" fill="none" ${st(p, 4)}/>` }; },
  goals: (p) => { const [d, f] = fill(p.red); return { defs: d, body: `<circle cx="60" cy="68" r="46" fill="${f}" ${st(p)}/><circle cx="60" cy="68" r="30" fill="#fff" ${st(p, 5)}/><circle cx="60" cy="68" r="14" fill="${p.red}" ${st(p, 5)}/><path d="M62 66 L106 22" ${st(p, 7)}/><path d="M96 16 L112 18 L110 34" fill="${p.gold}" ${st(p, 5)}/>` }; },
  close: (p) => ({ defs: "", body: `<path d="M34 34 L94 94 M94 34 L34 94" stroke="${p.ink}" stroke-width="26" stroke-linecap="round"/><path d="M34 34 L94 94 M94 34 L34 94" stroke="#fff" stroke-width="13" stroke-linecap="round"/>` }),
  play: (p) => { const [d, f] = fill(p.green); return { defs: d, body: `<path d="M36 22 Q30 22 30 30 V98 Q30 106 38 104 L104 70 Q112 64 104 58 L38 24 Z" fill="${f}" ${st(p)}/>${shine("M42 40 L44 64")}` }; },
  resume: (p) => { const [d, f] = fill(p.blue); return { defs: d, body: `<circle cx="64" cy="64" r="50" fill="${f}" ${st(p)}/><path d="M50 40 L88 64 L50 88 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/>` }; },
  check: (p) => ({ defs: "", body: `<path d="M24 66 L52 94 L106 34" fill="none" stroke="${p.ink}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 66 L52 94 L106 34" fill="none" stroke="${p.green}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>` }),
  calendar: (p) => { const [d, f] = fill(p.red); return { defs: d, body: `<rect x="16" y="24" width="96" height="88" rx="16" fill="#fff" ${st(p)}/><path d="M16 40 Q16 24 32 24 H96 Q112 24 112 40 V52 H16 Z" fill="${f}" ${st(p)}/><path d="M40 14 V34 M88 14 V34" ${st(p, 9)}/><g fill="${p.ink}" opacity=".75"><rect x="32" y="64" width="16" height="12" rx="3"/><rect x="56" y="64" width="16" height="12" rx="3"/><rect x="80" y="64" width="16" height="12" rx="3"/><rect x="32" y="86" width="16" height="12" rx="3"/><rect x="56" y="86" width="16" height="12" rx="3"/></g>` }; },
  gift: (p) => { const [d, f] = fill(p.pink); const [d2, f2] = fill(p.gold); return { defs: d + d2, body: `<rect x="20" y="56" width="88" height="56" rx="10" fill="${f}" ${st(p)}/><rect x="14" y="40" width="100" height="24" rx="8" fill="${f}" ${st(p)}/><rect x="56" y="40" width="16" height="72" fill="${f2}" ${st(p, 5)}/><path d="M64 40 Q40 10 30 26 Q24 40 64 40 Q88 40 98 26 Q88 10 64 40 Z" fill="${f2}" ${st(p, 6)}/>` }; },
  hand: (p) => { const [d, f] = fill("#ffd2a8"); return { defs: d, body: `<path d="M50 14 Q60 10 62 22 V56 L66 54 Q78 50 80 60 Q90 56 94 66 Q106 64 106 78 V92 Q106 116 80 118 H66 Q44 118 36 98 L22 72 Q18 62 28 60 Q36 58 42 70 V22 Q42 16 50 14 Z" fill="${f}" ${st(p, 6)}/><path d="M62 58 V76 M80 62 V78 M94 70 V82" ${st(p, 4)} opacity=".6"/>` }; },
  sparkle: (p) => { const [d, f] = fill(p.gold); return { defs: d, body: `<path d="${star(56, 66, 46, 12, 4)}" fill="${f}" ${st(p, 6)}/><path d="${star(98, 32, 20, 6, 4)}" fill="${f}" ${st(p, 5)}/><path d="${star(100, 98, 13, 4, 4)}" fill="#fff" ${st(p, 4)}/>` }; },
  moon: (p) => { const [d, f] = fill(p.gold); return { defs: d, body: `<path d="M74 16 A46 46 0 1 0 112 84 A38 38 0 1 1 74 16 Z" fill="${f}" ${st(p)}/><path d="${star(96, 32, 10, 3.5, 4)}" fill="#fff"/>` }; },
  bell: (p) => { const [d, f] = fill(p.gold); return { defs: d, body: `<path d="M64 14 Q60 14 60 20 V24 Q30 30 30 66 V82 L18 98 H110 L98 82 V66 Q98 30 68 24 V20 Q68 14 64 14 Z" fill="${f}" ${st(p)}/><circle cx="64" cy="106" r="11" fill="${f}" ${st(p, 6)}/>${shine("M44 48 Q46 38 54 34")}` }; },
  refresh: (p) => ({ defs: "", body: `<path d="M98 50 A38 38 0 1 0 98 78" fill="none" stroke="${p.ink}" stroke-width="22" stroke-linecap="round"/><path d="M98 50 A38 38 0 1 0 98 78" fill="none" stroke="${p.teal}" stroke-width="10" stroke-linecap="round"/><path d="M84 46 L112 52 L106 24 Z" fill="${p.teal}" ${st(p, 6)}/>` }),
  arrow: (p) => { const [d, f] = fill(p.pink); return { defs: d, body: `<path d="M48 12 H80 V64 H106 L64 116 L22 64 H48 Z" fill="${f}" ${st(p)}/>${shine("M58 24 V54")}` }; },
  home: (p) => { const [d, f] = fill(p.orange); return { defs: d, body: `<path d="M14 64 L64 18 L114 64 H100 V108 H28 V64 Z" fill="${f}" ${st(p)}/><rect x="52" y="74" width="24" height="34" rx="6" fill="#fff" ${st(p, 5)}/>` }; },
  lock: (p) => { const [d, f] = fill(p.gold); return { defs: d, body: `<path d="M40 56 V40 Q40 16 64 16 Q88 16 88 40 V56" fill="none" stroke="${p.ink}" stroke-width="20"/><path d="M40 56 V40 Q40 16 64 16 Q88 16 88 40 V56" fill="none" stroke="#c9d0e0" stroke-width="8"/><rect x="24" y="54" width="80" height="62" rx="14" fill="${f}" ${st(p)}/><circle cx="64" cy="82" r="8" fill="${p.ink}"/>` }; },
  palette: (p) => { const [d, f] = fill("#ffe2b8"); return { defs: d, body: `<path d="M64 14 Q112 14 114 58 Q116 84 92 82 Q76 80 80 96 Q84 114 62 114 Q14 112 14 64 Q14 14 64 14 Z" fill="${f}" ${st(p)}/><circle cx="42" cy="48" r="10" fill="${p.red}" ${st(p, 4)}/><circle cx="70" cy="36" r="10" fill="${p.gold}" ${st(p, 4)}/><circle cx="94" cy="54" r="9" fill="${p.blue}" ${st(p, 4)}/><circle cx="40" cy="80" r="10" fill="${p.green}" ${st(p, 4)}/>` }; },
  ball: (p) => { const [d, f] = fill(p.blue); return { defs: d, body: `<circle cx="64" cy="64" r="50" fill="${f}" ${st(p)}/><path d="${star(64, 66, 24, 10)}" fill="${p.gold}" ${st(p, 5)}/>${shine("M30 50 Q34 32 50 24")}` }; },
  battery: (p) => { const [d, f] = fill(p.green); return { defs: d, body: `<rect x="34" y="22" width="60" height="96" rx="14" fill="#fff" ${st(p)}/><rect x="52" y="10" width="24" height="14" rx="4" fill="${p.ink}"/><rect x="44" y="52" width="40" height="56" rx="7" fill="${f}"/><path d="M68 58 L54 84 H66 L60 104 L78 74 H66 Z" fill="#fff"/>` }; },
  smile: (p) => { const [d, f] = fill(p.gold); return { defs: d, body: `<circle cx="64" cy="64" r="50" fill="${f}" ${st(p)}/><circle cx="48" cy="54" r="7" fill="${p.ink}"/><circle cx="80" cy="54" r="7" fill="${p.ink}"/><path d="M40 74 Q64 102 88 74" fill="none" ${st(p, 7)}/>` }; },
  meh: (p) => { const [d, f] = fill("#ffd98a"); return { defs: d, body: `<circle cx="64" cy="64" r="50" fill="${f}" ${st(p)}/><circle cx="48" cy="56" r="7" fill="${p.ink}"/><circle cx="80" cy="56" r="7" fill="${p.ink}"/><path d="M44 84 H84" ${st(p, 7)}/>` }; },
  sad: (p) => { const [d, f] = fill("#a8d4ff"); return { defs: d, body: `<circle cx="64" cy="64" r="50" fill="${f}" ${st(p)}/><circle cx="48" cy="56" r="7" fill="${p.ink}"/><circle cx="80" cy="56" r="7" fill="${p.ink}"/><path d="M42 92 Q64 70 86 92" fill="none" ${st(p, 7)}/><path d="M88 66 Q84 78 90 80 Q96 78 92 66 Z" fill="#4fb6ff"/>` }; },
  joy: (p) => { const [d, f] = fill(p.gold); return { defs: d, body: `<circle cx="64" cy="64" r="50" fill="${f}" ${st(p)}/><path d="M38 54 Q48 42 58 54 M70 54 Q80 42 90 54" fill="none" ${st(p, 7)}/><path d="M38 70 Q64 110 90 70 Z" fill="#a8324e" ${st(p, 6)}/><circle cx="34" cy="74" r="7" fill="#ff8fa8" opacity=".7"/><circle cx="94" cy="74" r="7" fill="#ff8fa8" opacity=".7"/>` }; },
  trophy: (p) => { const [d, f] = fill(p.gold); return { defs: d, body: `<path d="M34 28 Q14 28 16 48 Q20 66 42 68 M94 28 Q114 28 112 48 Q108 66 86 68" fill="none" ${st(p, 9)}/><path d="M32 16 H96 Q96 76 64 86 Q32 76 32 16 Z" fill="${f}" ${st(p)}/><rect x="54" y="84" width="20" height="16" fill="${f}" ${st(p, 5)}/><rect x="36" y="100" width="56" height="16" rx="5" fill="${f}" ${st(p, 6)}/>` }; },
};

// Wrap a body as a render job (128×128, transparent).
function job(file, body, defs) { return K.job(file, 128, 128, body, defs); }
function jobs(pal, names, dir) {
  const p = Object.assign({}, DEF, pal || {});
  return (names || Object.keys(ICONS)).map((n) => { const r = ICONS[n](p); return job(`${dir || "assets/ui/icons"}/${n}.png`, r.body, r.defs); });
}
module.exports = { ICONS, jobs, job, fill, st, shine, DEF };
