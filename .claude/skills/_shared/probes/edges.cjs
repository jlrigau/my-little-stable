/*
 * edges — the edges of the trail loop (hedges / bollards) are a WALL: from the middle of the path, walk
 * perpendicular towards both edges on every side (on foot and riding); nobody may end up farther from the
 * path than the hedge band (a visible opening — e.g. a gap left in front of a station — is fine).
 *   OUT=/tmp/x node .claude/skills/_shared/playtest.cjs --port 8099 --viewport 390x844 --probe .claude/skills/_shared/probes/edges.cjs
 * Regression for: walking between the bollards / bushes on the vertical sides of the loop (gapless hedges).
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
module.exports = async (page) => {
  if (!(await page.evaluate(() => typeof LOOP_SEG !== "undefined" && LOOP_SEG.length === 4))) return { skipped: "no trail loop", errors: [] };
  const out = [];
  const runs = await page.evaluate(() => {
    const [T, B, L, R] = LOOP_SEG, W = WORLD.w, xs = [0.3, 0.45, 0.6].map((f) => W * f), ys = [0.35, 0.55].map((f) => WORLD.h * f);
    const avoid = (x) => !LOGS.some((l) => Math.abs(l.x - x) < 90);
    const r = [];
    for (const s of [T, B]) for (const x of xs.filter(avoid)) for (const key of ["ArrowUp", "ArrowDown"]) r.push({ x, y: s.y + s.h / 2, key });
    for (const s of [L, R]) for (const y of ys) for (const key of ["ArrowLeft", "ArrowRight"]) r.push({ x: s.x + s.w / 2, y, key });
    return r;
  });
  for (const ride of [false, true]) {
    if (ride) await page.evaluate(() => { const c = state.creatures.find((q) => !isYoung(q)); player.x = c.x - 60; player.y = c.y; activeTarget = c; creatureAction(GAME.creature.actions.find((a) => a.type === "ride").id); if (mounted) mounted[GAME.creature.ride.fatigueNeed] = 100; });
    for (const g of runs) {
      await page.evaluate((g) => { player.x = g.x; player.y = g.y; moveTarget = null; navPath = []; }, g);
      await page.keyboard.down(g.key); await sleep(1500); await page.keyboard.up(g.key); await sleep(100);
      out.push(await page.evaluate(([g, ride]) => {
        const f = GAME.environment.forest || {}, keys = [f.tree, f.bush];
        const hit = sc.children.list.filter((o) => o.texture && keys.includes(o.texture.key) && o.visible).filter((o) => {
          const w = o.displayWidth * 0.34, top = o.y - o.displayHeight * 0.75;
          return Math.abs(player.x - o.x) < w && player.y > top && player.y < o.y + 4;
        }).map((o) => o.texture.key);
        // past the edge wall? = farther from the path than the hedge band
        const segs = LOOP_SEG, d = Math.min(...segs.map((q) => Math.max(q.x - player.x, 0, player.x - (q.x + q.w)) + Math.max(q.y - player.y, 0, player.y - (q.y + q.h))));
        const lim = (f.hedgeMargin || 80) + (f.step || 44);
        // a VISIBLE opening is fine: did the walk cross a drawn hedge sprite on its way?
        const crossed = sc.children.list.some((o) => o.texture && o.texture.key === f.bush && o.visible && [0.2, 0.4, 0.6, 0.8].some((t) => {
          const x = g.x + (player.x - g.x) * t, y = g.y + (player.y - g.y) * t; return Math.abs(x - o.x) < o.displayWidth * 0.35 && y > o.y - o.displayHeight * 0.6 && y < o.y + 4; }));   // well inside the drawing (grazing an opening edge is fine)
        return { ride, key: g.key, from: [Math.round(g.x), Math.round(g.y)], at: [Math.round(player.x), Math.round(player.y)], inside: hit, out: Math.round(d), leak: d > lim && crossed };
      }, [g, ride]));
    }
  }
  const bad = out.filter((o) => o.leak);
  return { n: out.length, bad, errors: bad.map((o) => `${o.ride ? "riding" : "on foot"} ${o.key} from ${o.from}: went ${o.out}px past the edge, to ${o.at}`) };
};
