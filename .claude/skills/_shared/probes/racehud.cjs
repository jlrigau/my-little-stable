/*
 * racehud — the race HUD (time / distance / speed chips + quit) must stay on ONE row, chips must
 * not overlap, and each value must stay inside its pill, even with the longest values.
 * Regression for: the speed chip wrapping to a second row on iPhone ("102 km/h").
 *   OUT=/tmp/x node .claude/skills/_shared/playtest.cjs --engine webkit --device "iPhone 13" --probe .claude/skills/_shared/probes/racehud.cjs
 * Run on several widths: "iPhone 13" (390), "Galaxy S8" (360), "iPhone SE" (320).
 */
module.exports = async (page) => {
  const can = await page.evaluate(() => !!(GAME.race && GAME.creature && GAME.creature.ride));
  if (!can) return { skipped: "no race", errors: [] };
  await page.evaluate(async () => { const c = state.creatures.find((q) => !isYoung(q)); player.x = c.x - 60; player.y = c.y; activeTarget = c; creatureAction(GAME.creature.actions.find((a) => a.type === "ride").id); startRace(); });
  await new Promise((r) => setTimeout(r, 1500));
  const out = [];
  for (const [t, d, v] of [["9.9s", "9 m", "8 km/h"], ["58.8s", "4413 m", "210 km/h"], ["108.8s", "12345 m", "388 km/h"]]) {
    out.push(await page.evaluate(([t, d, v]) => {
      R3.on = false;    // freeze the HUD updates
      document.querySelector("#rh-time b").textContent = t; document.querySelector("#rh-dist b").textContent = d; document.querySelector("#rh-speed b").textContent = v;
      const r = (id) => document.getElementById(id).getBoundingClientRect();
      const ids = ["rh-time", "rh-dist", "rh-speed", "rh-quit"], b = ids.map(r);
      const spill = ids.slice(0, 3).some((id) => { const c = r(id), t = document.querySelector("#" + id + " b").getBoundingClientRect(); return t.right > c.right - 2 || t.left < c.left; });
      const oneRow = b.every((x) => Math.abs(x.top - b[0].top) < 12);
      const overlap = b.slice(0, -1).some((x, i) => x.right > b[i + 1].left + 1);
      return { vals: [t, d, v], oneRow, overlap, spill, fits: b[3].right <= innerWidth, w: b.map((x) => Math.round(x.width)) };
    }, [t, d, v]));
  }
  await page.screenshot({ path: process.env.OUT + "/racehud.png" });
  return { out, errors: out.filter((o) => !o.oneRow || o.overlap || !o.fits || o.spill).map((o) => "race HUD breaks with " + o.vals.join(" / ")) };
};
