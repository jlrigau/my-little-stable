---
name: ios-pwa-check
description: Check and fix the mobile / PWA layout of a game built on this engine on iPhone (safe areas, fullscreen, status bar, bottom panel, background, home-screen icon). Use for any iOS display problem: top/bottom band or margin, panel overflowing, home shortcut. Triggers: "it overflows on iPhone", "band at the top/bottom", "the panel takes too much room", "the icon name", "fullscreen".
---

# ios-pwa-check

Keep the iPhone layout clean (fullscreen, no band, safe areas).

## Points to respect
- **`index.html`**: `meta viewport ... viewport-fit=cover`, `theme-color`,
  `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`,
  `apple-mobile-web-app-title` (**short**, else truncated), `link rel="manifest"`,
  no-cache metas.
- **`manifest.webmanifest`**: `name`, short `short_name`, `display: standalone`,
  `background_color`, `theme_color`, `icons`: `icon-192.png` (any), `favicon.png` 512 (any),
  `icon-maskable.png` 512 (purpose `maskable`: subject inside the central 80 % — Android crops
  it to a circle/squircle) + `apple-touch-icon.png` 180. Never mark one file "any maskable".
  Render all of them from the art module's `icon(file, size, safe)` (one mascot drawing).
- **`engine.css`** (shared structure — safe areas, panel, HUD) / **`style.css`** (theme):
  - `html, body` fullscreen; **soft background** with no dark band
    (`background-attachment: fixed`).
  - `#screen-game { position: fixed; inset: 0; }` → covers the whole screen.
  - `.panel` (bottom) `position: fixed; bottom: 0` +
    `padding-bottom: calc(... + env(safe-area-inset-bottom))`, compact.
  - `.top-bar`: `padding-top: calc(... + env(safe-area-inset-top))` (notch).
  - `100dvh` (not just `vh`) for the screens.

## Bottom band on the home-screen app (iOS standalone bug)
Launched from the home screen with `black-translucent`, iOS reports a viewport **shorter
than the screen by the status-bar height** (59 pt on Dynamic Island phones) at launch:
`100dvh`, `position:fixed; inset:0` and `innerHeight` stop short → a plain band at the
bottom. iOS may then **correct it silently** (no resize event), so adding a measured gap
overshoots (tried: everything ended up shifted down). Safari tabs and Playwright never
show it. The engine's fix (don't regress): `html.ios-app` + `--app-h` = physical screen
height; full-screen layers are `top:0; height:var(--app-h)`; the `.panel` is `absolute`
inside `#screen-game`. Any NEW full-screen fixed layer must join that rule in engine.css.
Check with `node .claude/skills/_shared/ios-standalone-check.cjs [port]`: the launch (785),
corrected (844) and Safari runs must print identical values.

## Random shifts / bands (Safari and home-screen app)
- **Document scroll**: iOS scrolls the document behind fixed layers (rubber-band, input
  lifted above the keyboard) and leaves it scrolled → everything shifts, a band shows.
  The engine locks it (`body{position:fixed}`, `overscroll-behavior:none`) and snaps back
  to (0,0) on scroll / focusout / visualViewport resize / pageshow. Don't remove it.
- **Edge colour**: what iOS shows outside the layers (behind the floating toolbars, while
  the viewport settles) is the page background → `html[data-screen]` + `--edge-home` /
  `--edge-game` in the theme = the colours at the bottom of each screen.
- **Stale page**: GitHub Pages serves `index.html` with `max-age=600`; the `<meta
  no-cache>` tags don't change that. The engine fetches the live index (`no-store`) at
  start/foreground and reloads once if the build differs. Still: tell the tester to wait
  1–2 min after a deploy and check the build number on the home screen.
- `ios-standalone-check.cjs` also forces a scroll + input focus/blur → `shifted` must be
  `{scrollY:0, homeTop:0}`.

## Touch interactions (drag / scrub) on iOS
The close-up scrub and any finger-drag must survive Safari's touch quirks. The engine
already guards these (see ENGINE.md "iOS / touch robustness") — **don't regress them**:
- Targets the finger can delete are `pointer-events:none` and **hit-tested by geometry**;
  the pointer is captured on a **stable** element and **released** on up/cancel/close.
  (Capturing a removed element → iOS swallows every later touch = player "frozen".)
- `user-select:none` + `-webkit-touch-callout:none` + `-webkit-user-drag:none` +
  `touch-action:none` + a global `selectstart` `preventDefault` (skip inputs) → no blue
  selection hijacking touches.
- **Verify on the real Safari engine**, not Chromium:
  `playtest.cjs --engine webkit --device "iPhone 13" --probe ./touch.cjs` (see _shared/README).

## Home-screen icon
- `apple-touch-icon.png` = **180×180, full-bleed, no transparency** (iOS rounds the corners
  itself); a transparent/inset icon shows a small image on a white tile.
- iOS **freezes the icon at the moment it's added** to the home screen — a new deploy does
  **not** update an existing shortcut. To see a changed icon: delete the shortcut and re-add
  it from Safari. (The "Add to Home Screen" sheet preview is a small thumbnail — not the
  final size; judge from the actual home-screen icon.)

## Procedure
1. Reproduce in **screenshots** at iPhone size — prefer `--engine webkit --device "iPhone 13"`
   (true Safari + touch); else Playwright viewport ~390×844, `deviceScaleFactor: 2` via
   `playtest.cjs --shots` / a probe, then **Read** the PNGs.
2. Fix in `index.html` / `engine.css` (structural, generic) / `style.css` (theme) /
   `manifest.webmanifest` per the lists above.
3. **Re-test** visually (panel stuck to the bottom, no band, clean top) and, for any
   drag/scrub fix, **under WebKit**.
4. **iOS note**: a home-screen shortcut **freezes its name and icon** when added → to update
   either, delete and re-add it (tell the user).
5. **Publish**: **release-deploy** (bump `vN` — css/html changed).

## Guard-rails
- Test a **real phone template** (not just desktop).
- Don't reintroduce the bottom band: full-screen fixed layers use `html.ios-app` / `--app-h` (above).
- Don't reintroduce the "overflow band" (body background showing): `#screen-game` fixed
  + `.panel` fixed.
- Cache-busting is essential (else iOS keeps the old CSS).

## Chaining
**ios-pwa-check** → release-deploy.
