/*
 * Shared helpers for playtest probes (node .claude/skills/_shared/playtest.cjs --probe <probe>).
 * Every probe is a module exporting async (page) => result. Screenshots go to $OUT
 * (or the harness --out dir passed through the OUT env var).
 */
const OUT = () => process.env.OUT || "/tmp/engine-shots";
const wait = (page, ms) => page.waitForTimeout(ms);
async function shot(page, name) { const f = `${OUT()}/${name}.png`; await page.screenshot({ path: f }); return f; }

// The creature (not leaving) whose on-screen position is safely inside the visible play
// area (below the HUD, above the panel), nearest to the screen centre. Falls back to
// walking the player next to the first creature and re-measuring.
async function visibleCreature(page) {
  const pick = () => page.evaluate(() => {
    const W = innerWidth, H = innerHeight, list = [];
    state.creatures.forEach((c, i) => {
      if (!c.obj || c.departing || c.leaving || c.arriving) return;
      const p = worldToScreen(c.x, c.y - 20);
      const el = document.elementFromPoint(p.x, p.y);
      if (p.x > 30 && p.x < W - 30 && p.y > 150 && p.y < H - 220 && el && el.tagName === "CANVAS") list.push({ i, x: p.x, y: p.y, d: Math.hypot(p.x - W / 2, p.y - H / 2), name: c.name });
    });
    list.sort((a, b) => a.d - b.d);
    return list[0] || null;
  });
  let t = await pick();
  if (!t) {
    await page.evaluate(() => { const c = state.creatures.find((k) => !k.departing); if (c) { player.x = c.x - 170; player.y = c.y + 10; sc.cameras.main.centerOn(player.x, player.y); } });
    await wait(page, 1500);
    t = await pick();
  }
  return t;
}
// Scrub every close-up spot with the brush TIP (accounts for closeup.brushTip).
async function scrubAll(page, { keepLast } = {}) {
  const off = await page.evaluate(() => { const br = document.getElementById("closeup-brush"); const t = (cuState && cuState.a.closeup.brushTip) || { x: .5, y: .5 }; return br && !br.classList.contains("hidden") ? { dx: (t.x - .5) * br.offsetWidth, dy: (t.y - .5) * br.offsetHeight } : { dx: 0, dy: 0 }; });
  const spots = await page.evaluate(() => [...document.querySelectorAll(".cu-spot")].map((s) => { const b = s.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }));
  const list = keepLast ? spots.slice(0, -1) : spots;
  const count = () => page.evaluate(() => document.querySelectorAll(".cu-spot").length);
  for (const s of list) {
    // rub until a spot is cleared here (overlapping spots: the top one goes first, keep going)
    const n0 = await count();
    await page.mouse.move(s.x - off.dx, s.y - off.dy); await page.mouse.down();
    for (let k = 0; k < 12; k++) {
      await page.mouse.move(s.x - off.dx + (k % 2 ? 9 : -9), s.y - off.dy, { steps: 2 }); await wait(page, 110);
      if (k >= 4 && (await count()) < n0) break;
    }
    await page.mouse.up();
  }
  // full clean: sweep whatever is left (e.g. a spot hidden under another one)
  if (!keepLast) for (let pass = 0; pass < 4 && (await count()) > 0; pass++) {
    const left = await page.evaluate(() => [...document.querySelectorAll(".cu-spot")].map((x) => { const b = x.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }));
    for (const s of left) {
      await page.mouse.move(s.x - off.dx, s.y - off.dy); await page.mouse.down();
      for (let k = 0; k < 6; k++) { await page.mouse.move(s.x - off.dx + (k % 2 ? 9 : -9), s.y - off.dy, { steps: 2 }); await wait(page, 110); }
      await page.mouse.up();
    }
  }
  return { total: spots.length, last: spots[spots.length - 1], off };
}
module.exports = { OUT, wait, shot, visibleCreature, scrubAll };
