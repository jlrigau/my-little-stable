# Adversarial fresh-eyes review (mandatory before showing new art / UI to the owner)

Why: the agent that made (or briefed) an asset is blind to its defects. The owner kept
finding them one by one (big rump, frog legs, feet too high, floating boots, "cat ears"),
which cost many round trips. An independent reviewer with NO prior context finds them
in one pass. The owner asked for this to be systematic.

## When
Every NEW or REDRAWN character, mount, vehicle, close-up backdrop, splash, app icon,
or visible UI redesign, BEFORE the result is shown to the owner or published.
Small recolours / pure position tweaks don't need it.

## How (the loop)
1. Render, run art-check, write a full-size sheet of every variant + a 1x in-game strip
   (real screenshots on the iPhone 13 profile).
2. Spawn a NEW agent (Agent tool, background, no shared context) with the prompt below.
   Never reuse the agent that drew the art, and never tell the reviewer what you think is wrong.
3. Triage its findings: apply what makes the art more believable/readable; DROP anything
   that contradicts an owner decision (list them in the prompt so the reviewer knows).
4. Send the kept fixes to the art agent, re-render, and run a NEW reviewer
   (fresh eyes again) until the verdict is ≥ 8/10 with no "reads wrong at game size" issue,
   or two rounds bring nothing new.
5. Only then show the owner, with a one-line summary of what the review caught.
   Big scope changes the review suggests (new engine feature, new art layers) — tell the owner
   in one line and proceed unless it reverses one of their decisions.

## Reviewer prompt template
```
You are a senior 2D game art director doing a FRESH-EYES, ADVERSARIAL critique. You have
not seen this art before. Game: <name>, for <audience/age>, style: <smooth cartoon vector,
soft outlines, gradients>. Context of use: <where/how it is seen, camera angle, on-screen size>.

Look (Read tool) at: <full-size sheet>, <zoom crops>, <in-game screenshots>.
Source: <function in tools/art/X.cjs> (read it to understand how it is built).
For style consistency compare with: <existing sheets of the same characters/objects>.

Owner decisions you must NOT propose to reverse: <list, e.g. "thighs hidden behind the rump
(diagonal thighs = rejected frog legs)", "no manga", "no emoji">.

Judge: anatomy / construction (connected, believable from THIS camera angle), proportions,
readability at the in-game size (what reads first?), style + palette consistency with the
rest of the game (same character = same look), appeal for the audience, anything that looks
like a mistake, a seam, a float, a clip.

Deliver: 1) verdict (believability /10, appeal /10); 2) ranked issues — what, where
(coordinates in the logical frame), why it reads oddly; 3) for each, a precise SVG-level fix
(shapes, positions, layer order). Do NOT edit files. Be critical; don't flatter.
```
