#!/usr/bin/env node
/*
 * SVG → PNG/JPEG renderer (headless Chromium via Playwright).
 * Turns vector art written as SVG strings into the sprites / spritesheets /
 * backdrops a game loads. Chromium renders gradients, blur filters (glows) and
 * anti-aliasing far better than hand-drawn Pillow primitives.
 *
 * Usage:
 *   node .claude/skills/_shared/render-svg.cjs tools/art/mygame.cjs [--only key1,key2] [--root .]
 *     → the module exports `jobs` (array) or a function returning one (sync/async):
 *       [{ file, width, height, svg, scale?, type?, quality? }, …]
 *         width/height = the LOGICAL size (the SVG's own coordinate space)
 *         scale        = output resolution multiplier (default 1). Render art at the size it
 *                        is DISPLAYED on a phone (DPR 2–3), or it will look blurry: e.g.
 *                        sprites ×2 (+ `res: 2` in GAME.assets), menu thumbnails ×3,
 *                        UI icons ×2, full-screen backdrops ×2.
 *         type         = "png" (default, transparent) | "webp" (transparent, 3–15× smaller —
                        the default choice for game art; Safari ≥ 14) | "jpeg" (opaque only)
 *   node .claude/skills/_shared/render-svg.cjs --svg in.svg --out out.png --w 256 --h 256 [--scale 2]
 *
 * `file` is resolved against --root (default: the current directory). Helpers to write
 * the SVGs: svg-kit.cjs.
 */
const path = require("node:path");
const fs = require("node:fs");

function loadPlaywright() {
  for (const c of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
    try { return require(c); } catch (_) { /* next */ }
  }
  throw new Error("Playwright not found (npm i -g playwright).");
}
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };

(async () => {
  let jobs = [];
  if (arg("--svg")) {
    jobs = [{ file: arg("--out", "out.png"), width: +arg("--w", 256), height: +arg("--h", 256), scale: +arg("--scale", 1), svg: fs.readFileSync(arg("--svg"), "utf8") }];
  } else {
    const mod = process.argv[2];
    if (!mod) { console.error("usage: render-svg.cjs <art-module.cjs> [--only a,b]"); process.exit(1); }
    let m = require(path.resolve(mod));
    m = m.jobs || m.default || m;
    jobs = typeof m === "function" ? await m() : m;
  }
  const only = arg("--only", "");
  if (only) { const keys = only.split(","); jobs = jobs.filter((j) => keys.some((k) => j.file.includes(k))); }
  const root = path.resolve(arg("--root", "."));

  const pw = loadPlaywright();
  const browser = await pw.chromium.launch({ args: ["--ignore-certificate-errors"] });
  const pages = {};
  const pageFor = async (s) => pages[s] || (pages[s] = await browser.newPage({ deviceScaleFactor: s }));
  for (const j of jobs) {
    // fractional scales: render the SVG bigger at DPR 1 (keeps exact output sizes)
    const s = j.scale || 1, whole = Number.isInteger(s);
    const page = await pageFor(whole ? s : 1);
    const vw = Math.ceil(j.width * (whole ? 1 : s)), vh = Math.ceil(j.height * (whole ? 1 : s));
    let svg = j.svg;
    // Trap: a filter (glow, blur) on a <line> or a purely horizontal/vertical path has a zero-size bbox, so the
    // default filter region is empty and the stroke silently disappears. Warn (use a thin rect or filterUnits).
    (svg.match(/<(?:path|line)\b[^>]*filter=[^>]*>/g) || []).forEach((el) => {
      const d = (el.match(/\sd="([^"]*)"/) || [])[1];
      const flat = /^<line/.test(el) ? /x1="([^"]*)"[^>]*x2="\1"|y1="([^"]*)"[^>]*y2="\2"/.test(el) : d && /^\s*M\s*[-\d.]+[ ,]+[-\d.]+\s*([HV]\s*[-\d.]+\s*)+$/i.test(d);
      if (flat) console.warn(`⚠ ${j.file}: filter on a zero-height/width ${/^<line/.test(el) ? "line" : "path"} renders NOTHING — use a thin <rect> or filterUnits="userSpaceOnUse": ${el.slice(0, 90)}…`);
    });
    if (!whole) svg = svg.replace(/<svg([^>]*?)\swidth="[^"]*"\s+height="[^"]*"/, `<svg$1 width="${vw}" height="${vh}"`);
    await page.setViewportSize({ width: vw, height: vh });
    await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}svg{display:block}</style></head><body>${svg}</body></html>`);
    const out = path.resolve(root, j.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const type = j.type || (/\.jpe?g$/i.test(j.file) ? "jpeg" : /\.webp$/i.test(j.file) ? "webp" : "png");
    if (type === "webp") {
      // WebP (with alpha) — encoded by Chromium's canvas; 3–15x smaller than PNG at q 0.9.
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: vw, height: vh }, type: "png", omitBackground: true });
      const conv = await browser.newPage();
      const b64 = await conv.evaluate(async ({ data, q }) => {
        const img = new Image(); img.src = "data:image/png;base64," + data; await img.decode();
        const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        return c.toDataURL("image/webp", q).split(",")[1];
      }, { data: png.toString("base64"), q: j.quality ? j.quality / 100 : 0.9 });
      await conv.close();
      fs.writeFileSync(out, Buffer.from(b64, "base64"));
    } else {
      const opts = { path: out, clip: { x: 0, y: 0, width: vw, height: vh }, type };
      if (type === "png") opts.omitBackground = true; else opts.quality = j.quality || 86;
      await page.screenshot(opts);
    }
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log("✓", path.relative(root, out), `${Math.round(j.width * s)}×${Math.round(j.height * s)}`, `(${kb} KB)`);
  }
  await browser.close();
})().catch((e) => { console.error("render-svg failed:", e); process.exit(2); });
