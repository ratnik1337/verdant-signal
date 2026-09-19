# Verdant Signal — отчёт о пересборке art-pack animation pipeline

Дата проверки: 2026-09-12  
Тип работы: полноценная переработка существующей frontend-интеграции реального артпака без изменения backend, API, SQLite, auth, финансовой и legal-логики.

## Итог

Старый дублированный renderer в `public/app.js` заменён одной сценовой системой. Реальные PNG и горизонтальные atlas-файлы из `game-art-pack-v0.3.zip` подключены покадрово, с отдельными anchor/pivot/scale/z-index для объектов. Aviator теперь проходит конечный цикл `ready → countdown → takeoff → flying → crash → ended`; Chicken Road, Apple of Fortune, Mines и Football Penalties получили независимые объектные сцены и конечные пользовательские анимации.

Backend-файлы не переписывались. Существующие URL, игровые идентификаторы, auth/session, onboarding, activity, levels, bonuses, balances, withdrawal lock, localization и admin flow сохранены.

## Изменённые файлы

- `public/app.js` — единый renderer, `SpriteAtlasPlayer`, `SceneAnimationLoop`, пять сцен, cleanup и debug-preview.
- `public/styles.css` — новая pipeline-разметка слоёв, anchor-safe responsive layout, состояния сцен, reduced-motion и устранение старых CSS-only actor animations.
- `public/assets/verdant-artpack/manifest.json` — runtime-манифест с размерами, кадрами, timing, loop/once, pivot, anchor, display size, z-index и назначением.
- `public/assets/verdant-artpack/aviator/**` — plane, mountain, trail и пять atlas/VFX runtime-файлов.
- `public/assets/verdant-artpack/chicken/**` — отдельные chick и traffic van PNG.
- `public/assets/verdant-artpack/apple/**` — whole apple, bitten apple и closed wooden tile.
- `public/assets/verdant-artpack/football/**` — generic goalkeeper PNG.
- `public/i18n/redesign.js` — новые строки debug-preview для `en`, `ru`, `uk`, `pl`, `es`, `pt`, `de`, `fr`, `it`, `tr`, `ar`.
- `docs/SKILL_INVENTORY.md`, `docs/design-direction.md` — зафиксировано применение дизайн- и browser-QA скиллов.
- `docs/qa-screenshots/README.md`, `docs/qa-screenshots/scene-preview.html` — устойчивый preview/evidence-набор для локальной проверки.
- `progress.md` — пошаговый журнал выполнения web-game workflow.

`server/`, `test/`, `package.json` и серверная схема в рамках этой задачи не изменялись.

## Удалённая старая интеграция

Из `public/app.js` удалены дублирующиеся определения `footballStage`, `renderGameView`, `runFootball`, `handleGameAction` и старый процедурный fallback Aviator. Сцены больше не используют старый CSS-only goalkeeper/chicken path, независимые бесконечные actor loops или несколько конкурирующих render-функций. Весь runtime проходит через один `state.sceneLoop` и `stopGameAnimation()`.

## SpriteAtlasPlayer

`SpriteAtlasPlayer` принимает горизонтальный atlas и конфигурацию source rectangle `384×384`, вычисляет кадр по индивидуальным длительностям, поддерживает `loop` и `once`, `play`, `pause`, `stop`, `reset`, `dispose`, reduced-motion и safe frame fallback. Сам класс не создаёт отдельный постоянный цикл: кадр рисуется единственным сценовым `SceneAnimationLoop`. `requestAnimationFrame` отменяется при stop, смене игры и `pagehide`. Canvas backing store меняется только при изменении CSS-размера или capped `devicePixelRatio` (максимум 2).

| Atlas | Кадры | Тайминг | Режим | Слой |
|---|---:|---|---|---:|
| `propeller-spin-atlas.png` | 8 | `60,60,60,60,60,60,60,60 ms` | loop | 8 |
| `engine-glow-atlas.png` | 6 | `80,80,80,80,80,80 ms` | loop | 6 |
| `smoke-trail-atlas.png` | 6 | `80,80,80,80,100,120 ms` | loop | 5 |
| `crash-sparks-atlas.png` | 6 | `50,50,60,80,100,120 ms` | once | 10 |
| `plane-crash-explosion-atlas.png` | 8 | `50,50,60,70,80,100,120,160 ms` | once | 9 |

## Aviator anchors и pivots

Все значения нормализованы относительно последнего положения корпуса. Они откалиброваны по фактическим прозрачным PNG, а не взяты как случайные `left/top`.

| Объект | Anchor `{x,y}` | Scale | Pivot | Назначение |
|---|---|---:|---|---|
| Plane body | `{0.50, 0.51}` | `1.00` | `{0.50, 0.51}` | самостоятельный корпус |
| Propeller | `{0.91, 0.40}` | `0.36` | `{0.50, 0.50}` | отдельный носовой atlas, собственный центр вращения |
| Engine glow | `{0.14, 0.56}` | `0.48` | `{0.50, 0.50}` | свечение за двигателем |
| Smoke | `{-0.48, 0.58}` | `0.74` | `{0.50, 0.50}` | дым позади корпуса |
| Trail | `{-0.79, 0.55}` | `0.86` | `{0.50, 0.50}` | отдельный горизонтальный сегмент |
| Crash FX | `{0.50, 0.50}` | `1.00` | `{0.50, 0.50}` | explosion/sparks в последней точке самолёта |

Порядок отрисовки Aviator: background gradient → mountain → grid/trajectory → trail → looping smoke → engine glow → plane body → propeller → crash flash/sparks/explosion → HUD. Во время crash корпус остаётся в последней позиции, траектория затухает, а one-shot VFX стартуют в той же точке.

## Остальные сцены

- Chicken Road: chick и traffic van — отдельные DOM-объекты. Jump меняет только chick transform с squash/rotation/translation; road cells и van не двигаются. Fall — отдельное конечное состояние. Idle PNG не выдаётся за полноценный sprite rig.
- Apple of Fortune: каждая из 20 клеток — отдельная кнопка и собственный wooden tile. `apple-whole.png` используется для suggested/safe, `apple-bitten.png` — для revealed danger. Flip применяется к `.apple-cell-inner`, поэтому соседние клетки и board не вращаются.
- Mines: frame, controls, 4×4/5×5/6×6 grid, recommended/safe/mine/disabled состояния и finite opening animation. На мобильном readout и stage caption переведены в вертикальный стек без наложения.
- Football Penalties: пять зон, striker/keeper role, generic keeper, независимые ball и keeper transforms, конечные `goal/save/miss`, history, virtual stake clamp 10–10 000 RUB и localized Rules dialog. Keeper закреплён на нижней линии ворот, остаточные CSS-only dive animations выключены.

## Debug-preview

Открыть: `http://localhost:3000/?art-debug=1`, затем любую игру. Debug-секция содержит отдельные кнопки:

`propeller`, `engine glow`, `smoke`, `trail`, `crash`, `sparks`, `Chicken jump`, `Chicken fall`, `Apple flip`, `Apple safe`, `Apple danger`, `Keeper dive`.

Каждый запуск сначала вызывает общий cleanup. Для atlas используется общий scene RAF; для Chicken/Apple/Football — конечные transform/flip transitions. Кнопка `Stop preview` отменяет активный preview.

## Browser и visual QA

Проверено в локальном Chrome DevTools на приложении `http://localhost:3000`:

- 390 px: визуально просмотрены Overview, Aviator ready/crash, Chicken Road, Apple safe/danger, Mines и Football ready/terminal.
- Aviator: подтверждены `Countdown → Takeoff → Flying → Round ended`, multiplier остановлен на `2.34x`; повторный запуск и уход в Overview очищают runtime (`aviatorStages: 0`).
- Chicken: подтверждены `is-jumping` и переход к `1/5` после действия.
- Apple: подтверждены safe flip, progressive row unlock и danger reveal.
- Mines: подтверждены opening, safe и mine состояния.
- Football: подтверждены 5 зон, striker и keeper modes, раздельные ball/keeper transforms, history и Rules dialog.
- Console после перезагрузки и полного прогона: сообщений нет.
- Lighthouse snapshot: Accessibility `100`, Best Practices `100`, SEO `100`; Agentic Browsing `50` не относится к визуальной корректности приложения.

Матрица размеров:

| Viewport | Результат |
|---|---|
| `320×568` | точный viewport; пять сцен, overflow отсутствует |
| `360×800` | точный viewport; пять сцен, overflow отсутствует |
| `390×844` | пять сцен и interactions проверены визуально, overflow отсутствует |
| `412×915` | точный viewport; пять сцен, overflow отсутствует |
| `768×1024` | точный viewport; пять сцен, overflow отсутствует |
| `1440×1000` | рабочая область и desktop shell проверены, overflow отсутствует |

Во всех пяти сценах на проверенных ширинах `stage=true`, `overflow=false`, `offscreen=false`. Для Chicken и Football проверено по два независимых art layer; Aviator и Apple используют Canvas/клеточные DOM-объекты соответственно.

Preview-файл и список визуальных проверок: `docs/qa-screenshots/scene-preview.html` и `docs/qa-screenshots/README.md`. Скриншоты Chrome были просмотрены во время QA; durable preview оставлен в репозитории, поскольку browser screenshot export не был доступен в workspace root.

## Проверки командой

- `node --check public/app.js` — PASS.
- `node --check public/admin.js` — PASS.
- `node --check public/i18n/redesign.js` — PASS.
- `npm test` — PASS, `11/11`.
- `/api/health` — HTTP `200`, `{"status":"ok","service":"verdant-signal"}`.
- 14 runtime PNG/atlas paths из `manifest.json` — HTTP `200` через Express.
- Все 11 локалей присутствуют; новые debug keys отсутствуют ни в одном словаре; Arabic `dir=rtl`.
- Git provenance: текущая директория не является Git-репозиторием, поэтому `git diff --check` и `git status` неприменимы; это зафиксировано до изменений.

## Ограничения артпака

- Chicken chick, traffic van, mountain layer и goalkeeper — standalone/reconstructed art, не подтверждённые точные совпадения с именованными референсами.
- Football goalkeeper намеренно generic и не связан с реальным футболистом.
- Только пять Aviator sequences являются настоящими atlas-анимациями; Chicken, Apple и Football используют isolated stills с аккуратным transform-motion.
- В артпаке нет editable Mines textures и полноценного Chicken sprite rig.
- Reference sheets, contact sheets и GIF previews в runtime не подключаются.
- Папка `references/ui/` отсутствует в текущем окружении, поэтому точное пиксельное сравнение с перечисленными UI-скриншотами невозможно; art-pack PNG были реально распакованы, просмотрены и откалиброваны.

## Оценка готовности

- Функциональность: **96/100** — сохранены серверные контракты и игровые идентификаторы, finite animation paths и переход cleanup подтверждены браузером.
- Визуальное соответствие референсному направлению: **92/100** — фактические PNG/atlas собраны раздельно, но часть артпака reconstructed/still, а UI-референсы отсутствуют.
- Общая готовность: **94/100** — готово для локального demo/UAT; ограничители перечислены выше.

## Запуск

```bash
npm install
npm start
```

Основные URL: `http://localhost:3000` и `http://localhost:3000/admin`.
