# Verdant Signal design direction

Date: 2026-09-12

## Current redesign pass

This document now records the existing-product redesign. I inspected the current `README.md`, `READMEinst.md`, `package.json`, `public/`, `server/` and `test/` before changing the frontend. The requested `references/ui/` directory was not present, so its named screenshots could not be opened. The root archive and unnamed root PNG files were deliberately not used as visual inputs.

To keep the visual work evidence-based despite the missing folder, an original Verdant Signal art-direction image was generated and inspected locally. Its structural signals were a forest-green canvas, bright green topbar, left game rail, wide central instrument, right control rail, mono data labels and restrained amber emphasis. No external logo, person, casino art or screenshot asset was copied.

The desktop shell is now a dense platform terminal: green topbar, persistent left workspace/game rail, wide central work surface and right utility rail. On mobile the rail becomes a compact header plus bottom workspace navigation; the utility rail becomes an in-flow collapsible panel and never compresses or overlays a game field.

The green token system is implemented in `public/styles.css`: deep forest canvas, raised forest surfaces, sage metadata, lime signal accent, amber attention state and coral error state. `Bricolage Grotesque` carries display hierarchy, `Geist` carries controls and copy, and `Geist Mono` carries indices, multipliers and status labels. Panels use hairline rules, restrained radii, CSS Grid with `minmax(0, 1fr)`, visible focus rings and 44px touch-safe controls.

The game stages are intentionally different instruments: Aviator is a Canvas flight trace with linked plane and multiplier state; Chicken Road is a separate road/step scene with bounded jump/fall motion; Apple of Fortune is a four-row five-cell orchard board with progressive flip/opening; Mines is a framed configurable field with idle/opening/safe/mine/disabled states; Football Penalties is a goal/net scene with five zones, original keeper silhouette, ball movement, role/stake controls, result history and a rules dialog.

Motion is finite and user-triggered. Aviator uses `requestAnimationFrame` for `ready → countdown → takeoff → flying → crash → round-ended`; the other game stages use bounded timers and token checks. `stopGameAnimation()` cancels the active frame and pending timers on replay or game switch. `prefers-reduced-motion: reduce` removes spatial movement while preserving state and result text. Dynamic states use `aria-live`; unavailable Apple/Mines cells stay disabled and are not revealed early.

Responsive checks cover 320px, 390px, 430px and 1440px. At mobile widths the game field stays inside the viewport, Apple retains five columns with tighter gaps, Football retains five zones and legal/withdrawal/rules surfaces use native dialogs. Arabic sets `dir="rtl"`.

Skill application for this redesign: `redesign-existing-projects` preserved the existing stack and server contracts; `image-to-code` translated the inspected original art-direction image into geometry and hierarchy without copying assets; `design-taste-frontend`, `hallmark`, `stitch-design-taste`, `minimalist-ui`, `gpt-taste` and `high-end-visual-design` informed the committed green direction, density, token lock, panel language, touch states and motion; `brandkit`, `brand`, `frontend-design` and `frontend-design-pro` kept the Verdant Signal identity concrete; `design-system` and `ui-styling` shaped semantic tokens, forms, dialogs and progress semantics; `ui-ux-pro-max`, `a11y-debugging`, `chrome-devtools`, `playwright` and `debug-optimize-lcp` drove the visual, browser, accessibility and performance checks.

## Design read

Reading this as: a dark product workspace for players who want to inspect simulated round patterns, with an atmospheric operator-tool language, leaning toward a forest signal system with restrained bento/workbench rhythm.

The interface is a green AI-assisted analysis tool, not a casino storefront. It shows simulated patterns plainly and never implies a guaranteed result. Every game panel is a different instrument in the same analysis workspace.

## Design dials

- `DESIGN_VARIANCE: 8` - asymmetric workspace rail, varied analysis panels and different game compositions.
- `MOTION_INTENSITY: 5` - purposeful entry reveal, chart draw and tactile feedback only.
- `VISUAL_DENSITY: 6` - data-rich enough for a daily tool, with visible breathing room around primary actions.
- `CREATIVITY: 8`, `DENSITY: 6`, `VARIANCE: 8`, `MOTION INTENT: 5` from the Stitch direction.

## Macrostructure and navigation

- Hallmark macrostructure: `Workbench`. The main surface is a guided tour of the analysis instruments, so the product panels do the explaining.
- Navigation adaptation: a detached product rail inspired by Hallmark N5 Floating Pill. On desktop it becomes a slim left workspace rail for persistent app navigation; on mobile it becomes a compact top bar plus bottom navigation.
- Footer adaptation: Hallmark Ft5 Statement. The closing line is a short product principle followed by legal links, not an invented sitemap.
- Public/auth composition: split layout, left side signal-path visual, right side labelled login card.
- Product composition: wide page shell, one featured analysis panel, a varied two-column panel rhythm, and a lower live-activity row that stays empty when no real data exists.

## Palette and token roles

The palette is green-first and intentionally not blue. All production color values are lifted into token declarations; components reference semantic tokens only.

| Role | Token | Value | Use |
|---|---|---|---|
| Deep forest canvas | `--color-canvas` | `oklch(12% 0.028 155)` | Global page background |
| Raised forest surface | `--color-surface` | `oklch(16% 0.032 155)` | Primary panels |
| Elevated surface | `--color-surface-raised` | `oklch(20% 0.038 155)` | Metric and game sub-panels |
| Quiet rule | `--color-rule` | `oklch(31% 0.034 155)` | Structural borders |
| Main ink | `--color-ink` | `oklch(95% 0.018 150)` | Headings and primary values |
| Muted ink | `--color-muted` | `oklch(74% 0.026 150)` | Explanations and metadata |
| Signal green | `--color-accent` | `oklch(78% 0.17 142)` | Active state, primary action, recommendation |
| Accent ink | `--color-accent-ink` | `oklch(15% 0.035 150)` | Text on signal green |
| Error | `--color-error` | `oklch(70% 0.17 28)` | Errors and failed analysis states |
| Success | `--color-success` | `oklch(78% 0.17 142)` | Confirmation with icon and text |

The green accent is a highlighter, not a full-section fill. No purple-blue gradient, no pure black, no pure white, and no decorative neon halo. Background depth comes from lightness steps, thin rules and an anchored radial bloom with no animation.

## Typography

- Display: `Bricolage Grotesque`, 600-700, tracked tight for the product name and feature headings.
- Body/UI: `Geist`, 400-600, 16px base, comfortable 1.55 line-height.
- Data outlier: `Geist Mono`, 500, for multipliers, timestamps, Player ID masks and chart labels only.
- No italic display headings. No all-caps paragraphs. Labels use sentence case except explicit status tokens such as `DEMO ANALYSIS`.
- Fluid scale uses a 1.25 major-third rhythm with `clamp()` for the largest headings. Interactive labels never wrap.

## Grid and spacing

- 4pt base spacing tokens from 4px through 96px.
- Main workspace uses CSS Grid: desktop rail + content; within content, a wide feature track and a 2-column analysis grid.
- `minmax(0, 1fr)` is used for image/canvas-bearing columns. Mobile collapses to one column below 768px.
- Root uses `overflow-x: clip`; no `100vw`, no fixed desktop width, no negative mobile offsets.
- Cards are reserved for true hierarchy. Sub-panels share surfaces rather than nesting multiple bordered cards.

## Components

- `Button`: primary signal fill, quiet outline secondary, disabled explanation, inline loading state, error and success text where applicable. Minimum 44px.
- `Field`: visible label above input, helper/error row below, constant 1px border to avoid layout shift, instant focus ring.
- `Panel`: one surface, one radius scale (`14px` panels, full-pill controls), hairline rule, no heavy black shadow.
- `Metric`: tabular value, short label, one semantic icon/symbol.
- `Game rail`: compact route cards with one-line game title and one-sentence mechanic.
- `Analysis result`: explicit `DEMO ANALYSIS`, result value, rationale, copy action and history. Success is silent and visible in the result panel.
- `Dialog`: native `<dialog>` for withdrawal explanation and legal text, centred with escape support.
- `Toast`: fixed, contextual, reserved for errors or copy confirmation when the result is not otherwise visible.

## Game panel principles

Each panel exposes the same analysis contract but has a different visual instrument:

- Aviator uses a drawn flight trace, multiplier and round chips.
- Chicken Road uses a horizontal road with safe steps and difficulty controls.
- Apple of Fortune uses 5-cell rows with one recommended safe cell and four hazards.
- Mines uses a configurable CSS grid with recommended cells and mine indicators.
- Football Penalties uses a goal frame, keeper silhouette, five shot zones and direction history.

The panels show analysis as pattern-based and simulated. The UI copy is concrete: `Review pattern`, `Copy result`, `No analysis yet`, `Demo activity`. It does not use fake accuracy percentages, fake player names or guaranteed-win language.

## State model

Every major action has:

- loading: skeleton or inline progress label;
- empty: explanation plus a next action;
- error: named failure, reason when known and recovery step, announced through `aria-live`;
- success: visible state change with a check icon/label, no celebratory toast;
- disabled: reduced contrast plus an explanation, especially for withdrawal;
- focus/active/hover: visible ring and tactile press, with hover gated to fine pointers;
- reduced-motion: no spatial movement, functional state remains.

## Mobile adaptation

- Verify 320px, 375px, 390px, 414px, 430px and 768px widths.
- Desktop side rail collapses into a labelled mobile header and a bottom route bar with no more than five primary destinations.
- Game control rows stack; game grids remain inside the viewport; buttons stay single-line and at least 44px high.
- Football zones become a two-row, five-zone grid; Apple rows remain 5 columns with reduced cell gaps; Mines reduces cell size with a minimum 44px analysis target.
- Dialogs use nearly full width with safe-area padding. Content is not hidden under the mobile browser chrome.
- Arabic sets `dir="rtl"` and uses logical properties.

## Motion

Only three motion primitives are used:

1. `workspace-reveal`: one-time opacity + translate entry, capped under 500ms total.
2. `chart-draw`: transforms/opacity only, communicates that a new analysis result has been loaded.
3. `tactile-press`: 1px translate/0.98 scale on button press, communicates input feedback.

All motion uses the named token easings and collapses under `prefers-reduced-motion: reduce`. No scroll listeners, parallax, perpetual card pulses or decorative cursor effects.

## Accessibility and QA commitments

- Semantic landmarks: `header`, `nav`, `main`, `section`, `footer`, heading order.
- Labels and descriptions are wired with `for`, `aria-describedby`, `aria-live`, `aria-invalid` and accessible names for icon buttons.
- Keyboard navigation is possible for menus, game cells, modal close and copy action.
- Contrast target is WCAG AA for body text and 3:1 for controls/focus rings.
- Browser QA uses fresh snapshots after navigation and state changes plus screenshots at requested mobile widths. Console errors and tap target issues are treated as defects.

## Skill application summary

- `design-taste-frontend` supplied the no-slop discipline, token lock, one accent, state completeness and reduced-motion rules.
- `hallmark` supplied the Workbench macrostructure, atmospheric genre, N5/Ft5 structural fingerprints, 4pt spacing and preflight framing.
- `brandkit` and `brand` supplied the Verdant Signal identity, the forest/signal metaphor and concrete voice.
- `frontend-design`, `frontend-design-pro`, `high-end-visual-design`, `minimalist-ui`, and Stitch supplied the asymmetric split, restrained surfaces, hierarchy and touch target rules.
- `ui-ux-pro-max` produced the searchable recommendation set: dark green Bento rhythm, Phosphor-style outline icons, chart accessibility fallbacks, and explicit loading/error/touch checks.
- `design-system` and `ui-styling` supplied the primitive-semantic-component token layering and native equivalents for dialogs/forms/states.
- `a11y-debugging`, `chrome-devtools`, `playwright` and `debug-optimize-lcp` define the manual browser verification pass.
- `test-driven-development` defines the red-green-refactor order for server behavior.

## Art-pack animation pipeline addendum — 2026-09-12

The visual system now treats every supplied transparent asset as a calibrated instrument part rather than as a decorative background. Aviator uses a single Canvas scene with an explicit back-to-front z-order and normalized plane-relative anchors. The body, propeller, engine glow, smoke, trail, crash and sparks each have their own source, pivot, display scale and animation phase. Chicken Road uses a fixed road coordinate system with independent chick and van anchors. Apple cells own their tile and fruit layers, and Football keeps the generic goalkeeper and ball independent from the goal grid.

The runtime shell remains the Verdant Signal forest-green workbench: a bright green topbar, left game rail, central stage and right control/history panel on desktop. At 320–412 px the shell collapses into a single column and the utility rail moves below the game; the stage remains the largest visual surface. Mines received an explicit vertical stack for frame → readout → caption so dense mobile UI does not collide.

Design tokens used for art integration:

- `--color-accent` / pale signal green for safe/recommended states and focus.
- `--color-warning` / warm gold for active multiplier, countdown and important action.
- deep forest and blue-green stage gradients for the shared scene floor.
- mono labels for state/timing, display face for multiplier and game title.
- `44px` minimum touch targets, visible focus rings, `aria-live` only for discrete results, and reduced-motion collapse for spatial effects.

The debug section at `/?art-debug=1` is part of the design system’s inspectability: it exposes propeller, engine glow, smoke, trail, crash, sparks, Chicken jump/fall, Apple flip/safe/danger and keeper dive individually. This directly applies the image-to-code and game-UI workflow: inspect source art, isolate layers, calibrate anchors, then validate the scene at mobile widths.

## Design-plan check

Deterministic design selection based on the request text length selected:

```text
seed = 11, hero = split-workbench, type = Bricolage Grotesque + Geist, components = signal-rail + instrument-panel + result-card
motion = chart-draw + tactile-press, grid = 12 columns with 7/5 featured split and no empty cells
labels = no decorative section numbering, buttons = sentence case, one-line, WCAG contrast checked
```

The page has navigation, an attention surface, instrument panels for interest, a data visualization for desire/inspection, and a statement/legal footer for action and trust. No fabricated activity, accuracy, balance or testimonials are used.
