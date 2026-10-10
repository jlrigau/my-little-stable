/*
 * jitter — a ridden creature / vehicle must not shake or flip-flop on its way. Mounts the first
 * adult, then rides three tap-to-move trips (sideways, almost vertical, diagonal) at a fast speed
 * with the CPU throttled ×6 (≈15 fps, like a busy phone: big steps per frame). Fails if the
 * facing / mirror changes more than 4 times in a trip, or it stops short of the destination (stuck:
 * no longer advancing — a long detour that is still moving after 12 s counts as slow, not stuck).
 *   OUT=/tmp/x node .claude/skills/_shared/playtest.cjs --viewport 390x844 --probe .claude/skills/_shared/probes/jitter.cjs
 * Regression for: overshooting the waypoint at low fps, side-view mounts flipping on vertical
 * moves, 4-way vehicles flickering between rows on diagonals.
 */
module.exports = async (page) => {
  if (!(await page.evaluate(() => !!(GAME.creature && GAME.creature.ride)))) return { skipped: "no ride", errors: [] };
  try { const cdp = await page.context().newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 }); } catch (e) {}
  return page.evaluate(async () => {
    const R = GAME.creature.ride, c = state.creatures.find((x) => !isYoung(x)) || state.creatures[0];
    if (R.fatigueNeed) c[R.fatigueNeed] = 100; c.speedMul = 1.4;
    player.x = c.x - 60; player.y = c.y; activeTarget = c;
    creatureAction(GAME.creature.actions.find((a) => a.type === "ride").id);
    const res = [];
    for (const [dx, dy] of [[300, 4], [6, 320], [220, 230]]) {
      running = true; walkTo(player.x + dx, player.y + dy);
      const f = [], t0 = performance.now(); let frames = 0;
      await new Promise((ok) => { const g = () => { frames++; running = true; f.push([playerFacing, mounted && mounted.bodyT ? (mounted.bodyT.flipX ? 1 : 0) : 0, Math.round(player.x), Math.round(player.y)]); if (performance.now() - t0 < 12000 && (moveTarget || performance.now() - t0 < 300)) requestAnimationFrame(g); else ok(); }; g(); });   // a detour through a gate may take a while at 10 fps
      let flips = 0; for (let i = 1; i < f.length; i++) if (f[i][0] !== f[i - 1][0] || f[i][1] !== f[i - 1][1]) flips++;
      // not arrived but still clearly advancing at the end (a long gate detour at ~7 fps) = slow, not stuck
      const k = Math.floor(f.length * 0.75), adv = Math.hypot(f[f.length - 1][2] - f[k][2], f[f.length - 1][3] - f[k][3]);
      res.push({ fps: Math.round(frames / ((performance.now() - t0) / 1000)), flips, arrived: !moveTarget || adv > 40, stillMoving: !!moveTarget && adv > 40 });
    }
    return res;
  }).then((res) => ({ trips: res, errors: res.map((t, i) => [t, i]).filter(([t]) => t.flips > 4 || !t.arrived).map(([t, i]) => `trip ${i}: ${t.flips} flips, arrived=${t.arrived}`) }));
};
