# Skill inventory

Inventory captured on 2026-09-12 before implementation. The workspace contains a new empty application area plus the user-provided `READMEinst.md`. No `aipredict.zip` was present, so no archive content was read or reused.

## Workspace-local skills

The `.claude/skills` entries are symlink aliases of `.agents/skills`; the canonical files below were read from `.agents/skills` and the aliases were verified as the same skill set.

| Skill | Location | Purpose | Relevant | Read | Use and result |
|---|---|---|---:|---:|---|
| brandkit | `.agents/skills/brandkit/SKILL.md` | Brand world, logo logic, palette discipline, identity applications | Yes | Yes | Defined Verdant Signal as a dark nature/operator brand with a restrained forest palette and a signal-path mark. |
| design-taste-frontend | `.agents/skills/design-taste-frontend/SKILL.md` | Anti-slop frontend direction, tokens, motion, responsive and pre-flight rules | Yes | Yes | Chose the explicit design read, 8/5/6 dials, no purple/blue defaults, one accent, CSS grid, reduced motion and full state cycles. |
| design-taste-frontend-v1 | `.agents/skills/design-taste-frontend-v1/SKILL.md` | Earlier anti-slop frontend guidance | Yes | No | Older duplicate family was inventoried; the current `design-taste-frontend` rules were used as the source of truth. |
| full-output-enforcement | `.agents/skills/full-output-enforcement/SKILL.md` | Output completeness enforcement | No | No | Not needed for implementation decisions. |
| gpt-taste | `.agents/skills/gpt-taste/SKILL.md` | High-variance composition, AIDA, typography and motion checks | Yes | Yes | Used the two-line headline rule, deliberate asymmetry, a deterministic design plan and a single purposeful data reveal. GSAP was not introduced because the vanilla product UI did not require scroll pinning. |
| hallmark | `.agents/skills/hallmark/SKILL.md` | Anti-slop greenfield design flow, macrostructure, theme, tokens and slop test | Yes | Yes | Applied atmospheric genre, Workbench macrostructure, N5-inspired detached shell, Ft5-style statement footer, token locking and mobile verification. |
| high-end-visual-design | `.agents/skills/high-end-visual-design/SKILL.md` | High-end visual hierarchy, whitespace, interaction and responsive rules | Yes | Yes | Used a restrained double-surface panel language, tactile press feedback, asymmetric shell and hardware-safe motion. |
| image-to-code | `.agents/skills/image-to-code/SKILL.md` | Image-first reconstruction of a UI from supplied visual references | Yes | Yes | `references/ui` was absent, so the supplied screenshot set could not be inspected. An original generated Verdant Signal art-direction image was inspected, then translated into the shell proportions, green topbar, rail, chart and right utility panel without copying third-party branding. |
| imagegen-frontend-mobile | `.agents/skills/imagegen-frontend-mobile/SKILL.md` | Image-led mobile frontend generation | No | No | No image-generation asset was needed; CSS-native game panels preserve load performance and avoid fabricated imagery. |
| imagegen-frontend-web | `.agents/skills/imagegen-frontend-web/SKILL.md` | Image-led web frontend generation | No | No | No image-generation asset was needed; the product is a data interface rather than a photo-led page. |
| industrial-brutalist-ui | `.agents/skills/industrial-brutalist-ui/SKILL.md` | Raw industrial visual language | No | No | Deliberately not used because the brief asks for a polished green analysis product, not brutalism. |
| minimalist-ui | `.agents/skills/minimalist-ui/SKILL.md` | Premium utilitarian minimalism and flat UI patterns | Yes | Yes | Used flat surfaces, sparse borders, no heavy shadows, visible labels and quiet states. |
| redesign-existing-projects | `.agents/skills/redesign-existing-projects/SKILL.md` | Auditing and upgrading an existing project | Yes | Yes | Audited the existing Express/vanilla client and tests first; retained the server/API/DB contracts and made the redesign a targeted frontend upgrade in `public/app.js`, `public/styles.css` and locale assets. |
| stitch-design-taste | `.agents/skills/stitch-design-taste/SKILL.md` + `DESIGN.md` | Distinctive responsive UI, visual tokens, touch targets and motion intent | Yes | Yes | Used creativity 8, density 6, variance 8, motion intent 5; adopted the grid-first, no-overlap, 44px target and mobile-collapse rules. |

## Global Claude/Codex skills and connected plugin skills

Global native skill directories found under `C:/Users/odertati/.claude/skills/`: `context7-mcp` and `img2threejs`. They are not relevant to this HTML/CSS/Express/SQLite task and were not read. The plugin cache contained 494 `SKILL.md` files across multiple versioned copies. The following relevant skill families were selected and read from the newest available copies; duplicate versioned copies were not reread.

| Skill | Location | Purpose | Relevant | Read | Use and result |
|---|---|---|---:|---:|---|
| frontend-design | `C:/Users/odertati/.claude/plugins/cache/claude-plugins-official/frontend-design/3deb821cb71c/skills/frontend-design/SKILL.md` | Subject-specific visual direction and critique | Yes | Yes | Grounded the interface in gaming-round analysis, selected a distinctive subject vocabulary and used one memorable signal-path visual instead of generic AI decoration. |
| frontend-design-pro | `C:/Users/odertati/.claude/plugins/cache/frontend-design-pro/frontend-design-pro/1.0.0/skills/frontend-design-pro/SKILL.md` | Production visual direction and responsive visual systems | Yes | Yes | Applied one committed dark green direction, CSS custom properties, WCAG focus states, and kept media out of the critical path. |
| ui-ux-pro-max | `C:/Users/odertati/.claude/plugins/cache/ui-ux-pro-max-skill/ui-ux-pro-max/2.11.0/.claude/skills/ui-ux-pro-max/SKILL.md` | Searchable product, style, color, UX, icon and chart recommendations | Yes | Yes | Ran the design-system search for the product, plus UX, icon and chart searches. Used its Bento recommendation as a rhythm reference, Phosphor-style outline icon guidance, explicit loading/error/touch checks and accessible chart fallbacks. |
| design | `C:/Users/odertati/.claude/plugins/cache/ui-ux-pro-max-skill/ui-ux-pro-max/2.11.0/.claude/skills/design/SKILL.md` | Unified design routing for brand, tokens, UI and icons | Yes | Yes | Routed the work to brand, design-system, ui-styling and frontend-design concerns. |
| design-system | `C:/Users/odertati/.claude/plugins/cache/ui-ux-pro-max-skill/ui-ux-pro-max/2.11.0/.claude/skills/design-system/SKILL.md` | Primitive, semantic and component token architecture | Yes | Yes | Implemented primitive-to-semantic CSS variables and component states in `public/styles.css`. |
| ui-styling | `C:/Users/odertati/.claude/plugins/cache/ui-ux-pro-max-skill/ui-ux-pro-max/2.11.0/.claude/skills/ui-styling/SKILL.md` | Accessible styling, responsive layouts, dialogs, forms and states | Yes | Yes | Implemented native equivalents with semantic HTML, dialog-based withdrawal modal, labels, error regions, responsive grids and dark theme tokens. |
| brand | `C:/Users/odertati/.claude/plugins/cache/ui-ux-pro-max-skill/ui-ux-pro-max/2.11.0/.claude/skills/brand/SKILL.md` | Voice, identity, assets and brand consistency | Yes | Yes | Created the Verdant Signal voice and kept copy concrete: analysis, signal, review, active days. |
| banner-design | `C:/Users/odertati/.claude/plugins/cache/ui-ux-pro-max-skill/ui-ux-pro-max/2.11.0/.claude/skills/banner-design/SKILL.md` | Banner and hero art direction | No | Yes | Read as a related visual skill, but no separate banner asset was requested; the dashboard hero uses a native panel instead. |
| a11y-debugging | `C:/Users/odertati/.claude/plugins/cache/claude-plugins-official/chrome-devtools-mcp/1.9.0/skills/a11y-debugging/SKILL.md` | Lighthouse, accessibility tree, labels, focus, tap target and contrast checks | Yes | Yes | Used for the browser QA checklist and planned automated semantic checks. |
| chrome-devtools | `C:/Users/odertati/.claude/plugins/cache/claude-plugins-official/chrome-devtools-mcp/1.9.0/skills/chrome-devtools/SKILL.md` | Browser navigation, snapshots, screenshots and console checks | Yes | Yes | Used for browser navigation/snapshots/screenshots and console verification. |
| debug-optimize-lcp | `C:/Users/odertati/.claude/plugins/cache/claude-plugins-official/chrome-devtools-mcp/1.9.0/skills/debug-optimize-lcp/SKILL.md` | LCP trace and resource-load diagnostics | Yes | Yes | Used as the performance review criteria; the UI is text/CSS-first with no lazy-loaded hero image. |
| playwright | `C:/Users/odertati/.codex/skills/playwright/SKILL.md` | CLI-first real-browser flow checks and screenshots | Yes | Yes | Used as the preferred manual browser QA workflow with fresh snapshots after navigation and state changes. |
| test-driven-development | `C:/Users/odertati/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/skills/test-driven-development/SKILL.md` | Red-green-refactor test-first implementation | Yes | Yes | Wrote the initial server contract tests before production modules, observed the expected missing-module failure, then implemented to the tests. |
| security-best-practices | `C:/Users/odertati/.codex/skills/security-best-practices/SKILL.md` | Secure-by-default JavaScript web application guidance | Yes | Yes | Applied server validation, HMAC player lookup, bcrypt access/admin credentials, httpOnly cookies, Helmet, rate limits and client/system-field separation. |

## Relevant categories not present as standalone workspace skills

No dedicated local skill named `accessibility`, `responsive-design`, `mobile-interface`, `frontend-architecture`, `icons`, or `testing` was found under `.agents/skills` or `.claude/skills`. Those concerns were covered by the read plugin skills above. No `aipredict.zip` was available in the workspace, and no archive-derived files were created.

## Redesign pass evidence

## Art-pack pipeline pass — 2026-09-12

| Skill | Concrete application in this pass | Evidence/result |
|---|---|---|
| `redesign-existing-projects` | Treated the current client as an existing product; removed only the failed duplicate renderer and retained backend/API/auth/DB contracts. | `npm test` remained 11/11; server files unchanged. |
| `image-to-code` | Read the supplied art-pack manifest and inspected the actual transparent PNG/atlas images before selecting anchors, pivots and display sizes. | Runtime manifest records source rectangles, timing, pivots, anchors and limitations. |
| `develop-web-game` | Built finite user-triggered scene loops, added `render_game_to_text`/`advanceTime` hooks and a one-layer debug preview. | Aviator state machine and debug controls were exercised in Chrome. |
| `frontend-skill` | Applied a single visual thesis, explicit layer hierarchy, responsive stage sizing and reduced-motion handling. | 320/360/390/412/768/1440 QA showed no horizontal overflow. |
| `chrome-devtools` | Used snapshots, screenshots, scripted interaction, console inspection and Lighthouse. | Five scenes visually inspected; console clean; Lighthouse Accessibility 100. |
| `a11y-debugging` | Checked semantic controls, live result regions, focusable game cells, 44px touch minimums and mobile layout. | Lighthouse Accessibility 100; all 11 locales and Arabic RTL verified. |

- The current task is an existing-product redesign. The original greenfield wording in older implementation notes is superseded by this pass.
- `references/ui/` was not present in the workspace. The root-level archive and unnamed PNGs were not opened or used as visual inputs.
- `image-to-code` was still applied to the generated, original art-direction reference: forest canvas, bright green topbar, left navigation, central instrument and right utility rail.
- `redesign-existing-projects` was applied by preserving working routes, session/auth flow, server validation, database behavior, admin surface, and game identifiers while replacing the visual shell and game stages.
- Motion guidance was implemented as finite state machines with `requestAnimationFrame` for Aviator and bounded timers for the user-triggered Chicken Road, Apple, Mines and Football scenes. `prefers-reduced-motion` collapses spatial movement.
- Browser/a11y QA was rerun after the redesign: 320/390/430 mobile checks, 1440 desktop check, locale/RTL sweep, animation state checks, no duplicate IDs, clean console, and Lighthouse mobile 100/100/100/100.

## Design-plan record

The design plan for this redesign was recorded in `docs/design-direction.md` before the client changes. The implementation keeps the existing vanilla HTML/CSS/JavaScript and Express stack because the current product already uses it and the redesign brief explicitly asks to preserve that stack.
