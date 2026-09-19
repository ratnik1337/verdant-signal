# Game animations ready — audited first pass

This archive contains 35 fixed-size RGBA animation clips across Aviator, Chicken, Apple Fortune, Mines, and Football Penalties. It is **not complete production art**: read [ANIMATION_HANDOFF.md](ANIMATION_HANDOFF.md) and [REQUESTED_COVERAGE.json](REQUESTED_COVERAGE.json) before integration.

- `manifest.json` — playback manifest
- each `Game/clip/` — frames, horizontal sheet, preview strip, and `metadata.json`
- `SourceArt/` — exact source images used by clips
- `ASSET_AUDIT.csv` — complete inventory of the 82-file input package
- `ASSET_DEPENDENCIES.md` — source-to-clip dependency map
- `preview/index.html` — clip gallery
- `tools/validate_pack.py` — repeatable integrity check

Use PNG sequences or horizontal sheets. Do not integrate assets marked `placeholder_only`, `concept_only`, or uncalibrated without replacing/reviewing them.
