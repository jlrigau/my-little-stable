/*
 * Mon Centre Équestre — all game art as parametric SVG (rendered to WebP/PNG).
 *   node .claude/skills/_shared/render-svg.cjs tools/art/stable.cjs [--only horse_,kid_]
 *   node tools/art/stable.cjs        → prints the close-up spot areas + curry-brush tip
 * One source of truth per thing:
 *   horse(coat, pose)   side-view horse → walk strips, splash, weathervane, jump icon, close-up body
 *   head3q(coat)        the friendly 3/4 horse head (mascot) → thumbnails, icons, logo, app icon, close-up
 *   kid(spec, dir, ph)  the player kids → LPC sheets, ride pose, thumbnails, splash
 * Style: smooth cartoon vector, warm countryside palette, soft brown INK outline.
 */
const K = require("../../.claude/skills/_shared/svg-kit.cjs");
const IK = require("../../.claude/skills/_shared/icon-kit.cjs");
const { sheet, job, shade, mix, lin, rad, glow, blur, rng, star } = K;

const INK = "#4a3428";                      // soft dark-brown outline
const CORAL = "#ff7a6b", PINK = "#ff8fb3", SKY = "#7cc6f0", GOLD = "#ffc93c", CREAM = "#fff8ec";
const MEADOW = "#8fcf6a", MEADOW_D = "#6fb552", SAND = "#e8c98f", WOOD = "#b9804c", WOOD_D = "#8a5a36";
const f2 = (n) => (+n).toFixed(2);

// Smooth curve (Catmull-Rom → cubic Bézier) through points; closed or open.
function spline(pts, closed) {
  const n = pts.length, g = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f2(pts[0][0])} ${f2(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f2(p1[0] + (p2[0] - p0[0]) / 6)} ${f2(p1[1] + (p2[1] - p0[1]) / 6)} ${f2(p2[0] - (p3[0] - p1[0]) / 6)} ${f2(p2[1] - (p3[1] - p1[1]) / 6)} ${f2(p2[0])} ${f2(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}
const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
const stk = (w, c) => `stroke="${c || INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
// user-space vertical gradient (so separate shapes painted with it match seamlessly)
const ulin = (id, stops, y1, y2, tr) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y1}" x2="0" y2="${y2}"${tr ? ` gradientTransform="${tr}"` : ""}>${stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ""}/>`).join("")}</linearGradient>`;

/* ======================= Horses ======================= */
// Coats. body/belly = coat gradient; mane = mane+tail; legs = lower legs (stockings);
// muzzle = muzzle tone; marks: blaze | star | socks; dapple = dapple-grey spots.
const COATS = {
  bai:      { name: "Bai",      body: "#b8703f", mane: "#3b2b27", legs: "#3b2b27", muzzle: "#7e4a30", hoof: "#4a3a34", blaze: "star", ink: INK },
  noir:     { name: "Noir",     body: "#4e4450", mane: "#2a2329", legs: "#3a3240", muzzle: "#3a3038", hoof: "#2e2830", blaze: "star", ink: "#261c22", sheen: 0.32 },
  gris:     { name: "Gris",     body: "#b8bec6", mane: "#6c7380", legs: "#7a828d", muzzle: "#7a808a", hoof: "#4f4f56", dapple: true, ink: INK },
  palomino: { name: "Palomino", body: "#ebb85c", mane: "#fff3d8", legs: "#ebb85c", muzzle: "#d09a4c", hoof: "#6a5040", blaze: "blaze", socks: [1, 0, 0, 1], ink: INK },
  blanc:    { name: "Blanc",    body: "#f7f5f1", mane: "#ffffff", legs: "#eceae8", muzzle: "#e2cfcc", hoof: "#9a8a80", ink: INK, shadeAmt: -0.13 },
};
const HALTER = CORAL;

// Side-view geometry (facing LEFT) in a 192×160 frame, hooves on y=150.
const BODY_D = "M66 100 C58 90 50 76 44 62 L54 30 C62 24 72 34 78 46 C84 60 90 67 100 70 C116 74 130 70 144 68 C160 67 167 84 161 98 C157 108 147 112 136 110 C120 114 96 114 80 110 C72 108 68 106 66 100 Z";
const HEAD_D = "M66 34 C66 22 56 15 46 19 C36 24 26 38 18 50 C12 58 14 68 24 70 C32 72 40 68 46 62 C56 58 68 50 66 34 Z";
const CREST = [[56, 24], [70, 28], [84, 54], [102, 70]];          // mane crest (bezier)
// Legs: hip (x,y) in body coords; front = forearm+cannon, hind = gaskin+cannon (hock angle).
const LEGS = [
  { id: "ff", x: 88, y: 98, front: true, near: false },
  { id: "hf", x: 143, y: 96, front: false, near: false },
  { id: "fn", x: 79, y: 98, front: true, near: true },
  { id: "hn", x: 135, y: 96, front: false, near: true },
];
// tapered capsule from a (width wa) to b (width wb), round ends — limbs without seams
function capsule(a, b, wa, wb) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, ra = wa / 2, rb = wb / 2;
  return `M${f2(a[0] + nx * ra)} ${f2(a[1] + ny * ra)} L${f2(b[0] + nx * rb)} ${f2(b[1] + ny * rb)} A${f2(rb)} ${f2(rb)} 0 0 0 ${f2(b[0] - nx * rb)} ${f2(b[1] - ny * rb)} L${f2(a[0] - nx * ra)} ${f2(a[1] - ny * ra)} A${f2(ra)} ${f2(ra)} 0 0 0 ${f2(a[0] + nx * ra)} ${f2(a[1] + ny * ra)} Z`;
}
const dirv = (a) => { const r = a * Math.PI / 180; return [-Math.sin(r), Math.cos(r)]; };   // +a = forward (toward -x)
function legGeom(L, swing, lift, hip) {
  const len = L.front ? [27, 24] : [26, 28], hoofL = 7;
  const a1 = L.front ? swing + lift * 24 : -22 + swing + lift * 18;
  const a2 = L.front ? a1 - lift * 78 : a1 + 22 - lift * 62;
  const d1 = dirv(a1), d2 = dirv(a2);
  const knee = [hip[0] + d1[0] * len[0], hip[1] + d1[1] * len[0]];
  const foot = [knee[0] + d2[0] * len[1], knee[1] + d2[1] * len[1]];
  const sole = [foot[0] + d2[0] * hoofL, foot[1] + d2[1] * hoofL];
  return { hip, knee, foot, sole, a2, d2 };
}
// Walk poses (4 frames). Diagonal pairs: A = near-front + far-hind, B = far-front + near-hind.
// f0 contact (also idle) → f1 passing (B lifted) → f2 contact → f3 passing (A lifted).
const WALK = [
  { A: [13, 0], B: [-13, 0], head: 1.2, tail: 0 },
  { A: [0, 0], B: [4, 1], head: 0, tail: 2.5 },
  { A: [-13, 0], B: [13, 0], head: 1.2, tail: 0 },
  { A: [4, 1], B: [0, 0], head: 0, tail: -2.5 },
];
const PAIR = { fn: "A", hf: "A", ff: "B", hn: "B" };

// Draws one horse. pose = WALK index or { legs:{id:[swing,lift]}, head, tail }.
// opts: sw (outline), foal (long legs/short body), noHead, flat (single colour silhouette), mood
function horse(coatId, pose, u, opts = {}) {
  const c = typeof coatId === "string" ? COATS[coatId] : coatId, o = opts;
  const P = typeof pose === "number" ? WALK[pose] : pose;
  const ink = o.flat ? o.flat : c.ink || INK, sw = o.sw || 3;
  const sh = c.shadeAmt != null ? c.shadeAmt : -0.2;
  const bodyC = o.flat || c.body, maneC = o.flat || c.mane;
  // the body/neck/head are drawn in "body coords" then scaled about A and lifted (legs keep
  // their length): adult k .94, foal k .72 → long-legged foal.
  const k = o.foal ? 0.72 : 0.94, A = [110, 104], lift = o.foal ? -2 : -5;
  const T = (p) => [A[0] + (p[0] - A[0]) * k, A[1] + (p[1] - A[1]) * k + lift];
  const tr = `translate(${A[0]} ${A[1] + lift}) scale(${k}) translate(${-A[0]} ${-A[1]})`;
  const legSet = LEGS.map((L) => {
    const s = P.legs ? P.legs[L.id] : P[PAIR[L.id]];
    return Object.assign({ L }, legGeom(L, s[0], s[1], T([L.x, L.y])));
  });
  // drop the body so the lowest PLANTED hoof sits on y = 150
  const planted = legSet.filter((g, i) => !(P.legs ? P.legs[g.L.id][1] : P[PAIR[g.L.id]][1]));
  const dy = o.dy != null ? o.dy : 150 - Math.max(...(planted.length ? planted : legSet).map((g) => g.sole[1]));
  let defs = "";
  const bst = [[0, shade(bodyC, o.flat ? 0 : 0.16)], [0.55, bodyC], [1, shade(bodyC, o.flat ? 0 : sh)]];
  defs += ulin(`${u}b`, bst, 62, 116) + ulin(`${u}bl`, bst, 62, 116, tr);   // bl = same gradient seen from outside the body transform (legs)
  defs += lin(`${u}m`, [[0, shade(maneC, o.flat ? 0 : 0.12)], [1, shade(maneC, o.flat ? 0 : -0.15)]]);
  defs += `<mask id="${u}k" maskUnits="userSpaceOnUse" x="-60" y="-60" width="320" height="300"><rect x="-60" y="-60" width="320" height="300" fill="#fff"/><path d="${BODY_D}" fill="#000"${tr ? ` transform="${tr}"` : ""}/></mask>`;
  defs += `<clipPath id="${u}c"><path d="${BODY_D}"/></clipPath><clipPath id="${u}h"><path d="${HEAD_D}"/></clipPath>`;
  let g = `<g transform="translate(0 ${f2(dy)})">`;

  // --- tail (behind everything)
  const tl = P.tail || 0;
  const tail = spline([[150, 70], [168, 74], [176 + tl * 0.4, 96], [174 + tl, 120], [168 + tl, 136], [161 + tl * 0.6, 128], [162, 108], [156, 88], [146, 78]], true);
  g += `<g${tr ? ` transform="${tr}"` : ""}><path d="${tail}" fill="url(#${u}m)" ${stk(sw, ink)}/>`;
  if (!o.flat) g += `<path d="M166 84 Q172 104 168 126" fill="none" stroke="${shade(maneC, 0.3)}" stroke-width="${sw * 0.8}" stroke-linecap="round" opacity=".55"/><path d="M158 92 Q164 108 163 122" fill="none" stroke="${shade(maneC, -0.25)}" stroke-width="${sw * 0.6}" stroke-linecap="round" opacity=".5"/>`;
  g += `</g>`;

  // --- legs: tube = ink strokes, then fills; hoof on top
  const legDraw = (G, far) => {
    const L = G.L, fs = o.foal ? 0.74 : 1;
    const wTop = (L.front ? 16 : 21) * fs, wKnee = (L.front ? 10 : 11) * fs, wFoot = 8 * fs;
    const sock = c.socks && c.socks[["fn", "ff", "hf", "hn"].indexOf(L.id)];
    const upC = far ? `${shade(bodyC, o.flat ? 0 : -0.22)}` : `url(#${u}bl)`;
    const loC = o.flat ? o.flat : sock ? "#fffaf2" : far ? shade(c.legs, -0.2) : c.legs;
    const p = (a) => `${f2(a[0])} ${f2(a[1])}`;
    const top = [G.hip[0], G.hip[1] - 10];
    const up = capsule(top, G.knee, wTop, wKnee), lo = capsule(G.knee, G.foot, wKnee * 0.9, wFoot);
    const ink1 = `<path d="${up}" fill="${ink}" ${stk(sw * 2, ink)}/><path d="${lo}" fill="${ink}" ${stk(sw * 2, ink)}/>`;
    let s = far ? ink1 : `<g mask="url(#${u}k)">${ink1}</g>`;
    s += `<path d="${lo}" fill="${loC}"/><path d="${up}" fill="${upC}"/>`;
    // hoof: a small rounded trapezoid along the cannon direction
    const d = G.d2, n = [d[1], -d[0]], hw0 = 5, hw1 = 6.4, f = G.foot, sl = G.sole;
    const pts = [[f[0] - n[0] * hw0, f[1] - n[1] * hw0], [f[0] + n[0] * hw0, f[1] + n[1] * hw0], [sl[0] + n[0] * hw1, sl[1] + n[1] * hw1], [sl[0] - n[0] * hw1, sl[1] - n[1] * hw1]];
    const hc = o.flat ? o.flat : far ? shade(c.hoof, -0.15) : c.hoof;
    s += `<path d="M${p(pts[0])} L${p(pts[1])} L${p(pts[2])} Q${p([(pts[2][0] + pts[3][0]) / 2 + d[0] * 1.2, (pts[2][1] + pts[3][1]) / 2 + d[1] * 1.2])} ${p(pts[3])} Z" fill="${hc}" ${stk(sw * 0.9, ink)}/>`;
    if (!o.flat) s += `<path d="M${p([f[0] + d[0] * 2 - n[0] * 3, f[1] + d[1] * 2 - n[1] * 3])} L${p([f[0] + d[0] * 2 + n[0] * 3, f[1] + d[1] * 2 + n[1] * 3])}" stroke="#fff" stroke-width="1.4" opacity=".35" stroke-linecap="round"/>`;
    return s;
  };
  legSet.filter((G) => !G.L.near).forEach((G) => { g += legDraw(G, true); });

  // --- body + neck (one silhouette)
  g += `<g${tr ? ` transform="${tr}"` : ""}>`;
  g += `<path d="${BODY_D}" fill="url(#${u}b)" ${stk(sw, ink)}/>`;
  if (!o.flat) {
    g += `<g clip-path="url(#${u}c)">`;
    if (c.dapple) { const R = rng(7); for (let i = 0; i < 22; i++) { const x = 92 + R() * 70, y = 74 + R() * 30, r = 2.2 + R() * 2.4; g += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r + 0.9)}" fill="${shade(bodyC, -0.08)}" opacity=".7"/><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${shade(bodyC, 0.3)}" opacity=".85"/>`; } }
    g += `<path d="M86 76 C104 82 128 78 150 74" fill="none" stroke="#fff" stroke-width="${sw * 1.3}" stroke-linecap="round" opacity="${c.sheen || 0.38}"/>`;   // back sheen
    g += `<ellipse cx="150" cy="80" rx="8" ry="5" fill="#fff" opacity="${(c.sheen || 0.38) * 0.7}" transform="rotate(-20 150 80)"/>`;
    g += `<path d="M66 74 Q60 64 56 52" fill="none" stroke="#fff" stroke-width="${sw}" stroke-linecap="round" opacity="${(c.sheen || 0.38) * 0.8}"/>`;      // neck sheen
    g += `<path d="M84 82 Q80 92 83 102 M128 78 Q140 84 141 100" fill="none" stroke="${shade(bodyC, -0.3)}" stroke-width="${sw * 0.6}" stroke-linecap="round" opacity=".35"/>`;  // shoulder & thigh
    g += `</g>`;
  }
  // mane along the crest: a few pointed locks falling onto the neck
  const C0 = CREST, cr = (t) => bez(C0[0], C0[1], C0[2], C0[3], Math.max(0, Math.min(1, t)));
  const nrm = (t) => { const q = cr(t + 0.01), p0 = cr(t - 0.01), tx = q[0] - p0[0], ty = q[1] - p0[1], l = Math.hypot(tx, ty); return [ty / l, -tx / l]; };
  const outer = [], inner = [], NT = o.foal ? 5 : 6;
  for (let i = 0; i <= 14; i++) { const t = i / 14, p = cr(t), n = nrm(t), out = 3 + Math.sin(t * Math.PI) * 2.2 + (i % 3 === 1 ? 1.2 : 0); outer.push([p[0] + n[0] * out, p[1] + n[1] * out]); }
  for (let j = NT - 1; j >= 0; j--) {
    const tn = (j + 1) / NT, tt = (j + 0.45) / NT, pn = cr(tn), nn = nrm(tn), pt = cr(tt), nt = nrm(tt);
    const dt = (o.foal ? 8 : 12) * (1 - tt * 0.3), dn = dt * 0.6;
    if (j < NT - 1) inner.push([pn[0] - nn[0] * dn, pn[1] - nn[1] * dn]);
    inner.push([pt[0] - nt[0] * dt + 1, pt[1] - nt[1] * dt + 4]);
  }
  const maneD = spline(outer.concat(inner), true);
  g += `<path d="${maneD}" fill="url(#${u}m)" ${stk(sw, ink)}/>`;
  if (!o.flat) g += `<path d="${spline(outer.slice(2, 13).map((p) => [p[0] - 4, p[1] + 3]), false)}" fill="none" stroke="${shade(maneC, 0.35)}" stroke-width="${sw * 0.7}" stroke-linecap="round" opacity=".5"/>`;
  g += `</g>`;
  // --- near legs (in front of the body; their outline is masked inside the body)
  legSet.filter((G) => G.L.near).forEach((G) => { g += legDraw(G, false); });

  // --- head (with a little nod)
  if (!o.noHead) {
    const hb = P.head || 0;
    const htr = (o.foal ? `translate(54 34) scale(1.16) translate(-54 -34) ` : "") + `translate(${-hb * 0.5} ${hb})`;
    g += `<g${tr ? ` transform="${tr}"` : ""}><g transform="${htr}">`;
    // far ear, then head, near ear
    g += `<path d="M60 24 Q62 10 68 6 Q72 16 68 28 Z" fill="${shade(bodyC, o.flat ? 0 : -0.2)}" ${stk(sw, ink)}/>`;
    g += `<path d="${HEAD_D}" fill="url(#${u}b)" ${stk(sw, ink)}/>`;
    if (!o.flat) {
      g += `<g clip-path="url(#${u}h)">`;
      g += `<ellipse cx="20" cy="62" rx="14" ry="12" fill="${c.muzzle}" opacity=".85"/>`;
      if (c.blaze === "blaze") g += `<path d="M44 20 Q36 26 30 38 Q24 48 18 54 Q22 58 26 54 Q32 44 38 34 Q44 26 48 21 Z" fill="#fffaf0"/>`;
      if (c.blaze === "star") g += `<path d="M44 24 Q40 28 37 34 Q42 32 47 30 Q47 26 44 24 Z" fill="#fffaf0"/>`;
      g += `<path d="M54 50 Q60 44 60 36" fill="none" stroke="${shade(bodyC, -0.3)}" stroke-width="${sw * 0.6}" stroke-linecap="round" opacity=".4"/>`;   // jowl
      g += `<path d="M30 30 Q38 22 48 20" fill="none" stroke="#fff" stroke-width="${sw}" stroke-linecap="round" opacity="${c.sheen || 0.38}"/>`;
      g += `</g>`;
      // eye (big, friendly), lashes, nostril, smile
      const happy = o.mood === "happy";
      if (happy) g += `<path d="M38 37 Q43 31 48 37" fill="none" ${stk(sw * 0.9, "#2a1c18")}/>`;
      else g += `<ellipse cx="43" cy="36" rx="4.2" ry="5.2" fill="#2a1c18"/><circle cx="41.6" cy="34" r="1.7" fill="#fff"/><circle cx="44.6" cy="38.4" r=".8" fill="#fff" opacity=".8"/>`;
      g += `<path d="M47 31.5 Q49.5 30 51 28" fill="none" stroke="#2a1c18" stroke-width="1.3" stroke-linecap="round"/>`;
      g += `<path d="M18 56 Q16 59 19 61" fill="none" stroke="${shade(c.muzzle, -0.45)}" stroke-width="1.8" stroke-linecap="round"/>`;
      g += `<path d="M17 65.5 Q22 68 27 66" fill="none" stroke="${shade(c.muzzle, -0.45)}" stroke-width="1.5" stroke-linecap="round"/>`;
      g += `<ellipse cx="34" cy="50" rx="4" ry="2.6" fill="#ff8f9a" opacity=".35"/>`;
      // halter (coral noseband + cheek strap + ring)
      g += `<path d="M28 41 Q35 53 42 64" fill="none" ${stk(sw * 2 + 3.4, ink)}/><path d="M28 41 Q35 53 42 64" fill="none" stroke="${HALTER}" stroke-width="3.4" stroke-linecap="round"/>`;
      g += `<path d="M37 53 Q48 46 58 34" fill="none" ${stk(sw * 2 + 3, ink)}/><path d="M37 53 Q48 46 58 34" fill="none" stroke="${HALTER}" stroke-width="3" stroke-linecap="round"/>`;
      g += `<circle cx="37" cy="53" r="2.6" fill="${GOLD}" ${stk(1.4, ink)}/>`;
    }
    g += `<path d="M54 24 Q54 8 60 3 Q66 12 64 26 Z" fill="url(#${u}b)" ${stk(sw, ink)}/>`;
    if (!o.flat) g += `<path d="M57 21 Q57 12 60 8 Q62 14 61 22 Z" fill="${mix(bodyC, "#ff9fa8", 0.45)}" opacity=".8"/>`;
    // forelock
    g += `<path d="${spline([[53, 19], [60, 17], [59, 22], [53, 27], [47, 31], [49, 25]], true)}" fill="url(#${u}m)" ${stk(sw * 0.9, ink)}/>`;
    g += `</g></g>`;
  }
  g += `</g>`;
  return { defs, body: g };
}

function horseSheet(coat) {
  let defs = ""; const frames = [0, 1, 2, 3].map((i) => { const r = horse(coat, i, `h${i}`); defs += r.defs; return r.body; });
  return job(`assets/sheet/horse_${coat}.png`, 192 * 4, 160, sheet(frames, 192, 160, 4), defs);
}


/* ======================= Kids (the player) ======================= */
const KIDS = {
  fille:  { skin: "#f8d6bb", hair: "#9a5530", style: "ponytail", jacket: "#ff7f78", pants: "#f6eedc", boots: "#5a3e36", eyes: "#3e2a1e", tie: SKY },
  garcon: { skin: "#e9b48c", hair: "#4a2e1e", style: "short",    jacket: "#3ea8b6", pants: "#f1e7d1", boots: "#5a3e36", eyes: "#3a2a1a", tie: GOLD },
};
// Hair for a head centred (cx,cy) radius r. view: down | up | left ; layer: back | front
function kidHair(k, cx, cy, r, view, layer) {
  const H = k.hair, st = stk(3), HL = shade(H, 0.25);
  if (view === "up") {
    let g = `<circle cx="${cx}" cy="${cy}" r="${r + 1.5}" fill="${H}" ${st}/>`;
    g += `<path d="M${cx - r * 0.6} ${cy - r * 0.55} Q${cx} ${cy - r * 0.95} ${cx + r * 0.6} ${cy - r * 0.55}" fill="none" stroke="${HL}" stroke-width="3" stroke-linecap="round" opacity=".6"/>`;
    if (k.style === "ponytail") g += `<path d="${spline([[cx - 9, cy + r * 0.05], [cx - 13, cy + r * 0.7], [cx - 8, cy + r * 1.35], [cx + 1, cy + r * 1.6], [cx + 10, cy + r * 1.2], [cx + 12, cy + r * 0.6], [cx + 9, cy + r * 0.05]], true)}" fill="${H}" ${st}/><path d="M${cx - 1} ${cy + r * 0.6} Q${cx + 1} ${cy + r * 1.1} ${cx - 1} ${cy + r * 1.35}" fill="none" stroke="${HL}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/><ellipse cx="${cx}" cy="${cy + r * 0.08}" rx="8" ry="5" fill="${k.tie}" ${stk(2.5)}/>`;
    else g += `<path d="M${cx - r * 0.9} ${cy + r * 0.45} Q${cx} ${cy + r * 0.75} ${cx + r * 0.9} ${cy + r * 0.45}" fill="none" stroke="${shade(H, -0.2)}" stroke-width="2.5" opacity=".6"/>`;
    return g;
  }
  if (view === "down") {
    if (layer === "back") return k.style === "ponytail" ? `<path d="${spline([[cx + r * 0.75, cy - r * 0.35], [cx + r * 1.35, cy + r * 0.1], [cx + r * 1.35, cy + r * 0.8], [cx + r * 1.0, cy + r * 1.05], [cx + r * 0.85, cy + r * 0.4]], true)}" fill="${H}" ${st}/><ellipse cx="${cx + r * 0.98}" cy="${cy - r * 0.2}" rx="5" ry="6" fill="${k.tie}" ${stk(2.5)}/>` : "";
    if (k.style === "ponytail") return `<path d="M${cx - r * 1.03} ${cy + r * 0.15} Q${cx - r * 1.12} ${cy - r * 1.18} ${cx} ${cy - r * 1.1} Q${cx + r * 1.12} ${cy - r * 1.18} ${cx + r * 1.03} ${cy + r * 0.1} Q${cx + r * 0.9} ${cy - r * 0.42} ${cx + r * 0.45} ${cy - r * 0.5} Q${cx - r * 0.2} ${cy - r * 0.62} ${cx - r * 0.55} ${cy - r * 0.2} Q${cx - r * 0.85} ${cy - r * 0.1} ${cx - r * 1.03} ${cy + r * 0.15} Z" fill="${H}" ${st}/><path d="M${cx - r * 0.5} ${cy - r * 0.85} Q${cx} ${cy - r * 1.02} ${cx + r * 0.45} ${cy - r * 0.86}" fill="none" stroke="${HL}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
    return `<path d="M${cx - r * 1.03} ${cy - r * 0.02} Q${cx - r * 1.08} ${cy - r * 1.18} ${cx} ${cy - r * 1.12} Q${cx + r * 1.08} ${cy - r * 1.18} ${cx + r * 1.03} ${cy - r * 0.02} Q${cx + r * 0.75} ${cy - r * 0.55} ${cx + r * 0.3} ${cy - r * 0.45} L${cx + r * 0.12} ${cy - r * 0.62} L${cx - r * 0.08} ${cy - r * 0.45} Q${cx - r * 0.45} ${cy - r * 0.68} ${cx - r * 0.75} ${cy - r * 0.4} Q${cx - r * 0.95} ${cy - r * 0.3} ${cx - r * 1.03} ${cy - r * 0.02} Z" fill="${H}" ${st}/><path d="M${cx - r * 0.5} ${cy - r * 0.88} Q${cx} ${cy - r * 1.04} ${cx + r * 0.45} ${cy - r * 0.9}" fill="none" stroke="${HL}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
  }
  // side view (facing left): hair cap over the back half (+ ponytail behind)
  let g = "";
  if (k.style === "ponytail") g += `<path d="${spline([[cx + r * 0.7, cy - r * 0.55], [cx + r * 1.45, cy - r * 0.35], [cx + r * 1.7, cy + r * 0.35], [cx + r * 1.4, cy + r * 0.95], [cx + r * 1.15, cy + r * 0.5], [cx + r * 0.85, cy - r * 0.05]], true)}" fill="${H}" ${st}/><ellipse cx="${cx + r * 1.0}" cy="${cy - r * 0.38}" rx="4.5" ry="6" fill="${k.tie}" ${stk(2.5)} transform="rotate(-30 ${cx + r * 1.0} ${cy - r * 0.38})"/>`;
  g += `<path d="M${cx - r * 0.85} ${cy - r * 0.55} Q${cx - r * 0.3} ${cy - r * 1.25} ${cx + r * 0.6} ${cy - r * 0.95} Q${cx + r * 1.12} ${cy - r * 0.55} ${cx + r * 1.0} ${cy + r * 0.25} Q${cx + r * 0.85} ${cy + r * 0.75} ${cx + r * 0.5} ${cy + r * 0.8} Q${cx + r * 0.42} ${cy + r * 0.2} ${cx + r * 0.05} ${cy - r * 0.2} Q${cx - r * 0.25} ${cy - r * 0.42} ${cx - r * 0.55} ${cy - r * 0.28} Q${cx - r * 0.75} ${cy - r * 0.32} ${cx - r * 0.85} ${cy - r * 0.55} Z" fill="${H}" ${st}/>`;
  g += `<path d="M${cx - r * 0.35} ${cy - r * 0.88} Q${cx + r * 0.2} ${cy - r * 1.05} ${cx + r * 0.65} ${cy - r * 0.75}" fill="none" stroke="${HL}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
  return g;
}
// front face: eyes, cheeks, mouth (mood: "smile" | "happy")
function kidFace(k, cx, cy, r, mood) {
  const ey = cy + r * 0.05, ex = r * 0.36;
  let g = "";
  [-1, 1].forEach((d) => {
    g += `<ellipse cx="${cx + d * ex}" cy="${ey}" rx="${r * 0.12}" ry="${r * 0.16}" fill="${INK}"/><circle cx="${cx + d * ex - r * 0.04}" cy="${ey - r * 0.06}" r="${r * 0.05}" fill="#fff"/>`;
    g += `<ellipse cx="${cx + d * r * 0.58}" cy="${cy + r * 0.32}" rx="${r * 0.15}" ry="${r * 0.09}" fill="#ff7f9a" opacity=".5"/>`;
  });
  const my = cy + r * 0.42;
  if (mood === "happy") g += `<path d="M${cx - r * 0.3} ${my - r * 0.06} Q${cx} ${my + r * 0.4} ${cx + r * 0.3} ${my - r * 0.06} Z" fill="#9b3a4e" ${stk(2.6)}/><path d="M${cx - r * 0.24} ${my - r * 0.03} L${cx + r * 0.24} ${my - r * 0.03} L${cx + r * 0.2} ${my + r * 0.07} L${cx - r * 0.2} ${my + r * 0.07} Z" fill="#fff"/>`;
  else g += `<path d="M${cx - r * 0.22} ${my} Q${cx} ${my + r * 0.22} ${cx + r * 0.22} ${my}" fill="none" ${stk(2.6)}/>`;
  return g;
}
// One kid frame, 128×128, feet ≈ y 120. dir: up | left | down | right ; phase (radians) ; moving
function kid(k, dir, phase, moving, u, mood) {
  if (dir === "right") { const r = kid(k, "left", phase, moving, u, mood); return { defs: r.defs, body: `<g transform="translate(128 0) scale(-1 1)">${r.body}</g>` }; }
  const step = moving ? Math.sin(phase) : 0, bob = moving ? -Math.abs(Math.sin(phase)) * 2.5 : 0;
  const cx = 64, hy = 37 + bob, r = 25, st = stk(3);
  const defs = rad(`${u}s`, [[0, shade(k.skin, 0.18)], [1, k.skin]], 0.4, 0.35, 0.7) +
    lin(`${u}j`, [[0, shade(k.jacket, 0.18)], [1, shade(k.jacket, -0.12)]]) + lin(`${u}p`, [[0, k.pants], [1, shade(k.pants, -0.1)]]);
  const side = dir === "left";
  const JD = shade(k.jacket, -0.22);
  let g = "";
  // legs (jodhpurs + tall boots)
  const leg = (x, y0, len, far) => {
    const pc = far ? shade(k.pants, -0.12) : `url(#${u}p)`, bc = far ? shade(k.boots, -0.15) : k.boots;
    return `<rect x="${x - 6.5}" y="${y0}" width="13" height="${len}" rx="6" fill="${pc}" ${st}/>` +
      `<path d="M${x - 6.5} ${y0 + len * 0.56} Q${x} ${y0 + len * 0.52} ${x + 6.5} ${y0 + len * 0.56} V${y0 + len - 2} H${x - 6.5} Z" fill="${bc}" ${st}/>` +
      `<path d="M${x - 3.5} ${y0 + len * 0.18} Q${x - 4.5} ${y0 + len * 0.3} ${x - 3.5} ${y0 + len * 0.42}" stroke="${shade(k.pants, -0.25)}" stroke-width="1.6" fill="none" opacity=".6" stroke-linecap="round"/>` +
      `<path d="M${x - 4} ${y0 + len * 0.62} V${y0 + len - 6}" stroke="#fff" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>`;
  };
  if (side) {
    [1, -1].forEach((d) => {
      const a = d * step * 26;
      g += `<g transform="rotate(${f2(a)} ${cx} ${88 + bob})">${leg(cx, 85 + bob, 31, d > 0)}<ellipse cx="${cx - 4}" cy="${115.5 + bob}" rx="9.5" ry="5" fill="${d > 0 ? shade(k.boots, -0.15) : k.boots}" ${st}/></g>`;
    });
  } else {
    [-1, 1].forEach((d) => {
      const lift = moving ? Math.max(0, d * step) * 6 : 0;
      g += leg(cx + d * 8.5, 85 + bob, 31 - lift, false);
      g += `<ellipse cx="${cx + d * 9.5}" cy="${115.5 - lift + bob}" rx="${dir === "up" ? 8 : 9}" ry="5" fill="${k.boots}" ${st}/>`;
    });
  }
  // arms
  const arm = (x, ang, far) => `<g transform="rotate(${f2(ang)} ${x} ${66 + bob})"><rect x="${x - 6}" y="${62 + bob}" width="12" height="27" rx="6" fill="${far ? JD : `url(#${u}j)`}" ${st}/><circle cx="${x}" cy="${91 + bob}" r="5.6" fill="${k.skin}" ${st}/></g>`;
  if (side) g += arm(cx + 3, -step * 30, true);
  else g += arm(cx - 20, 10 + step * 14, false) + arm(cx + 20, -10 - step * 14, false);
  // neck (always joins head and jacket)
  g += `<rect x="${cx - 6.5}" y="${hy + 14}" width="13" height="16" rx="5" fill="${shade(k.skin, -0.08)}" ${st}/>`;
  // jacket (fitted riding jacket, slight flare at the hips)
  g += `<path d="M${cx - 18} ${62 + bob} Q${cx} ${56 + bob} ${cx + 18} ${62 + bob} L${cx + 20} ${91 + bob} Q${cx} ${95 + bob} ${cx - 20} ${91 + bob} Z" fill="url(#${u}j)" ${st}/>`;
  if (dir === "down") {
    g += `<path d="M${cx - 9} ${59 + bob} L${cx} ${72 + bob} L${cx + 9} ${59 + bob} Z" fill="#fff" ${stk(2.4)}/>`;           // shirt collar
    g += `<path d="M${cx} ${72 + bob} V${93 + bob}" stroke="${JD}" stroke-width="2.4"/>`;
    [79, 88].forEach((y) => { g += `<circle cx="${cx + 3.5}" cy="${y + bob}" r="1.8" fill="#fff" opacity=".85"/>`; });
    g += `<path d="M${cx - 15} ${83 + bob} a4.4 4.4 0 1 1 8.8 0" fill="none" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round"/>`;   // horseshoe badge
    
  } else if (side) {
    g += `<path d="M${cx - 12} ${61 + bob} L${cx - 6} ${74 + bob} L${cx - 14} ${91 + bob}" fill="none" stroke="${JD}" stroke-width="2.4" stroke-linejoin="round"/>`;
    g += `<path d="M${cx - 15} ${61 + bob} L${cx - 9} ${64 + bob} L${cx - 13} ${70 + bob} Z" fill="#fff" ${stk(2)}/>`;
  } else {
    g += `<path d="M${cx} ${62 + bob} V${93 + bob}" stroke="${JD}" stroke-width="2" opacity=".7"/><path d="M${cx - 12} ${61 + bob} Q${cx} ${66 + bob} ${cx + 12} ${61 + bob}" fill="none" stroke="${JD}" stroke-width="3"/>`;
  }
  // head
  if (dir === "up") {
    g += kidHair(k, cx, hy, r, "up");
    g += `<ellipse cx="${cx - r}" cy="${hy + 4}" rx="5" ry="7" fill="${k.skin}" ${st}/><ellipse cx="${cx + r}" cy="${hy + 4}" rx="5" ry="7" fill="${k.skin}" ${st}/>`;
  } else if (dir === "down") {
    g += kidHair(k, cx, hy, r, "down", "back");
    g += `<circle cx="${cx}" cy="${hy}" r="${r}" fill="url(#${u}s)" ${st}/>`;
    g += `<ellipse cx="${cx - r}" cy="${hy + 4}" rx="5" ry="7" fill="${k.skin}" ${st}/><ellipse cx="${cx + r}" cy="${hy + 4}" rx="5" ry="7" fill="${k.skin}" ${st}/>`;
    g += kidFace(k, cx, hy + 3, r, mood);
    g += kidHair(k, cx, hy, r, "down", "front");
  } else {
    g += `<circle cx="${cx}" cy="${hy}" r="${r}" fill="url(#${u}s)" ${st}/>`;
    g += `<path d="M${cx - r * 0.9} ${hy - r * 0.02} Q${cx - r * 1.2} ${hy + r * 0.16} ${cx - r * 0.93} ${hy + r * 0.32}" fill="${k.skin}" ${st}/>`;
    g += `<ellipse cx="${cx - r * 0.45}" cy="${hy + r * 0.05}" rx="${r * 0.11}" ry="${r * 0.15}" fill="${INK}"/><circle cx="${cx - r * 0.49}" cy="${hy - r * 0.02}" r="${r * 0.04}" fill="#fff"/>`;
    g += `<ellipse cx="${cx - r * 0.5}" cy="${hy + r * 0.38}" rx="${r * 0.13}" ry="${r * 0.08}" fill="#ff7f9a" opacity=".5"/>`;
    g += `<path d="M${cx - r * 0.78} ${hy + r * 0.5} Q${cx - r * 0.62} ${hy + r * 0.64} ${cx - r * 0.45} ${hy + r * 0.52}" fill="none" ${stk(2.5)}/>`;
    g += kidHair(k, cx, hy, r, "left");
    g += `<ellipse cx="${cx + r * 0.22}" cy="${hy + r * 0.12}" rx="${r * 0.14}" ry="${r * 0.19}" fill="${k.skin}" ${st}/>`;
    g += arm(cx - 2, step * 30, false);
  }
  return { defs, body: g };
}
function kidSheet(id) {
  const k = KIDS[id], dirs = ["up", "left", "down", "right"];
  let defs = ""; const frames = [];
  dirs.forEach((d, r) => { for (let i = 0; i < 9; i++) { const res = kid(k, d, ((i - 1) / 8) * Math.PI * 2, i > 0, `k${r}${i}`, "smile"); defs += res.defs; frames.push(res.body); } });
  return job(`assets/sheet/kid_${id}.png`, 128 * 9, 512, sheet(frames, 128, 128, 9), defs);
}
// Seated astride (side view facing LEFT): hips at (66, 96); no horse.
const RIDE_HIP = [66, 96];
function kidRide(k, u) {
  const cx = 64, hy = 36, r = 25, st = stk(3), [hx, hpy] = RIDE_HIP;
  const defs = rad(`${u}s`, [[0, shade(k.skin, 0.18)], [1, k.skin]], 0.4, 0.35, 0.7) +
    lin(`${u}j`, [[0, shade(k.jacket, 0.18)], [1, shade(k.jacket, -0.12)]]) + lin(`${u}p`, [[0, k.pants], [1, shade(k.pants, -0.1)]]);
  const JD = shade(k.jacket, -0.22);
  let g = "";
  // far arm (behind), reaching forward to the reins
  g += `<path d="${capsule([cx + 2, 68], [cx - 6, 84], 11, 10)}" fill="${JD}" ${st}/><path d="${capsule([cx - 6, 84], [cx - 19, 82], 10, 9)}" fill="${JD}" ${st}/><circle cx="${cx - 21}" cy="${81}" r="5.4" fill="${shade(k.skin, -0.1)}" ${st}/>`;
  // neck + jacket (torso upright, hips on the saddle)
  g += `<rect x="${cx - 6.5}" y="${hy + 14}" width="13" height="16" rx="5" fill="${shade(k.skin, -0.08)}" ${st}/>`;
  g += `<path d="M${cx - 17} ${62} Q${cx} ${56} ${cx + 17} ${62} L${cx + 18} ${92} Q${hx} ${hpy + 4} ${cx - 16} ${93} Z" fill="url(#${u}j)" ${st}/>`;
  g += `<path d="M${cx - 12} 61 L${cx - 6} 74 L${cx - 13} 92" fill="none" stroke="${JD}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${cx - 15} 61 L${cx - 9} 64 L${cx - 13} 70 Z" fill="#fff" ${stk(2)}/>`;
  // near leg: thigh forward-down, knee bent, lower leg down, boot heel down
  const knee = [hx - 18, hpy + 5], ankle = [hx - 13, hpy + 23];
  const cuff = [knee[0] + (ankle[0] - knee[0]) * 0.32, knee[1] + (ankle[1] - knee[1]) * 0.32];
  g += `<ellipse cx="${ankle[0] - 5}" cy="${ankle[1] + 1}" rx="9.5" ry="4.8" fill="${k.boots}" ${st}/>`;
  g += `<path d="${capsule(knee, ankle, 12.5, 11)}" fill="${k.boots}" ${st}/>`;
  g += `<path d="M${ankle[0] - 13} ${ankle[1] + 1} Q${ankle[0] - 5} ${ankle[1] - 3} ${ankle[0] + 5} ${ankle[1]}" fill="none" stroke="${k.boots}" stroke-width="5"/>`;
  g += `<path d="${capsule([knee[0], knee[1]], cuff, 12.5, 12)}" fill="url(#${u}p)" ${st}/>`;
  g += `<path d="${capsule([hx + 3, hpy - 3], knee, 17, 13)}" fill="url(#${u}p)" ${st}/>`;
  g += `<path d="${capsule([hx + 3, hpy - 3], knee, 17 - 6, 13 - 6)}" fill="url(#${u}p)"/>`;
  g += `<path d="M${cuff[0] - 1} ${cuff[1] + 4} L${ankle[0] - 1.5} ${ankle[1] - 4}" stroke="#fff" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>`;
  // head (side, facing left), smiling
  g += `<circle cx="${cx}" cy="${hy}" r="${r}" fill="url(#${u}s)" ${st}/>`;
  g += `<path d="M${cx - r * 0.9} ${hy - r * 0.02} Q${cx - r * 1.2} ${hy + r * 0.16} ${cx - r * 0.93} ${hy + r * 0.32}" fill="${k.skin}" ${st}/>`;
  g += `<ellipse cx="${cx - r * 0.45}" cy="${hy + r * 0.05}" rx="${r * 0.11}" ry="${r * 0.15}" fill="${INK}"/><circle cx="${cx - r * 0.49}" cy="${hy - r * 0.02}" r="${r * 0.04}" fill="#fff"/>`;
  g += `<ellipse cx="${cx - r * 0.5}" cy="${hy + r * 0.38}" rx="${r * 0.13}" ry="${r * 0.08}" fill="#ff7f9a" opacity=".5"/>`;
  g += `<path d="M${cx - r * 0.8} ${hy + r * 0.48} Q${cx - r * 0.62} ${hy + r * 0.68} ${cx - r * 0.42} ${hy + r * 0.5}" fill="none" ${stk(2.5)}/>`;
  g += kidHair(k, cx, hy, r, "left");
  g += `<ellipse cx="${cx + r * 0.22}" cy="${hy + r * 0.12}" rx="${r * 0.14}" ry="${r * 0.19}" fill="${k.skin}" ${st}/>`;
  // near arm: upper arm down, forearm forward, hands on the reins
  g += `<path d="${capsule([cx + 1, 68], [cx - 4, 85], 12, 11)}" fill="url(#${u}j)" ${st}/><path d="${capsule([cx - 4, 85], [cx - 17, 86], 11, 10)}" fill="url(#${u}j)" ${st}/>`;
  g += `<path d="M${cx - 24} 86 Q${cx - 34} 90 ${cx - 40} 98" fill="none" stroke="${WOOD_D}" stroke-width="3.2" stroke-linecap="round"/>`;   // reins
  g += `<circle cx="${cx - 21}" cy="${86}" r="5.8" fill="${k.skin}" ${st}/>`;
  return { defs, body: g };
}
function rideJob(id) { const r = kidRide(KIDS[id], "r"); return job(`assets/sheet/kid_${id}_ride.png`, 128, 128, r.body, r.defs); }
function kidThumb(id) { const r = kid(KIDS[id], "down", 0, false, "t", "happy"); return job(`assets/ui/kid_${id}.png`, 128, 128, r.body, r.defs); }

/* ======================= World: ground tiles (seamless 256) ======================= */
// every mark is drawn at its position and wrapped copies (±256) so the tile repeats seamlessly
const wrap = (x, y, fn, S = 256) => { let g = ""; for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { const X = x + dx, Y = y + dy; if (X > -40 && X < S + 40 && Y > -40 && Y < S + 40) g += fn(X, Y); } return g; };
function grass() {
  const S = 256, R = rng(11);
  let g = `<rect width="${S}" height="${S}" fill="#9dd174"/>`;
  for (let i = 0; i < 14; i++) { const x = R() * S, y = R() * S, rx = 30 + R() * 40, ry = 18 + R() * 24, c = R() < 0.5 ? "#a8d97e" : "#93c96b"; g += wrap(x, y, (X, Y) => `<ellipse cx="${f2(X)}" cy="${f2(Y)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="${c}" opacity=".55"/>`); }
  for (let i = 0; i < 70; i++) {   // little grass tufts (2–3 blades)
    const x = R() * S, y = R() * S, h = 4 + R() * 4, c = R() < 0.7 ? "#7fbd5a" : "#b6e08c";
    g += wrap(x, y, (X, Y) => `<path d="M${f2(X - 3)} ${f2(Y)} Q${f2(X - 3)} ${f2(Y - h * 0.6)} ${f2(X - 5)} ${f2(Y - h)} M${f2(X)} ${f2(Y)} Q${f2(X)} ${f2(Y - h)} ${f2(X + 1)} ${f2(Y - h * 1.25)} M${f2(X + 3)} ${f2(Y)} Q${f2(X + 3)} ${f2(Y - h * 0.6)} ${f2(X + 5)} ${f2(Y - h * 0.9)}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`);
  }
  for (let i = 0; i < 7; i++) {    // a few tiny flowers
    const x = R() * S, y = R() * S, c = ["#ffffff", "#fff2a8", "#ffd0dc"][i % 3];
    g += wrap(x, y, (X, Y) => `${[0, 1, 2, 3, 4].map((j) => `<circle cx="${f2(X + Math.cos(j * 1.257) * 2.2)}" cy="${f2(Y + Math.sin(j * 1.257) * 2.2)}" r="1.7" fill="${c}"/>`).join("")}<circle cx="${f2(X)}" cy="${f2(Y)}" r="1.2" fill="#ffc94a"/>`);
  }
  return job("assets/img/grass.png", S, S, g);
}
function sandTile(file, base, seed, raked) {
  const S = 256, R = rng(seed);
  let g = `<rect width="${S}" height="${S}" fill="${base}"/>`;
  for (let i = 0; i < 12; i++) { const x = R() * S, y = R() * S, rx = 26 + R() * 40, ry = 14 + R() * 20, c = R() < 0.5 ? shade(base, 0.12) : shade(base, -0.05); g += wrap(x, y, (X, Y) => `<ellipse cx="${f2(X)}" cy="${f2(Y)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="${c}" opacity=".5"/>`); }
  if (raked) for (let y = 8; y < S; y += 16) { let d = `M0 ${y}`; for (let x = 0; x <= S; x += 32) d += ` Q${x + 16} ${y + (((x / 32) % 2) ? 2 : -2)} ${x + 32} ${y}`; g += `<path d="${d}" fill="none" stroke="${shade(base, -0.09)}" stroke-width="2" opacity=".55"/><path d="${d}" transform="translate(0 2.5)" fill="none" stroke="${shade(base, 0.25)}" stroke-width="1.4" opacity=".6"/>`; }
  for (let i = 0; i < 90; i++) { const x = R() * S, y = R() * S, r = 0.8 + R() * 1.6, c = R() < 0.6 ? shade(base, -0.16) : shade(base, 0.3); g += wrap(x, y, (X, Y) => `<ellipse cx="${f2(X)}" cy="${f2(Y)}" rx="${f2(r * 1.3)}" ry="${f2(r)}" fill="${c}" opacity=".7"/>`); }
  if (!raked) for (let i = 0; i < 10; i++) { const x = R() * S, y = R() * S, r = 2.5 + R() * 2; g += wrap(x, y, (X, Y) => `<ellipse cx="${f2(X)}" cy="${f2(Y)}" rx="${f2(r * 1.3)}" ry="${f2(r)}" fill="${shade(base, -0.12)}"/><ellipse cx="${f2(X - 0.6)}" cy="${f2(Y - 0.8)}" rx="${f2(r * 0.7)}" ry="${f2(r * 0.45)}" fill="${shade(base, 0.25)}"/>`); }
  return job(`assets/img/${file}.png`, S, S, g);
}

/* ======================= World: buildings ======================= */
const shadowEl = (cx, cy, rx, ry, op = 0.16) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#2a3a1a" opacity="${op}"/>`;
function planks(x0, y0, w, h, step, col, vertical = true) {
  let g = "";
  for (let x = x0 + step; x < x0 + w - 2; x += step) g += `<path d="M${x} ${y0 + 3} V${y0 + h - 3}" stroke="${shade(col, -0.2)}" stroke-width="1.6" opacity=".7"/><path d="M${x + 2} ${y0 + 3} V${y0 + h - 3}" stroke="${shade(col, 0.2)}" stroke-width="1.2" opacity=".5"/>`;
  return g;
}
function flowerBox(x, y, w) {
  let g = `<rect x="${x}" y="${y}" width="${w}" height="12" rx="3" fill="${WOOD}" ${stk(3)}/>`;
  for (let i = 0; i < Math.floor(w / 12); i++) { const fx = x + 7 + i * 12, c = [PINK, "#fff", GOLD, CORAL][i % 4]; g += `<circle cx="${fx}" cy="${y - 2}" r="6" fill="#6fbf5a" ${stk(2)}/>`; }
  for (let i = 0; i < Math.floor(w / 12); i++) { const fx = x + 7 + i * 12, c = [PINK, "#fff", GOLD, CORAL][i % 4]; g += `<circle cx="${fx}" cy="${y - 5}" r="3.6" fill="${c}" ${stk(1.5)}/>`; }
  return g;
}
function windowEl(x, y, w, h, curtain) {
  let g = `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="6" fill="#fffaf0" ${stk(3.5)}/>`;
  g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#glass)"/>`;
  g += `<path d="M${x + 4} ${y + h * 0.55} L${x + w * 0.45} ${y + 4}" stroke="#fff" stroke-width="4" opacity=".55" stroke-linecap="round"/>`;
  if (curtain) g += `<path d="M${x} ${y} H${x + w * 0.32} Q${x + w * 0.16} ${y + h * 0.5} ${x + w * 0.26} ${y + h} H${x} Z M${x + w} ${y} H${x + w * 0.68} Q${x + w * 0.84} ${y + h * 0.5} ${x + w * 0.74} ${y + h} H${x + w} Z" fill="${curtain}" ${stk(2.2)}/>`;
  g += `<path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="#fffaf0" stroke-width="4"/>`;
  return g;
}
const GLASS = lin("glass", [[0, "#bfe8ff"], [1, "#7cc6f0"]]);
function house() {   // "Maison": cosy farmhouse — cream walls, slate roof, chimney
  const W = 300, H = 280;
  const defs = GLASS + lin("hw", [[0, "#fff4df"], [1, "#efd9b4"]]) + lin("hr", [[0, "#8396b4"], [1, "#5d6d8c"]]) + lin("hd", [[0, "#5fb0c8"], [1, "#3f8aa4"]]) + lin("hb", [[0, "#e07a5f"], [1, "#b85a44"]]);
  let g = shadowEl(150, 266, 140, 12);
  // chimney (behind roof)
  g += `<rect x="196" y="30" width="30" height="70" rx="3" fill="url(#hb)" ${stk(4)}/><rect x="190" y="22" width="42" height="14" rx="4" fill="#c86a52" ${stk(4)}/>`;
  g += `<path d="M200 50 H222 M200 66 H222 M211 36 V50 M205 50 V66 M217 66 V80" stroke="#9a4a3a" stroke-width="2" opacity=".6"/>`;
  [[214, 14, 8], [226, 8, 6]].forEach(([x, y, r]) => { g += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".8"/>`; });
  // walls
  g += `<rect x="38" y="128" width="224" height="136" rx="6" fill="url(#hw)" ${stk(4)}/>`;
  const R = rng(5); for (let i = 0; i < 16; i++) { const x = 50 + R() * 196, y = 140 + R() * 110; g += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(6 + R() * 6)}" ry="${f2(3 + R() * 3)}" fill="none" stroke="#d9bf94" stroke-width="1.6" opacity=".8"/>`; }
  g += `<rect x="38" y="250" width="224" height="14" rx="4" fill="#c9b08c" ${stk(4)}/>`;
  // roof (slate, front slope seen from above) + tile rows
  g += `<path d="M18 138 L62 46 H238 L282 138 Z" fill="url(#hr)" ${stk(4)}/>`;
  g += `<clipPath id="rc"><path d="M18 138 L62 46 H238 L282 138 Z"/></clipPath><g clip-path="url(#rc)">`;
  for (let row = 0; row < 6; row++) { const y = 58 + row * 15; let d = ""; for (let x = 10 - (row % 2) * 9; x < 292; x += 18) d += `M${x} ${y} q9 10 18 0 `; g += `<path d="${d}" fill="none" stroke="#4e5c78" stroke-width="2" opacity=".55"/>`; }
  g += `<path d="M70 54 H230" stroke="#fff" stroke-width="5" opacity=".3" stroke-linecap="round"/></g>`;
  g += `<path d="M14 136 H286 Q290 146 280 148 H20 Q10 146 14 136 Z" fill="#4e5c78" ${stk(4)}/>`;
  g += `<path d="M56 46 H244 Q250 46 248 52 H52 Q50 46 56 46 Z" fill="#4e5c78" ${stk(3)}/>`;
  // door + step + lamp
  g += `<path d="M70 252 V188 Q70 166 94 166 Q118 166 118 188 V252 Z" fill="url(#hd)" ${stk(4)}/>`;
  g += `<path d="M80 200 H108 M80 226 H108" stroke="#2f6f86" stroke-width="2.4"/><circle cx="110" cy="214" r="3.4" fill="${GOLD}" ${stk(1.6)}/>`;
  g += `<path d="M84 186 Q94 176 104 186" fill="none" stroke="#bfe8ff" stroke-width="4" stroke-linecap="round"/>`;
  g += `<rect x="62" y="250" width="64" height="12" rx="4" fill="#d8c8b0" ${stk(3.5)}/>`;
  g += `<path d="M132 168 V178" stroke="${INK}" stroke-width="3"/><path d="M126 178 H138 L136 194 H128 Z" fill="#ffe28a" ${stk(3)}/>`;
  // window with curtains + flower box
  g += windowEl(152, 172, 82, 54, PINK) + flowerBox(146, 236, 94);
  // little heart under the roof
  g += `<path d="M150 112 C142 104 132 112 150 124 C168 112 158 104 150 112 Z" fill="${CORAL}" ${stk(3)}/>`;
  return job("assets/img/house.png", W, H, g, defs);
}
function horseshoe(cx, cy, s, col, sw) {   // a lucky U horseshoe (opening up), with nail holes
  const r = 16 * s, d = `M${cx - r} ${cy - r * 0.9} V${cy} A${r} ${r} 0 0 0 ${cx + r} ${cy} V${cy - r * 0.9}`;
  let g = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${10 * s + sw * 2}" stroke-linecap="round"/>`;
  g += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${10 * s}" stroke-linecap="round"/>`;
  g += `<path d="M${cx - r} ${cy - r * 0.7} V${cy - r * 0.1}" fill="none" stroke="#fff" stroke-width="${3 * s}" stroke-linecap="round" opacity=".6"/>`;
  [[-1, -0.5], [-0.92, 0.3], [1, -0.5], [0.92, 0.3]].forEach(([a, b]) => { g += `<circle cx="${cx + a * r}" cy="${cy + b * r}" r="${1.6 * s}" fill="${shade(col, -0.45)}"/>`; });
  return g;
}
function saddleShape(cx, cy, s, col) {    // small saddle (side view) for signs/icons
  const st = stk(3 * Math.max(1, s * 0.8));
  let g = `<path d="M${cx - 24 * s} ${cy - 6 * s} Q${cx - 26 * s} ${cy - 18 * s} ${cx - 16 * s} ${cy - 16 * s} Q${cx} ${cy - 6 * s} ${cx + 16 * s} ${cy - 16 * s} Q${cx + 28 * s} ${cy - 22 * s} ${cx + 26 * s} ${cy - 6 * s} Q${cx + 24 * s} ${cy + 6 * s} ${cx} ${cy + 6 * s} Q${cx - 24 * s} ${cy + 6 * s} ${cx - 24 * s} ${cy - 6 * s} Z" fill="${col}" ${st}/>`;
  g += `<path d="M${cx - 6 * s} ${cy + 4 * s} V${cy + 18 * s}" stroke="${INK}" stroke-width="${2.4 * s}"/><path d="M${cx - 11 * s} ${cy + 18 * s} H${cx - 1 * s}" stroke="${INK}" stroke-width="${3 * s}" stroke-linecap="round"/>`;
  g += `<path d="M${cx - 16 * s} ${cy - 10 * s} Q${cx} ${cy - 1 * s} ${cx + 16 * s} ${cy - 11 * s}" fill="none" stroke="#fff" stroke-width="${2.4 * s}" opacity=".45" stroke-linecap="round"/>`;
  return g;
}
function tack() {    // "Sellerie": wooden tack-room/shop with a horseshoe+saddle sign
  const W = 300, H = 280;
  const defs = GLASS + lin("tw", [[0, "#d9a066"], [1, "#b47a46"]]) + lin("tr", [[0, "#cf6a52"], [1, "#a24a3a"]]) + lin("td", [[0, "#9a6a44"], [1, "#7a4f32"]]) + rad("ts", [[0, "#f2d3a2"], [1, "#d6a86a"]]);
  let g = shadowEl(150, 266, 140, 12);
  // walls
  g += `<rect x="36" y="118" width="228" height="146" rx="5" fill="url(#tw)" ${stk(4)}/>` + planks(36, 118, 228, 146, 19, "#c88c56");
  // gable roof
  g += `<path d="M150 22 L290 132 Q292 140 284 140 L16 140 Q8 140 10 132 Z" fill="url(#tr)" ${stk(4)}/>`;
  g += `<clipPath id="trc"><path d="M150 22 L290 132 L10 132 Z"/></clipPath><g clip-path="url(#trc)">`;
  for (let row = 0; row < 7; row++) { const y = 46 + row * 14; let d = ""; for (let x = 0; x < 300; x += 16) d += `M${x + (row % 2) * 8} ${y} q8 9 16 0 `; g += `<path d="${d}" fill="none" stroke="#8a3a2c" stroke-width="2" opacity=".5"/>`; }
  g += `</g><path d="M150 30 L60 100" stroke="#fff" stroke-width="5" opacity=".25" stroke-linecap="round"/>`;
  // gable sign: horseshoe + saddle plaque
  g += `<circle cx="150" cy="96" r="28" fill="url(#ts)" ${stk(4)}/><circle cx="150" cy="96" r="22" fill="none" stroke="#b98a52" stroke-width="2"/>`;
  g += horseshoe(150, 98, 1.05, GOLD, 2.6);
  // big double door with white X braces
  g += `<rect x="100" y="164" width="100" height="98" rx="4" fill="url(#td)" ${stk(4)}/>`;
  g += `<path d="M150 164 V262" stroke="${INK}" stroke-width="3"/>`;
  [[100, 150], [150, 200]].forEach(([a, b]) => { g += `<rect x="${a + 5}" y="169" width="40" height="88" fill="none" stroke="#fff6e6" stroke-width="5"/><path d="M${a + 7} 171 L${b - 7} 255 M${b - 7} 171 L${a + 7} 255" stroke="#fff6e6" stroke-width="5"/>`; });
  g += `<circle cx="143" cy="214" r="3" fill="${GOLD}" ${stk(1.5)}/><circle cx="157" cy="214" r="3" fill="${GOLD}" ${stk(1.5)}/>`;
  g += `<path d="M92 160 H208" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M92 160 H208" stroke="#fff6e6" stroke-width="5" stroke-linecap="round"/>`;
  // side windows + hanging lantern, horseshoe on the left wall
  g += windowEl(222, 168, 30, 36, null) + windowEl(50, 168, 30, 36, null);
  g += flowerBox(44, 216, 44) + flowerBox(216, 216, 44);
  return job("assets/img/tack.png", W, H, g, defs);
}
function stable() {   // small stable block with three stall doors (scenery)
  const W = 360, H = 260;
  const defs = lin("sw", [[0, "#e9bf86"], [1, "#cf9a5e"]]) + lin("sr", [[0, "#d46a52"], [1, "#a84a3a"]]) + lin("sd", [[0, "#5a3a2c"], [1, "#2e1e18"]]) + lin("sdd", [[0, "#7fb46e"], [1, "#5c9450"]]);
  let g = shadowEl(180, 248, 172, 11);
  g += `<rect x="20" y="104" width="320" height="142" rx="5" fill="url(#sw)" ${stk(4)}/>` + planks(20, 104, 320, 142, 20, "#dca86c");
  // roof + cupola
  g += `<rect x="160" y="18" width="40" height="40" rx="3" fill="#f1dfc0" ${stk(3.5)}/><path d="M152 22 L180 6 L208 22 Z" fill="url(#sr)" ${stk(3.5)}/><path d="M172 30 h16 v20 h-16 z" fill="#5a3a2c" ${stk(2.5)}/>`;
  g += `<path d="M8 120 L44 40 H316 L352 120 Q354 128 346 128 H14 Q6 128 8 120 Z" fill="url(#sr)" ${stk(4)}/>`;
  g += `<clipPath id="src"><path d="M8 120 L44 40 H316 L352 120 Z"/></clipPath><g clip-path="url(#src)">`;
  for (let row = 0; row < 6; row++) { const y = 52 + row * 14; let d = ""; for (let x = 0; x < 360; x += 18) d += `M${x + (row % 2) * 9} ${y} q9 9 18 0 `; g += `<path d="${d}" fill="none" stroke="#8a3a2c" stroke-width="2" opacity=".5"/>`; }
  g += `<path d="M52 48 H308" stroke="#fff" stroke-width="5" opacity=".25" stroke-linecap="round"/></g>`;
  // stall doors (Dutch doors: top open, bottom closed with X brace)
  [86, 180, 274].forEach((x) => {
    g += `<rect x="${x - 34}" y="140" width="68" height="106" rx="3" fill="#fff6e6" ${stk(4)}/>`;
    g += `<rect x="${x - 28}" y="146" width="56" height="44" rx="2" fill="url(#sd)" ${stk(3)}/>`;
    g += `<path d="M${x - 22} 186 Q${x - 12} 176 ${x - 4} 186 Q${x + 6} 174 ${x + 16} 186 Q${x + 22} 180 ${x + 26} 186" fill="#e9c66a" ${stk(2)}/>`;      // hay in the stall
    g += `<rect x="${x - 28}" y="192" width="56" height="50" rx="2" fill="url(#sdd)" ${stk(3)}/>`;
    g += `<path d="M${x - 24} 196 L${x + 24} 238 M${x + 24} 196 L${x - 24} 238" stroke="#fff6e6" stroke-width="4.5"/><rect x="${x - 24}" y="196" width="48" height="42" fill="none" stroke="#fff6e6" stroke-width="4"/>`;
    g += `<path d="M${x - 34} 190 H${x + 34}" stroke="${INK}" stroke-width="3"/>`;
    g += horseshoe(x, 124, 0.45, GOLD, 2);
  });
  return job("assets/img/stable.png", W, H, g, defs);
}

/* ======================= World: vegetation ======================= */
// leafy blobs: all outlines first, then all fills (no inner seams)
function leafy(circles, fill, sw = 3.5) {
  return circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + sw / 2}" fill="${INK}"/>`).join("") + circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - sw / 2}" fill="${fill}"/>`).join("");
}
function pine() {
  const W = 128, H = 192;
  const defs = lin("pn", [[0, "#5cb86e"], [1, "#2f7d4a"]]) + lin("tk", [[0, "#9a6a44"], [1, "#6e4a30"]], 0, 0, 1, 0);
  let g = shadowEl(64, 182, 40, 8);
  g += `<rect x="55" y="140" width="18" height="44" rx="5" fill="url(#tk)" ${stk(3.5)}/>`;
  const tiers = [[64, 150, 52, 54], [64, 112, 44, 50], [64, 76, 34, 46]];
  tiers.forEach(([x, y, w, h], i) => {
    const d = `M${x} ${y - h - 14} Q${x + w * 0.5} ${y - h * 0.5} ${x + w} ${y - 4} Q${x + w * 0.6} ${y + 6} ${x} ${y + 4} Q${x - w * 0.6} ${y + 6} ${x - w} ${y - 4} Q${x - w * 0.5} ${y - h * 0.5} ${x} ${y - h - 14} Z`;
    g += `<path d="${d}" fill="url(#pn)" ${stk(3.5)}/>`;
    g += `<path d="M${x - w * 0.45} ${y - h * 0.3} Q${x - w * 0.2} ${y - h * 0.6} ${x - 4} ${y - h * 0.9}" fill="none" stroke="#a8e39a" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>`;
  });
  return job("assets/img/pine.png", W, H, g, defs);
}
function tree() {
  const W = 160, H = 190;
  const defs = rad("lf", [[0, "#a6e07e"], [0.7, "#6cbf55"], [1, "#4f9e45"]], 0.4, 0.3, 0.8) + lin("tk", [[0, "#9a6a44"], [1, "#6e4a30"]], 0, 0, 1, 0);
  let g = shadowEl(80, 180, 54, 9);
  g += `<path d="M70 182 Q72 150 68 120 L92 120 Q88 150 90 182 Z" fill="url(#tk)" ${stk(3.5)}/>`;
  g += `<path d="M80 136 Q96 126 102 112" fill="none" ${stk(9)}/><path d="M80 136 Q96 126 102 112" fill="none" stroke="#8a5e3c" stroke-width="3.5" stroke-linecap="round"/>`;
  g += leafy([[80, 62, 48], [44, 92, 34], [116, 92, 34], [80, 112, 32], [56, 50, 30], [108, 50, 30]], "url(#lf)");
  g += `<path d="M46 66 Q56 36 84 26" fill="none" stroke="#fff" stroke-width="5" opacity=".35" stroke-linecap="round"/>`;
  [[58, 92], [102, 76], [90, 112], [118, 104], [72, 62]].forEach(([x, y]) => { g += `<circle cx="${x}" cy="${y}" r="6" fill="#ff6b5a" ${stk(2.5)}/><circle cx="${x - 2}" cy="${y - 2}" r="1.8" fill="#fff" opacity=".8"/>`; });
  return job("assets/img/tree.png", W, H, g, defs);
}
function bush() {
  const W = 112, H = 80;
  const defs = rad("bs", [[0, "#9ad97a"], [0.75, "#5fb04e"], [1, "#4a9440"]], 0.4, 0.3, 0.8);
  let g = shadowEl(56, 72, 48, 7);
  g += leafy([[30, 48, 22], [56, 36, 26], [84, 48, 22], [56, 54, 20]], "url(#bs)");
  g += `<path d="M30 40 Q38 22 58 16" fill="none" stroke="#fff" stroke-width="4" opacity=".3" stroke-linecap="round"/>`;
  [[36, 52, "#fff"], [70, 30, PINK], [86, 54, "#fff"], [52, 40, GOLD]].forEach(([x, y, c]) => { g += `${[0, 1, 2, 3, 4].map((j) => `<circle cx="${f2(x + Math.cos(j * 1.257) * 3.2)}" cy="${f2(y + Math.sin(j * 1.257) * 3.2)}" r="2.6" fill="${c}"/>`).join("")}<circle cx="${x}" cy="${y}" r="1.8" fill="#ffb84a"/>`; });
  return job("assets/img/bush.png", W, H, g, defs);
}

/* ======================= World: obstacles & decor ======================= */
function hurdle() {   // show-jumping obstacle: two striped wings + a striped pole
  const W = 112, H = 80;
  let g = shadowEl(56, 72, 50, 6);
  const wing = (x) => `<rect x="${x - 7}" y="12" width="14" height="58" rx="4" fill="#fffaf2" ${stk(3)}/>` + [18, 34, 50].map((y) => `<rect x="${x - 5.5}" y="${y}" width="11" height="8" fill="${CORAL}"/>`).join("") + `<rect x="${x - 7}" y="12" width="14" height="58" rx="4" fill="none" ${stk(3)}/><rect x="${x - 12}" y="64" width="24" height="8" rx="3" fill="${WOOD}" ${stk(3)}/><circle cx="${x}" cy="10" r="5" fill="${GOLD}" ${stk(2.5)}/>`;
  g += wing(14) + wing(98);
  const pole = (y) => { let s = `<rect x="16" y="${y}" width="80" height="9" rx="4.5" fill="#fffaf2" ${stk(3)}/><clipPath id="pc${y}"><rect x="16" y="${y}" width="80" height="9" rx="4.5"/></clipPath><g clip-path="url(#pc${y})">`; for (let x = 16; x < 96; x += 16) s += `<path d="M${x} ${y + 9} L${x + 6} ${y} H${x + 13} L${x + 7} ${y + 9} Z" fill="${SKY}"/>`; return s + `</g><rect x="16" y="${y}" width="80" height="9" rx="4.5" fill="none" ${stk(3)}/>`; };
  g += pole(30) + pole(50);
  g += `<path d="M22 32 H90" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/>`;
  return job("assets/img/hurdle.png", W, H, g);
}
function logs() {     // log-pile jump lying ACROSS a horizontal path (long axis vertical)
  const W = 80, H = 150;
  const defs = lin("lg", [[0, "#8a5a36"], [0.5, "#b07a4a"], [1, "#7a4e30"]], 0, 0, 1, 0) + rad("lc", [[0, "#f6deb0"], [1, "#d9b07a"]]);
  let g = shadowEl(40, 142, 34, 7);
  const log = (x, y0, y1, w) => {
    let s = `<rect x="${x - w / 2}" y="${y0}" width="${w}" height="${y1 - y0}" rx="${w / 2}" fill="url(#lg)" ${stk(3)}/>`;
    for (let y = y0 + 16; y < y1 - 18; y += 22) s += `<path d="M${x - w * 0.3} ${y} q${w * 0.15} 6 0 12" fill="none" stroke="#6a4228" stroke-width="2" opacity=".6"/><path d="M${x + w * 0.2} ${y + 10} q${w * 0.1} 5 0 10" fill="none" stroke="#6a4228" stroke-width="2" opacity=".6"/>`;
    s += `<ellipse cx="${x}" cy="${y1 - w * 0.42}" rx="${w / 2 - 1}" ry="${w * 0.42}" fill="url(#lc)" ${stk(3)}/><ellipse cx="${x}" cy="${y1 - w * 0.42}" rx="${w * 0.26}" ry="${w * 0.22}" fill="none" stroke="#c9955a" stroke-width="1.8"/><circle cx="${x}" cy="${y1 - w * 0.42}" r="2" fill="#c9955a"/>`;
    return s;
  };
  g += log(28, 14, 140, 24) + log(52, 14, 140, 24) + log(40, 6, 128, 22);
  g += `<path d="M36 18 V96" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>`;
  return job("assets/img/logs.png", W, H, g, defs);
}
function trough() {
  const W = 120, H = 70;
  const defs = lin("wt", [[0, "#9fdcff"], [1, "#4fa8e0"]]) + lin("tt", [[0, "#c58a56"], [1, "#9a6a42"]]);
  let g = shadowEl(60, 62, 54, 7);
  g += `<path d="M12 26 H108 L100 58 Q100 62 96 62 H24 Q20 62 20 58 Z" fill="url(#tt)" ${stk(3.5)}/>` + planks(12, 30, 96, 30, 24, "#b67e4c");
  g += `<rect x="8" y="16" width="104" height="16" rx="6" fill="#c58a56" ${stk(3.5)}/><rect x="14" y="19" width="92" height="9" rx="4" fill="url(#wt)"/>`;
  g += `<path d="M22 23 Q34 21 46 23 M66 22 Q78 20 92 22" stroke="#fff" stroke-width="2.2" fill="none" opacity=".85" stroke-linecap="round"/>`;
  g += `<rect x="14" y="56" width="10" height="8" rx="2" fill="#8a5a36" ${stk(2.5)}/><rect x="96" y="56" width="10" height="8" rx="2" fill="#8a5a36" ${stk(2.5)}/>`;
  return job("assets/img/trough.png", W, H, g, defs);
}
function haybale() {
  const W = 96, H = 72;
  const defs = lin("hy", [[0, "#ffe08a"], [1, "#e0b04a"]]) + lin("ht", [[0, "#fff0b0"], [1, "#f2cf6a"]]);
  let g = shadowEl(48, 64, 42, 6);
  g += `<path d="M10 30 L22 12 H86 L74 30 Z" fill="url(#ht)" ${stk(3.5)}/>`;
  g += `<path d="M74 30 L86 12 V48 L74 62 Z" fill="#d9a844" ${stk(3.5)}/>`;
  g += `<rect x="10" y="30" width="64" height="32" rx="4" fill="url(#hy)" ${stk(3.5)}/>`;
  const R = rng(4); for (let i = 0; i < 18; i++) { const x = 14 + R() * 56, y = 34 + R() * 24; g += `<path d="M${f2(x)} ${f2(y)} l${f2(5 + R() * 4)} ${f2(R() * 2 - 1)}" stroke="#c8963a" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`; }
  [30, 54].forEach((x) => { g += `<path d="M${x} 30 V62 M${x} 30 L${x + 12} 12" stroke="${CORAL}" stroke-width="3"/>`; });
  [[22, 16], [66, 18], [82, 26]].forEach(([x, y]) => { g += `<path d="M${x} ${y} l-4 -6 M${x + 3} ${y} l2 -7" stroke="#e0b04a" stroke-width="2" stroke-linecap="round"/>`; });
  return job("assets/img/haybale.png", W, H, g, defs);
}
function flowerHead(x, y, r, c) { return `${[0, 1, 2, 3, 4].map((j) => `<circle cx="${f2(x + Math.cos(j * 1.257 - 1.57) * r)}" cy="${f2(y + Math.sin(j * 1.257 - 1.57) * r)}" r="${f2(r * 0.85)}" fill="${c}" ${stk(1.8)}/>`).join("")}<circle cx="${x}" cy="${y}" r="${f2(r * 0.6)}" fill="#ffc94a" ${stk(1.6)}/>`; }
function flowers() {
  const W = 96, H = 60;
  let g = shadowEl(48, 52, 42, 6);
  g += leafy([[24, 42, 12], [44, 38, 14], [66, 40, 13], [80, 46, 9], [14, 48, 8]], "#6fbf5a", 3);
  [[22, 30, PINK], [40, 22, "#fff"], [58, 28, CORAL], [76, 34, "#c6a6ff"], [32, 42, GOLD], [64, 44, "#fff"]].forEach(([x, y, c]) => { g += `<path d="M${x} ${y + 4} V${y + 12}" stroke="#4f9e45" stroke-width="2.4"/>` + flowerHead(x, y, 4.2, c); });
  return job("assets/img/flowers.png", W, H, g);
}
function rosette(cx, cy, s, c1, c2) {
  let g = `<path d="M${cx - 12 * s} ${cy + 8 * s} L${cx - 22 * s} ${cy + 52 * s} L${cx - 12 * s} ${cy + 46 * s} L${cx - 6 * s} ${cy + 56 * s} L${cx} ${cy + 10 * s} Z" fill="${c1}" ${stk(3)}/><path d="M${cx + 12 * s} ${cy + 8 * s} L${cx + 22 * s} ${cy + 52 * s} L${cx + 12 * s} ${cy + 46 * s} L${cx + 6 * s} ${cy + 56 * s} L${cx} ${cy + 10 * s} Z" fill="${shade(c1, -0.12)}" ${stk(3)}/>`;
  let d = ""; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, rr = (i % 2 ? 26 : 30) * s; d += (i ? "L" : "M") + f2(cx + Math.cos(a) * rr) + " " + f2(cy + Math.sin(a) * rr); }
  g += `<path d="${d}Z" fill="${c1}" ${stk(3)}/><circle cx="${cx}" cy="${cy}" r="${19 * s}" fill="${c2}" ${stk(3)}/><circle cx="${cx}" cy="${cy}" r="${13 * s}" fill="#fffaf0" ${stk(2.5)}/>`;
  return g;
}
function ribbon() {
  const W = 80, H = 110;
  let g = rosette(40, 38, 1.05, CORAL, GOLD);
  g += horseshoe(40, 40, 0.42, GOLD, 1.6);
  g += `<path d="M24 22 Q30 14 40 12" fill="none" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>`;
  return job("assets/img/ribbon.png", W, H, g);
}
function trophy() {
  const W = 90, H = 110;
  const defs = rad("gd", [[0, "#fff6c2"], [0.5, "#ffd24a"], [1, "#e0a020"]], 0.4, 0.3, 0.8) + glow("tg", 3);
  let g = shadowEl(45, 104, 32, 5);
  g += `<rect x="20" y="86" width="50" height="18" rx="4" fill="${WOOD}" ${stk(3)}/><rect x="36" y="70" width="18" height="18" rx="3" fill="url(#gd)" ${stk(3)}/>`;
  g += `<path d="M22 22 Q8 22 10 38 Q12 52 28 54 M68 22 Q82 22 80 38 Q78 52 62 54" fill="none" ${stk(8)}/><path d="M22 22 Q8 22 10 38 Q12 52 28 54 M68 22 Q82 22 80 38 Q78 52 62 54" fill="none" stroke="#ffd24a" stroke-width="3.5" stroke-linecap="round"/>`;
  g += `<path d="M18 12 H72 Q72 62 45 72 Q18 62 18 12 Z" fill="url(#gd)" ${stk(3.5)}/>`;
  g += horseshoe(45, 38, 0.55, "#fff2b8", 1.6);
  g += `<path d="M26 18 Q26 40 34 52" fill="none" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`;
  g += `<path d="${star(76, 10, 7, 2.4, 4)}" fill="#fff6b8" filter="url(#tg)"/>`;
  return job("assets/img/trophy.png", W, H, g, defs);
}
function bench() {
  const W = 140, H = 80;
  const defs = lin("bw", [[0, "#d9a066"], [1, "#b47a46"]]);
  let g = shadowEl(70, 72, 62, 6);
  [22, 118].forEach((x) => { g += `<rect x="${x - 5}" y="44" width="10" height="28" rx="3" fill="#7a5a44" ${stk(3)}/>`; });
  g += `<rect x="12" y="10" width="116" height="13" rx="5" fill="url(#bw)" ${stk(3)}/><rect x="12" y="26" width="116" height="13" rx="5" fill="url(#bw)" ${stk(3)}/>`;
  [24, 116].forEach((x) => { g += `<rect x="${x - 4}" y="8" width="8" height="40" rx="3" fill="#7a5a44" ${stk(3)}/>`; });
  g += `<path d="M8 44 L16 38 H124 L132 44 Q132 52 124 52 H16 Q8 52 8 44 Z" fill="url(#bw)" ${stk(3)}/>`;
  g += `<path d="M20 14 H120 M20 42 H120" stroke="#fff" stroke-width="2" opacity=".4" stroke-linecap="round"/>`;
  g += `<path d="M70 18 C67 15 63 18 70 23 C77 18 73 15 70 18 Z" fill="${CORAL}" ${stk(1.5)}/>`;
  return job("assets/img/bench.png", W, H, g, defs);
}
function weathervane() {
  const W = 70, H = 150;
  const IRON = "#5a4a48";
  let g = shadowEl(35, 144, 20, 4);
  g += `<path d="M30 146 L33 132 H37 L40 146 Z" fill="${WOOD}" ${stk(2.5)}/><rect x="16" y="138" width="38" height="9" rx="3" fill="${WOOD}" ${stk(2.5)}/>`;
  g += `<path d="M35 134 V60" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M35 134 V60" stroke="#8a7a70" stroke-width="2.6" stroke-linecap="round"/>`;
  g += `<path d="M14 92 H56 M35 80 V104" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M14 92 H56" stroke="#8a7a70" stroke-width="2" stroke-linecap="round"/>`;
  [[14, 92], [56, 92], [35, 104]].forEach(([x, y]) => { g += `<circle cx="${x}" cy="${y}" r="4" fill="${GOLD}" ${stk(2)}/>`; });
  // the horse silhouette (shared horse drawing, flat iron colour)
  const h = horse("bai", { legs: { fn: [30, 1], ff: [24, 1], hn: [-28, 0], hf: [-22, 0] }, head: -2, tail: 6 }, "wv", { flat: IRON, sw: 3 });
  g += `<g transform="translate(35 52) scale(0.3) translate(-104 -150)">${h.body}</g>`;
  g += `<path d="M10 62 H60 L66 58 L60 54 M10 62 L4 56 M10 62 L4 68" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  g += `<circle cx="35" cy="62" r="4" fill="${GOLD}" ${stk(2)}/>`;
  return job("assets/img/weathervane.png", W, H, g, h.defs);
}
function carrotShape(x, y, len, ang, w = 1) {
  return `<g transform="rotate(${ang} ${x} ${y})"><path d="M${x - 4 * w} ${y + 2} Q${x} ${y - 6} ${x + 4 * w} ${y + 2} M${x} ${y} Q${x - 1} ${y - 9} ${x - 6 * w} ${y - 12} M${x} ${y} Q${x + 2} ${y - 10} ${x + 6 * w} ${y - 11}" fill="none" stroke="${INK}" stroke-width="${5 * w}" stroke-linecap="round"/><path d="M${x} ${y} Q${x - 1} ${y - 9} ${x - 6 * w} ${y - 12} M${x} ${y} Q${x + 2} ${y - 10} ${x + 6 * w} ${y - 11} M${x} ${y} V${y - 11}" fill="none" stroke="#5cbf4a" stroke-width="${2.6 * w}" stroke-linecap="round"/><path d="M${x - 5.5 * w} ${y + 1} Q${x} ${y - 2} ${x + 5.5 * w} ${y + 1} Q${x + 3 * w} ${y + len * 0.6} ${x} ${y + len} Q${x - 3 * w} ${y + len * 0.6} ${x - 5.5 * w} ${y + 1} Z" fill="#ff8a3a" ${stk(2.6 * w)}/><path d="M${x - 2.5 * w} ${y + len * 0.25} h${4 * w} M${x - 1.5 * w} ${y + len * 0.5} h${3 * w}" stroke="#d9601e" stroke-width="${1.5 * w}" stroke-linecap="round"/></g>`;
}
function carrots() {
  const W = 80, H = 60;
  const defs = lin("bk", [[0, "#e6b878"], [1, "#b8864e"]]);
  let g = shadowEl(40, 54, 34, 5);
  g += carrotShape(28, 18, 26, -18) + carrotShape(42, 14, 28, 4) + carrotShape(54, 18, 24, 22);
  g += `<path d="M10 28 H70 L64 52 Q63 55 59 55 H21 Q17 55 16 52 Z" fill="url(#bk)" ${stk(3)}/>`;
  for (let y = 34; y < 54; y += 7) g += `<path d="M14 ${y} H66" stroke="#9a6a3a" stroke-width="1.6" opacity=".6"/>`;
  for (let x = 20; x < 64; x += 8) g += `<path d="M${x} 29 V54" stroke="#f2cf98" stroke-width="1.4" opacity=".6"/>`;
  g += `<rect x="6" y="24" width="68" height="8" rx="4" fill="#d9a866" ${stk(3)}/>`;
  return job("assets/img/carrots.png", W, H, g, defs);
}
function saddleRack() {
  const W = 110, H = 110;
  const defs = lin("sd", [[0, "#a0643c"], [1, "#6e3e24"]]);
  let g = shadowEl(55, 102, 46, 6);
  g += `<path d="M22 102 L40 48 M88 102 L70 48 M30 76 H80" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M22 102 L40 48 M88 102 L70 48 M30 76 H80" stroke="${WOOD}" stroke-width="4.5" stroke-linecap="round"/>`;
  g += `<rect x="26" y="40" width="58" height="12" rx="5" fill="${WOOD}" ${stk(3)}/>`;
  // pad + saddle
  g += `<path d="M18 46 Q18 36 30 36 H80 Q92 36 92 46 V62 Q92 68 86 68 H24 Q18 68 18 62 Z" fill="${CORAL}" ${stk(3)}/><path d="M22 62 H88" stroke="#fff" stroke-width="2.4" stroke-dasharray="4 4" opacity=".8"/>`;
  g += `<path d="M24 40 Q22 22 34 22 Q55 34 76 22 Q90 18 88 40 Q86 52 55 52 Q26 52 24 40 Z" fill="url(#sd)" ${stk(3)}/>`;
  g += `<path d="M48 50 V80 M42 80 H54" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><rect x="42" y="78" width="12" height="7" rx="2" fill="#c9ced6" ${stk(2)}/>`;
  g += `<path d="M34 30 Q55 40 78 28" fill="none" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>`;
  return job("assets/img/saddle_rack.png", W, H, g, defs);
}
function heartPath(cx, cy, s) { return `M${cx} ${cy + 9 * s} C${cx - 14 * s} ${cy} ${cx - 10 * s} ${cy - 12 * s} ${cx} ${cy - 5 * s} C${cx + 10 * s} ${cy - 12 * s} ${cx + 14 * s} ${cy} ${cx} ${cy + 9 * s} Z`; }
function want() {     // "this horse needs you" bubble: carrot + heart
  const W = 96, H = 96;
  let g = `<path d="M48 6 C76 6 90 22 90 42 C90 62 76 76 56 77 L48 90 L40 77 C20 76 6 62 6 42 C6 22 20 6 48 6 Z" fill="#fffdf6" ${stk(4, CORAL)}/>`;
  g += carrotShape(40, 26, 32, -28, 1.15);
  g += `<path d="${heartPath(66, 50, 1.25)}" fill="${PINK}" ${stk(3)}/><path d="M60 46 Q61 43 64 43" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
  return job("assets/img/want.png", W, H, g);
}

/* ======================= Fence spritesheet (4 × 64) ======================= */
// 0 horizontal segment (post at x 32, rails across the tile: tiles every 32 px join),
// 1 vertical side piece (origin .5,.7), 2 top-left corner, 3 top-right corner.
function fence() {
  const WH = "#fffaf0", SH = "#d9cbb4";
  const rail = (x0, x1, y) => `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="7" fill="${WH}" stroke="${INK}" stroke-width="2.6"/><rect x="${x0}" y="${y + 4.5}" width="${x1 - x0}" height="2" fill="${SH}"/>`;
  const vrail = (x, y0, y1) => `<rect x="${x}" y="${y0}" width="6" height="${y1 - y0}" fill="${WH}" stroke="${INK}" stroke-width="2.6"/><rect x="${x + 3.5}" y="${y0}" width="2" height="${y1 - y0}" fill="${SH}"/>`;
  const post = (x, top, bot) => `<ellipse cx="${x}" cy="${bot}" rx="9" ry="3" fill="#2a3a1a" opacity=".18"/><rect x="${x - 5.5}" y="${top}" width="11" height="${bot - top}" rx="2.5" fill="${WH}" ${stk(2.6)}/><path d="M${x - 5.5} ${top + 3} L${x} ${top - 2} L${x + 5.5} ${top + 3}" fill="${WH}" ${stk(2.6)}/><rect x="${x + 1.5}" y="${top + 3}" width="2.5" height="${bot - top - 4}" fill="${SH}"/>`;
  // rails clipped to the tile so their caps sit exactly on the tile edges
  const f0 = `<g>${rail(-2, 66, 26)}${rail(-2, 66, 40)}</g>` + post(32, 16, 54);
  const f1 = vrail(26.5, -2, 66) + vrail(33.5, -2, 66) + post(32, 22, 45);
  const f2_ = rail(32, 66, 26) + rail(32, 66, 40) + vrail(26.5, 30, 66) + vrail(33.5, 30, 66) + post(32, 16, 54);
  const f3 = rail(-2, 32, 26) + rail(-2, 32, 40) + vrail(26.5, 30, 66) + vrail(33.5, 30, 66) + post(32, 16, 54);
  return job("assets/sheet/fence.png", 256, 64, sheet([f0, f1, f2_, f3], 64, 64, 4));
}

module.exports = () => K.hidpi(build([]), HIDPI);
const HIDPI = [
  [/favicon|apple-touch|icon-192|icon-maskable/, { keep: true }],
  [/flank_|splash/, { scale: 2, type: "webp", ext: ".webp" }],
  [/logo/, { scale: 2.5, type: "webp", ext: ".webp" }],
  [/ui\/icons\//, { scale: 2, type: "webp", ext: ".webp" }],
  [/assets\/ui\//, { scale: 6, type: "webp", ext: ".webp" }],
  [/mud_|straw|curry/, { scale: 3, type: "webp", ext: ".webp" }],
  [/assets\/(img|sheet)\//, { scale: 2, type: "webp", ext: ".webp" }],
];
function build(jobs) {
  Object.keys(COATS).forEach((c) => jobs.push(horseSheet(c)));
  Object.keys(KIDS).forEach((id) => jobs.push(kidSheet(id), rideJob(id), kidThumb(id)));
  jobs.push(grass(), sandTile("sand", "#e6c48a", 21, false), sandTile("arena", "#f1dcae", 33, true), house(), tack(), stable(), pine(), tree(), bush(),
    hurdle(), logs(), trough(), haybale(), flowers(), ribbon(), trophy(), bench(), weathervane(), carrots(), saddleRack(), want(), fence());
  return jobs;
}
