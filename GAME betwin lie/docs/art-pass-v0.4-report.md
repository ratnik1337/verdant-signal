# Art pass v0.4 — corrected scene integration

## Что исправлено

- Aviator: HUD вынесен из траектории самолёта; plane, propeller, engine glow, smoke и trail используют одну локальную систему anchor/pivot. Crash и sparks запускаются в последней позиции самолёта, тело самолёта затухает, затем остаётся after-crash smoke.
- Animation loop получил generation guard. При переходах `jump → fall`, `kick → reaction` и смене игры старый `requestAnimationFrame` не может запустить второй цикл.
- Chicken Road: добавлена отдельная стартовая точка перед первой плиткой и пять центров плиток; фургон больше не масштабируется до миниатюры; прыжок и падение управляются только сценовым JS.
- Apple of Fortune: состояния open/safe/danger сохраняются на уровне отдельной ячейки; деревянный tile не двигает весь board.
- Football Penalties: полёт мяча и реакция goalkeeper разделены на две последовательные фазы; generic goalkeeper остаётся generic и не получает имя реального игрока.
- Mines: canonical 5×5 board теперь использует `public/assets/verdant-artpack/gems/approved-mines-scene.png`, то есть синюю металлическую сцену из `gems/references/approved-mines-scene.png`. Поверх неё находятся доступные DOM-кнопки и safe/mine states. Для 4×4 и 6×6 используется blue-metal fallback, потому что отдельных tile/crystal/mine exports в исходном пакете нет.

## Ограничения артпака

Только Aviator содержит настоящие frame atlases. Chicken, Apple и Football используют одиночные прозрачные PNG с аккуратным transform motion, а не полноценные покадровые риги. Mines не имеет отдельных исходных игровых текстур; approved scene используется как честный визуальный backdrop до появления таких exports.

## Проверки

- `node --check public/app.js` — passed.
- `node --check public/admin.js` — passed.
- `jq empty public/assets/verdant-artpack/manifest.json` — passed.
- Новые и ключевые runtime PNG присутствуют в `public/assets/verdant-artpack/`.
- `npm test` в текущем Linux workspace нельзя выполнить на архивном `node_modules`: `better_sqlite3.node` был собран под Windows (`PE32+`, ошибка `invalid ELF header`). Перед запуском выполнить `npm install` на целевой платформе; `node_modules` в distribution archive не включается.
