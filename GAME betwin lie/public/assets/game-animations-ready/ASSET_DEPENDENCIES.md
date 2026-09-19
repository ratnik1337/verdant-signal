# Связи исходников и клипов

| Режим | Исходные элементы | Производные клипы | GENERATED / реконструкции | Что проверить или чего не хватает |
|---|---|---|---|---|
| Aviator | `aviator/models/plane-body.png`, `propeller.png`; propeller/glow/smoke/sparks/explosion atlases; trail segment | 9 клипов: самолёт, запуск, полёт, пропеллер, свечение, дым, искры, взрыв, остаточный дым | монтажные композиты из исходных слоёв; часть кадров уже слита | точка крепления винта и следа; траектория и место аварии в сцене; `loss_of_control`, `round_reset` отсутствуют |
| Chicken | одна реконструкция цыплёнка и одна реконструкция фургона | 6 клипов | success/fail rings; трансформация одного still-спрайта | нет специализированного референса, дорожных плиток/теней, anticipation/landing poses и `road_reset` |
| Apple Fortune | цельное/надкусанное яблоко; реконструированная деревянная клетка | 6 клипов | selection/reveal/progression rings | адаптивные стыки доски и тень яблока не экспортированы; нет отдельного `win_pulse` |
| Mines | только screenshot сцены как визуальный источник | 5 клипов | tile crop, cyan gem, orange mine, rings/impact | tile crop — не чистый sprite; нет исходных tile/gem/mine/VFX; клипы только placeholders |
| Football Penalties | один generic keeper concept | 9 клипов | ball marker, trail, result bursts; keeper transform variants | нет kicker, футбольного мяча, ворот/сетки/поля и трёх моделей игроков; нет проверки контакта/сейва |

Имена `sourceAssets` в manifest указывают исходные относительные пути; соответствующие файлы включены в архив под `SourceArt/`. Положения anchors в metadata являются визуальными оценками до интеграции, а не калиброванными игровыми координатами.
