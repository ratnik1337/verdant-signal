# Verdant Signal game art pack — asset pass 0.3

This is a partial set of real PNG assets generated from the supplied visual references. It is not a completed production art pack. All standalone art PNGs in the manifest have an RGBA alpha channel. The new transparent assets were composited for QA on white, black, forest-green and indigo backgrounds; see `previews/transparency-check-v0.2.jpg`, `previews/contact-sheet.jpg` and `previews/aviator-vfx-contact-sheet.jpg`.

## Included standalone art

- Aviator: separate plane body and detached propeller, cropped from `aviator/sources/plane-and-propeller-source.png`. The approximate attachment point has not been calibrated in the game.
- Aviator: a transparent indigo mountain-ridge layer reconstructed from the approved scene; parallax scale and placement still need calibration.
- Aviator VFX pass: eight-frame plane crash/explosion, six-frame smoke trail, six-frame crash sparks, six-frame engine glow pulse, eight-frame propeller spin, a stretchable exhaust trail and four standalone keyframe sprites. GIF previews are under `aviator/animations/previews/`.
- Apple of Fortune: whole and bitten apples; original queen and heroine concepts. Character likeness to the screenshot is not certified.
- Apple of Fortune: one blank warm-wood closed tile reconstructed from the board screenshot; it has not been checked in the responsive 5-column board.
- Chicken Road: one idle chick concept, explicitly a reconstruction because no dedicated Chicken reference was supplied.
- Chicken Road: one isolated orange-red traffic van, also a reconstruction because no dedicated Chicken reference was supplied.
- Football: one unassigned goalkeeper concept only; it is not a De Gea/Courtois/Oblak model.
- Gems/Mines: the supplied accepted screen is retained only as a reference; no original textures were found as separate files in the archive.

## Integration notes

Use the individual PNG paths and the `animations` records in `asset-manifest.json`. New VFX atlases use 384×384 horizontal frames; per-animation timing, loop mode and visual effect pivots are recorded there. The aircraft mount/trail contact points still need calibration in an actual scene. Do not treat the original source sheet or any screenshot as a final sprite. `players.json` records the exact roster from the supplied selection screen and leaves uncreated player assets empty.

## Project review

The supplied archive contains a runnable-looking vanilla JS/CSS project plus reference screenshots. The existing game scenes are rendered in the app; the archive does not include a separate production sprite library for these games. This art pack is therefore added as a standalone deliverable and does not alter the app code.

See `reference-map.md` for what each screenshot can and cannot establish, and `missing-assets.md` for the remaining art and animation work. The current manifest has 21 standalone image assets plus five Aviator animation records; concept stills and reference screenshots are not counted as animation atlases.
