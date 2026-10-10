/*
 * barriers — the jumpable barriers across the trail loop (environment.path.logs) must SEAL the path:
 *   1. riding, nobody gets past a barrier at any height across the path (only the Jump action clears it);
 *   2. the Jump action clears it;
 *   3. on foot, walking into it hops over (never walks THROUGH it) and tap-to-move reaches every
 *      section between barriers (no soft-lock).
 *   OUT=/tmp/x node .claude/skills/_shared/playtest.cjs --port 8099 --viewport 390x844 --probe .claude/skills/_shared/probes/barriers.cjs
 * Regression for: walking/riding past the rocks at the edge of the Star Ring (box shorter than the path).
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
module.exports = async (page) => {
  const has = await page.evaluate(() => typeof LOGS !== "undefined" && LOGS.length > 0 && !!(GAME.creature && GAME.creature.ride));
  if (!has) return { skipped: "no barriers / ride", errors: [] };
  const errors = [], r = {};
  const ys = await page.evaluate(() => { const s = LOOP_SEG[0], a = []; for (let y = s.y - SAND - 30; y <= s.y + s.h + SAND + 30; y += 18) a.push(y); return a; });
  const mount = () => page.evaluate(() => {
    if (!mounted) { const c = state.creatures.find((q) => !isYoung(q)); player.x = c.x - 60; player.y = c.y; activeTarget = c; creatureAction(GAME.creature.actions.find((a) => a.type === "ride").id); }
    if (mounted && GAME.creature.ride.fatigueNeed) mounted[GAME.creature.ride.fatigueNeed] = 100; return !!mounted;
  });
  // 1. riding: push right into the first barrier at every height
  if (!(await mount())) return { errors: ["could not mount"] };
  r.leaks = [];
  for (const y of ys) {
    await page.evaluate((y) => { player.x = LOGS[0].x - 110; player.y = y; moveTarget = null; navPath = []; }, y);
    await page.keyboard.down("ArrowRight"); await sleep(1100); await page.keyboard.up("ArrowRight");
    const x = await page.evaluate(() => player.x - LOGS[0].x);
    if (x > 30) r.leaks.push(y);
  }
  if (r.leaks.length) errors.push("riding past a barrier at y " + r.leaks.join(", "));
  // 2. the Jump action clears it
  r.jump = await page.evaluate(async () => {
    const s = LOOP_SEG[0]; player.x = LOGS[0].x - 70; player.y = s.y + s.h / 2; playerFacing = "right"; moveTarget = null; navPath = [];
    await new Promise((x) => setTimeout(x, 200)); doJump(); await new Promise((x) => setTimeout(x, 900));
    const ok = player.x > LOGS[0].x + 30; dismount(mounted); return ok;
  });
  if (!r.jump) errors.push("the Jump action did not clear the barrier");
  // 3. on foot: tap-to-move from each section of the path to the next one (crossing ONE barrier each time,
  //    from the corner road for the first) — every section is reachable, so nobody is ever stuck
  const legs = await page.evaluate(() => {
    const out = [], xs = [...new Set(LOGS.map((l) => l.x))].sort((a, c) => a - c), L = LOOP_SEG[2];
    for (const s of [LOOP_SEG[0], LOOP_SEG[1]]) {
      const y = s.y + s.h / 2, pts = [L.x + L.w / 2, ...xs.slice(0, -1).map((x, i) => (x + xs[i + 1]) / 2), (xs[xs.length - 1] + s.x + s.w) / 2];
      for (let i = 0; i + 1 < pts.length; i++) out.push({ from: { x: pts[i], y }, to: { x: pts[i + 1], y } });
    }
    return out; });
  r.sections = [];
  for (const g of legs) {
    const o = await page.evaluate(async (g) => {
      player.x = g.from.x; player.y = g.from.y; moveTarget = null; navPath = []; walkTo(g.to.x, g.to.y);
      const t0 = performance.now(); while (performance.now() - t0 < 20000 && (moveTarget || jumpRunning)) await new Promise((x) => setTimeout(x, 60));
      return { t: [Math.round(g.to.x), Math.round(g.to.y)], ok: Math.hypot(player.x - g.to.x, player.y - g.to.y) < 30 };
    }, g);
    r.sections.push(o); if (!o.ok) errors.push("on foot: could not reach the path section at " + o.t);
  }
  return { ...r, errors };
};
