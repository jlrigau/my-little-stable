/*
 * cuwide — close-up rotation check (closeup.wide): opens the first close-up action in
 * portrait, rotates to landscape and back. Asserts the backdrop swaps to the landscape
 * image and back, the spot count is unchanged, and every spot stays inside the visible
 * backdrop each time; then scrubs everything in landscape and checks the finish reveal.
 *   OUT=/tmp/cw node .claude/skills/_shared/playtest.cjs --engine webkit --device "iPhone 13" \
 *       --port N --probe .claude/skills/_shared/probes/cuwide.cjs
 * LOOK at cw-portrait.png / cw-landscape.png / cw-back.png / cw-finish.png: spots on the subject.
 */
const { wait, shot, scrubAll } = require("./lib.cjs");

module.exports = async (page) => {
  const r = { errors: [] };
  const check = (ok, msg) => { if (!ok) r.errors.push(msg); };
  const has = await page.evaluate(() => !!(GAME.creature && GAME.creature.actions.find((a) => a.type === "closeup" && a.closeup && a.closeup.wide)));
  if (!has) return { skipped: "no closeup action with closeup.wide", errors: [] };
  const vp = page.viewportSize();
  await page.evaluate(() => {
    const c = state.creatures.find((k) => !k.departing) || state.creatures[0];
    const a = GAME.creature.actions.find((x) => x.type === "closeup" && x.closeup.wide);
    activeTarget = c; player.x = c.x - 60; player.y = c.y;
    creatureAction(a.id);
  });
  await wait(page, 1500);
  const probe = () => page.evaluate(() => {
    const bg = document.getElementById("closeup-bg"), st = document.getElementById("closeup-stage").getBoundingClientRect();
    const spots = [...document.querySelectorAll(".cu-spot")].map((s) => { const b = s.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    return { open: closeupOpen, src: bg.src.split("/").pop(), mode: cuState && cuState.mode, n: spots.length,
             out: spots.filter((p) => p.x < st.left || p.x > st.right || p.y < st.top || p.y > st.bottom).length };
  });
  const p1 = await probe(); await shot(page, "cw-portrait");
  check(p1.open && p1.mode === "narrow" && !/_wide/.test(p1.src), "portrait did not use the portrait backdrop: " + JSON.stringify(p1));
  await page.setViewportSize({ width: vp.height, height: vp.width }); await wait(page, 900);
  const p2 = await probe(); await shot(page, "cw-landscape");
  check(p2.mode === "wide" && /_wide/.test(p2.src), "landscape did not swap to closeup.wide: " + JSON.stringify(p2));
  check(p2.n === p1.n && p2.out === 0, "spots lost or off-screen after rotating: " + JSON.stringify(p2));
  await page.setViewportSize(vp); await wait(page, 900);
  const p3 = await probe(); await shot(page, "cw-back");
  check(p3.mode === "narrow" && p3.src === p1.src && p3.n === p1.n && p3.out === 0, "rotating back failed: " + JSON.stringify(p3));
  await page.setViewportSize({ width: vp.height, height: vp.width }); await wait(page, 900);
  await scrubAll(page); await wait(page, 700);
  const fin = await page.evaluate(() => { const b2 = document.getElementById("closeup-bg2"); return { show: b2.classList.contains("show"), src: (b2.src || "").split("/").pop() }; });
  await shot(page, "cw-finish");
  check(fin.show && /_wide/.test(fin.src), "landscape finish did not reveal the wide 'done' backdrop: " + JSON.stringify(fin));
  await wait(page, 2500);
  r.closed = await page.evaluate(() => !closeupOpen);
  check(r.closed, "close-up did not close after finishing");
  await page.setViewportSize(vp);
  Object.assign(r, { p1, p2, p3, fin });
  return r;
};
