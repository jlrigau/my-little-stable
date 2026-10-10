/*
 * stress — monkey-test for "the player gets stuck / the world stops responding".
 * Plays randomly and fast (taps on the world, creatures, stations, panel actions,
 * close-up opened and closed at random moments — even during its zoom-in —, help modal,
 * double taps), and after every step asserts the WORLD STILL RESPONDS: a tap on a free
 * spot must make the player move. On a freeze it dumps the engine flags and a screenshot.
 *
 *   [STEPS=80] [SEED=1] OUT=/tmp/stress node .claude/skills/_shared/playtest.cjs \
 *       --engine webkit --device "iPhone 13" --probe .claude/skills/_shared/probes/stress.cjs
 * Use touch devices (WebKit iPhone profile): real phones send touch, not mouse.
 */
const { wait, shot, visibleCreature, scrubAll } = require("./lib.cjs");

module.exports = async (page) => {
  const r = { errors: [], steps: 0, actions: {}, stuck: [] };
  let seed = +(process.env.SEED || 1);
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const tap = async (x, y) => { try { await page.touchscreen.tap(x, y); } catch (_) { await page.mouse.click(x, y); } };
  const flags = () => page.evaluate(() => ({
    closeupOpen, nightRunning, zoomFx: typeof zoomFx !== "undefined" ? zoomFx : null,
    modal: !document.getElementById("modal").classList.contains("hidden"),
    cuHidden: document.getElementById("closeup").classList.contains("hidden"),
    input: sc && sc.input ? sc.input.enabled : null, manager: sc && sc.input && sc.input.manager ? sc.input.manager.enabled : null,
    zoom: +sc.cameras.main.zoom.toFixed(2), active: !!activeTarget, moveTarget: !!moveTarget, follow: !!followCreature,
    pending: typeof pendingInteract !== "undefined" ? !!pendingInteract : null, player: [Math.round(player.x), Math.round(player.y)],
    paused: sc.scene.isPaused ? sc.scene.isPaused() : null, loopRunning: sc.game.loop.running,
    jumpRunning, footHopping: typeof footHopping !== "undefined" ? footHopping : null, mounted: mounted ? mounted.name : null,
    race: typeof R3 !== "undefined" ? !!R3.on : null, placing: !!placingDecor, screen: document.documentElement.dataset.screen,
    raceDom: !!document.querySelector(".race3d:not(.hidden)"), stuck: player.stuck || 0, replans: player.replans || 0,
  }));
  // a free point on the canvas, ~110-170 px from the player, away from creatures
  const freePoint = () => page.evaluate((a) => {
    const W = innerWidth, H = innerHeight, p = worldToScreen(player.x, player.y);
    for (let k = 0; k < 40; k++) {
      const ang = a + k * 0.7, d = 110 + (k % 3) * 30, x = p.x + Math.cos(ang) * d, y = p.y + Math.sin(ang) * d;
      if (x < 30 || x > W - 30 || y < 160 || y > H - 200) continue;
      const el = document.elementFromPoint(x, y); if (!el || el.tagName !== "CANVAS") continue;
      const cam = sc.cameras.main, rc = sc.game.canvas.getBoundingClientRect(), z = cam.zoom / DPR;
      const w = { x: cam.worldView.x + (x - rc.left) / z, y: cam.worldView.y + (y - rc.top) / z };
      if (state.creatures.some((c) => Math.hypot(c.x - w.x, c.y - w.y) < 90)) continue;
      if (STATIONS.some((s) => Math.hypot(s.x - w.x, s.y - w.y) < 110)) continue;
      return { x, y };
    }
    return null;
  }, rnd() * 6.28);
  const responds = async () => {
    let f = await flags();
    // a race in progress is its own screen (taps steer, they don't walk): leave it with its quit button first
    if (f.race) { const q = await page.$("#rh-quit"); if (q) await q.click().catch(() => {}); await wait(page, 600); f = await flags(); if (f.race) return { ok: false, flags: f, why: "race could not be quit" }; }
    if (f.closeupOpen || f.modal || f.nightRunning) return { ok: true, skip: true };
    for (let tries = 0; tries < 2; tries++) {
      const pt = await freePoint(); if (!pt) return { ok: true, skip: "no free point" };
      const before = (await flags()).player;
      await tap(pt.x, pt.y); await wait(page, 900);
      const after = await flags();
      if (Math.hypot(after.player[0] - before[0], after.player[1] - before[1]) > 6 || after.moveTarget) return { ok: true };
    }
    return { ok: false, flags: await flags() };
  };
  const closeCloseupBtn = async () => { const b = await page.$("#closeup-close"); if (b) await b.click().catch(() => {}); };
  const ACTIONS = {
    tapWorld: async () => { const pt = await freePoint(); if (pt) await tap(pt.x, pt.y); await wait(page, 300 + rnd() * 900); },
    tapCreature: async () => { const t = await visibleCreature(page); if (t) await tap(t.x, t.y); await wait(page, 400 + rnd() * 1800); },
    panelAction: async () => {
      const t = await visibleCreature(page); if (t) await tap(t.x, t.y); await wait(page, 1600);
      const btns = await page.$$("#panel .act"); if (btns.length) await btns[Math.floor(rnd() * btns.length)].click().catch(() => {});
      await wait(page, 300 + rnd() * 900);
    },
    closeDuringZoom: async () => {
      const t = await visibleCreature(page); if (!t) return; await tap(t.x, t.y);
      for (let k = 0; k < 40; k++) { if (await page.evaluate(() => closeupOpen)) break; await wait(page, 60); }
      await wait(page, rnd() * 250); await closeCloseupBtn(); await wait(page, 200 + rnd() * 600);
    },
    doubleTaps: async () => { for (let k = 0; k < 4; k++) { const pt = await freePoint(); if (pt) await tap(pt.x, pt.y); await wait(page, 60 + rnd() * 120); } },
    station: async () => {
      const s = await page.evaluate((i) => { const st = STATIONS[Math.floor(i * STATIONS.length)]; if (!st) return null; const p = worldToScreen(st.x, st.y - 20); return p.y > 150 && p.y < innerHeight - 200 ? p : null; }, rnd());
      if (s) await tap(s.x, s.y); await wait(page, 1500);
      const btn = await page.$("#panel .act"); if (btn && rnd() < 0.6) await btn.click().catch(() => {}); await wait(page, 400 + rnd() * 2600);
    },
    help: async () => { const h = await page.$("#btn-help"); if (h) { await h.click().catch(() => {}); await wait(page, 400); } const c = await page.$("#btn-close-modal"); if (c) await c.click().catch(() => {}); await wait(page, 300); },
  };
  const names = Object.keys(ACTIONS), weights = [3, 3, 2, 2, 1, 1, 1];
  await page.waitForFunction(() => typeof sc !== "undefined" && sc && player, { timeout: 15000 });
  await wait(page, 1000);
  const N = +(process.env.STEPS || 80);
  for (let i = 0; i < N; i++) {
    // inside a close-up: scrub / close / wait, chosen at random
    if (await page.evaluate(() => closeupOpen)) {
      const x = rnd();
      if (x < 0.45) await scrubAll(page).catch(() => {});
      else if (x < 0.8) await closeCloseupBtn();
      await wait(page, 600 + rnd() * 2400);
      continue;
    }
    let k = rnd() * weights.reduce((a, b) => a + b), n = 0; while (k > weights[n]) { k -= weights[n]; n++; }
    const name = names[n]; r.actions[name] = (r.actions[name] || 0) + 1;
    await ACTIONS[name]().catch((e) => r.errors.push(name + ": " + e.message));
    r.steps++;
    const ok = await responds();
    if (!ok.ok) {
      r.stuck.push({ step: i, after: name, flags: ok.flags });
      await shot(page, "stuck-" + i);
      r.errors.push(`world stopped responding after "${name}" (step ${i})`);
      break;
    }
  }
  return r;
};
