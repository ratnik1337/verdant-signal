# Codex handoff: Verdant Signal art-pack integration

## Цель

Подключить `game-art-pack-v0.3(1).zip` к этому проекту как production-ready runtime art pass для мобильного интерфейса. Визуальный ориентир — плотный зелёно-золотой betting UI уровня Betwinner: ориентир по иерархии, контрасту, крупным touch-зонам и игровому темпу, без копирования логотипов, брендинга или чужих экранов.

## Фактическая архитектура проекта

- Backend: Node.js + Express, точка входа `server/index.js`.
- Frontend: vanilla JavaScript в `public/app.js`, стили в `public/styles.css`.
- Игровые сцены: DOM + Canvas 2D, существующие конечные состояния уже реализованы.
- Не переносить проект на Unity, Godot, React или Vite и не менять API, SQLite, auth/session flow и игровые идентификаторы.
- Статические runtime-ассеты должны находиться в `public/assets/verdant-artpack/`.

## Что интегрировать

Использовать только прозрачные runtime PNG и атласы из артпака. Исходные reference sheets, contact sheets и GIF-превью не подключать в runtime.

| Игра | Runtime-ассеты | Состояния |
|---|---|---|
| Aviator | `aviator/models/plane-body.png`, `aviator/backgrounds/mountain-ridge-layer-reconstruction.png`, `aviator/effects-vfx/*atlas.png`, `aviator/effects-vfx/trail-segment.png`, `aviator/animations/propeller-spin-atlas.png` | `ready → countdown → takeoff → flying → crash → ended`; propeller/engine glow/smoke loop, crash/sparks one-shot |
| Chicken Road | `chicken/models/chick-idle-reconstruction.png`, `chicken/obstacles/traffic-van-reconstruction.png` | idle, jump, safe step, fallen; модель должна оставаться читаемой на ширине 320–430 px |
| Apple of Fortune | `apple/objects/apple-whole.png`, `apple/objects/apple-bitten.png`, `apple/tiles/closed-wooden-board-tile-reconstruction.png` | закрытая плитка, suggested cell, opening/flip, safe apple, bitten/danger apple |
| Football Penalties | `football/concepts/goalkeeper-green-unassigned.png` | ready, kick, goal/save/miss; модель вратаря generic, не приписывать её реальному футболисту |
| Mines | `gems/approved-mines-scene.png` как канонический backdrop 5×5; интерактивные состояния поверх него | `ready → opening → safe/mine`; не подменять синюю металлическую сцену зелёной CSS-сеткой |

Для Mines в исходном артпаке нет отдельных экспортов tile/crystal/mine. Поэтому canonical 5×5 board использует approved scene backdrop, а клики, safe/mine states и accessibility остаются отдельными DOM-кнопками. Не растягивать этот backdrop на другие размеры поля: для 4×4/6×6 оставлять blue-metal fallback или запрашивать отдельные exports.

## Технические требования

1. Предзагружать изображения через `Image`, но не блокировать первый render. До загрузки сохранять безопасный procedural fallback.
2. Для Canvas ограничить `devicePixelRatio` максимумом 2; не пересоздавать backing store на каждом кадре без изменения размера.
3. Атласы горизонтальные, по одному кадру 384×384. Использовать timing из `public/assets/verdant-artpack/manifest.json`; не заменять crash-анимацию CSS-миганием.
4. Самолёт, propeller, engine glow и VFX должны иметь единый anchor около текущей точки полёта. Crash и sparks должны появляться в последней позиции самолёта и завершаться без бесконечного `requestAnimationFrame`.
5. Уважать `prefers-reduced-motion`: сократить/отключить пространственное движение и оставить читаемое конечное состояние.
6. Все кнопки и игровые ячейки оставить keyboard/touch friendly: touch target не меньше 44×44 px, без горизонтального overflow на 320 px.
7. Не менять серверную механику, расчёты, демо-оговорки, auth, историю, баланс, виртуальные ставки и legal copy.
8. Не добавлять реальные депозиты, выплаты, autoplay, автоматические ставки или обещания выигрыша.

## Проверка готовности

В корне проекта выполнить:

```bash
npm install
node --check public/app.js
npm test
```

Затем вручную проверить в браузере минимум 390×844 и 412×915:

- Aviator: countdown, takeoff/flying, движущийся самолёт с propeller/engine glow/smoke, один crash-взрыв и корректное завершение.
- Chicken Road: минимум один jump и fallen/safe результат; chick и van не перекрывают текст и touch-зоны.
- Apple of Fortune: suggested apple, flip/open, whole и bitten состояния.
- Football Penalties: kick, keeper animation и goal/save/miss; generic keeper не подписан именем реального игрока.
- Overview и все языки не ломают layout.

В финальном отчёте перечислить изменённые файлы, результаты `node --check`/`npm test`, мобильные размеры проверки и оставшиеся ограничения артпака. Не считать standalone concepts полноценными анимационными ригами без новых кадров.
