#!/usr/bin/env node
/*
 * Harnais de test/visualisation headless du jeu (Playwright).
 * Démarre une partie, prend des captures de zones, lance des vérifs, et
 * REMONTE les erreurs de page (pageerror / console.error). Code de sortie != 0
 * s'il y a une erreur de page (utile en CI / pour les skills).
 *
 * Portable : Node + Playwright + un serveur statique déjà lancé (voir serve.sh).
 * Réutilisé par les skills `test-debug` et `map-verify`.
 *
 * Exemples :
 *   node playtest.cjs --shots "spawn:560:860:0.9,paddock:1210:300:0.8"
 *   node playtest.cjs --walk --out /tmp/mce-shots
 *   node playtest.cjs --eval "etat.pieces"
 *   node playtest.cjs --probe ./mes-asserts.cjs      # module exportant async (page)=>obj
 *
 * Options :
 *   --port N        port du serveur statique (def. 8099)
 *   --out DIR       dossier des captures (def. /tmp/mce-shots)
 *   --shots LIST    "nom:x:y:zoom,..." captures centrées sur des points du monde
 *   --walk          vérifs de marchabilité du grand cross (couloirs + rondins)
 *   --eval EXPR     évalue une expression dans la page et l'affiche
 *   --probe FILE    module .cjs exportant async (page)=>résultat (assertions libres)
 *   --viewport WxH  taille de la fenêtre (def. 900x900)
 */
function loadPlaywright() {
  for (const c of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
    try { return require(c); } catch (_) { /* suivant */ }
  }
  throw new Error("Playwright introuvable. Installe-le (npm i -g playwright) ou ajuste le chemin.");
}

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const has = (name) => process.argv.includes(name);

(async () => {
  const { chromium } = loadPlaywright();
  const port = arg("--port", "8099");
  const out = arg("--out", "/tmp/mce-shots");
  const [vw, vh] = arg("--viewport", "900x900").split("x").map(Number);
  require("node:fs").mkdirSync(out, { recursive: true });

  const browser = await chromium.launch({ args: ["--ignore-certificate-errors"] });
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, ignoreHTTPSErrors: true });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  page.on("console", (m) => { if (m.type() === "error") pageErrors.push("console: " + m.text()); });

  const url = `http://localhost:${port}/index.html?cb=${Date.now()}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // --- Démarrer une nouvelle partie (flux accueil -> création -> jeu) ---
  await page.fill("#nom-haras", "Test");
  await page.click("#btn-commencer");
  await page.waitForTimeout(400);
  await page.click("#btn-creation-ok");
  await page.waitForFunction(
    () => typeof sc !== "undefined" && sc && typeof joueur !== "undefined" && joueur,
    { timeout: 15000 }
  );
  await page.waitForTimeout(800);

  const report = { shots: [], pageErrors: [] };

  // --- Captures de zones ---
  const shots = arg("--shots", "");
  if (shots) {
    for (const part of shots.split(",")) {
      const [name, x, y, z] = part.split(":");
      await page.evaluate(({ x, y, z }) => {
        const cam = sc.cameras.main;
        cam.stopFollow();
        cam.setZoom(parseFloat(z) || 0.85);
        cam.centerOn(parseFloat(x), parseFloat(y));
      }, { x, y, z });
      await page.waitForTimeout(220);
      const file = `${out}/${name}.png`;
      await page.screenshot({ path: file });
      report.shots.push(file);
    }
  }

  // --- Vérifs de marchabilité du grand cross ---
  if (has("--walk")) {
    report.walk = await page.evaluate(() => {
      const HX = 16, HY = 10;
      const hit = (x, y) => COLLISIONS.some((c) =>
        x + HX > c.x && x - HX < c.x + c.w && y + HY > c.y && y - HY < c.y + c.h);
      const line = (x0, y0, x1, y1, n) => {
        const bad = [];
        for (let i = 0; i <= n; i++) {
          const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
          if (hit(x, y)) bad.push([Math.round(x), Math.round(y)]);
        }
        return bad;
      };
      const lo = OUVERTURES[0], ro = OUVERTURES[1], top = LOOP_SEG[0];
      return {
        couloirGauche: line(lo.x + lo.w - 20, lo.y + lo.h / 2, 210, lo.y + lo.h / 2, 30),
        couloirDroit: line(ro.x + 20, ro.y + ro.h / 2, WORLD.w - 210, ro.y + ro.h / 2, 30),
        crossDessus: line(400, top.y + 24, 2400, top.y + 24, 60),
        crossDessous: line(400, top.y + top.h - 24, 2400, top.y + top.h - 24, 60),
      };
    });
  }

  // --- Évaluation libre ---
  const evalExpr = arg("--eval", "");
  if (evalExpr) {
    report.eval = await page.evaluate((e) => {
      try { return JSON.parse(JSON.stringify(eval(e))); } catch (err) { return "ERREUR eval: " + err.message; }
    }, evalExpr);
  }

  // --- Probe externe (assertions libres) ---
  const probe = arg("--probe", "");
  if (probe) {
    const fn = require(require("node:path").resolve(probe));
    report.probe = await (typeof fn === "function" ? fn : fn.default)(page);
  }

  report.pageErrors = pageErrors;
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  process.exit(pageErrors.length ? 1 : 0);
})().catch((e) => { console.error("ECHEC playtest:", e.message); process.exit(2); });
