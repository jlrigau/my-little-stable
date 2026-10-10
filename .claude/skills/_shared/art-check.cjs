#!/usr/bin/env node
/*
 * art-check — automated + visual QA for generated game art.
 *
 *   node .claude/skills/_shared/art-check.cjs [--out DIR] [--zoom 2] [--only key]
 *
 * Reads GAME.assets from game.config.js and, for every image / spritesheet:
 *   1. AUTOMATIC checks (printed, exit 1 on a problem):
 *      - clipping: opaque pixels touching a frame edge (a limb/antenna cut off by the frame)
 *      - empty frames (nothing drawn) in a spritesheet
 *      - frame jitter: the feet line (lowest opaque row) jumping between walk frames,
 *        or the sprite's horizontal centre drifting (looks like sliding / floating)
 *      - stray islands: small detached opaque blobs far from the main body (a floating
 *        head, a hand not attached to an arm, a speck) — flagged for visual review
 *   2. VISUAL review sheets (PNG) in --out (default /tmp/art-check):
 *      - <key>.png: every frame at `--zoom`× on a checkerboard with the frame grid, so
 *        clipping, gaps between body parts and outline breaks are obvious
 *      - ingame_<key>.png: the same art at its real in-game size (sheet frame × scale)
 *        next to a phone-width ruler — is it readable on a phone?
 *   Then LOOK at each sheet with the checklist in the `visual-review` skill.
 *
 * Uses headless Chromium (canvas) — no Python needed.
 */
const fs = require("node:fs"), path = require("node:path");
function loadPlaywright() {
  for (const c of ["playwright", "/opt/node22/lib/node_modules/playwright"]) { try { return require(c); } catch (_) {} }
  throw new Error("Playwright not found");
}
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const root = path.resolve(__dirname, "../../..");
const out = path.resolve(arg("--out", "/tmp/art-check"));
const zoom = +arg("--zoom", 2);
const only = arg("--only", "");
fs.mkdirSync(out, { recursive: true });

global.window = {};
require(path.join(root, "game.config.js"));
const G = global.window.GAME;
const items = [];
Object.entries((G.assets && G.assets.sheets) || {}).forEach(([k, s]) => items.push({ key: k, path: s.path, fw: s.frameWidth * (s.res || 1), fh: s.frameHeight * (s.res || 1) }));
Object.entries((G.assets && G.assets.images) || {}).forEach(([k, p]) => items.push({ key: k, path: typeof p === "string" ? p : p.path }));
Object.entries(G.icons || {}).forEach(([k, p]) => items.push({ key: "icon:" + k, path: p }));
const todo = items.filter((it) => !only || only.split(",").some((o) => it.key.includes(o)));

(async () => {
  const pw = loadPlaywright();
  const browser = await pw.chromium.launch({ args: ["--ignore-certificate-errors", "--allow-file-access-from-files"] });
  const page = await browser.newPage();
  await page.setContent("<html><body></body></html>");
  let problems = 0;
  for (const it of todo) {
    const file = path.join(root, it.path);
    if (!fs.existsSync(file)) { console.log(`✗ ${it.key}: missing file ${it.path}`); problems++; continue; }
    const b64 = fs.readFileSync(file).toString("base64");
    const res = await page.evaluate(async ({ b64, it, zoom }) => {
      const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
      const W = img.width, H = img.height, fw = it.fw || W, fh = it.fh || H;
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const x = c.getContext("2d"); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, W, H).data;
      const A = (px, py) => d[(py * W + px) * 4 + 3];
      const cols = Math.floor(W / fw), rows = Math.floor(H / fh), frames = [];
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const x0 = q * fw, y0 = r * fh;
        let minx = 1e9, maxx = -1, miny = 1e9, maxy = -1, edge = { l: 0, r: 0, t: 0, b: 0 }, n = 0;
        const mask = new Uint8Array(fw * fh);
        for (let yy = 0; yy < fh; yy++) for (let xx = 0; xx < fw; xx++) {
          if (A(x0 + xx, y0 + yy) > 40) {
            n++; mask[yy * fw + xx] = 1;
            if (xx < minx) minx = xx; if (xx > maxx) maxx = xx; if (yy < miny) miny = yy; if (yy > maxy) maxy = yy;
            if (xx === 0) edge.l++; if (xx === fw - 1) edge.r++; if (yy === 0) edge.t++; if (yy === fh - 1) edge.b++;
          }
        }
        // connected components (4-neighbour) → detached islands
        const lab = new Int32Array(fw * fh), sizes = []; let L = 0;
        for (let i = 0; i < mask.length; i++) {
          if (!mask[i] || lab[i]) continue;
          L++; let cnt = 0; const st = [i]; lab[i] = L;
          while (st.length) { const p = st.pop(); cnt++; const px = p % fw, py = (p / fw) | 0;
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= fw || ny >= fh) return; const j = ny * fw + nx; if (mask[j] && !lab[j]) { lab[j] = L; st.push(j); } }); }
          sizes.push(cnt);
        }
        const big = Math.max(0, ...sizes);
        const islands = sizes.filter((s) => s !== big && s > 12 && s > big * 0.004).length;
        frames.push({ n, bbox: n ? [minx, miny, maxx, maxy] : null, edge, islands, cx: n ? (minx + maxx) / 2 : 0, feet: maxy });
      }
      // review sheet: frames at zoom on a checkerboard, with grid
      const S = document.createElement("canvas"); S.width = W * zoom; S.height = H * zoom;
      const s = S.getContext("2d");
      for (let yy = 0; yy < S.height; yy += 16) for (let xx = 0; xx < S.width; xx += 16) { s.fillStyle = ((xx + yy) / 16) % 2 ? "#d9dde6" : "#f4f6fa"; s.fillRect(xx, yy, 16, 16); }
      s.imageSmoothingEnabled = true; s.drawImage(img, 0, 0, W * zoom, H * zoom);
      s.strokeStyle = "rgba(255,0,80,0.6)"; s.lineWidth = 1;
      for (let q = 0; q <= cols; q++) { s.beginPath(); s.moveTo(q * fw * zoom + 0.5, 0); s.lineTo(q * fw * zoom + 0.5, S.height); s.stroke(); }
      for (let r = 0; r <= rows; r++) { s.beginPath(); s.moveTo(0, r * fh * zoom + 0.5); s.lineTo(S.width, r * fh * zoom + 0.5); s.stroke(); }
      return { W, H, cols, rows, frames, sheet: S.toDataURL("image/png") };
    }, { b64, it, zoom });
    fs.writeFileSync(path.join(out, it.key + ".png"), Buffer.from(res.sheet.split(",")[1], "base64"));
    const issues = [];
    res.frames.forEach((f, i) => {
      if (!f.n) { if (it.fw) issues.push(`frame ${i} empty`); return; }
      const e = f.edge, sides = Object.entries(e).filter(([, v]) => v > 2).map(([k]) => k);
      // full-bleed backgrounds/tiles legitimately touch every edge
      if (sides.length && sides.length < 4) issues.push(`frame ${i} clipped at ${sides.join("/")}`);
      if (f.islands) issues.push(`frame ${i}: ${f.islands} detached part(s) — check nothing floats (head/hand/antenna)`);
    });
    if (it.fw && res.frames.length > 1) {
      const rowsF = [];
      for (let r = 0; r < res.rows; r++) rowsF.push(res.frames.slice(r * res.cols, (r + 1) * res.cols).filter((f) => f.n));
      rowsF.forEach((fr, r) => {
        if (fr.length < 2) return;
        const feet = fr.map((f) => f.feet), cx = fr.map((f) => f.cx);
        const df = Math.max(...feet) - Math.min(...feet), dc = Math.max(...cx) - Math.min(...cx);
        if (df > it.fh * 0.08) issues.push(`row ${r}: feet line jumps ${df}px between frames`);
        if (dc > it.fw * 0.12) issues.push(`row ${r}: horizontal centre drifts ${dc.toFixed(0)}px`);
      });
    }
    const tag = issues.length ? "⚠" : "✓";
    if (issues.length) problems++;
    console.log(`${tag} ${it.key} (${res.W}×${res.H}${it.fw ? `, ${res.cols}×${res.rows} frames` : ""})${issues.length ? "\n    - " + [...new Set(issues)].slice(0, 8).join("\n    - ") : ""}`);
  }
  await browser.close();
  console.log(`\nReview sheets: ${out}  (${problems} asset(s) flagged)`);
  console.log("Now LOOK at the sheets with the visual-review checklist (anatomy connected, no gaps, outlines closed, readable size).");
  process.exit(problems ? 1 : 0);
})().catch((e) => { console.error("art-check failed:", e); process.exit(2); });
