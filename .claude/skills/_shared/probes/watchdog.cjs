/*
 * watchdog — checks the engine recovers when the world FREEZES on a phone (canvas no longer
 * drawn while the DOM still works — "the player won't move", only a reload helped):
 *   1. game loop put to sleep (app back from background, never woken) → woken, no reload
 *   2. world frozen for good → save + reload straight back into the game (state kept)
 *   3. WebGL context lost and never restored → same recovery
 *   4. normal play → no spurious reload
 *   OUT=/tmp/wd node .claude/skills/_shared/playtest.cjs --engine webkit --device "iPhone 13" \
 *       --probe .claude/skills/_shared/probes/watchdog.cjs
 */
const { wait } = require("./lib.cjs");
module.exports = async (page) => {
  const r = { errors: [] };
  const ready = () => page.waitForFunction(() => typeof sc !== "undefined" && sc && player && !document.getElementById("screen-game").classList.contains("hidden"), { timeout: 20000 });
  await ready(); await wait(page, 1000);
  const frame = () => page.evaluate(() => game.loop.frame);
  // 1. loop put to sleep (app back from background without wake) → woken, no reload
  await page.evaluate(() => { window.__mark = 1; game.loop.sleep(); });
  await wait(page, 2500);
  const f1 = await frame(); await wait(page, 500);
  r.sleepRecovered = (await frame()) > f1 && (await page.evaluate(() => window.__mark === 1));
  // 2. world permanently frozen (wake does nothing) → save + reload straight into the game
  await page.evaluate(() => { state.coins = 42; game.loop.wake = () => {}; game.loop.sleep(); });
  await page.waitForFunction(() => !window.__mark, { timeout: 15000 }).catch(() => {});
  await ready().catch(() => {}); await wait(page, 1500);
  r.frozenReloaded = await page.evaluate(() => ({ reloaded: !window.__mark, inGame: !document.getElementById("screen-game").classList.contains("hidden"), coins: state && state.coins, frames: game && game.loop.frame }));
  // 3. WebGL context lost and never restored → reload into the game
  await page.evaluate(() => { window.__mark = 3; const gl = game.renderer.gl; const ext = gl && gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext(); window.__lost = !!ext; });
  r.lostSupported = await page.evaluate(() => window.__lost);
  await page.waitForFunction(() => !window.__mark, { timeout: 15000 }).catch(() => {});
  await ready().catch(() => {}); await wait(page, 1500);
  r.lostReloaded = await page.evaluate(() => ({ reloaded: window.__mark !== 3, inGame: !document.getElementById("screen-game").classList.contains("hidden"), frames: game && game.loop.frame }));
  // 4. normal play for 8 s: no spurious reload
  await page.evaluate(() => { window.__mark = 4; });
  await wait(page, 8000);
  r.noSpuriousReload = await page.evaluate(() => window.__mark === 4);
  if (!r.sleepRecovered) r.errors.push("sleeping game loop not woken");
  if (!r.frozenReloaded.reloaded || !r.frozenReloaded.inGame || r.frozenReloaded.coins !== 42) r.errors.push("frozen world not recovered into the game with its state");
  if (r.lostSupported && (!r.lostReloaded.reloaded || !r.lostReloaded.inGame)) r.errors.push("lost WebGL context not recovered");
  if (!r.noSpuriousReload) r.errors.push("watchdog reloaded during normal play");
  return r;
};
