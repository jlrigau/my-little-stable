/*
 * i18n — the game in its OTHER language (game.i18n.js): reloads with the saved language switched,
 * checks the home flag switch (one themed flag toggle top-left of home: on screen, >= 30 px, clear of title/tagline/buttons), that
 * <html lang> follows, then collects every visible text on the home screen, the HUD + panel, the
 * help and the goals modals: any text that is still a SOURCE string with a translation = a miss.
 * Also counts "" (untranslated) entries. Then switches back with the home toggle.
 *   OUT=/tmp/i18n node .claude/skills/_shared/playtest.cjs --engine webkit --device "iPhone 13" \
 *       --port N --probe .claude/skills/_shared/probes/i18n.cjs        [I18N_TO=fr]
 * LOOK at i18n-home.png, i18n-game.png, i18n-help.png (wording, overflowing labels).
 */
const { wait, shot } = require("./lib.cjs");

module.exports = async (page) => {
  const r = { errors: [] };
  const check = (ok, msg) => { if (!ok) r.errors.push(msg); };
  const info = await page.evaluate(() => ({ langs: LANGS, lang: LANG, src: SRC_LANG, key: LANG_KEY }));
  if (info.langs.length < 2) return { skipped: "no game.i18n.js translation", errors: [] };
  const to = process.env.I18N_TO || info.langs.find((l) => l !== info.lang);
  r.from = info.lang; r.to = to;
  await page.evaluate(({ key, to }) => localStorage.setItem(key, to), { key: info.key, to });
  await page.reload({ waitUntil: "networkidle" }); await wait(page, 500);

  const texts = () => page.evaluate(() => {
    const out = new Set();
    const vis = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0"; };
    document.querySelectorAll("body *").forEach((el) => {
      if (!vis(el) || ["SCRIPT", "STYLE", "CANVAS"].includes(el.tagName)) return;
      for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) out.add(n.textContent.trim());
      if (el.placeholder) out.add(el.placeholder.trim());
    });
    return [...out];
  });
  // a visible text is a miss when it equals (or contains, for long ones) a source key whose translation differs
  const misses = (list) => page.evaluate(({ list, to }) => {
    const D = (window.GAME_I18N || {})[to] || {};
    const src = Object.keys(D).filter((k) => D[k] && D[k] !== k).map((k) => [k, k.replace(/\{i:[\w-]+\}\s*/g, "").replace(/<[^>]+>/g, "").trim()]);
    return list.filter((t) => src.some(([k, plain]) => plain.length > 2 && (t === plain || (plain.length > 12 && !/\{\w+\}/.test(plain) && t.includes(plain)))));
  }, { list, to });

  const home = await page.evaluate(() => {
    const box = (id) => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, r: b.right, b: b.bottom }; };
    return { lang: document.documentElement.lang, sw: box("lang-switch"), tag: box("home-tagline"), title: box("home-title"), btn: box("btn-start"), vw: innerWidth, vh: innerHeight,
      flag: (() => { const f = document.getElementById("lang-switch"); return f ? f.getBoundingClientRect().height : 0; })(),
      ver: box("app-version"), ref: box("btn-refresh"),
      on: (document.querySelector("#lang-switch .on") || {}).dataset?.lang };
  });
  await shot(page, "i18n-home");
  check(home.lang === to, "<html lang> did not follow the saved language: " + JSON.stringify(home));
  check(home.sw && home.on === to, "home language switch missing or not showing the active language: " + JSON.stringify(home));
  if (home.sw) {
    check(home.sw.x >= 0 && home.sw.r <= home.vw && home.sw.b <= home.vh, "language switch off screen: " + JSON.stringify(home));
    const ov = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
    check(![home.tag, home.title, home.btn].some((b) => ov(home.sw, b)), "language toggle overlaps the title / tagline / buttons (LOOK at i18n-home.png for the logo art): " + JSON.stringify(home));
    check(home.flag >= 30, "language toggle too small to tap: " + home.flag);
  }
  const all = new Set(await texts());

  await page.evaluate(() => document.getElementById("btn-continue").click()); await wait(page, 600);   // it pulses: never "stable"
  if (await page.evaluate(() => !document.getElementById("screen-create").classList.contains("hidden"))) { await page.evaluate(() => document.getElementById("btn-create-ok").click()); await wait(page, 600); }
  await page.waitForFunction(() => typeof player !== "undefined" && player, null, { timeout: 15000 }); await wait(page, 900);
  (await texts()).forEach((t) => all.add(t)); await shot(page, "i18n-game");
  await page.evaluate(() => openHelp()); await wait(page, 400);
  (await texts()).forEach((t) => all.add(t)); await shot(page, "i18n-help");
  await page.evaluate(() => closeModal());
  if (await page.evaluate(() => { const b = document.getElementById("btn-goals"); return b && b.offsetParent !== null; })) {
    await page.click("#btn-goals"); await wait(page, 400); (await texts()).forEach((t) => all.add(t)); await shot(page, "i18n-goals");
    await page.evaluate(() => closeModal());
  }
  r.texts = all.size;
  r.missed = await misses([...all]);
  check(!r.missed.length, `source-language texts still on screen in "${to}": ` + JSON.stringify(r.missed.slice(0, 12)));
  r.untranslated = await page.evaluate((to) => { const D = (window.GAME_I18N || {})[to] || {}; return Object.keys(D).filter((k) => !D[k]).length; }, to);
  check(r.untranslated === 0, `${r.untranslated} dictionary entries are still "" (run i18n-extract.cjs --to ${to} --check)`);

  // switch back with the home toggle (real tap path)
  await page.evaluate(({ key, to }) => localStorage.setItem(key, to), { key: info.key, to });
  await page.reload({ waitUntil: "networkidle" }); await wait(page, 400);
  await page.click("#lang-switch");   // one toggle: tap = next language
  await page.waitForLoadState("networkidle"); await wait(page, 600);
  const back = await page.evaluate(() => document.documentElement.lang);
  check(back === info.lang, "tapping the home switch did not switch back: " + back);
  return r;
};
