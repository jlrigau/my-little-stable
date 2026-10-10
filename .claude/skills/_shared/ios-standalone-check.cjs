#!/usr/bin/env node
/*
 * ios-standalone-check — reproduces the iOS home-screen ("standalone") viewport bug in
 * WebKit and checks that the layout reaches the REAL bottom of the screen.
 *
 *   node .claude/skills/_shared/ios-standalone-check.cjs [port]   (serve.sh first)
 *
 * Bug: launched from the home screen with a black-translucent status bar, iOS reports a
 * viewport shorter than the screen by the status-bar height (59 pt on Dynamic Island
 * phones) → 100dvh / position:fixed inset:0 stop short and a plain band shows at the
 * bottom — and iOS may later correct the height WITHOUT a resize event (so measuring the
 * gap overshoots: everything shifted down). The engine pins full-screen layers to the
 * physical screen height (html.ios-app + --app-h).
 * Simulation: navigator.standalone + screen 390×844, viewport 785 (launch) and 844
 * (corrected), plus plain Safari. Every run must print the SAME values: layers end at
 * 844, sheet/panel at 844 minus their margin, and after a forced scroll + input
 * focus/blur `shifted` = { scrollY: 0, homeTop: 0, edge: "home" }.
 */
const pw = (() => { for (const c of ["playwright", "/opt/node22/lib/node_modules/playwright"]) { try { return require(c); } catch (_) {} } throw new Error("Playwright not found"); })();
(async () => {
  const port = process.argv[2] || 8099;
  const b = await pw.webkit.launch();
  // iOS launches the home-screen app with a viewport reported 59 pt short, then may
  // correct it silently: the layout must reach the screen bottom in BOTH states.
  for (const [mode, standalone, vh] of [["app-at-launch(785)", true, 785], ["app-corrected(844)", true, 844], ["safari", false, 844]]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: vh }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    if (standalone) await ctx.addInitScript(() => {
      Object.defineProperty(navigator, "standalone", { get: () => true });
      Object.defineProperty(screen, "height", { get: () => 844 }); Object.defineProperty(screen, "width", { get: () => 390 });
    });
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(`http://localhost:${port}/index.html`); await p.waitForTimeout(800);
    const r = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return Math.round(q.bottom); }, sel);
    // iOS leaves the document scrolled (rubber-band, input lifted above the keyboard):
    // force a scroll + input focus/blur, the engine must snap everything back.
    await p.evaluate(() => { const i = document.querySelector("input"); if (i) { i.focus(); i.blur(); } window.scrollTo(0, 120); });
    await p.waitForTimeout(500);
    const shifted = await p.evaluate(() => ({ scrollY: window.scrollY, homeTop: Math.round(document.getElementById("screen-home").getBoundingClientRect().top), edge: document.documentElement.dataset.screen }));
    const out = { mode, shifted, appH: await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--app-h")), home: await r("#screen-home"), sheet: await r(".home-sheet") };
    await p.evaluate(() => { const b = document.querySelector("#btn-new, .btn-giant"); b && b.click(); });
    await p.waitForTimeout(600);
    await p.evaluate(() => { const b = [...document.querySelectorAll("#screen-create .btn-giant, #screen-create .btn-primary")].pop(); b && b.click(); });
    await p.waitForTimeout(2500);
    Object.assign(out, { game: await r("#screen-game"), canvas: await r("#world canvas"), panel: await r(".panel:not(.hidden)"), errs });
    console.log(JSON.stringify(out));
    await ctx.close();
  }
  await b.close();
})();
