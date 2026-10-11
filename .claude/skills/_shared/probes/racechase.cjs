/*
 * racechase — the chase variant of the race (action.mode "chase", race.chase): the pursuer starts behind the
 * player and closes in, the gauge + distance show it, crashing gets you caught (results "caught"), a clean run to
 * the finish escapes (results "escaped", reward, chaseEscape stat). Both race modes coexist (two buttons).
 *   OUT=/tmp/rc node .claude/skills/_shared/playtest.cjs --engine webkit --device "iPhone 13" --port N \
 *       --probe .claude/skills/_shared/probes/racechase.cjs
 * LOOK at rc-start.png, rc-close.png (siren glow), rc-caught.png, rc-escaped.png.
 */
const { wait, shot } = require("./lib.cjs");

module.exports = async (page) => {
  const r = { errors: [] };
  const check = (ok, msg) => { if (!ok) r.errors.push(msg); };
  const act = await page.evaluate(() => { const a = (GAME.creature.actions || []).find((x) => x.type === "race" && x.mode === "chase"); return a && GAME.race && GAME.race.chase ? a.id : null; });
  if (!act) return { skipped: "no chase race", errors: [] };
  const start = () => page.evaluate((id) => {
    const RD = GAME.creature.ride || {};
    const c = state.creatures.find((q) => !isYoung(q)) || state.creatures[0]; c.age = 20; if (RD.fatigueNeed) c[RD.fatigueNeed] = 100;
    if (mounted !== c) { player.x = c.x - 60; player.y = c.y; activeTarget = c; creatureAction(GAME.creature.actions.find((a) => a.type === "ride").id); }
    activeTarget = c; refreshInteraction();
    const btns = [...document.querySelectorAll("#panel [data-creature]")].map((b) => b.dataset.creature);
    creatureAction(id);
    return btns;
  }, act);
  const btns = await start();
  const races = await page.evaluate(() => GAME.creature.actions.filter((a) => a.type === "race").map((a) => a.id));
  check(races.every((id) => btns.includes(id)), "every race mode needs its own button while riding: " + JSON.stringify({ btns, races }));
  await page.waitForFunction(() => R3.on && R3.chaser && R3.chaser.set, null, { timeout: 15000 });
  const s0 = await page.evaluate(() => ({ mode: R3.mode, behind: r3PlayerZ() - R3.chaser.z, gauge: !!document.getElementById("rh-chase"), rivals: R3.rivals.length }));
  await shot(page, "rc-start");
  check(s0.mode === "chase" && s0.behind > 0 && s0.gauge && s0.rivals === 0, "chase did not start with the pursuer behind + gauge: " + JSON.stringify(s0));
  await page.waitForFunction(() => R3.count <= 0, null, { timeout: 15000 });
  // crash on purpose: the player crawls, the pursuer must catch up
  await page.evaluate(() => { R3.maxSpeed = R3.baseMax * 0.2; R3.chaser.z = r3PlayerZ() - R3.segLen * 4; });
  await wait(page, 600); await shot(page, "rc-close");
  await page.waitForFunction(() => R3.caught > 0, null, { timeout: 30000 }); await wait(page, 500); await shot(page, "rc-caught-beat");
  await page.waitForFunction(() => !R3.on, null, { timeout: 30000 }); await wait(page, 700);
  const c1 = await page.evaluate(() => ({ modal: !document.getElementById("modal").classList.contains("hidden"), head: (document.querySelector(".rr-head") || {}).textContent || "", esc: state.stats.chaseEscape || 0 }));
  await shot(page, "rc-caught");
  check(c1.modal && c1.esc === 0, "being caught did not end the chase with a 'caught' result: " + JSON.stringify(c1));
  await page.evaluate(() => closeModal && closeModal());
  // clean run: put the player near the line, well ahead of the pursuer
  await start();
  await page.waitForFunction(() => R3.on && R3.chaser && R3.chaser.set && R3.count <= 0, null, { timeout: 20000 });
  const coins = await page.evaluate(() => state.coins);
  await page.evaluate(() => { R3.pos = R3.finishZ - (R3.carDepth || 0) - 5; R3.chaser.z = R3.pos - R3.segLen * 40; });
  await page.waitForFunction(() => !R3.on, null, { timeout: 15000 }); await wait(page, 700);
  const e = await page.evaluate(() => ({ modal: !document.getElementById("modal").classList.contains("hidden"), esc: state.stats.chaseEscape || 0, coins: state.coins }));
  await shot(page, "rc-escaped");
  check(e.modal && e.esc === 1 && e.coins > coins, "escaping did not give the escape result / reward / stat: " + JSON.stringify(e));
  Object.assign(r, { s0, c1, e });
  return r;
};
