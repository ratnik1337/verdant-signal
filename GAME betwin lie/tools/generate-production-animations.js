import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'game-art-pack-v0.3', 'game-art-pack');
const OUT = path.join(ROOT, 'game-animations-ready');

const sourceAsset = (relativePath) => path.join(SOURCE, relativePath);
const outputPath = (relativePath) => path.join(OUT, relativePath);

const mkdir = async (dir) => fs.mkdir(dir, { recursive: true });
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function svgBuffer(width, height, body) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
  );
}

function easeOutCubic(t) {
  const x = clamp(t);
  return 1 - ((1 - x) ** 3);
}

function easeInOut(t) {
  const x = clamp(t);
  return x < 0.5 ? 2 * x * x : 1 - (((-2 * x + 2) ** 2) / 2);
}

async function rasterImage(inputPath, options = {}) {
  const {
    canvasW,
    canvasH,
    width,
    height,
    x = canvasW / 2,
    y = canvasH / 2,
    angle = 0,
    opacity = 1,
    flop = false,
    brightness = 1,
    saturation = 1,
  } = options;

  let image = sharp(inputPath)
    .resize({ width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)), fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  if (flop) image = image.flop();
  if (angle) image = image.rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  if (brightness !== 1 || saturation !== 1) image = image.modulate({ brightness, saturation });
  const raw = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (opacity !== 1) {
    for (let index = 3; index < raw.data.length; index += 4) raw.data[index] = Math.round(raw.data[index] * opacity);
  }
  const data = await sharp(raw.data, { raw: { width: raw.info.width, height: raw.info.height, channels: 4 } }).png().toBuffer();
  const info = raw.info;
  const left = Math.round(x - info.width / 2);
  const top = Math.round(y - info.height / 2);
  return { input: data, left, top };
}

async function svgLayer(width, height, body) {
  return { input: await sharp(svgBuffer(width, height, body)).png().toBuffer(), left: 0, top: 0 };
}

async function sceneFrame(canvasW, canvasH, layers) {
  const composites = [];
  for (const layer of layers) {
    if (layer.type === 'svg') composites.push(await svgLayer(canvasW, canvasH, layer.body));
    else composites.push(await rasterImage(layer.input, { canvasW, canvasH, ...layer }));
  }
  return sharp({
    create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite(composites).png().toBuffer();
}

function glow(cx, cy, radius, color, opacity = 0.55) {
  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" opacity="${opacity}" filter="url(#glow)"/>`;
}

function defs() {
  return `<defs><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="7"/></filter><filter id="soft" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.5"/></filter></defs>`;
}

function ringVfx(w, h, t, color = '#9cff00') {
  const p = easeOutCubic(t);
  const r = 18 + 78 * p;
  const opacity = 0.75 * (1 - t);
  return `${defs()}${glow(w / 2, h / 2, r * 0.7, color, opacity * 0.35)}<circle cx="${w / 2}" cy="${h / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${2 + 4 * (1 - t)}" opacity="${opacity}"/><circle cx="${w / 2}" cy="${h / 2}" r="${r * 0.62}" fill="none" stroke="#eaffb8" stroke-width="1" opacity="${opacity * 0.55}"/>`;
}

function sparkVfx(w, h, t, color = '#d7ff62', accent = '#ffb52b') {
  const p = easeOutCubic(t);
  const cx = w / 2;
  const cy = h / 2;
  const alpha = 0.95 * (1 - t);
  const rays = Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 10;
    const inner = 10 + p * 8;
    const outer = 28 + p * 82 + (index % 2) * 14;
    const x1 = cx + Math.cos(angle) * inner;
    const y1 = cy + Math.sin(angle) * inner;
    const x2 = cx + Math.cos(angle) * outer;
    const y2 = cy + Math.sin(angle) * outer;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${index % 3 === 0 ? accent : color}" stroke-width="${index % 3 === 0 ? 4 : 2}" stroke-linecap="round" opacity="${alpha}"/>`;
  }).join('');
  return `${defs()}${glow(cx, cy, 22 + p * 20, accent, alpha * 0.6)}${rays}<circle cx="${cx}" cy="${cy}" r="${8 + p * 14}" fill="#f4ffe4" opacity="${alpha}"/>`;
}

function gemVfx(w, h, t) {
  const p = easeOutCubic(t);
  const s = 0.35 + p * 0.65;
  const cx = w / 2;
  const cy = h / 2;
  const points = `${cx},${cy - 32 * s} ${cx + 25 * s},${cy - 8 * s} ${cx + 17 * s},${cy + 29 * s} ${cx},${cy + 40 * s} ${cx - 17 * s},${cy + 29 * s} ${cx - 25 * s},${cy - 8 * s}`;
  return `${defs()}${glow(cx, cy, 34 * s, '#27d9ff', 0.65 * (1 - t * 0.5))}<polygon points="${points}" fill="#75edff" stroke="#e4ffff" stroke-width="3" opacity="${0.2 + p * 0.8}"/><polygon points="${cx},${cy - 24 * s} ${cx + 14 * s},${cy - 6 * s} ${cx},${cy + 25 * s} ${cx - 14 * s},${cy - 6 * s}" fill="#dffcff" opacity="${0.8 * p}"/>`;
}

function mineVfx(w, h, t) {
  const p = easeOutCubic(t);
  const cx = w / 2;
  const cy = h / 2;
  const rays = Array.from({ length: 12 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 12;
    const inner = 14 + p * 7;
    const outer = 34 + p * 70;
    return `<line x1="${(cx + Math.cos(angle) * inner).toFixed(1)}" y1="${(cy + Math.sin(angle) * inner).toFixed(1)}" x2="${(cx + Math.cos(angle) * outer).toFixed(1)}" y2="${(cy + Math.sin(angle) * outer).toFixed(1)}" stroke="${index % 2 ? '#ff9d35' : '#ff4f32'}" stroke-width="${index % 3 ? 3 : 5}" stroke-linecap="round" opacity="${1 - t}"/>`;
  }).join('');
  return `${defs()}${glow(cx, cy, 36 + p * 18, '#ff4f32', 0.52 * (1 - t))}${rays}<circle cx="${cx}" cy="${cy}" r="${22 + p * 10}" fill="#2d1820" stroke="#ffb52b" stroke-width="4" opacity="${0.35 + p * 0.65}"/><circle cx="${cx - 7}" cy="${cy - 7}" r="${5 + p * 3}" fill="#fff3cc" opacity="${1 - t * 0.6}"/>`;
}

function ballVfx(w, h, t, color = '#f4ffe4', arc = 0) {
  const p = easeInOut(t);
  const cx = 28 + p * (w - 56) + Math.sin(p * Math.PI) * arc;
  const cy = h / 2 + Math.sin(p * Math.PI) * (-18 + Math.abs(arc) * 0.16);
  const r = 14;
  const trail = Array.from({ length: 5 }, (_, index) => {
    const k = (index + 1) / 6;
    return `<line x1="${cx - 18 - k * 34}" y1="${cy + k * 5}" x2="${cx - 18 - k * 8}" y2="${cy + k * 2}" stroke="#b9ed82" stroke-width="${2.5 - k}" stroke-linecap="round" opacity="${0.32 * (1 - k)}"/>`;
  }).join('');
  return `${defs()}${trail}${glow(cx, cy, 20, '#a8ff4d', 0.28)}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#d7ff62" stroke-width="2"/><path d="M ${cx - 5} ${cy - 8} L ${cx + 3} ${cy - 4} L ${cx + 8} ${cy + 4} L ${cx + 1} ${cy + 9} L ${cx - 7} ${cy + 4} Z" fill="none" stroke="#315f39" stroke-width="2" opacity="0.8"/>`;
}

async function writeSheet(frameBuffers, width, height, sheetName) {
  const sheet = sharp({
    create: { width: width * frameBuffers.length, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite(frameBuffers.map((input, index) => ({ input, left: width * index, top: 0 })));
  const out = outputPath(sheetName);
  await mkdir(path.dirname(out));
  await sheet.png().toFile(out);
  return out;
}

async function writeFrames(game, name, spec) {
  const dir = path.join(OUT, game, name);
  const framesDir = path.join(dir, 'frames');
  await mkdir(framesDir);
  const framePaths = [];
  for (let index = 0; index < spec.frames.length; index += 1) {
    const framePath = path.join(framesDir, `frame-${String(index).padStart(2, '0')}.png`);
    await fs.writeFile(framePath, spec.frames[index]);
    framePaths.push(path.relative(OUT, framePath).replaceAll(path.sep, '/'));
  }
  const sheetPath = await writeSheet(spec.frames, spec.frameW, spec.frameH, path.join(game, name, 'sheet.png'));
  const previewPath = await writeSheet(spec.frames.filter((_, i) => i % Math.max(1, Math.floor(spec.frames.length / 6)) === 0), spec.frameW, spec.frameH, path.join(game, name, 'preview-strip.png'));
  return {
    id: `${game.toLowerCase()}_${name.replaceAll('-', '_')}`,
    game,
    name,
    frameSize: [spec.frameW, spec.frameH],
    frames: framePaths,
    frameCount: spec.frames.length,
    fps: spec.fps,
    timingMs: spec.frames.map(() => Math.round(1000 / spec.fps)),
    loop: spec.loop,
    pivot: spec.pivot,
    stateFrom: spec.stateFrom,
    stateTo: spec.stateTo,
    sourceAssets: spec.sourceAssets,
    generatedElements: spec.generatedElements ?? [],
    purpose: spec.purpose,
    spriteSheet: path.relative(OUT, sheetPath).replaceAll(path.sep, '/'),
    preview: path.relative(OUT, previewPath).replaceAll(path.sep, '/'),
  };
}

async function extractAtlasFrames(inputPath, frameW, frameH, count) {
  const frames = [];
  const image = sharp(inputPath);
  for (let index = 0; index < count; index += 1) {
    frames.push(await image.clone().extract({ left: index * frameW, top: 0, width: frameW, height: frameH }).png().toBuffer());
  }
  return frames;
}

function planeLayer(t, options = {}) {
  const { canvasW = 384, canvasH = 384, x = canvasW / 2, y = canvasH / 2, scale = 1, angle = 0 } = options;
  return { input: sourceAsset('aviator/models/plane-body.png'), canvasW, canvasH, width: 230 * scale, height: 157 * scale, x, y, angle };
}

async function generateAviator(manifest) {
  const W = 384; const H = 384;
  const plane = 'aviator/models/plane-body.png';
  const propeller = 'aviator/models/propeller.png';
  const trail = 'aviator/effects-vfx/trail-segment.png';
  const engineGlow = 'aviator/effects-vfx/engine-glow.png';
  const smoke = 'aviator/effects-vfx/after-crash-smoke.png';
  const animations = [];

  animations.push(await writeFrames('Aviator', 'plane-idle', {
    frameW: W, frameH: H, fps: 12, loop: 'loop', pivot: [0.5, 0.55], stateFrom: 'idle', stateTo: 'idle',
    sourceAssets: [plane], purpose: 'Subtle breathing hover; the aircraft remains centered and readable on mobile.',
    frames: await Promise.all(Array.from({ length: 8 }, (_, i) => sceneFrame(W, H, [planeLayer(0, { y: 194 + Math.sin((i / 8) * Math.PI * 2) * 4, scale: 0.92, angle: Math.sin((i / 8) * Math.PI * 2) * 1.4 })]))),
  }));

  animations.push(await writeFrames('Aviator', 'round-launch', {
    frameW: W, frameH: H, fps: 16, loop: 'once', pivot: [0.5, 0.55], stateFrom: 'ready', stateTo: 'takeoff',
    sourceAssets: [plane, propeller, engineGlow, trail], purpose: 'Short wind-up into takeoff with linked propeller, glow and exhaust layers.',
    frames: await Promise.all(Array.from({ length: 10 }, (_, i) => {
      const t = i / 9; const p = easeOutCubic(t);
      return sceneFrame(W, H, [
        { input: sourceAsset(engineGlow), canvasW: W, canvasH: H, width: 88 + p * 12, height: 88 + p * 12, x: 128 - p * 18, y: 202 - p * 10, opacity: 0.35 + p * 0.35 },
        { input: sourceAsset(trail), canvasW: W, canvasH: H, width: 180 + p * 80, height: 45, x: 128 - p * 22, y: 214 - p * 12, opacity: 0.35 + p * 0.4 },
        planeLayer(t, { x: 178 + p * 38, y: 204 - p * 30, scale: 0.84 + p * 0.08, angle: -2 - p * 7 }),
        { input: sourceAsset(propeller), canvasW: W, canvasH: H, width: 82, height: 72, x: 268 + p * 38, y: 186 - p * 30, angle: i * 45 },
      ]);
    })),
  }));

  animations.push(await writeFrames('Aviator', 'flight-loop', {
    frameW: W, frameH: H, fps: 18, loop: 'loop', pivot: [0.5, 0.55], stateFrom: 'flying', stateTo: 'flying',
    sourceAssets: [plane, propeller, engineGlow, trail], purpose: 'Production flight loop: plane rises on an arc while exhaust and propeller keep a separate cadence.',
    frames: await Promise.all(Array.from({ length: 12 }, (_, i) => {
      const t = i / 11; const x = 122 + t * 138; const y = 236 - Math.sin(t * Math.PI * 0.9) * 118; const angle = -7 - t * 8;
      return sceneFrame(W, H, [
        { input: sourceAsset(trail), canvasW: W, canvasH: H, width: 170, height: 42, x: x - 72, y: y + 27, angle: angle * 0.35, opacity: 0.4 },
        { input: sourceAsset(engineGlow), canvasW: W, canvasH: H, width: 76, height: 76, x: x - 55, y: y + 15, opacity: 0.35 + (i % 3) * 0.12 },
        planeLayer(t, { x, y, scale: 0.86, angle }),
        { input: sourceAsset(propeller), canvasW: W, canvasH: H, width: 74, height: 66, x: x + 88, y: y - 16, angle: i * 45 },
      ]);
    })),
  }));

  const crashAtlas = await extractAtlasFrames(sourceAsset('aviator/effects-vfx/plane-crash-explosion-atlas.png'), 384, 384, 8);
  const propellerAtlas = await extractAtlasFrames(sourceAsset('aviator/animations/propeller-spin-atlas.png'), 384, 384, 8);
  const smokeAtlas = await extractAtlasFrames(sourceAsset('aviator/effects-vfx/smoke-trail-atlas.png'), 384, 384, 6);
  const engineAtlas = await extractAtlasFrames(sourceAsset('aviator/effects-vfx/engine-glow-atlas.png'), 384, 384, 6);
  const sparksAtlas = await extractAtlasFrames(sourceAsset('aviator/effects-vfx/crash-sparks-atlas.png'), 384, 384, 6);
  animations.push(await writeFrames('Aviator', 'propeller-spin', { frameW: W, frameH: H, fps: 14, loop: 'loop', pivot: [0.5, 0.5], stateFrom: 'takeoff', stateTo: 'flying', sourceAssets: ['aviator/animations/propeller-spin-atlas.png'], purpose: 'Standalone layer from the supplied propeller atlas for independent plane compositing.', frames: propellerAtlas }));
  animations.push(await writeFrames('Aviator', 'engine-glow-pulse', { frameW: W, frameH: H, fps: 12, loop: 'loop', pivot: [0.5, 0.5], stateFrom: 'takeoff', stateTo: 'flying', sourceAssets: ['aviator/effects-vfx/engine-glow-atlas.png'], purpose: 'Standalone exhaust glow layer from the supplied atlas.', frames: engineAtlas }));
  animations.push(await writeFrames('Aviator', 'smoke-trail-loop', { frameW: W, frameH: H, fps: 12, loop: 'loop', pivot: [0.5, 0.5], stateFrom: 'flying', stateTo: 'flying', sourceAssets: ['aviator/effects-vfx/smoke-trail-atlas.png'], purpose: 'Standalone looping smoke layer from the supplied atlas.', frames: smokeAtlas }));
  animations.push(await writeFrames('Aviator', 'crash-sparks', { frameW: W, frameH: H, fps: 14, loop: 'once', pivot: [0.5, 0.5], stateFrom: 'crashed', stateTo: 'round-ended', sourceAssets: ['aviator/effects-vfx/crash-sparks-atlas.png'], purpose: 'Standalone impact spark layer from the supplied atlas.', frames: sparksAtlas }));
  animations.push(await writeFrames('Aviator', 'crash-explosion', {
    frameW: W, frameH: H, fps: 14, loop: 'once', pivot: [0.5, 0.58], stateFrom: 'flying', stateTo: 'crashed',
    sourceAssets: ['aviator/effects-vfx/plane-crash-explosion-atlas.png'], purpose: 'Existing production explosion atlas extracted into fixed-size frames.', frames: crashAtlas,
  }));

  const smokeFrames = await Promise.all(Array.from({ length: 8 }, (_, i) => {
    const t = i / 7;
    return sceneFrame(W, H, [{ input: sourceAsset(smoke), canvasW: W, canvasH: H, width: 164 + t * 60, height: 110 + t * 38, x: 204 + t * 18, y: 212 - t * 18, angle: -8 + t * 14, opacity: 0.82 * (1 - t * 0.82) }]);
  }));
  animations.push(await writeFrames('Aviator', 'after-crash-dissipate', {
    frameW: W, frameH: H, fps: 12, loop: 'once', pivot: [0.5, 0.58], stateFrom: 'crashed', stateTo: 'round-ended', sourceAssets: [smoke], purpose: 'Residual smoke fades and scales out, leaving the next round clear.', frames: smokeFrames,
  }));
  manifest.push(...animations);
}

async function generateChicken(manifest) {
  const W = 320; const H = 320;
  const chick = 'chicken/models/chick-idle-reconstruction.png';
  const van = 'chicken/obstacles/traffic-van-reconstruction.png';
  const animations = [];
  const chickFrame = (i, count, opts = {}) => {
    const t = i / Math.max(1, count - 1);
    return sceneFrame(W, H, [{ input: sourceAsset(chick), canvasW: W, canvasH: H, width: opts.width ?? 145, height: opts.height ?? 148, x: opts.x ?? 160, y: opts.y ?? (194 + Math.sin(t * Math.PI * 2) * 5), angle: opts.angle ?? Math.sin(t * Math.PI * 2) * 2 }]);
  };
  animations.push(await writeFrames('Chicken', 'chick-idle', { frameW: W, frameH: H, fps: 10, loop: 'loop', pivot: [0.5, 0.93], stateFrom: 'idle', stateTo: 'idle', sourceAssets: [chick], purpose: 'Breathing idle with feather-safe micro motion.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => chickFrame(i, 8))) }));
  animations.push(await writeFrames('Chicken', 'chick-jump-forward', { frameW: W, frameH: H, fps: 14, loop: 'once', pivot: [0.5, 0.93], stateFrom: 'ready', stateTo: 'landed', sourceAssets: [chick], purpose: 'Readably staged hop to the next tile; the ground pivot remains stable.', frames: await Promise.all(Array.from({ length: 10 }, (_, i) => { const t = i / 9; const p = easeInOut(t); return chickFrame(i, 10, { x: 98 + p * 124, y: 210 - Math.sin(p * Math.PI) * 74, width: 145 + Math.sin(p * Math.PI) * 8, height: 148 + Math.sin(p * Math.PI) * 8, angle: -8 + p * 16 }); })) }));
  animations.push(await writeFrames('Chicken', 'chick-success-bounce', { frameW: W, frameH: H, fps: 12, loop: 'once', pivot: [0.5, 0.93], stateFrom: 'landed', stateTo: 'success', sourceAssets: [chick], generatedElements: ['green success ring'], purpose: 'Small celebratory bounce with a restrained signal ring.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => { const t = i / 7; return sceneFrame(W, H, [ { input: sourceAsset(chick), canvasW: W, canvasH: H, width: 148, height: 151, x: 160, y: 198 - Math.sin(t * Math.PI) * 24, angle: Math.sin(t * Math.PI * 2) * 4 }, { type: 'svg', body: ringVfx(W, H, t, '#9cff00') } ]); })) }));
  animations.push(await writeFrames('Chicken', 'chick-danger-reaction', { frameW: W, frameH: H, fps: 14, loop: 'once', pivot: [0.5, 0.93], stateFrom: 'approach', stateTo: 'danger', sourceAssets: [chick, van], purpose: 'Alert recoil and small shake before a traffic collision decision.', frames: await Promise.all(Array.from({ length: 6 }, (_, i) => { const t = i / 5; return sceneFrame(W, H, [ { input: sourceAsset(van), canvasW: W, canvasH: H, width: 170, height: 132, x: 226 - t * 22, y: 226, angle: -2 + t * 4 }, { input: sourceAsset(chick), canvasW: W, canvasH: H, width: 145, height: 148, x: 108 + Math.sin(t * Math.PI * 4) * 7, y: 198, angle: -14 + t * 28 } ]); })) }));
  animations.push(await writeFrames('Chicken', 'chick-fail-fall', { frameW: W, frameH: H, fps: 12, loop: 'once', pivot: [0.5, 0.93], stateFrom: 'danger', stateTo: 'failed', sourceAssets: [chick], generatedElements: ['impact ring'], purpose: 'Soft fail fall with controlled rotation and no hard cut.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => { const t = i / 7; return sceneFrame(W, H, [ { input: sourceAsset(chick), canvasW: W, canvasH: H, width: 145 - t * 8, height: 148 - t * 8, x: 160 + t * 18, y: 198 + t * 70, angle: t * 72, opacity: 1 - t * 0.48 }, { type: 'svg', body: ringVfx(W, H, t, '#ff6f57') } ]); })) }));
  animations.push(await writeFrames('Chicken', 'vehicle-crossing', { frameW: W, frameH: H, fps: 16, loop: 'loop', pivot: [0.5, 0.78], stateFrom: 'road-active', stateTo: 'road-active', sourceAssets: [van], purpose: 'Looping obstacle crossing the lane; use collision boxes from code, not alpha bounds.', frames: await Promise.all(Array.from({ length: 10 }, (_, i) => { const t = i / 9; return sceneFrame(W, H, [{ input: sourceAsset(van), canvasW: W, canvasH: H, width: 170, height: 132, x: -96 + t * 512, y: 236, angle: Math.sin(t * Math.PI * 2) * 1.2 }]); })) }));
  manifest.push(...animations);
}

async function generateApple(manifest) {
  const W = 256; const H = 256;
  const whole = 'apple/objects/apple-whole.png';
  const bitten = 'apple/objects/apple-bitten.png';
  const tile = 'apple/tiles/closed-wooden-board-tile-reconstruction.png';
  const animations = [];
  const apple = (input, i, count, options = {}) => { const t = i / Math.max(1, count - 1); return sceneFrame(W, H, [{ input: sourceAsset(input), canvasW: W, canvasH: H, width: options.width ?? 116, height: options.height ?? 103, x: options.x ?? 128, y: options.y ?? 128, angle: options.angle ?? Math.sin(t * Math.PI * 2) * 2, opacity: options.opacity ?? 1 }]); };
  animations.push(await writeFrames('AppleFortune', 'apple-idle', { frameW: W, frameH: H, fps: 10, loop: 'loop', pivot: [0.5, 0.53], stateFrom: 'closed', stateTo: 'closed', sourceAssets: [whole], purpose: 'Quiet apple idle with a restrained breathing scale.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => { const s = 1 + Math.sin((i / 8) * Math.PI * 2) * 0.035; return apple(whole, i, 8, { width: 116 * s, height: 103 * s }); })) }));
  animations.push(await writeFrames('AppleFortune', 'selection-pulse', { frameW: W, frameH: H, fps: 14, loop: 'once', pivot: [0.5, 0.53], stateFrom: 'closed', stateTo: 'selected', sourceAssets: [whole], generatedElements: ['soft green selection ring'], purpose: 'Selection acknowledgement that leaves result reveal to the following state.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => { const t = i / 7; const s = 0.92 + Math.sin(t * Math.PI) * 0.1; return sceneFrame(W, H, [{ input: sourceAsset(whole), canvasW: W, canvasH: H, width: 116 * s, height: 103 * s, x: 128, y: 128 }, { type: 'svg', body: ringVfx(W, H, t, '#9cff00') }]); })) }));
  animations.push(await writeFrames('AppleFortune', 'safe-reveal', { frameW: W, frameH: H, fps: 16, loop: 'once', pivot: [0.5, 0.53], stateFrom: 'selected', stateTo: 'safe', sourceAssets: [whole], generatedElements: ['green reveal ring'], purpose: 'Clean safe result reveal using the approved whole apple asset.', frames: await Promise.all(Array.from({ length: 10 }, (_, i) => { const t = i / 9; const p = easeOutCubic(t); return sceneFrame(W, H, [{ input: sourceAsset(whole), canvasW: W, canvasH: H, width: 35 + p * 81, height: 31 + p * 72, x: 128, y: 128, angle: -8 + p * 8 }, { type: 'svg', body: ringVfx(W, H, Math.max(0, t - 0.18) / 0.82, '#9cff00') }]); })) }));
  animations.push(await writeFrames('AppleFortune', 'loss-reveal', { frameW: W, frameH: H, fps: 14, loop: 'once', pivot: [0.5, 0.53], stateFrom: 'selected', stateTo: 'loss', sourceAssets: [bitten], generatedElements: ['warm fail ring'], purpose: 'Loss reveal using the approved bitten apple asset; no extra symbols are baked into the art.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => { const t = i / 7; const p = easeOutCubic(t); return sceneFrame(W, H, [{ input: sourceAsset(bitten), canvasW: W, canvasH: H, width: 42 + p * 74, height: 37 + p * 66, x: 128 + Math.sin(t * Math.PI * 4) * 3, y: 128, angle: -5 + p * 5 }, { type: 'svg', body: ringVfx(W, H, t, '#ff6f57') }]); })) }));
  animations.push(await writeFrames('AppleFortune', 'level-transition', { frameW: W, frameH: H, fps: 12, loop: 'once', pivot: [0.5, 0.53], stateFrom: 'safe', stateTo: 'next-level', sourceAssets: [whole, tile], generatedElements: ['green progression ring'], purpose: 'Short transition beat between rows/levels; code should swap the board after completion.', frames: await Promise.all(Array.from({ length: 10 }, (_, i) => { const t = i / 9; return sceneFrame(W, H, [{ input: sourceAsset(tile), canvasW: W, canvasH: H, width: 208, height: 104, x: 128, y: 132, opacity: 0.68 }, { input: sourceAsset(whole), canvasW: W, canvasH: H, width: 108, height: 96, x: 128, y: 126 - Math.sin(t * Math.PI) * 18, angle: Math.sin(t * Math.PI * 2) * 3, opacity: 0.4 + 0.6 * Math.sin(t * Math.PI) }, { type: 'svg', body: ringVfx(W, H, t, '#9cff00') }]); })) }));
  animations.push(await writeFrames('AppleFortune', 'board-reset', { frameW: W, frameH: H, fps: 16, loop: 'once', pivot: [0.5, 0.5], stateFrom: 'round-ended', stateTo: 'closed', sourceAssets: [tile], purpose: 'Neutral tile reset/fade that makes the next board state easy for code to synchronize.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => { const t = i / 7; return sceneFrame(W, H, [{ input: sourceAsset(tile), canvasW: W, canvasH: H, width: 208, height: 104, x: 128, y: 128, opacity: 0.22 + easeInOut(t) * 0.78 }]); })) }));
  manifest.push(...animations);
}

async function generateMines(manifest) {
  const W = 256; const H = 256;
  const reference = sourceAsset('gems/references/approved-mines-scene.png');
  const tilePath = path.join(OUT, 'Mines', 'source-board-tile.png');
  await mkdir(path.dirname(tilePath));
  await sharp(reference).extract({ left: 610, top: 126, width: 70, height: 70 }).resize(168, 168).png().toFile(tilePath);
  const tileInput = tilePath;
  const animations = [];
  const tileFrame = (i, count, overlay = null, opts = {}) => { const t = i / Math.max(1, count - 1); return sceneFrame(W, H, [{ input: tileInput, canvasW: W, canvasH: H, width: opts.width ?? 168, height: opts.height ?? 168, x: 128 + (opts.dx ?? 0), y: 128 + (opts.dy ?? 0), angle: opts.angle ?? 0, opacity: opts.opacity ?? 1 }, ...(overlay ? [{ type: 'svg', body: overlay(t) }] : [])]); };
  animations.push(await writeFrames('Mines', 'tile-idle', { frameW: W, frameH: H, fps: 10, loop: 'loop', pivot: [0.5, 0.5], stateFrom: 'closed', stateTo: 'closed', sourceAssets: ['gems/references/approved-mines-scene.png'], generatedElements: ['cropped closed tile from approved board reference'], purpose: 'Closed-cell idle based on the supplied approved board reference.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => tileFrame(i, 8, null, { width: 168 + Math.sin((i / 8) * Math.PI * 2) * 3, height: 168 + Math.sin((i / 8) * Math.PI * 2) * 3 }))) }));
  animations.push(await writeFrames('Mines', 'tile-press', { frameW: W, frameH: H, fps: 16, loop: 'once', pivot: [0.5, 0.5], stateFrom: 'closed', stateTo: 'opening', sourceAssets: ['gems/references/approved-mines-scene.png'], generatedElements: ['cropped closed tile from approved board reference'], purpose: 'Tactile press compression and release.', frames: await Promise.all(Array.from({ length: 6 }, (_, i) => { const t = i / 5; const p = Math.sin(t * Math.PI); return tileFrame(i, 6, null, { width: 168 - p * 12, height: 168 - p * 12, dy: p * 4 }); })) }));
  animations.push(await writeFrames('Mines', 'gem-open', { frameW: W, frameH: H, fps: 16, loop: 'once', pivot: [0.5, 0.5], stateFrom: 'opening', stateTo: 'safe', sourceAssets: ['gems/references/approved-mines-scene.png'], generatedElements: ['cyan gem drawn as continuation of the supplied blue-crystal palette', 'green/cyan ring'], purpose: 'Safe reveal; the source pack has no isolated crystal export, so the gem is a documented generated element.', frames: await Promise.all(Array.from({ length: 10 }, (_, i) => tileFrame(i, 10, (t) => gemVfx(W, H, t), { width: 168, height: 168 }))) }));
  animations.push(await writeFrames('Mines', 'mine-open', { frameW: W, frameH: H, fps: 14, loop: 'once', pivot: [0.5, 0.5], stateFrom: 'opening', stateTo: 'mine', sourceAssets: ['gems/references/approved-mines-scene.png'], generatedElements: ['orange/red mine symbol drawn because no isolated mine export exists', 'impact rays'], purpose: 'Mine reveal with a compact mobile-safe fail burst.', frames: await Promise.all(Array.from({ length: 10 }, (_, i) => tileFrame(i, 10, (t) => mineVfx(W, H, t))) ) }));
  animations.push(await writeFrames('Mines', 'round-complete-reset', { frameW: W, frameH: H, fps: 12, loop: 'once', pivot: [0.5, 0.5], stateFrom: 'safe-or-mine', stateTo: 'reset', sourceAssets: ['gems/references/approved-mines-scene.png'], generatedElements: ['signal reset ring'], purpose: 'Round-end fade to a clean closed-cell state.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => tileFrame(i, 8, (t) => ringVfx(W, H, t, '#9cff00'), { opacity: 1 - i / 9 }))) }));
  manifest.push(...animations);
}

async function generateFootball(manifest) {
  const W = 384; const H = 384;
  const keeper = 'football/concepts/goalkeeper-green-unassigned.png';
  const animations = [];
  const keeperFrame = (i, count, opts = {}) => { const t = i / Math.max(1, count - 1); return sceneFrame(W, H, [{ input: sourceAsset(keeper), canvasW: W, canvasH: H, width: opts.width ?? 146, height: opts.height ?? 220, x: opts.x ?? 192, y: opts.y ?? 258, angle: opts.angle ?? 0, flop: opts.flop ?? false }]); };
  animations.push(await writeFrames('FootballPenalties', 'goalkeeper-idle', { frameW: W, frameH: H, fps: 10, loop: 'loop', pivot: [0.5, 1], stateFrom: 'ready', stateTo: 'ready', sourceAssets: [keeper], purpose: 'Keeper breathing stance based on the only supplied football character asset.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => keeperFrame(i, 8, { y: 258 + Math.sin((i / 8) * Math.PI * 2) * 3, angle: Math.sin((i / 8) * Math.PI * 2) * 1.1 }))) }));
  animations.push(await writeFrames('FootballPenalties', 'shot-prep', { frameW: W, frameH: H, fps: 12, loop: 'once', pivot: [0.5, 1], stateFrom: 'ready', stateTo: 'shot-ready', sourceAssets: [keeper], generatedElements: ['neutral shot marker'], purpose: 'Neutral preparation beat; no kicker model exists in the source pack.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => sceneFrame(W, H, [{ input: sourceAsset(keeper), canvasW: W, canvasH: H, width: 146, height: 220, x: 192, y: 258, angle: -2 + (i / 7) * 4 }, { type: 'svg', body: ringVfx(W, H, 0.15 + (i / 7) * 0.5, '#9cff00') }]))) }));
  for (const direction of ['left', 'center', 'right']) {
    const sign = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
    animations.push(await writeFrames('FootballPenalties', `ball-flight-${direction}`, { frameW: W, frameH: H, fps: 18, loop: 'once', pivot: [0.5, 0.5], stateFrom: 'shot-ready', stateTo: 'ball-arrived', sourceAssets: [], generatedElements: ['neutral football marker drawn because the archive has no isolated ball asset', 'motion trail'], purpose: `Ball trajectory variant (${direction}); final outcome is chosen by game logic.`, frames: await Promise.all(Array.from({ length: 12 }, (_, i) => { const t = i / 11; const curve = direction === 'center' ? 0 : sign * 80; return sceneFrame(W, H, [{ type: 'svg', body: ballVfx(W, H, t, '#f4ffe4', curve) }, { input: sourceAsset(keeper), canvasW: W, canvasH: H, width: 146, height: 220, x: 192, y: 258, angle: 0 }]); })) }));
  }
  animations.push(await writeFrames('FootballPenalties', 'goalkeeper-save-left', { frameW: W, frameH: H, fps: 16, loop: 'once', pivot: [0.5, 1], stateFrom: 'shot-ready', stateTo: 'save', sourceAssets: [keeper], generatedElements: ['ball marker and save burst'], purpose: 'Left dive and save endpoint using a mirrored/rotated version of the supplied keeper concept.', frames: await Promise.all(Array.from({ length: 10 }, (_, i) => { const t = i / 9; const p = easeOutCubic(t); return sceneFrame(W, H, [{ input: sourceAsset(keeper), canvasW: W, canvasH: H, width: 146 + p * 24, height: 220 + p * 24, x: 192 - p * 80, y: 258 + p * 18, angle: -18 - p * 38 }, { type: 'svg', body: `${ballVfx(W, H, Math.min(1, t + 0.2))}${sparkVfx(W, H, t, '#d7ff62', '#9cff00')}` }]); })) }));
  animations.push(await writeFrames('FootballPenalties', 'goalkeeper-save-right', { frameW: W, frameH: H, fps: 16, loop: 'once', pivot: [0.5, 1], stateFrom: 'shot-ready', stateTo: 'save', sourceAssets: [keeper], generatedElements: ['ball marker and save burst'], purpose: 'Right dive and save endpoint using a mirrored/rotated version of the supplied keeper concept.', frames: await Promise.all(Array.from({ length: 10 }, (_, i) => { const t = i / 9; const p = easeOutCubic(t); return sceneFrame(W, H, [{ input: sourceAsset(keeper), canvasW: W, canvasH: H, width: 146 + p * 24, height: 220 + p * 24, x: 192 + p * 80, y: 258 + p * 18, angle: 18 + p * 38, flop: true }, { type: 'svg', body: `${ballVfx(W, H, Math.min(1, t + 0.2))}${sparkVfx(W, H, t, '#d7ff62', '#9cff00')}` }]); })) }));
  animations.push(await writeFrames('FootballPenalties', 'goal-result', { frameW: W, frameH: H, fps: 12, loop: 'once', pivot: [0.5, 1], stateFrom: 'ball-arrived', stateTo: 'goal', sourceAssets: [keeper], generatedElements: ['green goal burst', 'neutral ball marker'], purpose: 'Goal result with the keeper holding scene space and a compact success VFX.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => sceneFrame(W, H, [{ input: sourceAsset(keeper), canvasW: W, canvasH: H, width: 146, height: 220, x: 192, y: 258, angle: Math.sin((i / 7) * Math.PI * 2) * 3 }, { type: 'svg', body: `${ballVfx(W, H, 0.98)}${ringVfx(W, H, i / 7, '#9cff00')}` }]))) }));
  animations.push(await writeFrames('FootballPenalties', 'miss-result', { frameW: W, frameH: H, fps: 12, loop: 'once', pivot: [0.5, 1], stateFrom: 'ball-arrived', stateTo: 'miss', sourceAssets: [keeper], generatedElements: ['neutral ball marker', 'amber miss accent'], purpose: 'Miss endpoint with no baked-in text or score.', frames: await Promise.all(Array.from({ length: 8 }, (_, i) => sceneFrame(W, H, [{ input: sourceAsset(keeper), canvasW: W, canvasH: H, width: 146, height: 220, x: 192, y: 258, angle: -3 + (i / 7) * 6 }, { type: 'svg', body: ballVfx(W, H, 1) + ringVfx(W, H, i / 7, '#ffb52b') }]))) }));
  manifest.push(...animations);
}

async function writeGameGallery(game, animations) {
  const width = 960;
  const cardW = 300;
  const cardH = 220;
  const rows = Math.ceil(animations.length / 3);
  const body = [];
  for (let index = 0; index < animations.length; index += 1) {
    const animation = animations[index];
    const row = Math.floor(index / 3); const col = index % 3;
    const x = col * cardW; const y = row * cardH;
    const strip = await sharp(path.join(OUT, animation.preview)).resize({ width: cardW - 36, height: 112, fit: 'inside' }).png().toBuffer();
    body.push(`<rect x="${x + 8}" y="${y + 8}" width="${cardW - 16}" height="${cardH - 16}" rx="12" fill="#13251c" stroke="#365b42"/><text x="${x + 20}" y="${y + 34}" fill="#efffe8" font-family="Arial" font-size="15" font-weight="700">${animation.name}</text><text x="${x + 20}" y="${y + 55}" fill="#a7c3a5" font-family="Arial" font-size="11">${animation.frameCount} frames · ${animation.fps} fps · ${animation.loop}</text><image href="data:image/png;base64,${strip.toString('base64')}" x="${x + 18}" y="${y + 70}" width="${cardW - 36}" height="112" preserveAspectRatio="xMidYMid meet"/><text x="${x + 20}" y="${y + 198}" fill="#9cff00" font-family="Arial" font-size="10">ordered preview strip →</text>`);
  }
  const out = outputPath(path.join(game, 'preview', 'contact-sheet.png'));
  await mkdir(path.dirname(out));
  await sharp(svgBuffer(width, rows * cardH, `<rect width="100%" height="100%" fill="#0b1711"/>${body.join('')}`)).png().toFile(out);
  return path.relative(OUT, out).replaceAll(path.sep, '/');
}

async function writeHtmlGallery(games, manifest) {
  await mkdir(outputPath('preview'));
  const rel = (value) => `../${value}`;
  const cards = games.map((game) => `<section><h2>${game}</h2><img src="${rel(manifest.galleries[game])}" alt="${game} animation contact sheet" loading="lazy"/><div class="grid">${manifest.animations.filter((a) => a.game === game).map((a) => `<article><h3>${a.name}</h3><img src="${rel(a.preview)}" alt="${a.name} preview" loading="lazy"/><p>${a.frameCount} frames · ${a.fps} fps · ${a.loop}</p></article>`).join('')}</div></section>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><title>Verdant Signal production animations</title><style>body{margin:0;background:#0b1711;color:#efffe8;font:14px system-ui,sans-serif;padding:24px}h1{font-size:28px}h2{margin-top:42px;color:#9cff00}section{max-width:1200px;margin:auto}section>img{width:100%;max-width:960px;border:1px solid #365b42;border-radius:14px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px}article{background:#13251c;border:1px solid #365b42;border-radius:12px;padding:10px}article h3{font-size:13px;margin:0 0 8px}article img{width:100%;background:#09110d;border-radius:8px}article p{color:#a7c3a5;font-size:11px;margin:8px 0 0}</style><h1>Verdant Signal · production animation handoff</h1><p>PNG frame sequences and sprite sheets generated from game-art-pack-v0.3. No application code is modified.</p>${cards}`;
  await fs.writeFile(outputPath('preview/index.html'), html, 'utf8');
}

async function main() {
  await mkdir(OUT);
  const animations = [];
  await generateAviator(animations);
  await generateChicken(animations);
  await generateApple(animations);
  await generateMines(animations);
  await generateFootball(animations);
  const games = ['Aviator', 'Chicken', 'AppleFortune', 'Mines', 'FootballPenalties'];
  const galleries = {};
  for (const game of games) galleries[game] = await writeGameGallery(game, animations.filter((animation) => animation.game === game));
  const manifest = {
    package: 'Verdant Signal production animation handoff',
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    sourceArchive: 'game-art-pack-v0.3.zip',
    sourceRoot: 'game-art-pack-v0.3/game-art-pack',
    outputUnits: 'PNG RGBA frames + horizontal PNG sprite sheets',
    frameContract: 'Every sequence has fixed-size frames and uses normalized pivot coordinates. Do not infer collision boxes from transparent pixels.',
    games,
    galleries,
    animations: animations.map((animation) => ({ ...animation, preview: animation.preview, spriteSheet: animation.spriteSheet })),
    missingSourceNotes: [
      'The source pack contains no isolated footballer/kicker model; shot-prep is neutral and the keeper is the only supplied football character.',
      'The source pack contains no isolated football ball export; ball-flight uses a generated neutral ball marker and motion trail.',
      'The source pack contains no isolated Mines crystal or mine export; gem-open and mine-open use documented generated symbols over a cropped tile from the approved Mines reference.',
      'Chicken and Football character exports are still/concept images; motion is transform-based and does not claim new skeletal detail.',
    ],
  };
  await fs.writeFile(outputPath('manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  await writeHtmlGallery(games, manifest);
  await fs.writeFile(outputPath('README.md'), '# Verdant Signal production animations\n\nGenerated from `game-art-pack-v0.3.zip`. Start with [preview/index.html](preview/index.html), then use [manifest.json](manifest.json) for integration.\n\nThe original archive and source art are preserved. This folder contains derived PNG frames, sheets and preview-only contact sheets.\n', 'utf8');
  console.log(JSON.stringify({ output: OUT, animations: animations.length, frames: animations.reduce((sum, item) => sum + item.frameCount, 0), galleries }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
