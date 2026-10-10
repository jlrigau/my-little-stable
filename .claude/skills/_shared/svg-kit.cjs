/*
 * svg-kit — tiny helpers to author game art as SVG strings (rendered to PNG by
 * render-svg.cjs). Game-agnostic: a game's art module (tools/art/<game>.cjs)
 * requires this and describes its own sprites.
 *
 *   const K = require("../../.claude/skills/_shared/svg-kit.cjs");
 *   K.svg(w, h, body, defs)            → full <svg> document
 *   K.sheet(frames, fw, fh, cols)      → frames (inner SVG strings) laid out on a grid
 *   K.job(file, w, h, body, defs)      → a render job { file, width, height, svg }
 *   K.shade("#ff8800", -0.2)           → darker / lighter colour (-1..1)
 *   K.mix(a, b, t)                     → blend two hex colours
 *   K.glow(id, std, color?)            → <filter> producing a soft outer glow
 *   K.shadowFilter(id, dy, std, op)    → <filter> for a soft drop shadow
 *   K.lin(id, stops, x1,y1,x2,y2) / K.rad(id, stops, cx,cy,r,fx,fy) → gradients
 *   K.rng(seed)                        → deterministic random (same art every run)
 */
function svg(w, h, body, defs) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs || ""}</defs>${body}</svg>`;
}
// Lay frames on a grid. Each frame is drawn in its own (0,0)-(fw,fh) coordinate space.
function sheet(frames, fw, fh, cols) {
  return frames.map((f, i) => `<g transform="translate(${(i % cols) * fw},${Math.floor(i / cols) * fh})"><svg x="0" y="0" width="${fw}" height="${fh}" viewBox="0 0 ${fw} ${fh}" overflow="hidden">${f}</svg></g>`).join("");
}
function job(file, width, height, body, defs) { return { file, width, height, svg: svg(width, height, body, defs) }; }

function hex2rgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgb2hex(r, g, b) { return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
function shade(c, t) { const [r, g, b] = hex2rgb(c); return t < 0 ? rgb2hex(r * (1 + t), g * (1 + t), b * (1 + t)) : rgb2hex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t); }
function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function glow(id, std, color) {
  return `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="${std}" result="b"/>${color ? `<feFlood flood-color="${color}"/><feComposite in2="b" operator="in" result="b"/>` : ""}<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}
function blur(id, std) { return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${std}"/></filter>`; }
function shadowFilter(id, dy, std, op) {
  return `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="${dy}" stdDeviation="${std}" flood-color="#000" flood-opacity="${op}"/></filter>`;
}
function stopsHTML(stops) { return stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ""}/>`).join(""); }
function lin(id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) { return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsHTML(stops)}</linearGradient>`; }
function rad(id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy) { return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ""}>${stopsHTML(stops)}</radialGradient>`; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// 4/5-point star path centred on (cx,cy)
function star(cx, cy, R, r, n = 5, rot = -Math.PI / 2) {
  let d = ""; for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r : R, a = rot + i * Math.PI / n; d += (i ? "L" : "M") + (cx + Math.cos(a) * rr).toFixed(2) + " " + (cy + Math.sin(a) * rr).toFixed(2); }
  return d + "Z";
}
// soft blob path (closed, smooth) through n points around an ellipse with jitter
function blob(cx, cy, rx, ry, n, jitter, rand) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 1 + (rand ? (rand() - 0.5) * 2 * jitter : 0); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (i === 0) d += `M${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + "Z";
}
// Output resolution policy: rules = [[RegExp on file, { scale, type, ext }], …]; first match
// wins. Render every image at the size it is DISPLAYED on a phone (DPR 2–3), else it is
// blurry. `ext` renames the file (e.g. ".jpg" for opaque full-screen backdrops).
function hidpi(jobs, rules) {
  return jobs.map((j) => {
    const r = rules.find(([re]) => re.test(j.file));
    if (!r || r[1].keep) return j;
    const o = Object.assign({}, j, { scale: r[1].scale || 1 });
    if (r[1].type) o.type = r[1].type;
    if (r[1].ext) o.file = j.file.replace(/\.[a-z]+$/i, r[1].ext);
    return o;
  });
}
module.exports = { hidpi, svg, sheet, job, shade, mix, glow, blur, shadowFilter, lin, rad, rng, star, blob, hex2rgb, rgb2hex };
