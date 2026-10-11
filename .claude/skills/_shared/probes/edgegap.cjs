/*
 * edgegap — the player stops RIGHT AT the drawn edge of the band (hedges / bollards / trees / rocks): walking
 * towards it (on foot and riding) in the 4 directions, the gap between the player's feet and the first drawn
 * sprite in that direction must be small (<= GAP px) and the feet must never stand inside the drawing.
 *   [GAP=14] OUT=/tmp/x node .claude/skills/_shared/playtest.cjs --port 8099 --viewport 390x844 --probe .claude/skills/_shared/probes/edgegap.cjs
 * Regression for: "it stops much too early below the rocks / beside the bollards" (oversized wall boxes).
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
module.exports = async (page) => {
  if (!(await page.evaluate(() => typeof LOOP_SEG !== "undefined" && LOOP_SEG.length === 4))) return { skipped: "no trail loop", errors: [] };
  const GAP = +(process.env.GAP || 14), out = [];
  const runs = await page.evaluate(() => {
    const [T, B, L, R] = LOOP_SEG, W = WORLD.w, H = WORLD.h, xs = [0.33, 0.52, 0.71].map((f) => W * f), ys = [0.4, 0.6].map((f) => H * f);
    const far = (x) => !LOGS.some((l) => Math.abs(l.x - x) < 120);
    const r = [];
    for (const s of [T, B]) for (const x of xs.filter(far)) for (const key of ["ArrowUp", "ArrowDown"]) r.push({ x, y: s.y + s.h / 2, key });   // from the road, up/down
    for (const s of [L, R]) for (const y of ys) for (const key of ["ArrowLeft", "ArrowRight"]) r.push({ x: s.x + s.w / 2, y, key });            // from the road, sideways
    for (const x of xs.filter(far)) { r.push({ x, y: BAND + 140, key: "ArrowUp", play: 1 }); r.push({ x, y: H - BAND - 140, key: "ArrowDown", play: 1 }); }  // from the play area
    for (const y of ys) { r.push({ x: BAND + 140, y, key: "ArrowLeft", play: 1 }); r.push({ x: W - BAND - 140, y, key: "ArrowRight", play: 1 }); }
    return r;
  });
  for (const ride of [false, true]) {
    if (ride) await page.evaluate(() => { const c = state.creatures.find((q) => !isYoung(q)); player.x = c.x - 60; player.y = c.y; activeTarget = c; creatureAction(GAME.creature.actions.find((a) => a.type === "ride").id); if (mounted) mounted[GAME.creature.ride.fatigueNeed] = 100; });
    for (const g of runs) {
      const startOk = await page.evaluate((g) => { player.x = g.x; player.y = g.y; moveTarget = null; navPath = []; const hw = mounted ? NAV.hw : 15, hh = mounted ? NAV.hh : 10;
        return !COLLISIONS.some((m) => g.x + hw > m.x && g.x - hw < m.x + m.w && g.y + hh > m.y && g.y - hh < m.y + m.h); }, g);
      if (!startOk) continue;
      await page.keyboard.down(g.key); await sleep(1600); await page.keyboard.up(g.key); await sleep(80);
      out.push(await page.evaluate(([g, ride]) => {
        const f = GAME.environment.forest || {}, keys = [f.tree, f.bush], hw = mounted ? NAV.hw : 15, hh = mounted ? NAV.hh : 10, px = player.x, py = player.y;
        const solid = (k) => k === f.bush ? f.hedgeSolid !== false : !!f.treeBox;
        const boxes = sc.children.list.filter((o) => o.texture && keys.includes(o.texture.key) && solid(o.texture.key) && o.visible)
          .map((o) => drawnBox(o.texture.key, o.x, o.y, o.originX, o.originY, o.scaleX * RES(o.texture.key)));
        // gap from the player's body box to the first drawn sprite in the walking direction (overlapping on the other axis)
        let gap = Infinity, inside = false;
        boxes.forEach((b) => {
          const ovX = px + hw > b.x && px - hw < b.x + b.w, ovY = py + 4 > b.y && py - 4 < b.y + b.h;
          if (ovX && py > b.y + 6 && py < b.y + b.h - 2 && Math.abs(px - (b.x + b.w / 2)) < b.w * 0.3) inside = true;
          if (g.key === "ArrowDown" && ovX && b.y >= py - 2) gap = Math.min(gap, b.y - py);
          if (g.key === "ArrowUp" && ovX && b.y + b.h <= py + 2) gap = Math.min(gap, py - (b.y + b.h));
          if (g.key === "ArrowRight" && ovY && b.x >= px - 2) gap = Math.min(gap, b.x - (px + hw));
          if (g.key === "ArrowLeft" && ovY && b.x + b.w <= px + 2) gap = Math.min(gap, (px - hw) - (b.x + b.w));
        });
        // what actually stopped us: the nearest collision box in the walking direction. If it is NOT a band
        // sprite (a fence, a station, a barrier) or there is none (an opening), this run says nothing about the band.
        let block = Infinity;
        COLLISIONS.forEach((b) => {
          const ovX = px + hw > b.x && px - hw < b.x + b.w, ovY = py + hh > b.y && py - hh < b.y + b.h;
          if (g.key === "ArrowDown" && ovX && b.y >= py - 2) block = Math.min(block, b.y - py);
          if (g.key === "ArrowUp" && ovX && b.y + b.h <= py + 2) block = Math.min(block, py - (b.y + b.h));
          if (g.key === "ArrowRight" && ovY && b.x >= px - 2) block = Math.min(block, b.x - (px + hw));
          if (g.key === "ArrowLeft" && ovY && b.x + b.w <= px + 2) block = Math.min(block, (px - hw) - (b.x + b.w));
        });
        const relevant = gap !== Infinity && block < 24 && gap < 200 && gap - block <= 8;   // stopped by the band itself
        return { ride, key: g.key, from: g.play ? "play area" : "path", at: [Math.round(px), Math.round(py)], gap: relevant ? Math.round(gap) : null, inside };
      }, [g, ride]));
    }
  }
  const bad = out.filter((o) => o.inside || (o.gap != null && o.gap > GAP));
  return { n: out.length, gaps: out.map((o) => o.gap), bad, errors: bad.map((o) => `${o.ride ? "riding" : "on foot"} ${o.key} from the ${o.from}: ${o.inside ? "feet inside the drawing" : "stops " + o.gap + "px before the drawn edge"} at ${o.at}`) };
};
