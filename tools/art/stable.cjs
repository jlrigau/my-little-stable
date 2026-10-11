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
    if (k.style === "ponytail") {
      [-0.6, -0.25, 0.25, 0.6].forEach((t) => { g += `<path d="M${cx + t * r} ${cy - r * 0.85} Q${cx + t * r * 0.7} ${cy - r * 0.3} ${cx + t * 4} ${cy - r * 0.02}" fill="none" stroke="${shade(H, -0.22)}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`; });
      g += `<path d="${spline([[cx - 7, cy + r * 0.02], [cx - 9, cy + r * 0.5], [cx - 4, cy + r * 1.0], [cx + 3, cy + r * 1.2], [cx + 6, cy + r * 0.8], [cx + 7, cy + r * 0.02]], true)}" fill="${H}" ${st}/><path d="M${cx} ${cy + r * 0.3} Q${cx + 1} ${cy + r * 0.7} ${cx} ${cy + r * 0.95}" fill="none" stroke="${HL}" stroke-width="2.2" stroke-linecap="round" opacity=".7"/><rect x="${cx - 6.5}" y="${cy - r * 0.08}" width="13" height="6" rx="3" fill="${k.tie}" ${stk(2.2)}/>`;
    }
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
  for (let i = 0; i < 14; i++) { const x = R() * S, y = R() * S, rx = 30 + R() * 40, ry = 18 + R() * 24, c = R() < 0.5 ? "#a8d97e" : "#93c96b"; g += wrap(x, y, (X, Y) => `<ellipse cx="${f2(X)}" cy="${f2(Y)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="${c}" opacity=".3"/>`); }
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
  for (let i = 0; i < 12; i++) { const x = R() * S, y = R() * S, rx = 26 + R() * 40, ry = 14 + R() * 20, c = R() < 0.5 ? shade(base, 0.12) : shade(base, -0.05); g += wrap(x, y, (X, Y) => `<ellipse cx="${f2(X)}" cy="${f2(Y)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="${c}" opacity=".32"/>`); }
  if (raked) for (let y = 8; y < S; y += 16) { let d = `M0 ${y}`; for (let x = 0; x <= S; x += 32) d += ` Q${x + 16} ${y + (((x / 32) % 2) ? 2 : -2)} ${x + 32} ${y}`; g += `<path d="${d}" fill="none" stroke="${shade(base, -0.09)}" stroke-width="2" opacity=".55"/><path d="${d}" transform="translate(0 2.5)" fill="none" stroke="${shade(base, 0.25)}" stroke-width="1.4" opacity=".6"/>`; }
  for (let i = 0; i < 90; i++) { const x = R() * S, y = R() * S, r = 0.8 + R() * 1.6, c = R() < 0.6 ? shade(base, -0.16) : shade(base, 0.3); g += wrap(x, y, (X, Y) => `<ellipse cx="${f2(X)}" cy="${f2(Y)}" rx="${f2(r * 1.3)}" ry="${f2(r)}" fill="${c}" opacity=".7"/>`); }
  if (!raked) for (let i = 0; i < 10; i++) { const x = R() * S, y = R() * S, r = 2.5 + R() * 2; g += wrap(x, y, (X, Y) => `<ellipse cx="${f2(X)}" cy="${f2(Y)}" rx="${f2(r * 1.3)}" ry="${f2(r)}" fill="${shade(base, -0.12)}"/><ellipse cx="${f2(X - 0.6)}" cy="${f2(Y - 0.8)}" rx="${f2(r * 0.7)}" ry="${f2(r * 0.45)}" fill="${shade(base, 0.25)}"/>`); }
  return job(`assets/img/${file}.png`, S, S, g);
}

// Sandy lane from the Paddock's right gate into the Carrière (a flat ground decal, 1 px = 1 world
// px). Arena-sand colour so it melts into the Carrière on the right; ragged grassy edges top and
// bottom and a feathered left end so it melts into the Paddock's grass; a few hoof prints.
function lane() {
  const W = 240, H = 300, R = rng(77), base = "#ecd2a0";
  const defs = lin("lnf", [[0, base, 0], [0.16, base, 1], [1, "#f1dcae", 1]], 0, 0, 1, 0) + blur("lnb", 3);
  // organic outline: wavy top & bottom edges, wide on the right (the arena gate), narrower in the paddock
  const top = [], bot = [];
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * W, t = i / 12;
    top.push([x, 40 - t * 24 + (R() - 0.5) * 10]); bot.push([x, H - 40 + t * 24 + (R() - 0.5) * 10]);
  }
  const path = "M" + top.map((p) => p.map(f2).join(" ")).join(" L") + " L" + bot.reverse().map((p) => p.map(f2).join(" ")).join(" L") + " Z";
  let g = `<path d="${path}" fill="${shade(base, -0.14)}" opacity=".8" filter="url(#lnb)" transform="translate(0 3)"/>`;   // soft darker rim
  g += `<path d="${path}" fill="url(#lnf)"/>`;
  // texture: soft patches + grains, like the arena tile
  for (let i = 0; i < 10; i++) { const x = 60 + R() * (W - 60), y = 60 + R() * (H - 120); g += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(20 + R() * 26)}" ry="${f2(10 + R() * 12)}" fill="${R() < 0.5 ? shade(base, 0.12) : shade(base, -0.05)}" opacity=".3"/>`; }
  for (let i = 0; i < 70; i++) { const x = 50 + R() * (W - 50), y = 50 + R() * (H - 100); g += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(1 + R() * 1.6)}" ry="${f2(0.8 + R())}" fill="${R() < 0.6 ? shade(base, -0.16) : shade(base, 0.3)}" opacity=".7"/>`; }
  // hoof prints heading into the Carrière
  for (let i = 0; i < 6; i++) { const x = 70 + i * 28, y = 140 + (i % 2 ? 18 : -6); g += `<path d="M${x} ${y} a6 5 0 1 1 8 0" fill="none" stroke="${shade(base, -0.22)}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`; }
  // grass tufts overlapping both edges (integrates with the meadow)
  const tuft = (x, y, s) => `<path d="M${f2(x - 4 * s)} ${f2(y)} Q${f2(x - 4 * s)} ${f2(y - 5 * s)} ${f2(x - 7 * s)} ${f2(y - 9 * s)} M${f2(x)} ${f2(y)} Q${f2(x)} ${f2(y - 8 * s)} ${f2(x + 1.5 * s)} ${f2(y - 11 * s)} M${f2(x + 4 * s)} ${f2(y)} Q${f2(x + 4 * s)} ${f2(y - 5 * s)} ${f2(x + 7 * s)} ${f2(y - 8 * s)}" fill="none" stroke="${R() < 0.6 ? "#7fbd5a" : "#9dd174"}" stroke-width="${f2(2 * s)}" stroke-linecap="round"/>`;
  top.forEach(([x, y], i) => { if (i % 2 === 0 && x < W - 30) g += tuft(x + R() * 10, y + 4, 0.9 + R() * 0.5); });
  bot.forEach(([x, y], i) => { if (i % 2 === 1 && x < W - 30) g += tuft(x + R() * 10, y + 2, 0.9 + R() * 0.5); });
  // two little flower clumps where the lane leaves the Paddock
  [[34, 62], [30, H - 52]].forEach(([x, y]) => { [[0, 0, PINK], [8, -3, "#fff"], [4, 6, GOLD]].forEach(([dx, dy, c]) => { g += `<circle cx="${x + dx}" cy="${y + dy}" r="3.2" fill="${c}" ${stk(1.3)}/>`; }); });
  return job("assets/img/lane.png", W, H, g, defs);
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
function hurdleV() {  // the same show-jumping obstacle turned ACROSS a left↔right run: far wing at the
  // top, two striped poles running down the screen, near wing in front (3/4 view, like the log pile)
  const W = 72, H = 170;
  let g = `<ellipse cx="36" cy="150" rx="24" ry="7" fill="#3a2a1e" opacity=".18"/><path d="M20 30 Q14 92 20 150 H52 Q58 92 52 30 Z" fill="#3a2a1e" opacity=".1"/>`;
  const wing = (y0, h, w) => {
    const x = 36 - w / 2;
    let s = `<rect x="${x}" y="${y0}" width="${w}" height="${h}" rx="4" fill="#fffaf2" ${stk(3)}/>`;
    for (let yy = y0 + 5; yy < y0 + h - 8; yy += 12) s += `<rect x="${x + 2}" y="${yy}" width="${w - 4}" height="6" fill="${CORAL}"/>`;
    s += `<rect x="${x}" y="${y0}" width="${w}" height="${h}" rx="4" fill="none" ${stk(3)}/>`;
    s += `<rect x="${x - 5}" y="${y0 + h - 6}" width="${w + 10}" height="8" rx="3" fill="${WOOD}" ${stk(3)}/>`;
    s += `<circle cx="${x + w / 2}" cy="${y0 - 3}" r="${w > 20 ? 5 : 4}" fill="${GOLD}" ${stk(2.5)}/>`;
    return s;
  };
  const pole = (x, y0, y1, id) => {
    let s = `<rect x="${x}" y="${y0}" width="9" height="${y1 - y0}" rx="4.5" fill="#fffaf2" ${stk(3)}/><clipPath id="${id}"><rect x="${x}" y="${y0}" width="9" height="${y1 - y0}" rx="4.5"/></clipPath><g clip-path="url(#${id})">`;
    for (let y = y0; y < y1; y += 16) s += `<path d="M${x} ${y} L${x + 9} ${y + 6} V${y + 13} L${x} ${y + 7} Z" fill="${SKY}"/>`;
    return s + `</g><rect x="${x}" y="${y0}" width="9" height="${y1 - y0}" rx="4.5" fill="none" ${stk(3)}/>`;
  };
  g += wing(10, 44, 26);                      // far wing (smaller: further away)
  g += pole(24, 34, 128, "hv1") + pole(39, 40, 136, "hv2");
  g += `<path d="M28 42 V120" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/>`;
  g += wing(108, 50, 24);                     // near wing in front
  return job("assets/img/hurdle_v.png", W, H, g);
}
function logs() {     // log-pile jump lying ACROSS the whole cross path (long axis vertical: path 240 + sand 2×46 = 332)
  const W = 80, H = 350;
  const defs = lin("lg", [[0, "#8a5a36"], [0.5, "#b07a4a"], [1, "#7a4e30"]], 0, 0, 1, 0) + rad("lc", [[0, "#f6deb0"], [1, "#d9b07a"]]);
  let g = shadowEl(40, H - 8, 34, 7);
  const log = (x, y0, y1, w) => {
    let s = `<rect x="${x - w / 2}" y="${y0}" width="${w}" height="${y1 - y0}" rx="${w / 2}" fill="url(#lg)" ${stk(3)}/>`;
    for (let y = y0 + 16; y < y1 - 18; y += 22) s += `<path d="M${x - w * 0.3} ${y} q${w * 0.15} 6 0 12" fill="none" stroke="#6a4228" stroke-width="2" opacity=".6"/><path d="M${x + w * 0.2} ${y + 10} q${w * 0.1} 5 0 10" fill="none" stroke="#6a4228" stroke-width="2" opacity=".6"/>`;
    s += `<ellipse cx="${x}" cy="${y1 - w * 0.42}" rx="${w / 2 - 1}" ry="${w * 0.42}" fill="url(#lc)" ${stk(3)}/><ellipse cx="${x}" cy="${y1 - w * 0.42}" rx="${w * 0.26}" ry="${w * 0.22}" fill="none" stroke="#c9955a" stroke-width="1.8"/><circle cx="${x}" cy="${y1 - w * 0.42}" r="2" fill="#c9955a"/>`;
    return s;
  };
  g += log(28, 14, H - 10, 24) + log(52, 14, H - 10, 24) + log(40, 6, H - 22, 22);
  g += `<path d="M36 18 V${H - 60}" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>`;
  return job("assets/img/logs.png", W, H, g, defs);
}
/* ======================= Race (pseudo-3D, seen from behind) ======================= */
// Horse seen FROM BEHIND with the rider's back on top — 200×170, hooves on y≈160.
// Rear view for the race (200×170, hooves on y≈160). Two layers with the SAME frame:
//   horse_back_<coat>  — the horse alone (+ its saddle);   rider_back_<kid> — the rider, drawn on top.
// The hind quarters + hind legs are ONE silhouette (mirrored half below); the rider's lower legs are
// clipped by the inverse of that silhouette so they come out from behind the rump.
const mirrorX = (x) => f2(200 - x);
function rearHalf() {   // left half of the rump + hind leg, spine peak → crease centre; tapers hip → stifle → gaskin → hock
  return [
    ["C", [88, 64.5], [72, 69], [66, 80]],
    ["C", [64.5, 84], [64.5, 87], [65, 90]],        // hip
    ["C", [65.5, 96], [66.5, 100], [68, 104]],      // stifle
    ["C", [69.5, 109], [71.5, 114], [73, 118]],     // gaskin (narrower)
    ["C", [74, 121], [75, 123.5], [75.4, 125]],
    ["C", [74.6, 126], [74.6, 128.2], [75.4, 129.2]], // hock bump, raised to y≈127
    ["C", [76.2, 130], [77, 130.6], [77, 131.6]],
    ["L", [78.5, 154]], ["L", [84.5, 154]], ["L", [83.2, 133.5]],   // long cannon leaning in
    ["C", [83.2, 130.6], [85, 128.2], [87, 126.4]], // inner hock
    ["C", [90.5, 121], [94, 118], [96, 115.5]],     // inner thigh
    ["C", [97.5, 113.5], [99, 112], [100, 111.5]],  // crease top
  ];
}
function rearPath() {
  const h = rearHalf(), top = [100, 64]; let d = `M${top[0]} ${top[1]}`;
  h.forEach(([t, ...p]) => { d += t + p.map((q) => `${f2(q[0])} ${f2(q[1])}`).join(" "); });
  const pts = [top].concat(h.map((s) => s[s.length - 1]));
  for (let i = h.length - 1; i >= 0; i--) {
    const [t, ...p] = h[i], from = pts[i];
    if (t === "L") d += `L${mirrorX(from[0])} ${f2(from[1])}`;
    else d += `C${mirrorX(p[1][0])} ${f2(p[1][1])} ${mirrorX(p[0][0])} ${f2(p[0][1])} ${mirrorX(from[0])} ${f2(from[1])}`;
  }
  return d + "Z";
}
const REAR = rearPath();
// rear-view colour tweaks (contrast from behind); the side-view COATS stay untouched
const REAR_OVR = { noir: { body: "#3a3340", mane: "#1c1820", sheen: 0.6, ink: "#3d2c26", rim: "#9fb2d6", rimOp: 0.5 }, blanc: { mane: "#ddd5c6", strand: "#a9b0bb" }, gris: { mane: shade("#6c7380", -0.1), shadeAmt: -0.26 }, palomino: { body: "#efb24a", legs: "#efb24a", shadeAmt: -0.28, rim: "#fff1c8" } };
function horseBackParts(coatId, u, opts = {}) {
  const c = Object.assign({}, COATS[coatId], REAR_OVR[coatId] || {}), sw = 3;
  const ink = c.ink || INK, st = stk(sw, ink), pad = opts.pad || CORAL;
  const bodyC = c.body, maneC = c.mane, sh = c.shadeAmt != null ? c.shadeAmt : -0.2, sheen = c.sheen || 0.38;
  const strand = c.strand || shade(maneC, 0.32);
  let defs = lin(`${u}b`, [[0, shade(bodyC, sh * 0.8)], [0.28, shade(bodyC, 0.1)], [0.62, bodyC], [1, shade(bodyC, sh)]], 0, 0, 1, 0) +
    lin(`${u}n`, [[0, shade(bodyC, -0.25)], [1, shade(bodyC, -0.05)]]) +
    ulin(`${u}lg`, [[0, c.legs, 0], [0.30, c.legs, 0], [0.31, c.legs, 1], [1, shade(c.legs, -0.12), 1]], 118, 156) +
    ulin(`${u}sk`, [[0, "#fffaf2", 0], [0.30, "#fffaf2", 0], [0.31, "#fffaf2", 1], [1, "#f2ebdf", 1]], 118, 156) +
    lin(`${u}m`, [[0, shade(maneC, 0.14)], [1, shade(maneC, -0.18)]]) +
    `<clipPath id="${u}c"><path d="${REAR}"/></clipPath>` + blur(`${u}bl`, 2.2) + blur(`${u}sb`, 1) + blur(`${u}db`, 1);
  let g = `<ellipse cx="100" cy="159" rx="34" ry="4.5" fill="#2a3a1a" opacity=".3" filter="url(#${u}bl)"/>`;
  // --- the front: neck (visible shape the ears stand on), ears ~15° out, mane on the RIGHT, forelock tuft
  const earC = shade(bodyC, -0.18);
  [1, -1].forEach((s) => { const X = (x) => (s > 0 ? x : 200 - x);
    g += `<path d="M${X(76)} 56 Q${X(70)} 51 ${X(69.5)} 42 Q${X(77.5)} 44 ${X(82)} 52 Z" fill="${earC}" ${st}/><path d="M${X(69.6)} 42.6 Q${X(77)} 44.3 ${X(78.6)} 46.6 Q${X(73.4)} 47.6 ${X(70.2)} 46.6 Z" fill="${shade(bodyC, -0.4)}"/><path d="M${X(75.2)} 55 Q${X(70.6)} 50.5 ${X(70.3)} 43.5" fill="none" stroke="${shade(bodyC, 0.25)}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/><path d="M${X(73)} 51 Q${X(71.5)} 48.5 ${X(71.3)} 47.5" fill="none" stroke="${shade(bodyC, -0.3)}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`; });
  g += `<path d="M72 80 C71 68 74 58 78 53 Q100 46 122 53 C126 58 129 68 128 80 Z" fill="url(#${u}n)" ${st}/>`;   // neck under the ears
  g += `<ellipse cx="100" cy="58" rx="24" ry="4.5" fill="#000" opacity=".18" filter="url(#${u}sb)"/>`;   // soft shade under the rider's shoulders
  g += `<path d="M116 53 Q124 55.5 128 63 L125.5 64 Q121.5 58 115 56 Z" fill="url(#${u}m)" ${stk(1.8, ink)}/>`;   // thin mane crest, right
  // --- front legs peeking between the hocks
  [[89, 96], [104, 111]].forEach(([a, b]) => { g += `<rect x="${a}" y="132" width="${b - a}" height="19" rx="2" fill="${shade(c.legs, -0.15)}" ${stk(2.4, ink)}/><path d="M${a - 0.5} 148 H${b + 0.5} L${b + 0.8} 153 Q${(a + b) / 2} 154.5 ${a - 0.8} 153 Z" fill="${shade(c.hoof, -0.2)}" ${stk(2.2, ink)}/>`; });
  // --- barrel (hidden behind the rump)
  g += `<path d="M72 78 Q74 72 86 71 Q100 70 114 71 Q126 72 128 78 Q131 88 129 98 Q100 103 71 98 Q69 88 72 78 Z" fill="${shade(bodyC, sh)}" ${st}/>`;
  // --- rump + hind legs: ONE silhouette, spine as the peak
  g += `<path d="${REAR}" fill="url(#${u}b)" ${st}/>`;
  g += `<g clip-path="url(#${u}c)">`;
  const socks = c.socks ? [c.socks[3], c.socks[2]] : [0, 0];
  [[70, 90], [110, 130]].forEach(([a, b], i) => { g += `<rect x="${a}" y="118" width="${b - a}" height="40" fill="url(#${u}${socks[i] ? "sk" : "lg"})"/>`; });   // crisp stocking edge under the hock
  if (c.dapple) { defs += rad(`${u}dp`, [[0, shade(bodyC, 0.25)], [0.7, shade(bodyC, 0.12)], [1, shade(bodyC, -0.12)]]); [[76, 84, 5], [124, 83, 4.8], [71, 94, 5.5], [129, 93, 5.2], [81, 92, 4.4], [119, 91, 4.5]].forEach(([x, y, r]) => { g += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}dp)" opacity=".35"/>`; }); }
  g += `<path d="M64 72 Q100 66 136 72 L136 80 Q100 88 64 80 Z" fill="${shade(bodyC, 0.12)}" opacity=".75"/>`;   // croup highlight arc
  g += `<path d="M100 66 V74" stroke="${shade(bodyC, -0.3)}" stroke-width="1.5" stroke-linecap="round" opacity=".3"/>`;   // spine groove
  g += `<ellipse cx="100" cy="124" rx="15" ry="15" fill="${shade(bodyC, -0.25)}" opacity=".55" filter="url(#${u}sb)"/>`;   // inner thighs
  g += `<path d="M79.6 128.6 Q81.6 127 83.6 128.2 M120.4 128.6 Q118.4 127 116.4 128.2" fill="none" stroke="${shade(c.legs, -0.4)}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;   // hock creases
  g += `<path d="M71 94 Q73 82 86 75" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity="${sheen}"/><path d="M128 87 Q126 81 119 77.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="${sheen * 0.45}"/>`;
  if (c.rim) g += `<path d="${REAR}" fill="none" stroke="${c.rim}" stroke-width="7" opacity="${c.rimOp || 0.35}" transform="translate(0 1.5)"/>`;   // cool rim light
  const tail = spline([[96, 85], [100, 82.5], [104, 85], [105.5, 96], [108.5, 110], [110.2, 122], [111, 131], [108, 135.5], [105, 132], [102, 134.6], [98.6, 131.6], [95, 133.5], [92.4, 124], [92.4, 110], [94.6, 96]], true);
  g += `<path d="${tail}" transform="translate(2 1.5)" fill="#000" opacity=".2"/>`;   // tail drop shadow
  g += `<ellipse cx="100" cy="94" rx="6" ry="3" fill="${shade(bodyC, -0.15)}" opacity=".5" filter="url(#${u}db)"/>`;   // soft shade under the dock
  g += `</g>`;
  // hooves with a lighter coronet band
  [81.5, 118.5].forEach((x) => { g += `<path d="M${x - 5.2} 152 L${x + 5.2} 152 L${x + 6} 160.5 Q${x} 161.8 ${x - 6} 160.5 Z" fill="${shade(c.hoof, -0.15)}" ${stk(sw * 0.9, ink)}/><path d="M${x - 5} 151.5 H${x + 5}" stroke="${shade(c.legs, 0.35)}" stroke-width="2" stroke-linecap="round"/>`; });
  // saddle cloth: a thin rim under the cantle (the cantle itself is drawn by the rider layer)
  g += `<path d="M83 64.5 Q100 69.5 117 64.5 L117 68 Q100 73 83 68 Z" fill="${pad}" ${stk(2, ink)}/>`;
  g += `<path d="M88 62.5 Q100 65.5 112 62.5" fill="none" stroke="${shade(WOOD_D, 0.25)}" stroke-width="2" stroke-linecap="round"/>`;   // saddle-seat crescent
  g += `<path d="M84 64 Q100 69.5 116 64" fill="none" stroke="${ink}" stroke-width="6.4" stroke-linecap="round"/><path d="M84 64 Q100 69.5 116 64" fill="none" stroke="${shade(WOOD_D, -0.25)}" stroke-width="3.6" stroke-linecap="round"/>`;   // cantle (dark leather)
  // --- tail: hairless dock (no full outline), then hair flaring and swinging a little
  defs += `<clipPath id="${u}t"><path d="${tail}"/></clipPath>`;
  g += `<path d="${tail}" fill="url(#${u}m)" ${st}/>`;
  g += `<path d="${tail}" fill="none" clip-path="url(#${u}t)" stroke="${shade(maneC, -0.3)}" stroke-width="6" opacity=".6"/>`;
  g += `<path d="M97 100 Q95.5 116 96.5 128 M103.5 100 Q106.5 114 107.5 127 M100 102 Q101 118 102 130" fill="none" stroke="${strand}" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>`;
  g += `<path d="M96.5 83 Q100 81 103.5 83 L104 92 Q100 95.5 96 92 Z" fill="${bodyC}"/><ellipse cx="100" cy="95.5" rx="4.2" ry="3" fill="${maneC}" opacity=".75" filter="url(#${u}db)"/>`;   // dock + feathered hair start
  return { defs, body: g };
}
function horseBack(coatId) { const r = horseBackParts(coatId, "hb" + coatId); return job(`assets/img/horse_back_${coatId}.png`, 200, 170, r.body, r.defs); }

// Rider from behind (same 200×170 frame). spec: jacket, hair, pants, boots, helmet, style (ponytail|short), tie, bib
function riderBackParts(k, u) {
  const helmet = k.helmet || "#2f3456", st = (w) => stk(w || 2.6);
  const JD = shade(k.jacket, -0.22), white = helmet === "#f4f4f8", REIN = "#5a3a28", B = "#4a3a34", skin = k.skin || "#f1c9a8";
  let defs = lin(`${u}j`, [[0, shade(k.jacket, 0.15)], [1, shade(k.jacket, -0.12)]]) +
    rad(`${u}h`, [[0, shade(helmet, 0.4)], [0.55, helmet], [1, shade(helmet, -0.3)]], 0.36, 0.28, 0.8) +
    lin(`${u}bt`, [[0, shade(B, 0.1)], [1, shade(B, -0.1)]], 0, 0, 1, 0) +
    `<mask id="${u}x" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="170"><rect width="200" height="170" fill="#fff"/><path d="${REAR}" fill="#000" stroke="#000" stroke-width="2.2"/></mask>`;
  let g = "";
  // --- lower legs BEHIND the rump: tan saddle flap, glossy near-black boot tapering to the ankle, stirrup
  let legs = "";
  [-1, 1].forEach((d) => {
    const X = (x) => 100 + d * (100 - x);
    legs += `<path d="${capsule([X(64), 88], [X(63.5), 93], 5, 5)}" fill="${k.pants}" ${st()}/>`;   // knee (mostly hidden)
    legs += `<path d="M${X(64)} 83 L${X(57)} 85.5 Q${X(55.5)} 97 ${X(58.5)} 107 L${X(66)} 105 Z" fill="${shade(WOOD, 0.15)}" ${stk(2.4)}/>`;   // saddle flap (tan)
    legs += `<path d="M${X(63)} 86 L${X(60)} 112" stroke="${REIN}" stroke-width="2.2" stroke-linecap="round"/>`;   // stirrup leather, outer edge
    let boot = `<path d="M${X(56)} 93 Q${X(61)} 90 ${X(68)} 92 Q${X(69.5)} 101 ${X(68)} 112 Q${X(68.5)} 118.5 ${X(66)} 119 L${X(63)} 119 Q${X(60.5)} 118 ${X(60.5)} 112 Q${X(56.5)} 104 ${X(56)} 93 Z" fill="url(#${u}bt)" ${st()}/>`;   // boot
    boot += `<path d="M${X(59.5)} 96 Q${X(59.6)} 99.5 ${X(60.2)} 102.5" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".4"/>`;   // gloss, upper calf
    boot += `<path d="M${X(57.8)} 94.5 Q${X(62.5)} 92 ${X(68)} 93.5" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;   // cuff line
    boot += `<path d="M${X(60.4)} 112 V121.5 Q${X(60.4)} 124 ${X(64.4)} 124 Q${X(68.4)} 124 ${X(68.4)} 121.5 V112" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M${X(60.4)} 112 V121.5 Q${X(60.4)} 124 ${X(64.4)} 124 Q${X(68.4)} 124 ${X(68.4)} 121.5 V112" fill="none" stroke="#c9d0d8" stroke-width="1.6" stroke-linecap="round"/>`;   // U stirrup iron
    boot += `<path d="M${X(61.2)} 118.5 H${X(68.2)} V121.4 H${X(61.2)} Z" fill="#1e1612"/>`;   // sole on the tread
    boot += `<rect x="${Math.min(X(61.5), X(68.5))}" y="118.6" width="7" height="4.4" rx="1.5" fill="${shade(B, -0.15)}" ${st(2)}/>`;   // heel, toward the camera
    legs += `<g transform="rotate(${-8 * d} ${X(62)} 93)">${boot}</g>`;   // toe tilted ~8° outward
  });
  g += `<g mask="url(#${u}x)">${legs}</g>`;
  // cream breeches cuff above each boot (~4 px)
  [-1, 1].forEach((d) => { const X = (x) => 100 + d * (100 - x); g += `<path d="M${X(55.8)} 93.5 Q${X(55.2)} 87 ${X(59)} 86.4 L${X(64.5)} 86.4 L${X(65.5)} 92.4 Q${X(61)} 91.2 ${X(55.8)} 93.5 Z" fill="${k.pants}" ${st(2.2)}/>`; });
  // --- upper body, sitting INTO the saddle: the croup (REAR mask) hides the seat and the jacket hem
  let b = "";
  [-1, 1].forEach((d) => { const X = (x) => 100 + d * (100 - x); b += `<path d="${capsule([X(77), 56], [X(89), 64], 6.5, 6)}" fill="${shade(k.jacket, -0.3)}" ${st()}/>`; });   // forearms (behind the torso)
  b += `<path d="M81.5 61 Q79.5 70 88 74 H112 Q120.5 70 118.5 61 Z" fill="${k.pants}" ${st()}/>`;   // seat / pelvis (sides peek above the cantle)
  b += `<path d="M79 49 Q79 40 90 39 L110 39 Q121 40 121 49 L117 66 Q100 70.5 83 66 Z" fill="url(#${u}j)" ${st(2.8)}/>`;   // torso, hem flaring at the belt
  b += `<path d="M84.5 63.8 Q100 68 115.5 63.8" fill="none" stroke="${shade(k.jacket, -0.35)}" stroke-width="2.2"/>`;   // belt line
  b += `<path d="M88.5 47 Q87.8 54 89 61" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".3"/>`;
  if (k.style !== "ponytail" && !k.bib) b += `<path d="M100 46 V66" stroke="${JD}" stroke-width="2" stroke-linecap="round"/>`;   // seam
  if (k.bib) {   // rivals: a big white emblem printed on the back (no card, so it never reads as a face)
    const ey = 58, E = "#ffffff", es = stk(1.4, shade(k.jacket, -0.45)), ex = k.style === "ponytail" ? -6 : 0;
    const em = {
      star: `<path d="${star(100, ey + 0.4, 6.4, 2.7)}" fill="${E}" ${es}/>`,
      heart: `<path d="${heartPath(100, ey - 1.2, 0.52)}" fill="${E}" ${es}/>`,
      moon: `<path d="M102 ${ey - 6} A6 6 0 1 0 105.5 ${ey + 3.4} A4.7 4.7 0 1 1 102 ${ey - 6} Z" fill="${E}" ${es}/>`,
      flower: [0, 1, 2, 3, 4].map((j) => `<circle cx="${f2(100 + Math.cos(j * 1.2566 - 1.5708) * 3.6)}" cy="${f2(ey + Math.sin(j * 1.2566 - 1.5708) * 3.6)}" r="2.6" fill="${E}" ${es}/>`).join("") + `<circle cx="100" cy="${ey}" r="2" fill="${GOLD}" ${stk(1, shade(k.jacket, -0.45))}/>`,
      clover: `<path d="M100 ${ey + 1.5} Q101.5 ${ey + 4.5} 103.5 ${ey + 6}" fill="none" stroke="${E}" stroke-width="1.8" stroke-linecap="round"/>` + [[100, ey - 3.2], [96.9, ey + 0.4], [103.1, ey + 0.4]].map(([x, y]) => `<circle cx="${x}" cy="${f2(y)}" r="3" fill="${E}" ${es}/>`).join(""),
    };
    b += `<g transform="translate(${ex} 0)">${em[k.bib] || em.star}</g>`;
  }
  [-1, 1].forEach((d) => { const X = (x) => 100 + d * (100 - x); b += `<path d="${capsule([X(83), 45], [X(77), 56], 7.5, 7)}" fill="${JD}" ${st()}/>`; });   // upper arms, angled out at the elbow
  let lock = "";
  if (k.style === "ponytail") {
    b += `<path d="M86 36 Q100 40 114 36 Q113 44.5 100 45 Q87 44.5 86 36 Z" fill="${k.hair}" ${st(2)}/><path d="M91 42 Q100 43.6 109 42" fill="none" stroke="${shade(k.hair, 0.35)}" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`;
    // big high ponytail, OFF the centre axis: narrow root at x≈104–110 under the rim, swinging right to a point at (112,64)
    lock = `<path d="M103.5 40 Q100.6 46.5 102.6 53 Q105 59.5 112.2 64.6 Q114.8 58.6 113.6 52 Q112.8 45.6 110 40 Z" fill="${k.hair}" ${st(2.2)}/>`;
    lock += `<path d="M105.6 44 Q104 50 106 55.5 Q107.8 59 110.4 61.6 M108.4 44.5 Q109.6 49 109.4 54" fill="none" stroke="${shade(k.hair, 0.32)}" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`;
  } else {   // short: one solid hair mass under the rim (no scallops), outer tufts, then the jacket collar
    b += `<path d="M84 36 Q84 46 91 47.5 Q100 49 109 47.5 Q116 46 116 36 Z" fill="${k.hair}" ${st(2)}/>`;
    b += `<path d="M85.5 43 L84.5 47.5 L88.5 45.5 M114.5 43 L115.5 47.5 L111.5 45.5" fill="${k.hair}" ${st(1.6)}/>`;
    b += `<path d="M91 41.5 Q97 43.6 103 42.6" fill="none" stroke="${shade(k.hair, 0.35)}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
  }
  b += `<path d="M87 42 Q100 47.5 113 42 L113.5 46 Q100 51.5 86.5 46 Z" fill="${shade(k.jacket, -0.3)}" ${st(2)}/>`;   // jacket collar
  if (k.style === "ponytail") b += lock;
  // helmet: half-width 20, bottom unchanged (reads more like a child) + chin straps
  b += `<path d="M83.5 36 L87.5 44 M116.5 36 L112.5 44" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>`;
  b += `<path d="M80 37 Q79 10 100 10 Q121 10 120 37 Q100 42 80 37 Z" fill="url(#${u}h)" ${st(2.8)}/>`;
  if (k.bib) {   // rivals: jacket-coloured side quarters, white crown, pompom
    b += `<path d="M80 37 Q79 22 86.5 14.5 Q90 26 92.5 38.8 Q86 38.6 80 37 Z" fill="${k.jacket}" opacity=".92"/><path d="M120 37 Q121 22 113.5 14.5 Q110 26 107.5 38.8 Q114 38.6 120 37 Z" fill="${k.jacket}" opacity=".92"/>`;
    b += `<path d="M80 37 Q79 10 100 10 Q121 10 120 37 Q100 42 80 37 Z" fill="none" ${st(2.8)}/>`;
  }
  b += `<path d="M81.5 35.5 Q100 40.3 118.5 35.5" fill="none" stroke="${shade(helmet, white ? -0.15 : 0.4)}" stroke-width="1.8" opacity=".75"/>`;
  b += `<path d="M87 22 Q90.5 13.5 100 12.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".5"/>`;
  b += k.bib ? `<circle cx="100" cy="10.5" r="4" fill="${k.jacket}" ${st(1.6)}/>` : `<circle cx="100" cy="10.5" r="2.5" fill="${shade(helmet, 0.2)}" ${st(1.5)}/>`;
  if (k.style === "ponytail") b += `<circle cx="111.4" cy="42" r="2.5" fill="${k.tie}" ${st(1.5)}/><circle cx="109.2" cy="40.6" r="1.7" fill="${k.tie}" ${st(1.3)}/>`;   // small scrunchie knot at the side
  g += `<g mask="url(#${u}x)"><g transform="translate(0 -1)">${b}</g></g>`;
  return { defs, body: g };
}
function riderBack(id) { const r = riderBackParts(KIDS[id], "rb" + id); return job(`assets/img/rider_back_${id}.png`, 200, 170, r.body, r.defs); }
// 5 fixed race rivals (rider layers drawn over horse_back_<coat>): white helmet + bib emblem
const RIVAL_RIDERS = [
  { jacket: "#a98bf0", hair: "#6a4a2e", pants: "#ffffff", helmet: "#f4f4f8", style: "short", bib: "star", skin: "#e9b48c", freckles: true },
  { jacket: "#4fbf5e", hair: "#d8a24a", pants: "#ffffff", helmet: "#f4f4f8", style: "ponytail", tie: CORAL, bib: "heart", skin: "#f8d6bb", gap: true, lashes: true },
  { jacket: "#4a6fe0", hair: "#3a2a20", pants: "#ffffff", helmet: "#f4f4f8", style: "short", bib: "moon", bibColor: "#e0a020", skin: "#c98c64", thickBrows: true, mood: "smile" },
  { jacket: "#ff9640", hair: "#4a2e20", pants: "#ffffff", helmet: "#f4f4f8", style: "ponytail", tie: SKY, bib: "flower", skin: "#f1c9a8", freckles: true, lashes: true },
  { jacket: "#f5c23a", hair: "#2e2420", pants: "#ffffff", helmet: "#f4f4f8", style: "ponytail", tie: PINK, bib: "clover", bibColor: "#2fb3a8", skin: "#d9a47c", lashes: true, gap: true },
];
// results-screen portraits: the kid's FRONT face (kidFace/kidHair) wearing the race helmet, 40×40
function riderHeadFront(file, k, u) {
  const kk = Object.assign({ skin: "#f1c9a8", tie: CORAL }, k), helmet = k.helmet || "#2f3456", white = helmet === "#f4f4f8";
  const cx = 64, cy = 64, r = 25, st = stk(3);
  let defs = rad(`${u}s`, [[0, shade(kk.skin, 0.18)], [1, kk.skin]], 0.4, 0.35, 0.7) + lin(`${u}j`, [[0, shade(k.jacket, 0.15)], [1, shade(k.jacket, -0.12)]]) +
    rad(`${u}h`, [[0, shade(helmet, 0.4)], [0.55, helmet], [1, shade(helmet, -0.3)]], 0.36, 0.28, 0.8);
  let g = kidHair(kk, cx, cy, r, "down", "back");                                                      // ponytail peeking at one side
  g += `<path d="M16 130 Q18 100 42 94 Q64 90 86 94 Q110 100 112 130 Z" fill="url(#${u}j)" ${st}/>`;       // jacket
  g += `<rect x="57" y="82" width="14" height="14" rx="5" fill="${shade(kk.skin, -0.08)}" ${st}/>`;        // neck
  g += `<path d="M48 94 L64 106 L80 94 L76 91 L64 99 L52 91 Z" fill="${shade(k.jacket, -0.3)}" ${stk(2.6)}/>`;   // collar
  g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${u}s)" ${st}/>`;
  g += `<ellipse cx="${cx - r}" cy="${cy + 4}" rx="5" ry="7" fill="${kk.skin}" ${st}/><ellipse cx="${cx + r}" cy="${cy + 4}" rx="5" ry="7" fill="${kk.skin}" ${st}/>`;
  g += kidFace(kk, cx, cy + 4, r, k.mood || "happy");
  {   // small per-person touches: eyebrows (hair colour), freckles, lashes, gap tooth
    const ey = cy + 4 + r * 0.05, ex = r * 0.36, bw = k.thickBrows ? 3.4 : 2.2;
    [-1, 1].forEach((d) => {
      g += `<path d="M${cx + d * (ex - 5)} ${ey - 8} Q${cx + d * ex} ${ey - 11} ${cx + d * (ex + 5)} ${ey - 8.5}" fill="none" stroke="${shade(kk.hair, -0.15)}" stroke-width="${bw}" stroke-linecap="round"/>`;
      if (k.lashes) g += `<path d="M${cx + d * (ex + 2.6)} ${ey - 2.6} l${d * 3} -2.2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
      if (k.freckles) [[0, 0], [3, 2], [-2.5, 2.4]].forEach(([fx, fy]) => { g += `<circle cx="${cx + d * (r * 0.55 + fx)}" cy="${cy + 4 + r * 0.24 + fy}" r="1" fill="#b0704a" opacity=".8"/>`; });
    });
    if (k.gap && (k.mood || "happy") === "happy") { const my = cy + 4 + r * 0.42; g += `<rect x="${cx - 0.8}" y="${my - r * 0.03}" width="1.6" height="${r * 0.1}" fill="#9b3a4e"/>`; }
  }
  g += kidHair(kk, cx, cy + 2, r, "down", "front");
  // race helmet over the top of the head, with a small peak
  g += `<path d="M44 66 Q46 80 54 86 M84 66 Q82 80 74 86" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;   // chin straps
  const dome = "M37 56 Q35 28 64 27 Q93 28 91 56 Q64 50 37 56 Z";
  g += `<path d="${dome}" fill="url(#${u}h)" ${st}/>`;
  if (white) {
    g += `<path d="M37 56 Q35 38 46 30 Q50 42 51 53 Q43 54 37 56 Z" fill="${k.jacket}" opacity=".92"/><path d="M91 56 Q93 38 82 30 Q78 42 77 53 Q85 54 91 56 Z" fill="${k.jacket}" opacity=".92"/>`;
    g += `<path d="${dome}" fill="none" ${st}/><circle cx="64" cy="27" r="6" fill="${k.jacket}" ${stk(2.6)}/>`;
  } else g += `<circle cx="64" cy="27.5" r="4" fill="${shade(helmet, 0.2)}" ${stk(2.4)}/>`;
  g += `<path d="M44 38 Q50 31 60 30" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".5"/>`;
  g += `<path d="M39 55 Q64 48 89 55 Q90 60 86 60 Q64 54 42 60 Q38 60 39 55 Z" fill="${white ? shade(k.jacket, -0.2) : shade(helmet, -0.25)}" ${stk(2.4)}/>`;   // peak
  return job(file, 40, 40, `<g transform="scale(${40 / 104}) translate(-12 -22)">${g}</g>`, defs);
}
function riderRival(i) { const r = riderBackParts(RIVAL_RIDERS[i], "rq" + i); return job(`assets/img/rider_rival_${i + 1}.png`, 200, 170, r.body, r.defs); }
function startGate() {   // cross-country START arch, seen from behind, spanning the track (middle left transparent)
  const W = 400, H = 220;
  const defs = lin("sgw", [[0, "#c58a56"], [0.5, "#b07a4a"], [1, "#8a5a36"]], 0, 0, 1, 0) + lin("sgb", [[0, "#c58a56"], [1, "#9a6a42"]]) + blur("sgs", 2);
  let g = "";
  [26, 374].forEach((x) => { g += `<ellipse cx="${x}" cy="212.5" rx="19" ry="3.2" fill="#2a3a1a" opacity=".28" filter="url(#sgs)"/>`; });
  // posts with base blocks and gold finials
  [26, 374].forEach((x) => {
    g += `<rect x="${x - 9}" y="14" width="18" height="198" rx="5" fill="url(#sgw)" ${stk(3)}/>`;
    g += `<path d="M${x - 4} 30 V200" stroke="#fff" stroke-width="2.2" opacity=".25" stroke-linecap="round"/>`;
    g += `<rect x="${x - 14}" y="200" width="28" height="15" rx="4" fill="${WOOD_D}" ${stk(3)}/>`;
    g += `<circle cx="${x}" cy="11" r="8" fill="${GOLD}" ${stk(2.8)}/><circle cx="${x - 2.5}" cy="8.5" r="2.2" fill="#fff" opacity=".8"/>`;
  });
  // top beam
  g += `<rect x="22" y="18" width="356" height="12" rx="6" fill="url(#sgb)" ${stk(3)}/><path d="M34 21.5 H366" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/>`;
  // chequered strip
  let ch = `<clipPath id="sgc"><rect x="40" y="30" width="320" height="15" rx="3"/></clipPath><g clip-path="url(#sgc)">`;
  for (let i = 0; i < 40; i++) for (let j = 0; j < 2; j++) ch += `<rect x="${40 + i * 8}" y="${30 + j * 7.5}" width="8" height="7.5" fill="${(i + j) % 2 ? "#4a3428" : "#fffaf2"}"/>`;
  g += ch + `</g><rect x="40" y="30" width="320" height="15" rx="3" fill="none" ${stk(2.6)}/>`;
  // bunting along a sagging string
  const P = (t) => { const u = 1 - t; return [u * u * 40 + 2 * u * t * 200 + t * t * 360, u * u * 46 + 2 * u * t * 60 + t * t * 46]; };
  const cols = [CORAL, GOLD, SKY, PINK, MEADOW];
  let pts = []; for (let i = 0; i <= 40; i++) pts.push(P(i / 40));
  g += `<path d="M${pts.map((p) => f2(p[0]) + " " + f2(p[1])).join(" L")}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
  const N = 15;
  for (let i = 0; i < N; i++) {
    const a = P((i + 0.15) / N), b = P((i + 0.85) / N), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 15];
    g += `<path d="M${f2(a[0])} ${f2(a[1])} L${f2(b[0])} ${f2(b[1])} L${f2(m[0])} ${f2(m[1])} Z" fill="${cols[i % cols.length]}" ${stk(2.2)}/>`;
    g += `<path d="M${f2(a[0] + 3)} ${f2(a[1] + 2.5)} L${f2(m[0] - 1)} ${f2(m[1] - 5)}" stroke="#fff" stroke-width="1.6" opacity=".45" stroke-linecap="round"/>`;
  }
  // flower garlands spiralling down the posts
  [26, 374].forEach((x, s) => {
    for (let k = 0; k < 7; k++) {
      const y = 52 + k * 21, dx = (k % 2 ? 7 : -7) * (s ? -1 : 1);
      g += `<path d="M${x + dx} ${y} Q${x} ${y + 12} ${x - dx} ${y + 21}" fill="none" stroke="#5f9e4a" stroke-width="3" stroke-linecap="round"/>`;
      g += `<ellipse cx="${x + dx * 0.4}" cy="${y + 8}" rx="4" ry="2.2" fill="${MEADOW}" ${stk(1.4)} transform="rotate(${dx > 0 ? -30 : 30} ${x + dx * 0.4} ${y + 8})"/>`;
      g += flowerHead(x + dx, y, 4.2, [PINK, "#fff", GOLD, CORAL][k % 4]);
    }
  });
  return job("assets/img/start_gate.png", W, H, g, defs);
}
function raceLog() {   // cross-country log jump seen from the FRONT: 3 stacked logs, cut ends on both sides
  const W = 200, H = 110;
  const defs = lin("rlg", [[0, "#b98250"], [0.45, "#9a6a40"], [1, "#6e4a2e"]]) + rad("rlc", [[0, "#f8e2b6"], [1, "#d6ab74"]]) + blur("rlb", 2.5);
  let g = `<ellipse cx="100" cy="98" rx="90" ry="6" fill="#2a3a1a" opacity=".28" filter="url(#rlb)"/>`;
  const log = (x0, x1, cy, r) => {
    let s = `<rect x="${x0}" y="${cy - r}" width="${x1 - x0}" height="${2 * r}" rx="${r * 0.45}" fill="url(#rlg)" ${stk(3.5)}/>`;
    for (let x = x0 + 22; x < x1 - 24; x += 30) s += `<path d="M${x} ${cy - r * 0.4} q8 ${r * 0.18} 16 0" fill="none" stroke="#5e3c24" stroke-width="2" opacity=".55" stroke-linecap="round"/><path d="M${x + 12} ${cy + r * 0.35} q7 ${r * 0.15} 14 0" fill="none" stroke="#5e3c24" stroke-width="2" opacity=".5" stroke-linecap="round"/>`;
    s += `<path d="M${x0 + 12} ${cy - r * 0.62} H${x1 - 12}" stroke="#fff" stroke-width="2.6" opacity=".28" stroke-linecap="round"/>`;
    [x0 + r * 0.38, x1 - r * 0.38].forEach((ex) => { s += `<ellipse cx="${ex}" cy="${cy}" rx="${r * 0.42}" ry="${r - 0.5}" fill="url(#rlc)" ${stk(3)}/><ellipse cx="${ex}" cy="${cy}" rx="${r * 0.22}" ry="${r * 0.55}" fill="none" stroke="#c08e58" stroke-width="1.6"/><ellipse cx="${ex}" cy="${cy}" rx="1.6" ry="2.4" fill="#c08e58"/>`; });
    return s;
  };
  g += log(10, 104, 80, 17) + log(96, 190, 80, 17) + log(36, 164, 50, 17);
  [[18, 98], [62, 99], [110, 99], [150, 98], [184, 98]].forEach(([x, y]) => { g += `<path d="M${x - 6} ${y} Q${x - 5} ${y - 9} ${x - 2} ${y - 12} M${x} ${y} Q${x} ${y - 10} ${x + 3} ${y - 14} M${x + 6} ${y} Q${x + 6} ${y - 7} ${x + 9} ${y - 10}" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/><path d="M${x - 6} ${y} Q${x - 5} ${y - 9} ${x - 2} ${y - 12} M${x} ${y} Q${x} ${y - 10} ${x + 3} ${y - 14} M${x + 6} ${y} Q${x + 6} ${y - 7} ${x + 9} ${y - 10}" fill="none" stroke="${MEADOW}" stroke-width="2.6" stroke-linecap="round"/>`; });
  return job("assets/img/race_log.png", W, H, g, defs);
}
function raceHurdle() {   // show-jumping hurdle seen from the FRONT: two striped wings + a red/white pole
  const W = 200, H = 130;
  const defs = blur("rhb", 2.5);
  let g = `<ellipse cx="100" cy="120" rx="88" ry="5.5" fill="#2a3a1a" opacity=".28" filter="url(#rhb)"/>`;
  const wing = (x) => {
    let s = `<rect x="${x - 10}" y="16" width="20" height="100" rx="5" fill="#fffaf2" ${stk(3.5)}/>`;
    for (let y = 22; y < 104; y += 18) s += `<rect x="${x - 8}" y="${y}" width="16" height="9" fill="${CORAL}"/>`;
    s += `<rect x="${x - 10}" y="16" width="20" height="100" rx="5" fill="none" ${stk(3.5)}/><path d="M${x - 5} 22 V108" stroke="#fff" stroke-width="2.4" opacity=".55" stroke-linecap="round"/>`;
    s += `<rect x="${x - 15}" y="110" width="30" height="11" rx="4" fill="${WOOD}" ${stk(3.5)}/><circle cx="${x}" cy="12" r="7" fill="${GOLD}" ${stk(3)}/><circle cx="${x - 2}" cy="10" r="2" fill="#fff" opacity=".8"/>`;
    return s;
  };
  const pole = (y, h, c1, id) => {
    let s = `<clipPath id="${id}"><rect x="22" y="${y}" width="156" height="${h}" rx="${h / 2}"/></clipPath><rect x="22" y="${y}" width="156" height="${h}" rx="${h / 2}" fill="#fffaf2"/><g clip-path="url(#${id})">`;
    for (let x = 22; x < 178; x += 26) s += `<path d="M${x} ${y + h} L${x + 9} ${y} H${x + 22} L${x + 13} ${y + h} Z" fill="${c1}"/>`;
    return s + `</g><rect x="22" y="${y}" width="156" height="${h}" rx="${h / 2}" fill="none" ${stk(3.5)}/><path d="M30 ${y + 3} H170" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>`;
  };
  g += pole(90, 11, SKY, "rhp2");
  g += pole(52, 14, "#e8463c", "rhp1");
  g += `<rect x="31" y="66" width="10" height="6" rx="2" fill="#9aa2ad" ${stk(2)}/><rect x="159" y="66" width="10" height="6" rx="2" fill="#9aa2ad" ${stk(2)}/>`;   // cups
  g += wing(22) + wing(178);
  return job("assets/img/race_hurdle.png", W, H, g, defs);
}
function raceIcons() {
  const IP = Object.assign({}, IK.DEF, PAL), ist = (w) => IK.st(IP, w), out = [];
  { const [d, f] = IK.fill(IP.teal);
    let b = `<rect x="54" y="6" width="20" height="16" rx="4" fill="${GOLD}" ${ist(6)}/><path d="M98 30 L106 22" ${ist(13)}/><path d="M98 30 L106 22" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>`;
    b += `<circle cx="64" cy="70" r="48" fill="${f}" ${ist(7)}/><circle cx="64" cy="70" r="35" fill="#fffaf2" ${ist(5)}/>`;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; b += `<path d="M${f2(64 + Math.cos(a) * 27)} ${f2(70 + Math.sin(a) * 27)} L${f2(64 + Math.cos(a) * 32)} ${f2(70 + Math.sin(a) * 32)}" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`; }
    b += `<path d="M64 70 L64 44" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M64 70 L84 80" stroke="${CORAL}" stroke-width="7" stroke-linecap="round"/><circle cx="64" cy="70" r="6" fill="${INK}"/>${IK.shine("M33 56 Q38 42 50 34")}`;
    out.push(ICN("timer", b, d)); }
  { const [d, f] = IK.fill(IP.pink);
    let b = `<path d="M26 120 L50 50 H78 L102 120 Z" fill="${SAND}" ${ist(7)}/><path d="M64 58 V66 M64 78 V90 M64 102 V114" stroke="#fffaf2" stroke-width="6" stroke-linecap="round"/>`;
    b += `<path d="M64 80 Q38 52 38 34 Q38 8 64 8 Q90 8 90 34 Q90 52 64 80 Z" fill="${f}" ${ist(7)}/><circle cx="64" cy="34" r="11" fill="#fff" ${ist(5)}/>${IK.shine("M48 30 Q50 20 58 16")}`;
    out.push(ICN("distance", b, d)); }
  { const [d, f] = IK.fill(IP.purple);
    let b = `<path d="M14 100 A50 50 0 1 1 114 100 Z" fill="${f}" ${ist(7)}/><path d="M28 94 A38 38 0 1 1 100 94" fill="none" stroke="#fffaf2" stroke-width="13"/>`;
    b += `<path d="M28 94 A38 38 0 0 1 40 48" fill="none" stroke="${IP.green}" stroke-width="10"/><path d="M50 39 A38 38 0 0 1 80 39" fill="none" stroke="${GOLD}" stroke-width="10"/><path d="M90 48 A38 38 0 0 1 100 94" fill="none" stroke="${CORAL}" stroke-width="10"/>`;
    b += `<path d="M64 82 L94 52" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><path d="M64 82 L94 52" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/><circle cx="64" cy="82" r="11" fill="${GOLD}" ${ist(5)}/>`;
    out.push(ICN("speed", b, d)); }
  { const [d, f] = IK.fill("#c98a54"), [d2, fp] = IK.fill(CORAL);
    let b = `<rect x="14" y="12" width="60" height="106" rx="8" fill="#6a4632" ${ist(7)}/><path d="M22 20 L62 28 V112 L22 108 Z" fill="${f}" ${ist(6)}/><path d="M32 40 V96 M46 42 V98" stroke="#a8703e" stroke-width="3" stroke-linecap="round" opacity=".7"/><circle cx="54" cy="70" r="5" fill="${GOLD}" ${ist(3)}/>`;
    b += `<path d="M62 54 H84 V34 L118 66 L84 98 V78 H62 Z" fill="${fp}" ${ist(7)}/>${IK.shine("M70 62 H88")}`;
    out.push(ICN("quit", b, d + d2)); }
  { const [d, f] = IK.fill(IP.teal); out.push(ICN("left", `<path d="M14 64 L58 20 V44 H110 V84 H58 V108 Z" fill="${f}" ${ist(10)}/>${IK.shine("M64 56 H98")}`, d)); }
  { const [d, f] = IK.fill(IP.teal); out.push(ICN("right", `<path d="M114 64 L70 20 V44 H18 V84 H70 V108 Z" fill="${f}" ${ist(10)}/>${IK.shine("M30 56 H64")}`, d)); }
  { // checkered finish flag on a wooden pole
    const x = 30, y = 18, w = 84, h = 62, wave = 8, cols = 4, rows = 3;
    const P = (a, b2) => [x + a * w, y + b2 * h + Math.sin(a * Math.PI * 1.6) * wave];
    let b = `<rect x="16" y="12" width="13" height="106" rx="5" fill="${WOOD}" ${ist(6)}/><circle cx="22.5" cy="12" r="8" fill="${GOLD}" ${ist(5)}/>`;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const a = P(i / cols, j / rows), bb = P((i + 1) / cols, j / rows), cc = P((i + 1) / cols, (j + 1) / rows), dd = P(i / cols, (j + 1) / rows);
      b += `<path d="M${f2(a[0])} ${f2(a[1])} L${f2(bb[0])} ${f2(bb[1])} L${f2(cc[0])} ${f2(cc[1])} L${f2(dd[0])} ${f2(dd[1])} Z" fill="${(i + j) % 2 ? INK : "#fffaf2"}"/>`;
    }
    const pts = []; for (let i = 0; i <= 12; i++) pts.push(P(i / 12, 0)); for (let i = 12; i >= 0; i--) pts.push(P(i / 12, 1));
    b += `<path d="M${pts.map((p) => f2(p[0]) + " " + f2(p[1])).join(" L")} Z" fill="none" ${ist(7)}/>`;
    out.push(ICN("flag", `<g transform="translate(0 3)">${b}</g>`)); }
  return out;
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
  g += `<g transform="translate(35 61) scale(0.3) translate(-104 -150)">${h.body}</g>`;
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
  g += carrotShape(28, 21, 24, -18) + carrotShape(42, 18, 26, 4) + carrotShape(54, 21, 22, 22);
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

/* ======================= The friendly 3/4 horse head (mascot) ======================= */
// Drawn in a local box (ears ≈ y -86, muzzle bottom ≈ +51, neck bottom ≈ +112), placed at
// (cx,cy) with scale s. o: sw (outline in px), mood smile|happy, noNeck, foal, tilt
function head3q(coatId, cx, cy, s, u, o = {}) {
  const c = COATS[coatId], sw = (o.sw || 3) / s, ink = c.ink || INK, st = stk(sw, ink), tilt = o.tilt != null ? o.tilt : -6;
  const F = o.foal ? 1 : 0;
  const defs = rad(`${u}g`, [[0, shade(c.body, 0.22)], [0.6, c.body], [1, shade(c.body, c.shadeAmt != null ? c.shadeAmt : -0.16)]], 0.42, 0.3, 0.75) +
    lin(`${u}n`, [[0, shade(c.body, 0.05)], [1, shade(c.body, -0.18)]], 0, 0, 1, 0) + lin(`${u}m`, [[0, shade(c.mane, 0.15)], [1, shade(c.mane, -0.15)]]) +
    rad(`${u}z`, [[0, shade(c.muzzle, 0.18)], [1, c.muzzle]], 0.45, 0.35, 0.7) +
    `<clipPath id="${u}hc"><path d="M0 -58 C28 -58 43 -42 41 -18 C39 0 31 10 30 24 L-30 24 C-31 10 -39 0 -41 -18 C-43 -42 -28 -58 0 -58 Z"/></clipPath>`;
  let g = `<g transform="translate(${cx} ${cy}) scale(${s}) rotate(${tilt})">`;
  if (!o.noNeck) g += `<path d="M-26 0 C-30 36 -42 62 -52 80 Q-34 102 4 102 Q42 102 60 80 C50 56 42 22 32 -16 Z" fill="url(#${u}n)" ${st}/><path d="M-14 62 Q2 72 20 66" fill="none" stroke="#fff" stroke-width="${sw * 1.1}" stroke-linecap="round" opacity=".3"/>`;
  // mane falling down the right side of the neck
  const mane = o.noNeck ? [[10, -56], [32, -44], [42, -18], [44, 6], [36, 0], [30, -16], [16, -34]]
    : (F ? [[10, -56], [32, -44], [40, -14], [46, 14], [50, 44], [40, 40], [34, 16], [26, -10], [14, -34]]
         : [[10, -58], [36, -46], [46, -14], [52, 18], [60, 48], [66, 76], [52, 90], [48, 66], [40, 42], [34, 14], [26, -14], [12, -36]]);
  g += `<path d="${spline(mane, true)}" fill="url(#${u}m)" ${st}/>`;
  if (!o.noNeck && !F) g += `<path d="M38 -24 Q48 10 52 40 Q56 58 58 72" fill="none" stroke="${shade(c.mane, 0.35)}" stroke-width="${sw}" stroke-linecap="round" opacity=".5"/>`;
  // ears
  const es = F ? 0.82 : 1;
  [-1, 1].forEach((d) => {
    g += `<path d="M${d * 8} -46 Q${d * 12 * es} ${-86 * es} ${d * 30 * es} ${-88 * es} Q${d * 36} ${-60} ${d * 30} -38 Z" fill="url(#${u}g)" ${st}/>`;
    g += `<path d="M${d * 14} -48 Q${d * 17 * es} ${-76 * es} ${d * 28 * es} ${-78 * es} Q${d * 31} -60 ${d * 27} -46 Z" fill="${mix(c.body, "#ff9fa8", 0.5)}" opacity=".85"/>`;
  });
  // head
  g += `<path d="M0 -58 C28 -58 43 -42 41 -18 C39 0 31 10 30 24 L-30 24 C-31 10 -39 0 -41 -18 C-43 -42 -28 -58 0 -58 Z" fill="url(#${u}g)" ${st}/>`;
  g += `<g clip-path="url(#${u}hc)">`;
  if (c.blaze === "blaze") g += `<path d="M-6 -46 Q0 -50 6 -46 Q4 -20 7 20 L-7 20 Q-4 -20 -6 -46 Z" fill="#fffaf0"/>`;
  if (c.blaze === "star") g += `<path d="${star(0, -34, 8, 3.4, 4)}" fill="#fffaf0"/>`;
  if (c.dapple) [[-20, -36, 4], [18, -40, 3.4], [24, -8, 3.6], [-26, -6, 3]].forEach(([x, y, r]) => { g += `<circle cx="${x}" cy="${y}" r="${r}" fill="${shade(c.body, 0.3)}" opacity=".8"/>`; });
  g += `<path d="M-24 -40 Q-12 -52 4 -52" fill="none" stroke="#fff" stroke-width="${sw * 1.4}" stroke-linecap="round" opacity="${c.sheen || 0.42}"/>`;
  g += `</g>`;
  // muzzle
  g += `<ellipse cx="0" cy="${30 - F * 4}" rx="${31 - F * 3}" ry="${22 - F * 3}" fill="url(#${u}z)" ${st}/>`;
  g += `<ellipse cx="-10" cy="${22 - F * 4}" rx="9" ry="4" fill="#fff" opacity=".3"/>`;
  [-1, 1].forEach((d) => { g += `<ellipse cx="${d * 12}" cy="${28 - F * 4}" rx="3.6" ry="5" fill="${shade(c.muzzle, -0.5)}" transform="rotate(${d * 20} ${d * 12} ${28 - F * 4})"/>`; });
  const my = 41 - F * 6;
  if (o.mood === "happy") g += `<path d="M-12 ${my - 1} Q0 ${my + 9} 12 ${my - 1} Q0 ${my + 3} -12 ${my - 1} Z" fill="#9b3a4e" ${stk(sw * 0.8, shade(c.muzzle, -0.5))}/>`;
  else g += `<path d="M-9 ${my} Q0 ${my + 6} 9 ${my}" fill="none" stroke="${shade(c.muzzle, -0.5)}" stroke-width="${sw * 0.85}" stroke-linecap="round"/>`;
  // halter (noseband + cheek straps)
  if (!F) {
    const hp = "M-31 12 Q0 20 31 12 M-31 12 Q-38 -4 -40 -22 M31 12 Q38 -4 40 -22";
    g += `<path d="${hp}" fill="none" ${stk(sw * 2 + 4.5, ink)}/><path d="${hp}" fill="none" stroke="${HALTER}" stroke-width="4.5" stroke-linecap="round"/>`;
    g += `<circle cx="-31" cy="12" r="4" fill="${GOLD}" ${stk(sw * 0.7, ink)}/><circle cx="31" cy="12" r="4" fill="${GOLD}" ${stk(sw * 0.7, ink)}/>`;
  }
  // eyes + cheeks
  const er = F ? 1.2 : 1;
  [-1, 1].forEach((d) => {
    const ex = d * 19, ey = -16;
    if (o.mood === "happy") g += `<path d="M${ex - 7} ${ey + 2} Q${ex} ${ey - 8} ${ex + 7} ${ey + 2}" fill="none" ${stk(sw * 1.1, "#2a1c18")}/>`;
    else g += `<ellipse cx="${ex}" cy="${ey}" rx="${6.4 * er}" ry="${8.2 * er}" fill="#2a1c18"/><circle cx="${ex - 2.2}" cy="${ey - 3}" r="${2.6 * er}" fill="#fff"/><circle cx="${ex + 2.4}" cy="${ey + 3}" r="${1.2 * er}" fill="#fff" opacity=".8"/>`;
    g += `<ellipse cx="${d * 27}" cy="0" rx="6" ry="3.6" fill="#ff8f9a" opacity=".45"/>`;
  });
  // forelock
  g += `<path d="${spline(F ? [[-12, -54], [0, -62], [12, -54], [6, -44], [0, -40], [-6, -46]] : [[-14, -54], [0, -64], [15, -54], [10, -44], [4, -38], [-1, -44], [-8, -40], [-12, -46]], true)}" fill="url(#${u}m)" ${st}/>`;
  g += `</g>`;
  return { defs, body: g };
}
function horseThumb(coat) { const h = head3q(coat, 62, 62, 0.6, "t", { sw: 3 }); return job(`assets/ui/horse_${coat}.png`, 128, 128, h.body, h.defs); }

/* ======================= UI icons ======================= */
const PAL = { ink: INK, pink: PINK, red: "#ff6b6b", teal: "#3ea8b6", blue: "#5ab4f0", purple: "#b08cf0", gold: GOLD, green: "#6cc47a", orange: "#ff9f43" };
const ICN = (name, body, defs) => IK.job(`assets/ui/icons/${name}.png`, body, defs || "");
function gameIcons() {
  const out = [];
  const F = (c) => IK.fill(c), st = (w) => stk(w || 7);
  { const h = head3q("bai", 64, 68, 0.64, "ih", { sw: 6, noNeck: true, tilt: 0 }); out.push(ICN("horse", h.body, h.defs)); }
  { const h = head3q("palomino", 64, 70, 0.64, "if", { sw: 6, noNeck: true, foal: true, mood: "happy", tilt: 0 }); out.push(ICN("foal", h.body, h.defs)); }
  { const [d, f] = F(GOLD); out.push(ICN("coin", `<circle cx="64" cy="64" r="50" fill="${f}" ${st()}/><circle cx="64" cy="64" r="36" fill="none" stroke="#e0a020" stroke-width="5"/>${horseshoe(64, 68, 1.25, "#fff2b8", 4)}<path d="M30 46 Q36 30 52 24" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/>`, d)); }
  { const [d, f] = F("#ffd86a"); let g = `<path d="M20 44 Q64 30 108 44 L104 100 Q64 114 24 100 Z" fill="${f}" ${st()}/>`; const R = rng(3); for (let i = 0; i < 12; i++) { const x = 30 + R() * 66, y = 50 + R() * 44; g += `<path d="M${f2(x)} ${f2(y)} l${f2(8 + R() * 6)} ${f2(R() * 4 - 2)}" stroke="#d9a440" stroke-width="3" stroke-linecap="round"/>`; } g += `<path d="M44 38 Q42 70 44 106 M84 38 Q86 70 84 106" fill="none" stroke="${INK}" stroke-width="13"/><path d="M44 38 Q42 70 44 106 M84 38 Q86 70 84 106" fill="none" stroke="${CORAL}" stroke-width="6"/><path d="M24 40 l-6 -14 M40 34 l0 -14 M62 32 l4 -16 M88 34 l6 -14 M104 40 l10 -10" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M24 40 l-6 -14 M40 34 l0 -14 M62 32 l4 -16 M88 34 l6 -14 M104 40 l10 -10" stroke="#ffd86a" stroke-width="4" stroke-linecap="round"/>`; out.push(ICN("hay", g, d)); }
  out.push(ICN("carrot", `<g transform="translate(64 64) scale(2.0) translate(-60 -58)">${carrotShape(64, 44, 32, -35, 1.45)}</g>`));
  { const [d, f] = F("#c98a54"); out.push(ICN("brush", `<g transform="rotate(-30 64 64)"><rect x="18" y="58" width="92" height="38" rx="14" fill="#7a5a44" ${st()}/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${28 + i * 12} 62 V92" stroke="#e8d6b8" stroke-width="5" stroke-linecap="round"/>`).join("")}<path d="M14 62 Q14 30 64 30 Q114 30 114 62 Z" fill="${f}" ${st()}/><path d="M38 44 Q64 34 92 44" fill="none" stroke="${CORAL}" stroke-width="9" stroke-linecap="round"/><path d="M30 50 Q36 38 52 36" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/></g>`, d)); }
  { const [d, f] = F("#a0643c"); out.push(ICN("saddle", `<path d="M20 60 Q18 92 36 96 H96 Q112 92 110 60 Z" fill="${CORAL}" ${st(6)}/><path d="M28 88 H102" stroke="#fff" stroke-width="3" stroke-dasharray="6 6" opacity=".8"/>` +
    `<path d="M42 66 Q36 98 50 108 H74 Q86 100 82 66 Z" fill="#7a4628" ${st(6)}/>` +
    `<path d="M18 52 Q14 34 28 32 Q40 56 64 58 Q92 58 104 30 Q120 26 116 48 Q112 70 90 72 H40 Q20 70 18 52 Z" fill="${f}" ${st()}/>` +
    `<path d="M62 72 V102" stroke="${INK}" stroke-width="5"/><path d="M52 102 H72 L70 116 H54 Z" fill="#c9ced6" ${st(5)}/><path d="M34 48 Q50 62 70 62" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".45"/>`, d)); }
  out.push(ICN("horseshoe", horseshoe(64, 62, 2.7, GOLD, 6)));
  { const h = horse("bai", { legs: { fn: [62, 1], ff: [56, 1], hn: [-50, 0], hf: [-44, 0] }, head: -2, tail: 6 }, "ij", { sw: 3.6, dy: 0 });
    let g = `<rect x="14" y="100" width="12" height="20" rx="4" fill="#fffaf2" ${st(5)}/><rect x="102" y="100" width="12" height="20" rx="4" fill="#fffaf2" ${st(5)}/><rect x="16" y="98" width="96" height="10" rx="5" fill="${CORAL}" ${st(5)}/>`;
    g += `<g transform="translate(64 60) rotate(-16) scale(0.66) translate(-104 -100)">${h.body}</g>`;
    out.push(ICN("jump", g, h.defs)); }
  { const [d, f] = F("#fff1d8"); const [d2, f2_] = F("#7488a8"); out.push(ICN("house", `<rect x="26" y="58" width="76" height="56" rx="6" fill="${f}" ${st()}/><path d="M12 64 L64 18 L116 64 Z" fill="${f2_}" ${st()}/><rect x="54" y="80" width="22" height="34" rx="6" fill="#4f9fc0" ${st(5)}/><rect x="80" y="26" width="14" height="22" fill="#d06a52" ${st(5)}/>`, d + d2)); }
  { const [d, f] = F("#d29a60"); const [d2, f2_] = F("#cf6a52"); out.push(ICN("shop", `<rect x="22" y="58" width="84" height="58" rx="6" fill="${f}" ${st()}/><path d="M10 64 L64 16 L118 64 Z" fill="${f2_}" ${st()}/><rect x="44" y="78" width="40" height="38" fill="#7a4f32" ${st(5)}/><path d="M48 82 L80 112 M80 82 L48 112" stroke="#fff6e6" stroke-width="4"/>${horseshoe(64, 50, 0.6, GOLD, 3)}`, d + d2)); }
  { const [d, f] = F(GOLD); out.push(ICN("energy", `<path d="M74 10 L26 72 H58 L48 118 L102 50 H68 Z" fill="${f}" ${st()}/><path d="M66 24 L44 54" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>`, d)); }
  { const [d, f] = F("#5ab4f0"); out.push(ICN("clean", `<path d="M56 12 Q90 52 90 78 A34 34 0 0 1 22 78 Q22 52 56 12 Z" fill="${f}" ${st()}/><path d="M38 76 Q38 92 52 98" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/><path d="${star(100, 34, 20, 6, 4)}" fill="${GOLD}" ${st(5)}/><path d="${star(104, 92, 11, 3.6, 4)}" fill="#fff" ${st(4)}/>`, d)); }
  { const [d, f] = F("#ffd86a"); out.push(ICN("food", `<path d="M14 70 Q50 56 86 70 L82 110 Q50 122 18 110 Z" fill="${f}" ${st()}/><path d="M24 78 l12 0 M44 92 l14 -2 M30 100 l10 2 M60 80 l12 1" stroke="#d9a440" stroke-width="3" stroke-linecap="round"/><g transform="translate(78 54) scale(1.9) translate(-64 -50)">${carrotShape(64, 40, 28, 30, 1)}</g>`, d)); }
  { const [d, f] = F(GOLD); const [d2, f2_] = F("#fff1d8"); out.push(ICN("rest", `<rect x="16" y="70" width="64" height="46" rx="6" fill="${f2_}" ${st()}/><path d="M6 76 L48 38 L90 76 Z" fill="#7488a8" ${st()}/><rect x="38" y="88" width="20" height="28" rx="5" fill="#4f9fc0" ${st(5)}/><path d="M92 12 A28 28 0 1 0 120 56 A22 22 0 1 1 92 12 Z" fill="${f}" ${st(6)}/>`, d + d2)); }
  { out.push(ICN("stall", `<rect x="18" y="14" width="92" height="104" rx="8" fill="#fff6e6" ${st()}/><rect x="28" y="24" width="72" height="34" rx="4" fill="#3e2a22" ${st(5)}/><path d="M34 54 Q46 42 56 54 Q66 40 78 54 Q88 46 94 54" fill="#e9c66a" ${st(4)}/><rect x="28" y="64" width="72" height="44" rx="4" fill="#6fae60" ${st(5)}/><path d="M32 68 L96 104 M96 68 L32 104" stroke="#fff6e6" stroke-width="7"/><path d="M18 61 H110" stroke="${INK}" stroke-width="5"/>`)); }
  return out;
}

/* ======================= Logo, splash, app icons ======================= */
function logo() {
  const W = 460, H = 300;
  const h = head3q("bai", 230, 140, 1.12, "lg", { sw: 7, noNeck: true, mood: "smile" });
  const defs = h.defs + glow("lgl", 5) + rad("lh", [[0, "#ffffff", 0.9], [1, "#ffffff", 0]]);
  let g = `<ellipse cx="230" cy="160" rx="220" ry="138" fill="url(#lh)"/>`;
  g += horseshoe(230, 150, 6.6, GOLD, 7);
  g += rosette(96, 196, 1.15, CORAL, GOLD) + rosette(364, 196, 1.15, SKY, GOLD);
  g += h.body;
  [[60, 60, 16], [400, 70, 14], [36, 250, 10], [424, 250, 12]].forEach(([x, y, r], i) => { g += `<path d="${star(x, y, r, r * 0.33, 4)}" fill="${i % 2 ? PINK : GOLD}" filter="url(#lgl)"/>`; });
  return job("assets/img/logo.png", W, H, g, defs);
}
function splash() {
  const W = 900, H = 1600;
  let defs = lin("sky", [[0, "#7cc6f0"], [0.6, "#bfe6fb"], [1, "#e9f7e0"]]) + lin("hill", [[0, "#a6dc7c"], [1, "#86c662"]]) + lin("hill2", [[0, "#8fcf6a"], [1, "#74b955"]]) +
    lin("mead", [[0, "#a3d879"], [1, "#86c463"]]) + rad("sun", [[0, "#fffbe0"], [0.5, "#ffe48a"], [1, "#ffd24a"]]) + glow("sg", 6) + rad("sh", [[0, "#ffffff", 0.7], [1, "#ffffff", 0]]);
  let g = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  g += `<circle cx="700" cy="230" r="150" fill="url(#sh)"/><circle cx="700" cy="230" r="70" fill="url(#sun)"/>`;
  const cloud = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#fff"><circle cx="-40" cy="10" r="30"/><circle cx="0" cy="-6" r="42"/><circle cx="44" cy="12" r="28"/><rect x="-70" y="10" width="140" height="30" rx="15"/></g>`;
  g += cloud(180, 220, 1.1) + cloud(560, 400, 0.8) + cloud(820, 120, 0.7);
  // hills, tree line, distant stable
  g += `<path d="M0 640 Q220 520 470 610 Q680 520 900 600 V1600 H0 Z" fill="url(#hill)"/>`;
  g += `<path d="M0 720 Q300 640 600 700 Q780 660 900 690 V1600 H0 Z" fill="url(#hill2)"/>`;
  g += `<g transform="translate(560 512) scale(0.5)">${stable().svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g>`;
  [[120, 600, 0.55], [190, 620, 0.42], [820, 610, 0.5]].forEach(([x, y, k]) => { g += `<g transform="translate(${x - 64 * k} ${y - 186 * k}) scale(${k})">${pine().svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g>`; });
  g += `<rect x="0" y="780" width="${W}" height="${H - 780}" fill="url(#mead)"/><path d="M0 790 Q450 760 900 790 V800 H0 Z" fill="#9fd676"/>`;
  // paddock fence across the meadow
  const fy = 820; for (let x = -20; x < W + 40; x += 90) g += `<rect x="${x - 9}" y="${fy - 70}" width="18" height="84" rx="4" fill="#fffaf0" ${stk(5)}/>`;
  g += `<rect x="-10" y="${fy - 54}" width="${W + 20}" height="14" fill="#fffaf0" ${stk(5)}/><rect x="-10" y="${fy - 24}" width="${W + 20}" height="14" fill="#fffaf0" ${stk(5)}/>`;
  for (let x = -20; x < W + 40; x += 90) g += `<rect x="${x - 9}" y="${fy - 72}" width="18" height="10" rx="3" fill="#fffaf0" ${stk(5)}/>`;
  // flowers in the grass
  const R = rng(9); for (let i = 0; i < 26; i++) { const x = R() * W, y = 1190 + R() * 380, c = [PINK, "#fff", GOLD, CORAL][i % 4]; g += flowerHead(+f2(x), +f2(y), 11, c); }
  // the happy horse, the foal and the two kids (subjects between y 420 and 1150; crop x 80–820)
  const big = horse("bai", 0, "sph", { sw: 3 }), foal = horse("palomino", 0, "spf", { sw: 3, foal: true });
  defs += big.defs + foal.defs;
  g += `<ellipse cx="400" cy="1042" rx="190" ry="24" fill="#2a3a1a" opacity=".16"/><ellipse cx="650" cy="1072" rx="100" ry="16" fill="#2a3a1a" opacity=".16"/>`;
  g += `<g transform="translate(400 1040) scale(2.7) translate(-104 -150)">${big.body}</g>`;
  g += `<g transform="translate(650 1070) scale(2.0) translate(-${104} -150) translate(208 0) scale(-1 1)">${foal.body}</g>`;
  const kidsA = [["fille", 210, 1160, 2.2], ["garcon", 560, 1170, 2.2]];
  kidsA.forEach(([id, x, y, sc], i) => { const r = kid(KIDS[id], "down", 0, false, "sk" + i, "happy"); defs += r.defs; g += `<ellipse cx="${x}" cy="${y - 2}" rx="56" ry="12" fill="#2a3a1a" opacity=".16"/><g transform="translate(${x} ${y}) scale(${sc}) translate(-64 -120)">${r.body}</g>`; });
  [[120, 470, 22], [790, 520, 18]].forEach(([x, y, r]) => { g += `<path d="${heartPath(x, y, r / 9)}" fill="${PINK}" ${stk(4)}/>`; });
  return K.job("assets/img/splash.png", W, H, g, defs);
}
// App icon (home screen): 512 grid; `safe` < 1 shrinks the subject into the maskable safe zone.
function icon(file, size, safe = 1) {
  const S = 512, k = safe;
  const h = head3q("bai", 256, 230, 2.2, "ic", { sw: 12, noNeck: false });
  const defs = h.defs + rad("ib", [[0, "#ffd9a0"], [0.55, "#ffb27a"], [1, "#f08a6a"]], 0.5, 0.35, 0.85) + glow("ig", 10) + rad("ih", [[0, "#ffffff", 0.7], [1, "#ffffff", 0]]);
  let g = `<rect width="${S}" height="${S}" fill="url(#ib)"/>`;
  for (let i = 0; i < 16; i++) { const a0 = (i / 16) * Math.PI * 2, a1 = a0 + Math.PI / 16; g += `<path d="M256 250 L${256 + Math.cos(a0) * 520} ${250 + Math.sin(a0) * 520} L${256 + Math.cos(a1) * 520} ${250 + Math.sin(a1) * 520} Z" fill="#ffffff" opacity=".08"/>`; }
  g += `<circle cx="256" cy="262" r="${220 * k}" fill="url(#ih)"/>`;
  g += `<g transform="translate(256 262) scale(${k}) translate(-256 -262)">`;
  g += horseshoe(256, 270, 11.5, GOLD, 12);
  g += `<g transform="translate(256 512) scale(0.92) translate(-256 -512)">${h.body}</g>`;
  g += `</g>`;
  [[90, 100, 30, "#fff6b8"], [430, 420, 22, "#ffffff"], [80, 410, 18, "#ffffff"]].forEach(([x, y, r, c]) => { g += `<path d="${star(x, y, r * k, r * 0.33 * k, 4)}" fill="${c}" filter="url(#ig)"/>`; });
  return Object.assign(job(file, S, S, g, defs), { scale: size / S });
}

/* ======================= Close-up: brushing the horse ======================= */
// 1000×1000 backdrop (cover-fit on a phone shows roughly x 0.27–0.73). The side body comes
// from horse() scaled ×FS, the friendly head from head3q() turned toward the player.
const FB = 1000, FS = 7, FTX = 60, FTY = 40;
const toImg = (p) => [p[0] * FS + FTX, p[1] * FS + FTY];
function spotAreas() {   // neck + shoulder/barrel regions (fractions of the backdrop)
  const r = (x0, y0, x1, y1) => { const a = toImg([x0, y0]), b = toImg([x1, y1]); return { x: +(a[0] / FB).toFixed(3), y: +(a[1] / FB).toFixed(3), w: +((b[0] - a[0]) / FB).toFixed(3), h: +((b[1] - a[1]) / FB).toFixed(3) }; };
  return [r(58, 62, 76, 86), r(76, 80, 96, 104)];
}
function flank(coat, done) {
  const c = COATS[coat];
  const body = horse(coat, 0, "fb", { sw: 1.5, noHead: true, dy: 0 });
  const hd = head3q(coat, 440, 270, 2.9, "fh", { sw: 11, noNeck: true, mood: done ? "happy" : "smile", tilt: -8 });
  let defs = body.defs + hd.defs + lin("bg", [[0, "#bfe6fb"], [0.55, "#e6f6d6"], [1, "#b9e08f"]]) + glow("sp", 8) + rad("halo", [[0, "#ffffff", 0.85], [1, "#ffffff", 0]]) + rad("bok", [[0, "#ffffff", 0.6], [1, "#ffffff", 0]]);
  let g = `<rect width="${FB}" height="${FB}" fill="url(#bg)"/>`;
  // soft background: distant fence + bokeh
  g += `<rect x="0" y="560" width="${FB}" height="440" fill="#a9d986" opacity=".55"/>`;
  for (let x = 30; x < FB; x += 150) g += `<rect x="${x}" y="470" width="22" height="120" rx="6" fill="#fffaf0" opacity=".7"/>`;
  g += `<rect x="0" y="494" width="${FB}" height="16" fill="#fffaf0" opacity=".7"/><rect x="0" y="540" width="${FB}" height="16" fill="#fffaf0" opacity=".7"/>`;
  const R = rng(coat.length * 17); for (let i = 0; i < 18; i++) g += `<circle cx="${f2(R() * FB)}" cy="${f2(R() * 520)}" r="${f2(14 + R() * 30)}" fill="url(#bok)"/>`;
  if (done) g += `<circle cx="520" cy="560" r="520" fill="url(#halo)"/>`;
  g += `<g transform="translate(${FTX} ${FTY}) scale(${FS})">${body.body}</g>`;
  if (done) {   // gleaming coat: long glossy streaks on the barrel + neck
    g += `<g transform="translate(${FTX} ${FTY}) scale(${FS})" fill="none" stroke="#fff" stroke-linecap="round" opacity=".55"><path d="M92 84 Q118 80 140 82" stroke-width="2.6"/><path d="M100 92 Q120 90 134 92" stroke-width="1.6"/><path d="M70 70 Q66 62 64 56" stroke-width="2.2"/></g>`;
  }
  g += hd.body;
  if (done) [[520, 640, 40], [700, 600, 30], [430, 520, 26], [180, 160, 38], [820, 220, 34], [610, 760, 22], [300, 700, 28]].forEach(([x, y, s2]) => { g += `<path d="${star(x, y, s2, s2 * 0.3, 4)}" fill="#fff6b8" filter="url(#sp)"/>`; });
  if (done) [[520, 140, 3], [610, 210, 2.2]].forEach(([x, y, k]) => { g += `<path d="${heartPath(x, y, k)}" fill="${PINK}" ${stk(6)}/>`; });
  return job(`assets/img/flank_${coat}${done ? "_done" : ""}.png`, FB, FB, g, defs);
}
function mud(file, seed, col) {   // a FLAT mud splash on the coat: irregular splat + droplets
  const R = rng(seed), cx = 55, cy = 55, rim = shade(col, -0.38);
  const pts = [], n = 24;
  const lobe = Array.from({ length: 8 }, () => 0.6 + R() * 0.8);
  for (let i = 0; i < n; i++) {                                // soft round lobes = splash edge
    const a = (i / n) * Math.PI * 2, t = (i / n) * 8, k = Math.floor(t), fr = t - k;
    const bump = Math.sin(fr * Math.PI) * lobe[k % 8];
    const rr = 23 + bump * 9;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9]);
  }
  const splat = spline(pts, true);
  let g = `<path d="${splat}" fill="${col}" stroke="${rim}" stroke-width="3.5" stroke-linejoin="round"/>`;
  g += `<path d="${spline(pts.map(([x, y]) => [cx + (x - cx) * 0.62, cy + (y - cy) * 0.62 - 2]), true)}" fill="${shade(col, 0.1)}" opacity=".7"/>`;
  // droplets flung around the splat
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + R() * 0.6, d = 41 + R() * 7, r = 3 + R() * 3;
    g += `<circle cx="${f2(cx + Math.cos(a) * d)}" cy="${f2(cy + Math.sin(a) * d * 0.92)}" r="${f2(r)}" fill="${col}" stroke="${rim}" stroke-width="2"/>`;
  }
  // dust/grass speckles + a small soft highlight
  for (let i = 0; i < 9; i++) { const x = cx - 16 + R() * 32, y = cy - 14 + R() * 28; g += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(1 + R() * 1.4)}" fill="${i % 3 ? rim : "#8fae5a"}" opacity=".55"/>`; }
  g += `<ellipse cx="${cx - 9}" cy="${cy - 10}" rx="8" ry="4" fill="#fff" opacity=".35" transform="rotate(-25 ${cx - 9} ${cy - 10})"/>`;
  return job(`assets/img/${file}.png`, 110, 110, g);
}
function straw() {
  const R = rng(5);
  const defs = rad("dust", [[0, "#f6e6c4", 0.95], [1, "#e9cf98", 0.85]]);
  let g = `<path d="${K.blob(55, 56, 36, 30, 10, 0.15, R)}" fill="url(#dust)" ${stk(4, "#b8935a")}/>`;
  [[30, 40, 80, 64], [34, 72, 84, 44], [52, 30, 62, 84], [26, 56, 70, 52], [44, 78, 86, 70]].forEach(([x1, y1, x2, y2]) => { g += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="#ffd86a" stroke-width="4" stroke-linecap="round"/><path d="M${x1 + 2} ${y1} L${(x1 + x2) / 2} ${(y1 + y2) / 2}" stroke="#fff6c8" stroke-width="1.6" stroke-linecap="round"/>`; });
  return job("assets/img/straw.png", 110, 110, g, defs);
}
// round grooming brush held at an angle, bristles toward the top-left
const CURRY = { W: 150, rot: -45, cx: 78, cy: 80, tip: [0, -30] };
function curryTip() { const a = CURRY.rot * Math.PI / 180, [x, y] = CURRY.tip; return { x: +((CURRY.cx + x * Math.cos(a) - y * Math.sin(a)) / CURRY.W).toFixed(3), y: +((CURRY.cy + x * Math.sin(a) + y * Math.cos(a)) / CURRY.W).toFixed(3) }; }
function curry() {
  const defs = lin("cw", [[0, "#e0a86e"], [1, "#a8703e"]]) + glow("cg", 2);
  let g = `<g transform="translate(${CURRY.cx} ${CURRY.cy}) rotate(${CURRY.rot})">`;
  g += `<rect x="-46" y="-36" width="92" height="26" rx="10" fill="#6a4a3a" ${stk(4.5)}/>`;
  for (let i = 0; i < 9; i++) g += `<path d="M${-38 + i * 9.5} -34 V-14" stroke="${i % 2 ? "#f4e2c2" : "#e2c89c"}" stroke-width="5" stroke-linecap="round"/>`;
  g += `<path d="M-52 -10 Q-56 -4 -50 4 Q-30 24 0 24 Q30 24 50 4 Q56 -4 52 -10 Z" fill="url(#cw)" ${stk(4.5)}/>`;
  g += `<path d="M-30 14 Q-34 40 0 42 Q34 40 30 14" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/><path d="M-30 14 Q-34 40 0 42 Q34 40 30 14" fill="none" stroke="${CORAL}" stroke-width="8" stroke-linecap="round"/>`;
  g += `<path d="M-38 -4 Q-20 6 6 6" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>${horseshoe(26, -2, 0.42, GOLD, 1.4)}`;
  g += `</g>`;
  g += `<path d="${star(34, 30, 9, 3, 4)}" fill="#fff6b8" filter="url(#cg)"/>`;
  return job("assets/img/curry.png", CURRY.W, CURRY.W, g, defs);
}
if (require.main === module) {
  console.log("closeup.spots.area =", JSON.stringify(spotAreas()));
  console.log("closeup.brushTip   =", JSON.stringify(curryTip()));
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
  jobs.push(grass(), sandTile("sand", "#e6c48a", 21, false), sandTile("arena", "#f1dcae", 33, true), lane(), house(), tack(), stable(), pine(), tree(), bush(),
    hurdle(), hurdleV(), logs(), trough(), haybale(), flowers(), ribbon(), trophy(), bench(), weathervane(), carrots(), saddleRack(), want(), fence());
  Object.keys(COATS).forEach((c) => jobs.push(horseThumb(c), flank(c, false), flank(c, true)));
  jobs.push(mud("mud_1", 3, "#a9784a"), mud("mud_2", 8, "#a27046"), straw(), curry(), logo(), splash(),
    icon("assets/favicon.png", 512), icon("assets/apple-touch-icon.png", 180), icon("assets/icon-192.png", 192), icon("assets/icon-maskable.png", 512, 0.78),
    ...gameIcons(),
    ...Object.keys(COATS).map((c) => horseBack(c)), ...Object.keys(KIDS).map((id) => riderBack(id)), ...RIVAL_RIDERS.map((_, i) => riderRival(i)), ...RIVAL_RIDERS.map((k, i) => riderHeadFront(`assets/img/rival_head_${i + 1}.png`, k, "qh" + i)), ...Object.keys(KIDS).map((id) => riderHeadFront(`assets/img/rider_head_${id}.png`, KIDS[id], "kh" + id)), raceLog(), raceHurdle(), startGate(), ...raceIcons(),
    ...IK.jobs(PAL, ["star", "heart", "heartEmpty", "sound", "soundOff", "help", "avatar", "goals", "close", "play", "resume", "check", "gift", "hand", "sparkle", "bell", "refresh", "arrow", "trophy", "joy", "moon", "calendar", "palette", "ball", "smile", "meh", "sad", "lock", "battery", "home"]));
  return jobs;
}
