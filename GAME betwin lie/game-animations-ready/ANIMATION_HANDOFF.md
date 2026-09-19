# Animation handoff — аудит и состояние готовности

## Итог аудита

В исходнике найдено 82 файла: 17 прямо используемых PNG-источников клипов, оставшиеся исходные картинки/атласы/скриншоты/документы и превью перечислены в `ASSET_AUDIT.csv`. Кадры всех 35 имеющихся клипов собраны в PNG RGBA; каждому клипу добавлен `metadata.json`. Пути исходных PNG, использованных клипами, теперь доступны внутри этого архива в `SourceArt/`.

Пакет **не является полным production-ready набором для пяти игр**. Это технически стандартизованный first pass. Наиболее близки к интеграции Aviator и Apple Fortune после калибровки сценовых якорей. Chicken использует трансформацию одного неподвижного изображения. Mines и Football содержат временные placeholders и должны быть заменены чистыми игровыми моделями до production. Смотрите `REQUESTED_COVERAGE.json` для точного покрытия каждого запрошенного действия.

## Что взято из исходника

- **Aviator:** отдельные body и propeller, пропеллер/glow/smoke/sparks/explosion atlases, trail segment и after-crash smoke. Исходник сам отмечает, что крепление и масштаб в сцене не откалиброваны.
- **Chicken:** реконструированные idle chick и traffic van. В исходнике нет отдельного референса Chicken Road.
- **Apple Fortune:** whole/bitten apple и реконструированная blank wooden tile; character concepts сохранены в исходнике, но клипами не используются.
- **Mines:** скриншот одобренной сцены используется как визуальная основа для технического crop; отдельные чистые исходники клетки, кристалла и мины отсутствуют.
- **Football:** один generic keeper concept без назначения игроку/личности.

Полные размеры, alpha, вид камеры, опора, предполагаемый pivot, прямое использование и необходимые доработки — в `ASSET_AUDIT.csv`. Зависимости между исходниками и клипами — в `ASSET_DEPENDENCIES.md`.

## GENERATED и реконструкции

GENERATED элементы и их provenance записаны в `manifest.json` и каждом `metadata.json`. Сгенерированными/производными являются композиты и transform-motion кадров, Chicken success/fail rings, Apple selection/reveal/transition rings, Mines gem/mine icons и impact rings, Football ball marker/trails/result bursts. Они не являются исходными ассетами и не подтверждают физический контакт или игровое событие. Реконструированные chick, van, wooden tile и mountain ridge помечены как реконструкции в аудите.

## Ассеты, которые нельзя подключать напрямую

1. Любые файлы в `SourceArt/sources/references/`, `SourceArt/previews/` и `SourceArt/gems/references/` — скриншоты/preview, а не игровые PNG.
2. `plane-and-propeller-source.png` — исходный лист двух элементов; для runtime предназначены отдельные слои.
3. Цельные кадры Chicken и Football — трансформационная анимация целой картинки; это не покадровая рисованная или skeletal-анимация.
4. Mines tiles/gem/mine и все Football ball/result markers — временный placeholder.
5. Любой atlas — только после выборки кадров; сам atlas целиком не является кадром.

## Покрытие клипов

Текущие клипы, их начальное и конечное состояния, FPS, loop, длительность, pivot, anchors, source/generated элементы указаны в `manifest.json` и `*/<clip>/metadata.json`. `REQUESTED_COVERAGE.json` явно перечисляет все запрошенные действия и отмечает `present`, `partial` или `missing`. Не найденные клипы не подменены фиктивными файлами.

Важные quality notes:

- `Chicken/vehicle-crossing`: первый и последний кадры полностью прозрачны: это предусмотренный offscreen-въезд/выезд. Loop применим, если рендерить весь фиксированный canvas; пустой промежуток соединяет выезд с новым въездом. Для событийного пересечения используйте one-shot и запускайте клип игровым таймером.
- `Aviator/flight-loop`: крайние кадры касаются границы canvas; проверить обрезку на целевом размере.
- Football flight/save клипы — placeholder-демонстрации; marker не является мячом, успешный контакт с руками не доказан.
- Пивоты и attachment anchors — оценки по видимым объектам. Нужна проверка в исходной responsive-сцене; в проекте игры этих файлов не было, поэтому live scene validation невозможен.

## Runtime playback

```js
const pack = await fetch('/assets/game-animations-ready/manifest.json').then(r => r.json());
const clip = pack.animations.find(x => x.id === 'aviator_flight_loop');
const sheet = new Image();
sheet.src = `/assets/game-animations-ready/${clip.spriteSheet}`;
const frame = Math.floor(elapsedMs / (1000 / clip.fps)) % clip.frameCount;
const [fw, fh] = clip.frameSize;
ctx.drawImage(sheet, frame * fw, 0, fw, fh,
  x - clip.pivot[0] * drawWidth, y - clip.pivot[1] * drawHeight, drawWidth, drawHeight);
```

При one-shot использовать индекс `Math.min(Math.floor(elapsedMs / (1000 / clip.fps)), clip.frameCount - 1)` и переключать состояние после `durationMs`. Плейсхолдеры Mines/Football и неподтверждённые anchors не следует выпускать в production без замены/проверки.

## Автоматическая проверка

Запуск из распакованной папки `game-animations-ready`: `python3 tools/validate_pack.py`. Скрипт проверяет валидность JSON, существование файлов manifest, одинаковый размер и RGBA для каждого набора кадров, совпадение sheet с количеством кадров, preview/meta пути, прозрачные кадры и все bundled source assets. Прозрачные кадры отмечены в metadata; неожиданно пустые кадры приводят к ошибке.

Контрольный список:

- [x] все 35 клипов имеют фиксированный размер кадров и alpha RGBA;
- [x] sheet и preview присутствуют для каждого клипа;
- [x] добавлен отдельный metadata JSON для каждого клипа;
- [x] все заявленные в клипах source assets включены в архив;
- [x] JSON/пути/PNG проверяются автоматически;
- [x] известные прозрачные/обрезанные кадры отмечены;
- [ ] монтаж plane/propeller/engine/trail откалиброван в проекте;
- [ ] foot contacts, tile joins и runtime event transitions проверены в живой игре;
- [ ] отсутствующие персонажи/модели/VFX заменены финальным артом;
- [ ] вся анимация в пяти режимах принята визуально на целевом мобильном viewport.
