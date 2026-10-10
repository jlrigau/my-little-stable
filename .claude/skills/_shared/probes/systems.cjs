/*
 * systems — functional checks of the optional engine systems a game enables:
 * ride (+ rideSheet / hideRider / dirSheet facing), jump, station menus + restyle,
 * missions, chase, models, race, legacy save migration. Each block runs only when the
 * game's config has that system, so it is safe on any game.
 *
 *   OUT=/tmp/shots node .claude/skills/_shared/playtest.cjs --viewport 390x844 \
 *       --probe .claude/skills/_shared/probes/systems.cjs
 * Prints { errors:[…], <system>: {...} } and saves a screenshot per system in OUT.
 */
const { wait, shot } = require("./lib.cjs");

module.exports = async (page) => {
  const r = { errors: [] };
  const check = (ok, msg) => { if (!ok) r.errors.push(msg); };
  const has = await page.evaluate(() => ({
    ride: !!(GAME.creature && GAME.creature.ride), race: !!GAME.race, missions: !!GAME.missions, chase: !!GAME.chase,
    models: !!GAME.models, menu: (GAME.stations || []).some((s) => s.action === "menu"), legacy: !!(GAME.meta && GAME.meta.legacySave),
  }));
  r.has = has;
  await page.evaluate(() => { state.coins = 5000; refreshHud(); });

  // ---- ride: mount the first adult creature, move, check facing / rider, then jump ----
  if (has.ride) {
    const out = await page.evaluate(async () => {
      const c = state.creatures.find((x) => !isYoung(x)) || state.creatures[0];
      player.x = c.x - 60; player.y = c.y; activeTarget = c;
      const ride = GAME.creature.actions.find((a) => a.type === "ride");
      creatureAction(ride.id);
      const o = { mounted: mounted === c, riderVisible: playerSprite.visible, riderTex: playerSprite.texture.key };
      return o;
    });
    check(out.mounted, "ride: could not mount");
    for (const [k, dir] of [["ArrowRight", "right"], ["ArrowDown", "down"], ["ArrowLeft", "left"]]) {
      await page.keyboard.down(k); await wait(page, 450); await page.keyboard.up(k); await wait(page, 120);
      const f = await page.evaluate(() => ({ facing: playerFacing, mountFacing: mounted && mounted.facing, flip: mounted && mounted.bodyT.flipX }));
      out["after_" + dir] = f;
    }
    await shot(page, "sys-ride");
    const j = await page.evaluate(async () => {
      const before = state.stats.jump || 0, x0 = player.x, y0 = player.y;
      const jump = GAME.creature.actions.find((a) => a.type === "jump");
      if (jump) creatureAction(jump.id);
      await new Promise((res) => setTimeout(res, 800));
      return { jumped: (state.stats.jump || 0) > before || !jump, moved: Math.hypot(player.x - x0, player.y - y0) };
    });
    out.jump = j; check(j.jumped, "ride: jump did not count");
    r.ride = out;
  }

  // ---- race (mounted) ----
  if (has.race && has.ride) {
    const out = await page.evaluate(async () => {
      if (!mounted) return { skipped: "not mounted" };
      startRace();
      await new Promise((res) => setTimeout(res, 1200));
      return { on: R3.on, hud: !!document.querySelector("#race-hud:not(.hidden)"), pos: Math.round(R3.pos), time: R3.time };
    });
    await shot(page, "sys-race");
    // steer with a real pointer on the right half
    await page.mouse.move(330, 600); await page.mouse.down(); await wait(page, 500);
    const steer = await page.evaluate(() => R3.playerX); await page.mouse.up();
    out.steerRight = steer;
    check(out.on && out.hud && out.pos > 0, "race: did not start / advance");
    check(steer > 0, "race: steering right did not move the car right");
    const fin = await page.evaluate(async () => {
      const wins = state.stats[GAME.race.stat || "raceWin"] || 0, coins = state.coins;
      R3.pos = R3.finishZ - 10; await new Promise((res) => setTimeout(res, 300));
      return { off: !R3.on, won: (state.stats[GAME.race.stat || "raceWin"] || 0) === wins + 1, paid: state.coins - coins };
    });
    out.finish = fin; check(fin.off && fin.won, "race: finishing did not end + count a win");
    r.race = out;
  }
  await page.evaluate(() => { if (mounted) dismount(mounted, false); closeModal(); });

  // ---- station menu + restyle ----
  if (has.menu) {
    const out = await page.evaluate(async () => {
      const st = GAME.stations.find((s) => s.action === "menu");
      openStationMenu(st);
      const n = document.querySelectorAll("#modal-body .choice").length;
      const ri = (st.menu.items || []).findIndex((it) => it.do === "restyle");
      const o = { items: n };
      if (ri >= 0) {
        if (GAME.chase) addHeat(2);
        choicePick(ri);
        const opts = document.querySelectorAll("#modal-body .choice").length;
        const c = state.creatures.find((x) => x.id === state.lastRide) || state.creatures[0];
        const before = c.variant;
        const idx = choiceOpts.findIndex((x) => !x.disabled);
        choicePick(idx);
        o.restyle = { options: opts, changed: c.variant !== before, heat: state.heat };
      }
      closeModal();
      return o;
    });
    check(out.items > 0, "menu: no items");
    if (out.restyle) { check(out.restyle.changed, "restyle: variant unchanged"); }
    r.menu = out;
  }

  // ---- missions ----
  if (has.missions) {
    const out = await page.evaluate(async () => {
      state.mission = null; openMissions();
      const n = document.querySelectorAll("#modal-body .choice").length;
      choicePick(0);
      const m = state.mission && { x: state.mission.x, y: state.mission.y };
      return { offers: n, taken: !!m, m };
    });
    await wait(page, 400); await shot(page, "sys-mission");
    const done = await page.evaluate(async () => {
      const st = GAME.missions.stat || "missions", before = state.stats[st] || 0, coins = state.coins;
      player.x = state.mission.x; player.y = state.mission.y;
      await new Promise((res) => setTimeout(res, 300));
      return { cleared: !state.mission, counted: (state.stats[st] || 0) === before + 1, paid: state.coins - coins };
    });
    out.done = done;
    check(out.offers > 0 && out.taken, "missions: could not take one");
    check(done.cleared && done.counted && done.paid > 0, "missions: reaching the destination did not complete it");
    r.missions = out;
  }

  // ---- chase ----
  if (has.chase) {
    const out = await page.evaluate(async () => {
      clearHeat(); addHeat(2);
      await new Promise((res) => setTimeout(res, 600));
      const o = { units: chasers.length, chip: !document.getElementById("chip-heat").classList.contains("hidden") };
      // get caught: stand on a pursuer
      const coins = state.coins;
      const t0 = performance.now();
      while (state.heat > 0 && performance.now() - t0 < 6000) {
        const u = chasers[0]; if (u) { player.x = u.x; player.y = u.y; }
        await new Promise((res) => setTimeout(res, 100));
      }
      o.caught = state.heat === 0; o.fined = coins - state.coins; o.unitsAfter = chasers.length;
      return o;
    });
    await shot(page, "sys-chase");
    check(out.units > 0 && out.chip, "chase: no pursuers / no HUD chip");
    check(out.caught && out.unitsAfter === 0, "chase: getting caught did not end it");
    r.chase = out;
  }

  // ---- models ----
  if (has.models) {
    const out = await page.evaluate(async () => {
      state.capacity = Math.max(state.capacity, state.creatures.length + 2);
      openModels();
      const n = document.querySelectorAll("#modal-body .choice").length;
      const before = state.creatures.length;
      choicePick(0);
      const m = state.creatures[state.creatures.length - 1];
      const o = { items: n, bought: state.creatures.length === before + 1, model: m && m.model, speedMul: m && m.speedMul };
      openModels(); o.ownedDisabled = !!(choiceOpts[0] && choiceOpts[0].disabled); closeModal();
      return o;
    });
    await shot(page, "sys-models");
    check(out.bought && out.model && out.ownedDisabled, "models: buying failed or not marked owned");
    r.models = out;
  }

  // ---- legacy save migration ----
  if (has.legacy) {
    const out = await page.evaluate(() => {
      const L = GAME.meta.legacySave, key = [].concat(L.key)[0];
      const keep = localStorage.getItem(GAME.meta.saveKey);
      localStorage.removeItem(GAME.meta.saveKey);
      const had = localStorage.getItem(key);
      const ok = !!had;
      const s = ok ? load() : null;
      if (keep) localStorage.setItem(GAME.meta.saveKey, keep); else localStorage.removeItem(GAME.meta.saveKey);
      return { legacyPresent: ok, migrated: !!s, creatures: s && s.creatures ? s.creatures.length : 0 };
    });
    r.legacy = out;
  }
  return r;
};
