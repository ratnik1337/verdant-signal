# Aviator VFX pass

All animation frames are 384×384 RGBA PNGs. Horizontal atlases use one frame per cell, left to right. The matching frame directories are retained beside each atlas for engines that prefer individual files. Preview GIFs are composited on the existing dark indigo scene color and are QA previews, not game sprites.

Included sequences:

- `plane-crash-explosion-atlas.png` — 8-frame one-shot crash sequence.
- `smoke-trail-atlas.png` — 6-frame looping smoke drift.
- `crash-sparks-atlas.png` — 6-frame one-shot spark burst.
- `engine-glow-atlas.png` — 6-frame looping engine pulse.
- `../animations/propeller-spin-atlas.png` — 8-frame looping spin, 45° per frame, center pivot.

`trail-segment.png` is a 1024×256 RGBA sprite intended for horizontal repeat/stretch. `crash-flash.png`, `after-crash-smoke.png`, `ember-spark.png` and `engine-glow.png` are standalone keyframes.

The effect pivots are visual centers. Plane-to-effect mount points still require calibration in the target scene.
