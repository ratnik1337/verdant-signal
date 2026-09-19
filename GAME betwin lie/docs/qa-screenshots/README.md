# Verdant Signal art pipeline QA preview

These durable preview references correspond to the Chrome DevTools visual pass on 2026-09-12.

Open the running app and use the live scenes:

- [Aviator + art debug](http://localhost:3000/?art-debug=1)
- [Main workspace](http://localhost:3000/)

The browser pass captured and inspected each scene at approximately 390 px: Aviator ready/crash, Chicken Road jump, Apple safe/danger, Mines safe/mine, and Football keeper/ball. Additional viewport checks were run at 320, 360, 412, 768 and 1440 px.

`scene-preview.html` is a file-based asset preview for the exact runtime PNG/atlas files. It does not replace the interactive application.
