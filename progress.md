# Art pipeline progress

Original prompt: Rebuild Verdant Signal's animation pipeline around the adjacent game-art-pack-v0.3 archive, using real runtime PNGs and atlas frames without changing backend behavior.

## 2026-09-12

- Baseline captured: `npm test` passed 11/11.
- Archive unpacked read-only into a temporary directory; runtime assets copied explicitly from the pack into `public/assets/verdant-artpack/`.
- Inspected the pack manifest, README, missing-assets notes and transparent sprites/atlases.
- Replaced the duplicated frontend renderer with one `SpriteAtlasPlayer` + one `SceneAnimationLoop` pipeline.
- Added calibrated Aviator layer anchors, isolated Chicken/Apple/Football objects, mobile bounds and an `?art-debug=1` preview.
- Remaining work: run syntax checks, test suite, runtime asset HTTP checks and browser visual QA at the requested mobile sizes; then update the final report.

## 2026-09-13

- Ran readiness checks: `npm install` (up to date), `node --check public/app.js` (pass), `npm test` (11/11 pass).
- Started the server locally and confirmed `manifest.json` plus sample runtime PNGs (plane, Mines backdrop) return HTTP 200 from `/assets/verdant-artpack/`.
- Browser QA (Playwright, since the Chrome DevTools MCP browser lock and the Claude-in-Chrome extension were both unavailable in this environment) at 390x844 and 412x915:
  - Login and profile setup complete without layout issues.
  - Aviator: plane/mountain background/trail render on canvas; verified propeller, engine glow, smoke, crash and sparks atlases individually via the `?art-debug=1` calibration panel (all play correct frames). Live round auto-advances through its own internal timers (countdown/takeoff/flying/crash/ended) and its Start button is intentionally disabled mid-round; did not force through a full live crash cycle in this pass, relying on the debug panel for the crash/sparks atlas review.
  - Chicken Road: jump advanced the road to 1/5 with a visible safe checkmark; chick and van do not overlap text or touch zones.
  - Apple of Fortune: suggested whole-apple tile highlighted correctly on the closed wooden board; apple-danger (bitten) sprite confirmed via the debug panel.
  - Football Penalties: ran a demo kick, reached a "Save" result state; generic green-kit keeper is not attributed to a real player.
  - Mines: canonical 5x5 approved scene backdrop renders with DOM cell buttons overlaid (~47x47px touch targets); note the backdrop image itself has baked-in Russian text ("Сделайте ставку") regardless of selected UI language, since it's part of the source art, not app copy.
  - Switched to Russian locale on Overview at 412x915: no horizontal overflow, layout intact.
- `prefers-reduced-motion` handling was verified by code inspection only (public/app.js:91 gates the animation loop on `matchMedia('(prefers-reduced-motion: reduce)')`); this session's browser tooling could not emulate the media feature to confirm visually.
- Remaining limitations (unchanged from the pack): Chicken chick, traffic van, mountain layer and goalkeeper are original/reconstructed art rather than verified matches to any named reference; only the five Aviator sequences are true atlas animations, other games use calibrated transforms on stills; Mines has no isolated tile/crystal/mine exports so it relies on the single approved scene backdrop.

## 2026-09-13 (rebuild pass, full brief)

Full audit against the extracted art pack, all 8 usable style/reference screenshots, and the running app found three real state-machine deadlocks (not just miscalibration) plus several anti-slop violations. Fixed all of them; see chat for the full anchor/z-index correspondence table.

- **Bug fixes (state machine):**
  - Aviator "Start demo round" was permanently disabled on first entry — the disabled condition checked `phase not in [ended, crash]`, but the initial phase is `ready`, which fell into that set. Round could never be started from a fresh game screen. Fixed to disable only during `countdown/takeoff/flying`.
  - Football "Next demo round" had the identical bug: disabled whenever `phase !== 'ready'`, which is also true for the terminal `goal/save/miss` states where the button must be clickable. Fixed to disable only during `kick/reaction`.
  - Mines: hitting a mine set `phase: 'mine'`, but `phaseLabel()`'s phase→i18n-key map had no `mine` entry, so the status badge silently fell back to "Ready" right after a loss. Added `mine → cellMine`.
- **Aviator:** re-anchored `engineGlow` from the tail (wrong) to the nose/engine cowling (right, drawn behind the body); confined the flight path to the left ~58% of the canvas and moved the multiplier HUD into a dedicated right-side panel so it can never sit on the plane, trail or crash VFX at any progress value; added a `?art-debug=1` overlay on the live canvas itself (bounding box, direction arrow, pivot/anchor dots, z-order legend), not just the isolated preview panel.
- **Chicken Road:** the first jump's start→tile-1 anchor delta was 0.072 while every later jump was ~0.19 — visually read as "no movement". Recomputed all six anchors from the real 5-column grid geometry; first jump is now a normal, visible hop. Moved the van anchor off tile 5's anchor point.
- **Mines:** replaced the CSS-only rotated-square/radial-burst "icons" with two purpose-built SVG assets (`public/assets/generated/mines-diamond.svg`, `mines-bomb.svg` — faceted gem with glow; bomb body + fuse + spark + explosion flash) since the pack has no isolated crystal/mine exports. Added a mask plate over the backdrop's baked-in "place your bet" banner that only appears once a round is under way, so it never covers live cells.
- **Football:** the ball was a literal `●` text glyph in a plain circle div. Replaced with a purpose-built stitched-panel SVG (`public/assets/generated/football-ball.svg`).
- **Touch targets:** Mines cells measured ~39px and Apple cells ~38px wide at the 320px floor — under the 44px minimum. Grew the real hit box on both via an absolutely-positioned `::before`/`::after` with a negative inset (pointer events on a pseudo-element register on its host element), without resizing the visible art or breaking alignment with the painted backdrop.
- **Verification:** `npm install`, `node --check` on every `public/*.js`, `npm test` (11/11) all pass after every edit round. Playwright QA (Chrome DevTools MCP and the Claude-in-Chrome extension were both unavailable again this session) re-confirmed, with real `.click()` calls (not direct function calls): Aviator start→countdown→takeoff→flying→crash→ended→restart cycle end-to-end at 390×844; Mines safe-cell→diamond and mine-cell→bomb with the seeded (deterministic per player+day) `recommendedCells`, plus reset and repeat; Chicken first-jump movement; Apple single-cell flip; Football kick→save and a reset. No horizontal overflow at 320/360/390/412/768/1440px.
- `prefers-reduced-motion` remains verified by code inspection only (this session's tooling still can't emulate the media feature); the gating logic itself is unchanged from the prior pass.

## 2026-09-14 (animation handoff)

- Built `game-animations-ready/` from the supplied `game-art-pack-v0.3.zip` without changing application code or replacing source assets.
- Generated 35 fixed-size animation clips / 304 RGBA PNG frames across Aviator, Chicken, AppleFortune, Mines and FootballPenalties, with horizontal sheets, per-clip preview strips, five game contact sheets and `preview/index.html`.
- Added `manifest.json` and `ANIMATION_HANDOFF.md` with frame order, FPS, loop, normalized pivots, state transitions, source mappings and documented generated elements.
- Verified every manifest frame and sheet exists with expected dimensions and RGBA channels; ZIP contains 384 files under one `game-animations-ready/` root.
- Known source gaps are explicit: no kicker/ball models, no isolated Mines gem/mine exports, and only one generic goalkeeper concept. Neutral generated additions are listed in the handoff rather than represented as original art.

## 2026-09-14 (runtime integration)

- Copied the verified animation package to `public/assets/game-animations-ready/` so Express serves the manifest, sheets, frames and previews at `/assets/game-animations-ready/`.
- Added manifest loading and a shared timing/sprite-sheet renderer to `public/app.js`; the existing source-art/atlas renderer remains the fallback and `?art-debug=1` keeps the calibration view available.
- Wired production clips to live game phases: Aviator idle/takeoff/flight/crash/dissipate; Chicken idle/jump/success/fail; Apple selection/safe/loss reveal; Mines gem/mine opening; Football ball flight, goalkeeper saves and goal/miss outcomes.
- Added canvas layers and mobile-safe CSS without changing server contracts or application layout. UI text and numeric readouts remain DOM-owned; animation frames contain no gameplay text or coefficients.
- Verification: `node --check public/app.js` passed; `npm test` passed 11/11; `/api/health` and `/assets/game-animations-ready/manifest.json` returned HTTP 200; Chrome QA exercised all five scenes with real clicks, intermediate phases and rendered screenshots; browser console had no errors.
- The bundled develop-web-game Playwright client was attempted but its module resolves from the skill directory, while the project dependency is local; equivalent live browser verification was completed through the connected Chrome tab. No application package or lockfile change was made for that tooling attempt.

## 2026-09-15 (artpack resync)

- Confirmed the uploaded root folder is `game-animations-ready` (hyphenated name), with 443 files, 35 clips, `SourceArt`, per-clip metadata and package validator.
- Ran the supplied validator: 35 clips checked, 0 errors.
- Resynced the complete root package into `public/assets/game-animations-ready/`; served manifest SHA-256 now matches the root package (`AEC2D652B69227B6CED1425FA0C88D018630331300980E028882230E36E88181`).
- Verified HTTP 200 for representative sheets from all five games. Runtime integration continues to resolve the package through `/assets/game-animations-ready/manifest.json`.

## 2026-09-15 (Aviator rig hand-off stabilization)

- Fixed the visible Aviator hand-off that could make a plane appear to jump when `round-launch` changed to `flight-loop`.
- Flattened aircraft frames are now alpha-bound aligned to the same normalized flight-path anchor, so the body, nose, propeller and exhaust travel as one authored composite instead of being independently placed.
- Added 160 ms idle-to-launch and 180 ms launch-to-flight crossfades. The launch clip is held on its authored final frame during the second blend, preventing a first-flight-frame position pop.
- Re-verified Chrome flow with real clicks: `countdown → takeoff → flying → crash → ended → restart`; captured a live flying frame with the aircraft and propeller attached. Chicken jump, Apple opening, Mines cell opening and Football save also passed after the change.
- Final checks: `node --check public/app.js`, `npm test` 11/11, supplied animation validator 35 clips / 0 errors, HTTP 200 for health, manifest and representative animation sheets, browser console 0 errors/warnings.

## 2026-09-15 (Aviator single-motion rig correction)

- Reviewed the supplied screen recording frame-by-frame. The failure was real: the flattened flight composite carried its own internal translation while the scene also moved it along a path, creating the observed circular/jittering motion; the propeller could not be guaranteed to share that composite's pivot.
- Disabled the flattened Aviator composite for scene playback and switched the live rig to the package `SourceArt` plane body plus the package propeller atlas. The scene now owns one monotonic straight-line trajectory; the body and propeller are drawn from the same `planeCenter` and rotation on every frame.
- Removed the known purple stray frame from the crash atlas playback by ending the runtime sequence on authored smoke frame 7, then handing off to the after-crash smoke layer.
- Fresh headless Chrome QA captured ready, flying and crash states; observed phases were `countdown → takeoff → flying → crash → ended`, with no page errors apart from the expected unauthenticated activity request during session bootstrap. `node --check public/app.js` and `npm test` 11/11 pass.

## 2026-09-15 (Aviator countdown and visual cleanup)

- Removed the animated trail, smoke and engine-glow layers from live Aviator takeoff/flight. The coefficient line remains the only flight-line animation; crash still renders its local explosion and sparks at the last aircraft position.
- Increased the propeller render scale from `0.34` to `0.50` while keeping the shared nose anchor and aircraft rotation, so the propeller stays attached instead of being independently placed.
- Reworked the round countdown to render `7 → 6 → 5 → 4 → 3 → 2 → 1 → 0` at one-second intervals before takeoff; nullish countdown rendering preserves the visible `0` state.
- Browser QA with a fresh profile confirmed all countdown values and phases `countdown → takeoff → flying → crash → ended`; screenshots reviewed for countdown 7, countdown 0, clean flight and crash. The only console error was the expected unauthenticated activity request during bootstrap.
- Final checks: `node --check public/app.js`, `npm test` (11/11), `/api/health` 200 and animation manifest 200.

## 2026-09-15 (Aviator side propeller and countdown stability)

- Replaced the live front-facing propeller atlas with a separate generated side-profile propeller at `public/assets/generated/aviator-propeller-side.png`; the source artpack files remain unchanged. The generated PNG was converted to real RGBA transparency after removing its baked checkerboard background.
- Reduced the aircraft render width from the previous mobile scale to `22vw` / `148px` max and moved the monotonic path start from `14%` to `8%` of the Aviator canvas width.
- Increased the side propeller draw size to `1.16x` aircraft width and animated it with edge-on squash timing so it reads as a propeller mounted on a side-profile aircraft.
- Crash VFX now exists only during `crash`; the `ended` state clears the aircraft, propeller, explosion, sparks and after-smoke instead of leaving the final explosion visible.
- Countdown ticks now update only runtime DOM/canvas state, preventing full-page render flicker. Fresh browser QA confirmed `7 → 6 → 5 → 4 → 3 → 2 → 1 → 0`, `countdown → takeoff → flying → crash → ended`, clean flight/crash/end screenshots, and no runtime page errors beyond the expected bootstrap 401 activity request.

## 2026-09-15 (Aviator propeller axis and explicit countdown)

- Corrected the side-profile propeller motion axis: the edge-on spin now changes the vertical projection (`scaleY`) instead of compressing along the aircraft's horizontal flight axis (`scaleX`).
- Reduced the side propeller draw size from `1.16x` to `0.78x` aircraft width so its visual diameter is proportional to the smaller aircraft body while remaining clearly attached to the nose.
- Added a dedicated countdown card with a large live number and `7 → 0` range label; it is visible only during countdown and hidden once takeoff begins.
- Fresh browser QA confirmed countdown values `7…0`, hero visibility during countdown, `endedHeroVisible=false`, full runtime phases, no white background on the generated RGBA propeller, and no runtime page errors beyond the expected bootstrap 401 activity request.

## 2026-09-15 (Aviator unified aircraft and reference countdown)

- Baked the plane body and generated side-profile propeller into one transparent `aviator-aircraft-composite.png`; live playback now applies one image, one pivot and one transform, with no independent propeller rotation or anchor drift.
- Replaced the large countdown card with a canvas spinner based on the supplied references: fixed white center ball, seven rounded markers scrolling around it, final marker orange, and current countdown number visible inside the mobile canvas.
- Moved the coefficient trace origin to the exact canvas bottom-left `(0, height)` while keeping the aircraft start position left-biased at `8%` width.
- Fresh browser QA reviewed countdown 7/0, composite aircraft flight and ended state. Confirmed `7…0`, `countdown → takeoff → flying → crash → ended`, and no crash VFX after ending. `npm test` remains 11/11; runtime console only reports the expected bootstrap activity 401.

## 2026-09-15 (Aviator exact user aircraft and 8-second countdown)

- Copied the exact supplied RGBA PNG `codex-clipboard-06cbb74e-c4e0-48e2-b993-a7a554960694.png` into `public/assets/generated/aviator-aircraft-user.png` without cropping, recoloring or resampling; its integrated propeller is rendered as part of the same image.
- Live Aviator now uses only this unified aircraft image with one position, one scale and one rotation. The previously generated composite and separate propeller are no longer referenced by the scene.
- The reference countdown now has eight compact rounded markers on a right-side arc, a fixed white ball, a rolling marker motion and an orange eighth marker. The `7 → 0` sequence advances once per second and holds the final `0`/orange slot for one second before takeoff, for an 8-second preflight.
- The coefficient trace continues to originate at the exact canvas bottom-left; the canvas background, grid, mountain layer and existing HUD layout remain unchanged.
- Browser QA at 390×844 confirmed `7,6,5,4,3,2,1,0`, all runtime phases, the unified aircraft flight frame and a clean ended frame. `node --check public/app.js`, `npm test` (11/11) and `/api/health` (200) pass. The only console error is the existing unauthenticated bootstrap activity request (401).

## 2026-09-15 (Aviator replacement aircraft background cleanup)

- Replaced the previous Aviator aircraft source with the newly supplied `codex-clipboard-7f40bc4a-dd7a-485d-99e1-7b69542abaf6.png`.
- Removed only the checkerboard background by generating alpha transparency locally; the aircraft RGB pixels, silhouette, propeller, proportions and framing remain unchanged. The transparent production file is `public/assets/generated/aviator-aircraft-user.png`.
- The built-in image edit was inspected but retained the checkerboard, so it was not used in the project. No generated redraw or alternate aircraft is connected.
- Final browser QA at 390×844 confirmed the new asset is requested by the canvas runtime, countdown `7…0`, phases `countdown → takeoff → flying → crash → ended`, no page errors, and clean flight/ended frames.

## 2026-09-15 (Aviator corner countdown and hidden preflight aircraft)

- Hid the aircraft completely while `phase === 'countdown'`; it becomes visible only after the final `0` slot and keeps the existing unified user asset.
- Changed the aircraft trajectory to monotonic eased travel with a smooth lift curve; there is no circular/orbiting motion or second position owner.
- Moved the countdown to the lower-right corner as a compact visible semicircle. The eight markers remain in order with the eighth orange, and the white ball interpolates from one marker to the next once per second.
- Final browser QA at 390×844 confirmed no aircraft in the countdown frame, visible corner ball/semicircle, `7,6,5,4,3,2,1,0`, phases `countdown → takeoff → flying → crash → ended`, no page errors, and clean flight/ended frames.

## 2026-09-19 (signal-only mechanics repair)

- Replaced the current remote game iframe mounts with the existing local art/animation scenes. The remote surfaces had been made non-interactive with `pointer-events: none`, so their controls could not satisfy the local signal-only contract.
- Aviator now has a local instruction overlay with a working close button and reopen button. Its existing canvas countdown and flight animation remain the runtime owner.
- Chicken Road no longer exposes a manual jump action as the primary flow. `Get signal` requests the model result, picks a random available signal step, and starts the chicken jump automatically.
- Mines now uses the existing approved scene and clickable overlay cells. The right-side field-size and mine-count selectors remain the only setup controls; requesting a signal starts the local round without any bet UI.
- Football Penalties now uses the local goal-zone controls and the existing role selector. Striker and goalkeeper paths both remain playable through the same local animation loop.
- Apple of Fortune was not changed.
- Next: run syntax/tests, launch localhost, and browser-check the Aviator close button, Chicken auto-jump, Mines cell opening after signal and Football role/zone flows at desktop and narrow mobile sizes.

## 2026-09-19 (temporary external embed experiment, reverted)

- A short-lived attempt reinstated third-party visual embeds to mirror the supplied screenshots. In the local browser those embeds produced black screens, so this path was reverted and is not part of the current runtime.
- The iframe preservation and visual overlay approach was also removed; the browser checks below the current section are the authoritative checks for the local scenes.

## 2026-09-19 (local game scenes restored)

- Removed the temporary third-party iframe layer. It was the source of the black game screens and could not be relied on for the supplied local game experience.
- Restored the existing local Aviator, Chicken Road, Mines, and Football scenes so the supplied art, models, and animations remain the rendered runtime.
- Removed the stale iframe/overlay CSS and iframe-preservation path. Signal-only controls now operate against the local scenes: Chicken signal animates the chicken jump, Mines uses the local grid and mine-count control, and Football uses the local role/zone flow.
- Apple of Fortune remains untouched.
- Added a cache-busting version to the app stylesheet and script tags so an already-open localhost tab loads this visual/mechanics build after a normal refresh.

## 2026-09-19 (reference skins and final signal QA)

- Replaced the obsolete green/local presentation behind Aviator, Chicken Road, Mines, and Football with local copies of the supplied Betwinner reference compositions in `public/assets/reference-games/`; no third-party game iframe or betting control is used.
- Aviator now keeps the dark AviaShow-style chart layer while the new atlas aircraft remains the only animated flight layer; the instruction `×` closes correctly and `Get signal` starts countdown/flight.
- Chicken Road keeps the dark road composition and moves the new chick animation to the randomly selected signal step; Mines keeps the blue-metal board with the right-side field-size/mine-count controls and signal-highlighted cells.
- Football now shows the supplied player/role reference composition, keeps the generic keeper animation, preserves the selected Striker/Goalkeeper role through analysis, and starts kick/save/goal animation from `Get signal`.
- Browser QA confirmed the four active games render, signals change runtime state, and the visible game copy is signal-only with no stake controls. Apple of Fortune remains untouched.

## 2026-09-19 (signal-driven round flow)

- Kept the local reference scenes as the active render path; the browser now reports zero game iframes and renders the Aviator, Chicken Road, Mines, and Football stages locally with their existing art and animation layers.
- Added a real 2.3-second signal wait before every active game starts its animation. Chicken now follows the server-selected safe route one jump at a time, Mines opens the recommended safe cells sequentially, Football starts the selected striker/goalkeeper flow automatically, and Aviator flies to the generated target multiplier.
- Added weighted server sampling so ordinary low coefficients and short safe routes are common while high Aviator multipliers, long Chicken routes, and rare football zones are less frequent. Apple of Fortune remains untouched.
- Browser QA after restarting the local server confirmed the new Chicken scale (`1.12x`, `1.28x`, `1.48x`, `1.78x`, `2.25x`), sequential completion through the target step, three safe Mines cells opening, goalkeeper role execution in Football, Aviator instruction close behavior, and zero active iframes.

## 2026-09-19 (active renderer correction)

- The served root build had drifted back to `renderChickenStageLegacy()` plus reference-only wrappers. Those wrappers did not represent the saved local production scenes and were the reason the browser showed the stale/simple game composition again.
- Restored the active Aviator, Chicken Road, Mines and Football stage functions to the local production art/animation pipeline from the repository baseline while retaining the signal-only controls, automatic signal flow, mine setup selectors, Football role selector and Aviator instruction close action. Apple of Fortune was not changed.
- Restarted the root server and verified the served `app.js?v=20260919-signal-7` contains no legacy Chicken renderer and no external game iframe. Browser checks showed the local chick scene, canonical blue-metal Mines board, Football zones with striker/keeper switching, signal-triggered animation states and working Aviator close button.
- `node --check public/app.js`, `node --check server/app.js`, `node --check server/services.js`, `npm test` (11/11), `git diff --check` and `/api/health` all pass.

## 2026-09-19 (reference composition reactivated)

- The green local baseline was still the stale visual surface the current review was rejecting, so the active root renderer was switched back to the supplied local Betwinner reference compositions rather than the old embedded games or the legacy simple renderer.
- Aviator, Chicken Road and Football now use their reference composition with the current local `game-animations-ready` canvases layered as the animation owner; Mines keeps the canonical blue-metal scene. No external iframe or betting UI was reintroduced, and Apple of Fortune remains untouched.
- Cache-bust is `20260919-signal-8`; the live browser tab was refreshed onto this build and Chicken Road signal flow was rechecked: after the signal wait, the local chick moved to the generated safe step and the result panel updated.

## 2026-09-19 (reference layers restored from GAME betwin lie)

- Rechecked the actual `GAME betwin lie` source before changing the root: its four non-Apple stage functions are external iframe URLs, not local game components. The Chicken URL still stops on its external loading screen in the connected browser, so restoring those iframe functions would reproduce the black/loading failure and would keep their betting controls outside the signal runtime.
- Kept the working local signal renderer, but corrected the reference layer instead of the custom green surface: Aviator is now explicitly marked as the reference skin so its local animation canvas is painted over `references/e618...png`; Mines adds a signal-only mask over the source betting panel while retaining the supplied blue-metal board; Football continues to use the supplied player-selection reference background with the local role/zone animation.
- Added the final shell override and cache-bust `20260919-signal-10`. Browser QA confirmed Aviator reference background, working instruction close and signal flight; Mines reference board, right-side size/mine selectors and sequential safe-cell opening; Football reference player panel and role selector. No active game iframe is served.
