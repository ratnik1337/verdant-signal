(function () {
  'use strict';

  const dictionaries = window.VERDANT_TRANSLATIONS || {};
  const locales = ['en', 'ru', 'uk', 'pl', 'es', 'pt', 'de', 'fr', 'it', 'tr', 'ar'];
  const games = ['aviator', 'chicken-road', 'apple-of-fortune', 'mines', 'football-penalties'];
  const APPLE_MULTIPLIERS = ['1.23', '1.54', '1.93', '2.41', '4.02', '6.71', '11.18', '27.97', '69.93', '349.68'];
  const APPLE_STAKES = [10, 50, 100, 500, 1000, 5000];
  const appleFallbackRows = () => APPLE_MULTIPLIERS.map((multiplier, index) => ({ level: index + 1, recommendedCell: (index % 5) + 1, multiplier: `x${multiplier}` }));
  const ART_ROOT = '/assets/verdant-artpack';
  const PACKAGE_ART_ROOT = '/assets/game-animations-ready/SourceArt';
  const LOCAL_GAME_ROOT = '/assets/local-games';
  const GAME_VIDEO_ROOT = '/assets/game-videos';
  const MINES_SIGNAL_ART = {
    reveal: '/assets/mines-signals/diamond-reveal-spritesheet.png',
    close: '/assets/mines-signals/diamond-close-preview.gif',
    bomb: '/assets/mines-signals/bomb-explosion-spritesheet.png',
  };
  const MINES_ANIMATIONS = {
    reveal: { frames: 12, columns: 4, rows: 3, frameDuration: 55 },
    bomb: { frames: 31, columns: 4, rows: 8, frameDuration: 55 },
    closeDuration: 650,
  };
  const GAME_VIDEO_OUTCOMES = {
    aviator: [
      ['x1.11.mp4', 1.11, 180], ['x1.36.mp4', 1.36, 170], ['x1.43.mp4', 1.43, 145],
      ['x1.65.mp4', 1.65, 125], ['x1.89.mp4', 1.89, 105], ['x1.99.mp4', 1.99, 90],
      ['x2.18.mp4', 2.18, 75], ['x2.23.mp4', 2.23, 60], ['x2.56.mp4', 2.56, 45],
      ['x2.96.mp4', 2.96, 30], ['x3.63.mp4', 3.63, 18], ['x4.98.mp4', 4.98, 9],
      ['x10.53.mp4', 10.53, 2],
    ],
    'chicken-road': [
      ['x1.28.mp4', 1.28, 36, 2], ['x1.47.mp4', 1.47, 30, 3], ['x2.76.mp4', 2.76, 19, 4],
      ['x4.03.mp4', 4.03, 10, 5], ['x6.91.mp4', 6.91, 5, 6],
    ],
    'football-penalties': [
      ['x1.02.mp4', 1.02, 32], ['x1.38.mp4', 1.38, 26], ['1.68.mp4', 1.68, 18],
      ['x1.81.mp4', 1.81, 12], ['x2.6.mp4', 2.6, 8], ['x3.36.mp4', 3.36, 4],
    ],
  };
  const VIDEO_GAMES = new Set(Object.keys(GAME_VIDEO_OUTCOMES));
  const LOCAL_GAME_ART = {
    aviator: {
      background: `${LOCAL_GAME_ROOT}/aviator/background.webp`,
      logo: `${LOCAL_GAME_ROOT}/aviator/logo.webp`,
      planeAtlas: `${LOCAL_GAME_ROOT}/aviator/plane.webp`,
    },
    chicken: {
      logo: `${LOCAL_GAME_ROOT}/chicken-road/logo.svg`,
      idle: `${LOCAL_GAME_ROOT}/chicken-road/chicken-idle.png`,
      jump: `${LOCAL_GAME_ROOT}/chicken-road/chicken-jump.png`,
      dead: `${LOCAL_GAME_ROOT}/chicken-road/chicken-dead.png`,
      decors: `${LOCAL_GAME_ROOT}/chicken-road/decors.png`,
    },
    mines: {
      background: `${LOCAL_GAME_ROOT}/mines/background.jpg`,
      logo: `${LOCAL_GAME_ROOT}/mines/logo.png`,
      cell: `${LOCAL_GAME_ROOT}/mines/cell.png`,
      gem: `${LOCAL_GAME_ROOT}/mines/gem.png`,
      mine: `${LOCAL_GAME_ROOT}/mines/mine.png`,
    },
    football: {
      background: `${LOCAL_GAME_ROOT}/football/background.jpg`,
      logo: `${LOCAL_GAME_ROOT}/football/logo.png`,
      goalkeeper: `${LOCAL_GAME_ROOT}/football/goalkeeper.png`,
      ball: `${LOCAL_GAME_ROOT}/football/ball.png`,
    },
  };
  // The supplied Aviator launch/flight sheets are flattened composites with baked-in motion.
  // The scene must own position and rotation, otherwise the composite and the scene path fight.
  const AVIATOR_USE_FLATTENED_COMPOSITE = false;

  const ART = {
    aviator: {
      plane: `${PACKAGE_ART_ROOT}/aviator/models/plane-body.png`,
      // Exact user-supplied final aircraft. The propeller is part of this same transparent image.
      aircraftComposite: '/assets/generated/aviator-aircraft-user.png',
      mountain: `${ART_ROOT}/aviator/backgrounds/mountain-ridge-layer-reconstruction.png`,
      trail: `${PACKAGE_ART_ROOT}/aviator/effects-vfx/trail-segment.png`,
      propeller: `${PACKAGE_ART_ROOT}/aviator/animations/propeller-spin-atlas.png`,
      engineGlow: `${PACKAGE_ART_ROOT}/aviator/effects-vfx/engine-glow-atlas.png`,
      smoke: `${PACKAGE_ART_ROOT}/aviator/effects-vfx/smoke-trail-atlas.png`,
      sparks: `${PACKAGE_ART_ROOT}/aviator/effects-vfx/crash-sparks-atlas.png`,
      crash: `${PACKAGE_ART_ROOT}/aviator/effects-vfx/plane-crash-explosion-atlas.png`,
      afterSmoke: `${PACKAGE_ART_ROOT}/aviator/effects-vfx/after-crash-smoke.png`,
    },
    chicken: {
      chick: `${ART_ROOT}/chicken/models/chick-idle-reconstruction.png`,
      van: `${ART_ROOT}/chicken/obstacles/traffic-van-reconstruction.png`,
    },
    apple: {
      whole: `${ART_ROOT}/apple/objects/apple-whole.png`,
      bitten: `${ART_ROOT}/apple/objects/apple-bitten.png`,
      tile: `${ART_ROOT}/apple/tiles/closed-wooden-board-tile-reconstruction.png`,
      background: '/images/apple-fortune/background.png',
      queen: '/images/apple-fortune/evil-queen.png',
      snowWhite: '/images/apple-fortune/snow-white.png',
      logo: '/images/apple-fortune/logo.png',
      vine: '/images/apple-fortune/vine-corner.png',
    },
    football: {
      goalkeeper: `${ART_ROOT}/football/concepts/goalkeeper-green-unassigned.png`,
      // The pack has no isolated ball export; this is a purpose-built technical asset (stitched panels,
      // shading), not a text glyph or bare CSS circle standing in for the game object.
      ball: '/assets/generated/football-ball.svg',
    },
    mines: {
      approvedScene: `${ART_ROOT}/gems/approved-mines-scene.png`,
      // The pack ships one approved backdrop only (no isolated crystal/bomb exports, see manifest
      // "limitations"). These two are technical assets built for this project in the same blue-metal
      // language as the backdrop: a faceted gem and a fused bomb, both real layered art, not glyphs.
      diamond: '/assets/generated/mines-diamond.svg',
      bomb: '/assets/generated/mines-bomb.svg',
    },
  };

  const ATLAS = {
    propeller: { frameCount: 8, frameWidth: 384, frameHeight: 384, durations: [60, 60, 60, 60, 60, 60, 60, 60], loop: true },
    engineGlow: { frameCount: 6, frameWidth: 384, frameHeight: 384, durations: [80, 80, 80, 80, 80, 80], loop: true },
    smoke: { frameCount: 6, frameWidth: 384, frameHeight: 384, durations: [80, 80, 80, 80, 100, 120], loop: true },
    sparks: { frameCount: 6, frameWidth: 384, frameHeight: 384, durations: [50, 50, 60, 80, 100, 120], loop: false },
    // The supplied atlas has a purple stray artifact in frame 8; stop on the authored smoke
    // frame 7 and hand off to afterSmoke instead of ever presenting that unrelated pixel layer.
    crash: { frameCount: 7, frameWidth: 384, frameHeight: 384, durations: [50, 50, 60, 70, 80, 100, 120], loop: false },
  };

  // Scene coordinates calibrated against the transparent plane-body.png (955x650): the nose /
  // engine cowling sits at roughly (0.93, 0.38) on the right, the tail fin at (0.05, 0.55) on the
  // left. Every anchor below is expressed as a fraction of the plane's own bounding box so it
  // stays correct at any render scale.
  const AVIATOR_ANCHORS = {
    plane: { x: 0.50, y: 0.51, scale: 1, pivot: { x: 0.50, y: 0.51 } },
    // Nose tip, just ahead of the cowling opening: propeller reads as mounted on the front of the aircraft.
    propeller: { x: 0.91, y: 0.40, scale: 0.50, pivot: { x: 0.50, y: 0.50 } },
    // Engine cowling itself, drawn BEHIND the body (see draw order) so the halo bleeds out around the nose.
    engineGlow: { x: 0.80, y: 0.39, scale: 0.62, pivot: { x: 0.50, y: 0.50 } },
    // Tail end: smoke and the trail ribbon both originate behind the aircraft, not the nose.
    smoke: { x: 0.06, y: 0.58, scale: 0.56, pivot: { x: 0.50, y: 0.50 } },
    trail: { x: 0.06, y: 0.58, scale: 0.92, pivot: { x: 0.50, y: 0.50 } },
    crash: { x: 0.50, y: 0.50, scale: 1, pivot: { x: 0.50, y: 0.50 } },
  };

  const CHICKEN_SCENE = {
    // Six anchors: the chick starts clear of tile 1, then lands on each of the five tile centers.
    // Tile centers are derived from the 5-column grid (12px insets, 9px gaps) so every jump,
    // including the first, covers a real, visible distance.
    stepAnchors: [0.025, 0.115, 0.285, 0.455, 0.625, 0.795],
    chickPivot: { x: 0.50, y: 0.93 },
    vanAnchor: { x: 0.92, y: 0.58, scale: 1, pivot: { x: 0.50, y: 0.78 } },
  };

  const FOOTBALL_SCENE = {
    keeperAnchor: { x: 0.50, y: 0.98, pivot: { x: 0.50, y: 1.00 } },
    ballStart: { x: 0.13, y: 0.91 },
    ballTargets: [
      { x: 0.18, y: 0.34 },
      { x: 0.34, y: 0.42 },
      { x: 0.50, y: 0.48 },
      { x: 0.66, y: 0.42 },
      { x: 0.82, y: 0.34 },
    ],
  };

  const artImageCache = new Map();
  const ANIMATION_ROOT = '/assets/game-animations-ready';
  const app = document.getElementById('app');
  const state = {
    catalogs: null, player: null, guestMode: true, view: 'overview', activeGame: 'aviator', analysis: null,
    history: [], activePlayers: [], activity: null, busy: false, message: '', balanceMessage: '', minWithdrawalMinor: 10000,
    runtime: null, footballHistory: [], debugRuntime: null, sceneLoop: null, animationManifest: null,
    signalAmounts: { aviator: 100, 'chicken-road': 100, 'apple-of-fortune': 100, mines: 100, 'football-penalties': 100 },
  };

  let locale = localStorage.getItem('verdant-locale') || 'ru';
  if (!locales.includes(locale)) locale = 'en';

  function t(key) {
    return (dictionaries[locale] && dictionaries[locale][key]) || (dictionaries.en && dictionaries.en[key]) || key;
  }

  function reducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  }

  function isArtDebug() {
    return new URLSearchParams(window.location.search).has('art-debug');
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function fakeOnlineCount() {
    const bucket = Math.floor(Date.now() / 45000);
    const wave = Math.sin(bucket / 6) * 900 + Math.sin(bucket / 17) * 400;
    return Math.max(12084, Math.round(13260 + wave));
  }

  function formatMoney(minor, player = state.player) {
    const fractionDigits = Number(player?.currencyFractionDigits ?? 2);
    const code = player?.currencyCode || 'USD';
    try {
      return new Intl.NumberFormat(player?.currencyLocale || locale, { style: 'currency', currency: code, minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(Number(minor || 0) / (10 ** fractionDigits));
    } catch {
      return `${code} ${Number(minor || 0) / (10 ** fractionDigits)}`;
    }
  }

  function formatDate(value) {
    if (!value) return t('notAvailable');
    try { return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value)); } catch { return value; }
  }

  function initial(value) {
    return String(value || 'V').trim().slice(0, 1).toUpperCase() || 'V';
  }

  function langOptions() {
    const names = { en: 'English', ru: 'Русский', uk: 'Українська', pl: 'Polski', es: 'Español', pt: 'Português', de: 'Deutsch', fr: 'Français', it: 'Italiano', tr: 'Türkçe', ar: 'العربية' };
    return locales.map((code) => `<option value="${code}" ${code === locale ? 'selected' : ''}>${names[code]}</option>`).join('');
  }

  function artImage(source) {
    if (!artImageCache.has(source)) {
      const image = new Image();
      image.decoding = 'async';
      image.addEventListener('load', () => {
        if (state.view === 'game' || state.view === 'overview') { drawAviatorScene(); hydrateSceneArt(); }
      }, { once: true });
      image.src = source;
      artImageCache.set(source, image);
    }
    return artImageCache.get(source);
  }

  function preloadArt() {
    Object.values(ART.aviator).concat(Object.values(ART.chicken), Object.values(ART.apple), Object.values(ART.football), Object.values(ART.mines)).forEach(artImage);
  }

  async function loadAnimationManifest() {
    try {
      const response = await fetch(`${ANIMATION_ROOT}/manifest.json`, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Animation manifest HTTP ${response.status}`);
      state.animationManifest = await response.json();
    } catch (error) {
      state.animationManifest = null;
      console.warn('[animations] manifest unavailable; using source-art fallback', error);
    }
  }

  function animationClip(id) {
    return state.animationManifest?.animations?.find((clip) => clip.id === id) || null;
  }

  function animationClipDuration(id) {
    const clip = animationClip(id);
    return clip ? (clip.timingMs || []).reduce((sum, duration) => sum + duration, 0) : 0;
  }

  function animationFrameAt(clip, elapsed) {
    const durations = clip.timingMs || Array.from({ length: clip.frameCount }, () => 1000 / clip.fps);
    const duration = durations.reduce((sum, value) => sum + value, 0);
    const safeElapsed = Math.max(0, Number(elapsed) || 0);
    const position = clip.loop === 'loop' ? safeElapsed % duration : Math.min(safeElapsed, Math.max(0, duration - 1));
    let cursor = 0;
    for (let index = 0; index < durations.length; index += 1) {
      cursor += durations[index];
      if (position < cursor) return index;
    }
    return Math.max(0, clip.frameCount - 1);
  }

  function drawAnimationClip(context, id, elapsed, x, y, width, height, options = {}) {
    const clip = animationClip(id);
    if (!clip) return false;
    const image = artImage(`${ANIMATION_ROOT}/${clip.spriteSheet}`);
    if (!image?.complete || !image.naturalWidth) return false;
    const frame = animationFrameAt(clip, elapsed);
    const frameWidth = clip.frameSize[0];
    const frameHeight = clip.frameSize[1];
    let drawX = x; let drawY = y; let drawWidth = width; let drawHeight = height;
    if (options.contain) {
      const scale = Math.min(width / frameWidth, height / frameHeight);
      drawWidth = frameWidth * scale; drawHeight = frameHeight * scale;
      drawX = x + (width - drawWidth) / 2; drawY = y + (height - drawHeight) / 2;
    }
    if (options.alignAlphaBounds) {
      const bounds = clip.validation?.alphaBoundsByFrame?.[frame];
      if (bounds) {
        const alphaCenterX = ((bounds[0] + bounds[2]) / 2) * (drawWidth / frameWidth);
        const alphaCenterY = ((bounds[1] + bounds[3]) / 2) * (drawHeight / frameHeight);
        drawX += x + width / 2 - (drawX + alphaCenterX);
        drawY += y + height / 2 - (drawY + alphaCenterY);
      }
    }
    context.save();
    context.globalAlpha = options.alpha ?? 1;
    context.translate(drawX + drawWidth / 2, drawY + drawHeight / 2);
    context.rotate(options.rotation || 0);
    context.drawImage(image, frame * frameWidth, 0, frameWidth, frameHeight, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.restore();
    return true;
  }

  function prepareAnimationCanvas(canvas) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width || canvas.clientWidth || 1));
    const height = Math.max(1, Math.floor(rect.height || canvas.clientHeight || 1));
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio); const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height); context.imageSmoothingEnabled = true;
    return { context, width, height };
  }

  function drawAnimationCanvas(canvas, id, elapsed) {
    const frame = prepareAnimationCanvas(canvas);
    return frame ? drawAnimationClip(frame.context, id, elapsed, 0, 0, frame.width, frame.height, { contain: true, alpha: 0.98 }) : false;
  }

  function totalDuration(config) {
    return config.durations.reduce((sum, duration) => sum + duration, 0);
  }

  /** Atlas frame state is isolated from the one SceneAnimationLoop used by a scene. */
  class SpriteAtlasPlayer {
    constructor(source, config) {
      this.source = source;
      this.config = { ...config, durations: [...config.durations] };
      this.frame = 0;
      this.running = false;
      this.paused = false;
      this.finished = false;
      this.rafId = 0;
    }

    play() {
      if (this.running && !this.paused) return this;
      this.running = true; this.paused = false; this.finished = false;
      return this;
    }

    pause() { this.paused = true; return this; }

    stop() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = 0; this.running = false; this.paused = false; this.finished = false; this.frame = 0;
      return this;
    }

    reset() { this.frame = 0; this.finished = false; this.paused = false; return this; }
    dispose() { this.stop(); }

    frameAt(elapsed) {
      const safeElapsed = Math.max(0, Number(elapsed) || 0);
      if (reducedMotion()) return this.config.loop ? 0 : this.config.frameCount - 1;
      const duration = totalDuration(this.config);
      const position = this.config.loop ? safeElapsed % duration : Math.min(safeElapsed, duration - 1);
      let cursor = 0;
      for (let index = 0; index < this.config.durations.length; index += 1) {
        cursor += this.config.durations[index];
        if (position < cursor) return index;
      }
      return this.config.frameCount - 1;
    }

    draw(context, centerX, centerY, width, height, options = {}) {
      const image = artImage(this.source);
      if (!image?.complete || !image.naturalWidth) return false;
      const elapsed = options.elapsed || 0;
      this.frame = this.frameAt(elapsed);
      context.save();
      context.globalAlpha = options.alpha ?? 1;
      context.translate(centerX, centerY);
      context.rotate(options.rotation || 0);
      context.drawImage(image, this.frame * this.config.frameWidth, 0, this.config.frameWidth, this.config.frameHeight, -width / 2, -height / 2, width, height);
      context.restore();
      if (!this.config.loop && elapsed >= totalDuration(this.config)) this.finished = true;
      return true;
    }
  }

  class SceneAnimationLoop {
    constructor() { this.running = false; this.rafId = 0; this.callback = null; this.generation = 0; }
    start(callback) {
      if (this.running) return;
      this.running = true;
      this.callback = callback;
      const generation = ++this.generation;
      this.rafId = requestAnimationFrame((now) => this.tick(now, generation));
    }
    tick(now, generation) {
      if (!this.running || generation !== this.generation) return;
      const callback = this.callback;
      callback?.(now);
      if (this.running && generation === this.generation) this.rafId = requestAnimationFrame((nextNow) => this.tick(nextNow, generation));
    }
    stop() {
      this.running = false;
      this.generation += 1;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = 0;
      this.callback = null;
    }
  }

  window.SpriteAtlasPlayer = SpriteAtlasPlayer;
  window.render_game_to_text = () => JSON.stringify({
    view: state.view,
    game: state.activeGame,
    phase: state.runtime?.phase || 'ready',
    animationManifest: Boolean(state.animationManifest),
    multiplier: state.runtime?.multiplier || state.analysis?.multiplier || null,
    step: state.runtime?.step ?? null,
    mines: state.activeGame === 'mines' ? {
      size: state.runtime?.size || null,
      mineCount: state.runtime?.mines || null,
      openedCells: state.runtime?.revealedCells || [],
      activeCell: state.runtime?.activeCell ?? null,
      bombCell: state.runtime?.bombCell ?? null,
      result: state.runtime?.result || null,
    } : null,
  });
  window.advanceTime = (milliseconds) => {
    const runtime = state.runtime;
    if (!runtime) return window.render_game_to_text();
    const now = performance.now() + Math.max(0, Number(milliseconds) || 0);
    if (runtime.game === 'aviator' && runtime.startedAt) drawAviatorScene(now);
    if (runtime.game === 'chicken-road') hydrateChickenPose(runtime, Math.min(1, (Number(milliseconds) || 0) / 620));
    if (runtime.game === 'football-penalties') hydrateFootballPose(runtime, Math.min(1, (Number(milliseconds) || 0) / 820));
    if (runtime.game === 'apple-of-fortune') hydrateAppleAnimation(runtime, now);
    if (runtime.game === 'mines') hydrateMinesAnimation(runtime, now);
    return window.render_game_to_text();
  };

  function createAtlasSet() {
    return { propeller: new SpriteAtlasPlayer(ART.aviator.propeller, ATLAS.propeller), engineGlow: new SpriteAtlasPlayer(ART.aviator.engineGlow, ATLAS.engineGlow), smoke: new SpriteAtlasPlayer(ART.aviator.smoke, ATLAS.smoke), sparks: new SpriteAtlasPlayer(ART.aviator.sparks, ATLAS.sparks), crash: new SpriteAtlasPlayer(ART.aviator.crash, ATLAS.crash) };
  }

  function disposeAtlasSet(sprites) { Object.values(sprites || {}).forEach((player) => player.dispose()); }

  function stopGameAnimation() {
    state.sceneLoop?.stop();
    if (state.runtime?.timers) state.runtime.timers.forEach((id) => window.clearTimeout(id));
    disposeAtlasSet(state.runtime?.sprites); disposeAtlasSet(state.debugRuntime?.sprites);
    state.runtime = null; state.debugRuntime = null;
  }

  function scheduleRuntime(callback, delay) {
    const runtime = state.runtime;
    if (!runtime) return;
    const token = runtime.token;
    const id = window.setTimeout(() => { runtime.timers.delete(id); if (state.runtime?.token === token) callback(); }, reducedMotion() ? 0 : delay);
    runtime.timers.add(id);
  }

  function runtimeFor(game) { return state.runtime?.game === game ? state.runtime : null; }
  function updateRuntimeDom(game) {
    const runtime = runtimeFor(game); if (!runtime) return;
    const root = document.querySelector(`[data-runtime-game="${game}"]`); if (root) root.dataset.phase = runtime.phase;
    if (game === 'aviator') {
      const multiplier = document.querySelector('[data-runtime-multiplier]'); const countdown = document.querySelector('[data-runtime-countdown]'); const countdownHero = document.querySelector('[data-countdown-hero]'); const countdownHeroNumber = document.querySelector('[data-runtime-countdown-hero]'); const caption = document.querySelector('[data-runtime-caption]'); const liveState = document.querySelector('[data-game-live-state]'); const startButton = document.querySelector('[data-game-action="aviator-start"]');
      if (multiplier) multiplier.textContent = `${Number(runtime.multiplier || 1).toFixed(2)}x`;
      document.querySelectorAll('[data-runtime-state]').forEach((status) => { status.textContent = phaseLabel(runtime.phase); });
      if (countdown) countdown.textContent = runtime.phase === 'countdown' ? `${t('countdown')}: ${runtime.countdown}` : '';
      if (countdownHero) countdownHero.hidden = runtime.phase !== 'countdown';
      if (countdownHeroNumber) countdownHeroNumber.textContent = runtime.phase === 'countdown' ? String(runtime.countdown) : '';
      if (caption) caption.textContent = runtime.phase === 'countdown' ? `${t('countdown')}: ${runtime.countdown}` : 'РАУНД';
      if (liveState) liveState.textContent = phaseLabel(runtime.phase);
      if (startButton) { startButton.disabled = ['countdown', 'takeoff', 'flying'].includes(runtime.phase); startButton.textContent = runtime.phase === 'ended' ? t('nextRound') : t('startRound'); }
      if (root) {
        const progress = Math.max(0, Math.min(1, Number(runtime.progress) || 0));
        root.style.setProperty('--flight-progress', progress);
        const plane = root.querySelector('[data-aviator-plane]');
        if (plane) {
          const takeoff = Math.max(0, Math.min(1, Number(runtime.takeoffProgress) || 0));
          const cruise = Math.max(0, Math.min(1, Number(runtime.cruiseProgress) || 0));
          const x = cruise > 0 ? 32 + cruise * 50 : 7 + takeoff * 25;
          const bob = cruise > 0 ? Math.sin(cruise * Math.PI * 2) * 2.2 + Math.sin(cruise * Math.PI * 5) * .55 : 0;
          const y = 13 + takeoff * 49 + bob;
          plane.style.left = `${x}%`;
          plane.style.bottom = `${y}%`;
        }
        const curve = root.querySelector('[data-aviator-curve]');
        if (curve) curve.style.strokeDashoffset = String(100 - progress * 100);
      }
    }
  }

  function updateChickenSignalDom(runtime, animate = false) {
    const root = document.querySelector('[data-runtime-game="chicken-road"]');
    if (!root) return;
    if (animate) {
      root.dataset.phase = 'safe';
      void root.offsetWidth;
    }
    root.dataset.phase = runtime.phase;
    root.dataset.step = String(runtime.step || 0);
    root.style.setProperty('--chicken-step', String(runtime.nextStep || runtime.step || 0));
    root.style.setProperty('--chicken-sprite', `url('${runtime.phase === 'fallen' ? LOCAL_GAME_ART.chicken.dead : runtime.phase === 'jumping' ? LOCAL_GAME_ART.chicken.jump : LOCAL_GAME_ART.chicken.idle}')`);
    root.querySelectorAll('.reference-road-lane').forEach((lane, index) => {
      const laneNumber = index + 1;
      lane.classList.toggle('is-used', laneNumber < runtime.step);
      lane.classList.toggle('is-current', laneNumber === runtime.step || (runtime.phase === 'ended' && laneNumber === runtime.targetStep));
    });
    const result = root.querySelector('[data-chicken-result]');
    if (result) {
      const multipliers = state.analysis?.multipliers || ['1.12x', '1.28x', '1.47x', '1.70x', '1.98x', '2.33x'];
      result.textContent = runtime.step ? `${multipliers[runtime.step - 1]} · ${phaseLabel(runtime.phase)}` : phaseLabel(runtime.phase);
    }
    document.querySelectorAll('[data-runtime-state], [data-game-live-state]').forEach((node) => { node.textContent = phaseLabel(runtime.phase); });
  }

  function updateMineSignalDom(runtime) {
    const root = document.querySelector('[data-runtime-game="mines"]');
    if (!root) return;
    root.dataset.phase = runtime.phase;
    root.querySelectorAll('.reference-mine-cell.is-suggested').forEach((cell) => cell.classList.remove('is-suggested'));
    const status = root.querySelector('[data-mines-status]');
    if (status) {
      if (runtime.phase === 'revealed') status.textContent = `${runtime.revealedCells.length} SAFE · ${runtime.multiplier || ''}`.trim();
      else if (runtime.phase === 'mine') status.textContent = `${runtime.revealedCells.length} SAFE · MINE`;
      else if (runtime.phase === 'revealing') status.textContent = `${runtime.revealedCells.length}/${runtime.revealPath.length} OPEN`;
      else status.textContent = phaseLabel(runtime.phase);
    }
    document.querySelectorAll('[data-runtime-state], [data-game-live-state]').forEach((node) => { node.textContent = phaseLabel(runtime.phase); });
  }

  function updateAppleSignalDom(runtime, row, opening) {
    const root = document.querySelector('[data-runtime-game="apple-of-fortune"]');
    if (!root || !row) return;
    root.dataset.phase = runtime.phase;
    root.querySelectorAll('.apple-row').forEach((node) => node.classList.toggle('is-current', Number(node.dataset.appleRow) === Number(row.level)));
    const cell = root.querySelector(`[data-apple-row="${row.level}"][data-apple-cell="${row.recommendedCell}"]`);
    if (cell) {
      cell.classList.toggle('is-opening', Boolean(opening));
      cell.classList.toggle('is-safe', !opening);
      if (!cell.querySelector('.apple-sprite')) cell.insertAdjacentHTML('beforeend', `<img class="apple-sprite" src="${ART.apple.whole}" alt="" aria-hidden="true">`);
    }
    const caption = root.querySelector('[data-runtime-caption]');
    if (caption) caption.textContent = runtime.phase === 'ended' ? `${phaseLabel('ended')} · x${String(row.multiplier || '').replace(/^x/i, '')}` : `${phaseLabel('opening')} · ${runtime.activeRow}/${runtime.targetRow}`;
    document.querySelectorAll('[data-runtime-state], [data-game-live-state]').forEach((node) => { node.textContent = phaseLabel(runtime.phase); });
  }
  function phaseLabel(phase) {
    return t({ ready: 'ready', analyzing: 'analysisLoading', closing: 'opening', revealing: 'opening', revealed: 'roundEnded', countdown: 'countdownState', takeoff: 'takeoff', flying: 'flying', crash: 'crash', ended: 'roundEnded', jumping: 'jumping', safe: 'safeStep', fallen: 'stepFailed', opening: 'opening', mine: 'cellMine', goal: 'goal', save: 'save', miss: 'miss', kick: 'kick', reaction: 'kick' }[phase] || 'ready');
  }

  async function api(url, options = {}) {
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
    const response = await fetch(url, { ...options, headers, credentials: 'same-origin', body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body });
    let body = {};
    try { body = await response.json(); } catch { body = {}; }
    if (!response.ok) { const error = new Error(body.error?.message || t('errorGeneric')); error.code = body.error?.code || 'REQUEST_FAILED'; error.status = response.status; throw error; }
    return body;
  }

  function legalLinks() { return `<div class="auth-legal"><button class="text-link" data-legal="privacy" type="button">${t('legalPrivacy')}</button><button class="text-link" data-legal="terms" type="button">${t('legalTerms')}</button><button class="text-link" data-legal="responsible" type="button">${t('legalResponsible')}</button><a href="/admin">${t('admin')}</a></div>`; }
  function legalDialog() { return `<dialog id="legal-dialog" class="legal-dialog"><button class="dialog-close" data-close-dialog type="button" aria-label="${t('close')}">×</button><div data-legal-body></div></dialog>`; }

  function authModal() { return `<dialog id="auth-modal" class="auth-modal"><button class="dialog-close" data-close-auth type="button" aria-label="Закрыть">×</button><div class="auth-modal-head"><span class="brand-mark">B</span><div><p class="eyebrow">VERDANT ACCESS</p><h2 data-auth-title>Вход в аккаунт</h2></div></div><form class="stack-form" id="modal-auth-form"><label for="modal-auth-email">Email<input id="modal-auth-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label for="modal-auth-password">Пароль<input id="modal-auth-password" name="password" type="password" autocomplete="current-password" required minlength="8" placeholder="Минимум 8 символов"></label><label class="modal-name-field" for="modal-auth-name">Имя пользователя<input id="modal-auth-name" name="nickname" autocomplete="nickname" placeholder="Ваше имя"></label><p class="form-message" data-modal-auth-message aria-live="polite"></p><button class="button button-primary button-full" type="submit">Продолжить</button></form><button class="auth-switch" data-auth-switch type="button">Нет аккаунта? Регистрация</button></dialog>`; }
  function openAuthModal(mode = 'login') { const modal = document.getElementById('auth-modal'); if (!modal) return; modal.dataset.mode = mode; modal.querySelector('[data-auth-title]').textContent = mode === 'register' ? 'Создать аккаун��' : 'Вход в аккаунт'; modal.querySelector('.modal-name-field').hidden = mode !== 'register'; modal.querySelector('[data-auth-switch]').textContent = mode === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'; modal.showModal(); }
  function bindAuthModal() { const modal = document.getElementById('auth-modal'); if (!modal) return; modal.querySelector('[data-close-auth]').addEventListener('click', () => modal.close()); modal.querySelector('[data-auth-switch]').addEventListener('click', () => openAuthModal(modal.dataset.mode === 'register' ? 'login' : 'register')); modal.querySelector('form').addEventListener('submit', async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const mode = modal.dataset.mode; const message = modal.querySelector('[data-modal-auth-message]'); message.textContent = 'Проверяем данные…'; try { const result = await api(mode === 'register' ? '/api/auth/register' : '/api/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(data)) }); state.player = result.player || result.user || result; state.guestMode = false; modal.close(); render(); } catch (error) { message.textContent = error.message || 'Не удалось выполнить запрос'; } }); }

  function renderAuth() {
    stopGameAnimation(); app.className = 'auth-layout';
    app.innerHTML = `<section class="auth-visual" aria-hidden="true"><div class="brand-lockup"><span class="brand-mark">B</span><span><strong>BET<em>WINNER</em></strong><small>LINE / WORKSPACE</small></span></div><div class="auth-visual-copy"><p class="eyebrow">${t('appKicker')}</p><h1>${t('signInTitle')}</h1><p>${t('signInCopy')}</p></div><div class="signal-readout"><div><span>${t('mode')}</span><strong>${t('simulation')}</strong></div><div><span>${t('games')}</span><strong>06</strong></div></div></section><section class="auth-card-wrap"><div class="auth-card"><div class="brand-lockup"><span class="brand-mark">B</span><span><strong>BET<em>WINNER</em></strong><small>LINE</small></span></div><p class="eyebrow">${t('appKicker')}</p><h2>${t('signInTitle')}</h2><p class="lede">${t('signInCopy')}</p><form class="stack-form" id="auth-form"><label for="player-id">${t('playerId')}<input id="player-id" name="playerId" autocomplete="username" placeholder="${t('playerIdPlaceholder')}" minlength="3" maxlength="64" required></label><label for="access-code">${t('accessCode')}<input id="access-code" name="accessCode" type="password" autocomplete="current-password" placeholder="${t('accessCodePlaceholder')}" minlength="6" maxlength="128" required></label><button class="button button-primary button-full" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? t('signingIn') : t('signIn')}</button><p class="form-message" role="alert" aria-live="polite">${escapeHTML(state.message)}</p><p class="helper">${t('newSession')}</p></form>${legalLinks()}</div></section>${legalDialog()}`;
    document.getElementById('auth-form').addEventListener('submit', handleLogin); bindLegalLinks(); bindDialogClose();
  }

  function renderOnboarding() {
    const countries = state.catalogs?.countries || []; const currencies = state.catalogs?.currencies || [];
    stopGameAnimation(); app.className = 'onboarding-layout';
    app.innerHTML = `<section class="onboarding-card"><div class="brand-lockup"><span class="brand-mark">B</span><span><strong>BET<em>WINNER</em></strong><small>LINE / PROFILE</small></span></div><p class="eyebrow">${t('setup')}</p><h1>${t('onboardingTitle')}</h1><p class="lede">${t('onboardingCopy')}</p><form class="profile-form" id="onboarding-form"><label for="nickname">${t('nickname')}<input id="nickname" name="nickname" minlength="3" maxlength="24" autocomplete="nickname" placeholder="${t('nicknamePlaceholder')}" value="${escapeHTML(state.player?.nickname || '')}" required></label><div class="profile-grid"><label for="country-code">${t('country')}<select id="country-code" name="countryCode" required><option value="">${t('chooseCountry')}</option>${countries.map((country) => `<option value="${country.code}" ${country.code === state.player?.countryCode ? 'selected' : ''}>${escapeHTML(country.name)}</option>`).join('')}</select></label><label for="currency-code">${t('currency')}<select id="currency-code" name="currencyCode" required><option value="">${t('chooseCurrency')}</option>${currencies.map((currency) => `<option value="${currency.code}" ${currency.code === state.player?.currencyCode ? 'selected' : ''}>${currency.code} · ${escapeHTML(currency.name)}</option>`).join('')}</select></label></div><label class="check-line"><input type="checkbox" name="acceptedTerms" required><span>${t('acceptTerms')} <button class="text-link" data-legal="terms" type="button">${t('termsLink')}</button></span></label><label class="check-line"><input type="checkbox" name="acceptedDisclaimer" required><span>${t('acceptDisclaimer')} <button class="text-link" data-legal="disclaimer" type="button">${t('disclaimerLink')}</button></span></label><button class="button button-primary" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? t('saving') : t('saveProfile')}</button><p class="form-message" role="alert" aria-live="polite">${escapeHTML(state.message)}</p><p class="helper">${t('profileNote')}</p></form>${legalLinks()}</section>${legalDialog()}`;
    document.getElementById('onboarding-form').addEventListener('submit', handleProfileSave); bindLegalLinks(); bindDialogClose();
  }

  function gameLabel(game) { return t({ aviator: 'aviator', 'chicken-road': 'chickenRoad', 'apple-of-fortune': 'appleFortune', mines: 'mines', 'football-penalties': 'footballPenalties' }[game]); }

  function renderMetrics() {
    const player = state.player;
    return `<div class="metric-grid"><div class="metric"><span class="metric-label">${t('balance')}</span><strong class="metric-value">${escapeHTML(formatMoney(player.balanceMinor))}</strong><span class="metric-meta">${escapeHTML(player.currencyCode || 'USD')} / ${t('virtualOnly')}</span></div><div class="metric"><span class="metric-label">${t('bonusBalance')}</span><strong class="metric-value accent">${escapeHTML(formatMoney(player.bonusBalanceMinor))}</strong><span class="metric-meta">${t('level')} ${player.level}</span></div><div class="metric"><span class="metric-label">${t('activeDays')}</span><strong class="metric-value">${player.activeDays}</strong><span class="metric-meta">${t('currentStreak')}: ${player.consecutiveActiveDays}</span></div><div class="metric metric-status"><span class="metric-label">${t('withdrawal')}</span><strong class="metric-value ${player.withdrawalEligible ? 'is-open' : ''}">${player.withdrawalEligible ? t('open') : t('locked')}</strong><span class="metric-meta">${player.withdrawalEligible ? `${t('eligibleOn')} ${formatDate(player.withdrawalEligibleAt)}` : t('withdrawalNeedDays')}</span></div></div>`;
  }

  function renderLevelPanel() {
    const level = state.player.level; const progress = state.player.levelProgress;
    return `<section class="panel level-panel"><div class="panel-head"><div><p class="panel-kicker">${t('level')} ${level}</p><h3>${level >= 6 ? t('longView') : t('signalProgression')}</h3></div><span class="level-number">${String(level).padStart(2, '0')}</span></div><div class="panel-body"><div class="progress-track" role="progressbar" aria-label="${progress}%" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" data-progress="${progress}"></div></div><div class="progress-meta"><span>${progress}% ${t('status')}</span><span>${state.player.activeDays} ${t('activeDays').toLowerCase()}</span></div><dl class="data-list"><div><dt>${t('bonusBalance')}</dt><dd>${escapeHTML(formatMoney(state.player.bonusBalanceMinor))}</dd></div><div><dt>${t('currentStreak')}</dt><dd>${state.player.consecutiveActiveDays} ${t('days')}</dd></div></dl></div></section>`;
  }

  function renderActivePlayers() {
    if (!state.activePlayers.length) return `<div class="empty-state"><span class="empty-mark">—</span><p>${t('noActivePlayers')}</p><small>${t('demoActivityNote')}</small></div>`;
    return `<div class="player-list">${state.activePlayers.map((player, index) => `<div class="player-row"><span class="avatar" data-active-initial="${index}"></span><div class="player-row-copy"><strong data-active-name="${index}"></strong><span data-active-country="${index}"></span></div><span class="online-dot" role="img" aria-label="${t('online')}"></span></div>`).join('')}</div>`;
  }

  function gameCards() {
    return `<section class="games-section"><div class="section-heading"><div><p class="panel-kicker">${t('games')} / 06</p><h2>${t('chooseInstrument')}</h2></div><span class="section-count">${t('liveDemo')}</span></div><div class="game-card-grid">${games.map((game, index) => `<button class="game-card game-card-${game} ${game === state.activeGame ? 'active' : ''}" type="button" data-game="${game}"><span class="game-card-index">0${index + 1}</span><strong>${gameLabel(game)}</strong><span><i class="game-dot"></i>${t('demoAnalysis')}</span></button>`).join('')}</div></section>`;
  }

  function renderOverview() {
    return `<header class="workspace-header"><div><p class="eyebrow">${t('dashboardKicker')}</p><h1>${t('dashboardTitle')}</h1><p class="lede">${t('dashboardCopy')}</p></div><div class="header-actions"><button class="button button-ghost" data-view="profile" type="button">${t('profile')}</button></div></header><div class="content-width"><div class="status-strip"><span class="status-badge">${t('demoAnalysis')}</span><span class="status-badge muted">${t('simulatedData')}</span><span class="status-badge online-badge"><span class="online-pulse" aria-hidden="true"></span>${fakeOnlineCount().toLocaleString(locale)} ${t('onlineNow')}</span><span class="status-badge warning">${t('noGuarantee')}</span><span class="status-strip-note">${t('patternBased')}</span></div>${renderMetrics()}<div class="dashboard-grid"><div>${gameCards()}<section class="beta-section"><div class="section-heading"><div><p class="panel-kicker">${t('betaGames')}</p><h3>${t('keepExploring')}</h3></div><span class="beta-stamp">${t('inDevelopment')}</span></div><p>${t('futureSurfaces')}</p></section></div><aside class="analysis-side"><details class="mobile-utility" open><summary>${t('utilityPanel')}</summary><div class="utility-stack">${renderLevelPanel()}<section class="panel"><div class="panel-head"><div><p class="panel-kicker">${t('activePlayers')}</p><h3>${t('byCountry')}</h3><p class="panel-copy">${t('realPlayersOnly')}</p></div></div><div class="panel-body">${renderActivePlayers()}</div></section></div></details><div class="desktop-utility">${renderLevelPanel()}<section class="panel"><div class="panel-head"><div><p class="panel-kicker">${t('activePlayers')}</p><h3>${t('byCountry')}</h3><p class="panel-copy">${t('realPlayersOnly')}</p></div></div><div class="panel-body">${renderActivePlayers()}</div></section></div></aside></div>${renderFooter()}</div>`;
  }

  function renderFooter() { return `<footer class="statement-footer"><div><p>BETWINNER LINE / ${t('analysisEngine')} / ${t('simulatedData')}</p><div class="footer-links"><button class="text-link" data-legal="privacy" type="button">${t('legalPrivacy')}</button><button class="text-link" data-legal="terms" type="button">${t('legalTerms')}</button><button class="text-link" data-legal="responsible" type="button">${t('legalResponsible')}</button><button class="text-link" data-legal="disclaimer" type="button">${t('legalDisclaimer')}</button></div></div><p>${t('disclaimerText')}</p></footer>`; }

  function renderAviatorStage() {
    const runtime = runtimeFor('aviator') || createReadyRuntime('aviator');
    const progress = Math.max(0, Math.min(1, Number(runtime.progress) || 0));
    const multiplier = Number(runtime.multiplier || 1).toFixed(2);
    const stars = Array.from({ length: 24 }, (_, index) => `<i style="--star-x:${(index * 37) % 96};--star-y:${(index * 53) % 88};--star-delay:${(index % 8) * -.18}s;--star-size:${2 + (index % 4)}px"></i>`).join('');
    return `<div class="visual-stage reference-game reference-aviator" data-runtime-game="aviator" data-phase="${escapeHTML(runtime.phase)}" style="--flight-progress:${progress}">
      <img class="reference-aviator-logo" src="${LOCAL_GAME_ART.aviator.logo}" alt="AviaShow">
      <div class="reference-aviator-history" aria-hidden="true"><span>1.38x</span><span>1.57x</span><span>1.71x</span><span>4.36x</span><span>2.48x</span><span>1.73x</span><span>14.00x</span></div>
      <div class="reference-aviator-stars" aria-hidden="true">${stars}</div>
      <svg class="reference-aviator-curve" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true"><path data-aviator-curve pathLength="100" d="M 8 530 L 320 205 L 920 205"></path></svg>
      <div class="reference-aviator-plane" data-aviator-plane aria-hidden="true"><span class="reference-plane-crop"></span><i class="reference-plane-pilot"><b></b></i><i class="reference-plane-propeller"></i></div>
      <div class="reference-aviator-readout"><strong data-runtime-multiplier>${multiplier}x</strong><span data-runtime-state>${phaseLabel(runtime.phase)}</span></div>
      <div class="reference-aviator-ready" data-aviator-ready>${runtime.phase === 'ready' ? 'GET SIGNAL TO START' : ''}</div>
    </div>`;
  }

  function renderChickenStage() {
    const runtime = runtimeFor('chicken-road') || createChickenRuntime();
    const multipliers = ['1.12x', '1.28x', '1.47x', '1.70x', '1.98x', '2.33x'];
    const step = Math.max(0, Math.min(6, Number(runtime.step) || 0));
    const target = Math.max(1, Math.min(6, Number(runtime.targetStep || state.analysis?.targetStep) || 1));
    const medals = multipliers.map((value, index) => { const lane = index + 1; const stateClass = lane < step ? 'is-used' : lane === step ? 'is-current' : lane === target && runtime.phase === 'ended' ? 'is-current' : ''; return `<div class="reference-road-lane ${stateClass}"><span class="reference-road-medal">${value}</span><i class="reference-road-grate"></i></div>`; }).join('');
    const sprite = runtime.phase === 'jumping' ? LOCAL_GAME_ART.chicken.jump : runtime.phase === 'fallen' ? LOCAL_GAME_ART.chicken.dead : LOCAL_GAME_ART.chicken.idle;
    return `<div class="visual-stage reference-game reference-chicken" data-runtime-game="chicken-road" data-phase="${escapeHTML(runtime.phase)}" data-step="${step}" style="--chicken-step:${step}">
      <header class="reference-chicken-bar"><img src="${LOCAL_GAME_ART.chicken.logo}" alt="Chicken Road"><span>LIVE WINS <b>•</b> ONLINE</span></header>
      <div class="reference-road-scene"><div class="reference-road-lanes">${medals}</div><div class="reference-chicken-actor" data-chicken-actor style="--chicken-sprite:url('${sprite}')"><span></span></div></div>
      <div class="reference-chicken-result"><span data-chicken-result>${step ? `${multipliers[step - 1]} · ${phaseLabel(runtime.phase)}` : 'WAITING FOR SIGNAL'}</span></div>
    </div>`;
  }

  function renderChickenStageLegacy() {
    const analysis = state.analysis?.game === 'chicken-road' ? state.analysis : null; const runtime = runtimeFor('chicken-road') || { phase: 'ready', step: 0, target: 1, multiplier: 1 }; const safeSteps = analysis?.safeSteps || [1, 2, 3];
    const cells = [1, 2, 3, 4, 5].map((step) => `<div class="road-step ${runtime.step >= step ? 'is-cleared' : ''} ${runtime.target === step && runtime.phase === 'ready' ? 'is-target' : ''} ${runtime.failedStep === step ? 'is-danger' : ''}" aria-label="${t('step')} ${step}"><span class="step-number">${step}</span><span class="step-marker">${runtime.step >= step ? '✓' : step === runtime.target ? '→' : '·'}</span><small>${safeSteps.includes(step) ? t('safe') : t('risk')}</small></div>`).join('');
    return `<div class="visual-stage chicken-road-stage pipeline-stage ${runtime.phase === 'jumping' ? 'is-jumping' : ''} ${runtime.phase === 'fallen' ? 'is-fallen' : ''}" data-runtime-game="chicken-road" data-step="${runtime.step}"><div class="road-sky" aria-hidden="true"><span class="road-light"></span><span class="road-cloud cloud-a"></span><span class="road-cloud cloud-b"></span></div><div class="road-playfield"><div class="road-shoulder"></div><div class="road-cells">${cells}</div><canvas class="scene-animation-canvas chicken-animation-canvas" data-animation-canvas="chicken" aria-hidden="true"></canvas><img class="van-object" data-art-layer="vehicle" src="${ART.chicken.van}" alt="" aria-hidden="true"><div class="chick-object" data-art-layer="chick"><img src="${ART.chicken.chick}" alt="${t('chickenRoad')}"></div><div class="road-shadow" aria-hidden="true"></div></div><div class="road-readout"><div><span class="readout-label">${t('roadProgress')}</span><strong data-chicken-step>${runtime.step}/5</strong></div><div><span class="readout-label">${t('multiplier')}</span><strong data-chicken-multiplier>${runtime.multiplier.toFixed(2)}x</strong></div></div><div class="stage-caption"><span data-runtime-caption>${runtime.phase === 'ready' ? t('targetStep') : phaseLabel(runtime.phase)}</span><span>РАУНД</span></div></div>`;
  }

  function renderAppleTopIcon(kind, action, label, active) {
    const icons = {
      info: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9.4" stroke="currentColor" stroke-width="1.7"/><path d="M12 11.1v5.3" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1.05" fill="currentColor"/></svg>',
      soundOn: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M4 9.4v5.2h3.3L12.2 18V6L7.3 9.4H4Z" fill="currentColor"/><path d="M15.6 9.1a3.5 3.5 0 0 1 0 5.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M17.8 6.9a6.8 6.8 0 0 1 0 10.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.75"/></svg>',
      soundOff: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M4 9.4v5.2h3.3L12.2 18V6L7.3 9.4H4Z" fill="currentColor"/><path d="M15.8 9.5l4.6 5M20.4 9.5l-4.6 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    };
    return `<button class="apple-icon-btn${active ? ' is-active' : ''}" type="button" data-game-action="${action}" aria-label="${escapeHTML(label)}">${icons[kind]}</button>`;
  }

  function renderAppleGameView() {
    const runtime = runtimeFor('apple-of-fortune') || createAppleSignalRuntime();
    const rows = appleRows();
    const revealedCells = runtime.revealedCells || {};
    const orderedRows = rows.slice().sort((a, b) => b.level - a.level);
    const activeRowData = rows.find((item) => item.level === runtime.activeRow) || rows[0];
    const statusText = runtime.phase === 'ended'
      ? `${phaseLabel('ended')} · x${String(activeRowData?.multiplier || '').replace(/^x/i, '')}`
      : runtime.phase === 'opening'
        ? `${phaseLabel('opening')} · ${runtime.activeRow}/${runtime.targetRow || rows.length}`
        : phaseLabel('ready');
    const rowsHtml = orderedRows.map((row) => {
      const revealed = revealedCells[row.level];
      const cellsHtml = [1, 2, 3, 4, 5].map((cell) => {
        const safe = Number(revealed?.cell) === cell;
        return `<div class="apple-cell${safe ? ' is-safe' : ''}" data-apple-row="${row.level}" data-apple-cell="${cell}" aria-label="${t('cell')} ${cell}"><span class="apple-cell-inner"><img class="apple-tile" src="${ART.apple.tile}" alt="" aria-hidden="true">${safe ? `<img class="apple-sprite" src="${ART.apple.whole}" alt="" aria-hidden="true">` : ''}</span></div>`;
      }).join('');
      return `<div class="apple-row${row.level === runtime.activeRow && runtime.phase === 'opening' ? ' is-current' : ''}" data-apple-row="${row.level}"><div class="apple-cells">${cellsHtml}</div><span class="apple-row-multiplier${row.level === runtime.activeRow && runtime.phase === 'opening' ? ' is-current' : ''}">x${escapeHTML(String(row.multiplier || '').replace(/^x/i, ''))}</span></div>`;
    }).join('');
    const stageHtml = `<div class="apple-fullstage is-signal-only" data-runtime-game="apple-of-fortune" data-phase="${escapeHTML(runtime.phase)}">
      <img class="apple-bg" src="${ART.apple.background}" alt="" aria-hidden="true">
      <div class="apple-vignette" aria-hidden="true"></div>
      <img class="apple-character apple-queen" src="${ART.apple.queen}" alt="\u0417\u043B\u0430\u044F \u043A\u043E\u0440\u043E\u043B\u0435\u0432\u0430">
      <img class="apple-character apple-snow" src="${ART.apple.snowWhite}" alt="\u0411\u0435\u043B\u043E\u0441\u043D\u0435\u0436\u043A\u0430">
      <img class="apple-logo" src="${ART.apple.logo}" alt="Apple of Fortune">
      <div class="apple-panel">
        <img class="apple-vine apple-vine-left" src="${ART.apple.vine}" alt="" aria-hidden="true">
        <img class="apple-vine apple-vine-right" src="${ART.apple.vine}" alt="" aria-hidden="true">
        <div class="apple-panel-top">
          ${renderAppleTopIcon('info', 'apple-info', t('appleInfo'))}
          <strong class="apple-panel-title" data-runtime-caption>${escapeHTML(statusText)}</strong>
          ${renderAppleTopIcon(runtime.muted ? 'soundOff' : 'soundOn', 'apple-mute', runtime.muted ? t('appleUnmute') : t('appleMute'), runtime.muted)}
        </div>
        <div class="apple-board">${rowsHtml}</div>
      </div>
    </div>`;
    const controls = `<section class="panel control-panel"><div class="panel-head"><div><p class="panel-kicker">${t('controlStack')}</p><h2>${t('gameStatus')}</h2></div><span class="status-dot"></span></div><div class="panel-body control-fields">${gameControls('apple-of-fortune')}<button class="button button-primary button-full" data-analyze="apple-of-fortune" type="button" ${state.busy ? 'disabled' : ''}>${state.busy ? t('analysisLoading') : t('getSignal')}</button><button class="button button-ghost button-full" data-copy="apple-of-fortune" type="button" ${state.analysis?.game === 'apple-of-fortune' ? '' : 'disabled'}>${t('copyResult')}</button><p class="form-message" role="alert" aria-live="polite">${escapeHTML(state.message)}</p></div></section>`;
    return `<header class="workspace-header game-header"><div><p class="eyebrow">${t('games')} / ${String(games.indexOf('apple-of-fortune') + 1).padStart(2, '0')}</p><h1>${gameLabel('apple-of-fortune')}</h1><p class="lede">${t('gameIntro')}</p></div><div class="header-actions"><button class="game-exit-button" data-view="overview" type="button"><span class="game-exit-icon" aria-hidden="true">&#8592;</span>${t('backToHome')}</button></div></header><div class="content-width game-view apple-game-view"><div class="game-layout"><section class="game-stage apple-game-stage"><div class="stage-topline"><div><span class="stage-index">03</span><span class="status-badge muted">\u0420\u0410\u0423\u041D\u0414</span></div><span class="round-state" data-game-live-state aria-live="polite">${phaseLabel(runtime.phase)}</span></div>${stageHtml}</section><aside class="game-side">${controls}<section class="panel result-panel"><div class="panel-head"><div><p class="panel-kicker">${t('result')}</p><h2>${t('latestSignal')}</h2></div></div><div class="panel-body">${renderResult(state.analysis?.game === 'apple-of-fortune' ? state.analysis : null)}</div></section><section class="panel history-panel"><div class="panel-head"><div><p class="panel-kicker">${t('history')}</p><h3>${t('attempts')}</h3></div></div><div class="panel-body">${renderHistory()}</div></section></aside></div>${renderFooter()}</div>`;
  }

  function renderMinesStage() {
    const runtime = runtimeFor('mines') || createMineRuntime();
    const size = [16, 25, 36].includes(Number(runtime.size)) ? Number(runtime.size) : 25;
    const columns = Math.sqrt(size);
    const revealed = new Set(runtime.revealedCells || []);
    const bombCell = runtime.phase === 'mine' ? Number(runtime.bombCell) : -1;
    const cells = Array.from({ length: size }, (_, index) => {
      const safe = revealed.has(index);
      const bomb = index === bombCell;
      return `<div class="reference-mine-cell ${safe ? 'is-safe' : ''} ${bomb ? 'is-bomb' : ''}" data-mine-index="${index}" aria-label="${t('cell')} ${index + 1}"><span class="reference-mine-tile"></span><span class="reference-mine-sprite ${safe ? 'is-reveal' : ''} ${bomb ? 'is-bomb' : ''}" aria-hidden="true"></span></div>`;
    }).join('');
    const status = runtime.phase === 'revealed' ? `${revealed.size} SAFE · ${runtime.multiplier || ''}` : runtime.phase === 'mine' ? `${revealed.size} SAFE · MINE` : phaseLabel(runtime.phase);
    return `<div class="visual-stage reference-game reference-mines" data-runtime-game="mines" data-phase="${escapeHTML(runtime.phase)}">
      <img class="reference-mines-logo" src="${LOCAL_GAME_ART.mines.logo}" alt="Diamond Mines">
      <div class="reference-mines-board" style="--mine-columns:${columns}">${cells}<i class="reference-mines-blast" data-mines-blast aria-hidden="true"></i></div>
      <div class="reference-mines-status"><span>${columns} × ${columns}</span><strong data-mines-status>${escapeHTML(status)}</strong></div>
    </div>`;
  }

  function renderFootballStage() {
    const runtime = runtimeFor('football-penalties') || createFootballRuntime();
    const zone = Math.max(1, Math.min(5, Number(runtime.shotZone || state.analysis?.recommendedZone) || 3));
    const zones = Array.from({ length: 5 }, (_, index) => `<span class="reference-goal-zone ${index + 1 === zone && runtime.phase !== 'ready' ? 'is-target' : ''}">${index + 1}</span>`).join('');
    return `<div class="visual-stage reference-game reference-football" data-runtime-game="football-penalties" data-phase="${escapeHTML(runtime.phase)}" data-zone="${zone}">
      <img class="reference-football-logo" src="${LOCAL_GAME_ART.football.logo}" alt="Penalty Champion">
      <div class="reference-scoreboard"><span>STRIKER</span><strong>${runtime.score || 0} : 0</strong></div>
      <div class="reference-goal"><div class="reference-net"></div><div class="reference-goal-zones">${zones}</div><div class="reference-keeper" aria-hidden="true"></div></div>
      <div class="reference-ball" aria-hidden="true"></div>
      <div class="reference-football-status">${runtime.phase === 'ready' ? 'WAITING FOR SIGNAL' : phaseLabel(runtime.phase)}</div>
    </div>`;
  }

  function renderOutcomeVideoStage(game, runtime) {
    const label = runtime.videoLabel || state.analysis?.video?.label || '';
    return `<div class="visual-stage reference-game game-outcome-stage game-outcome-${game}" data-runtime-game="${game}" data-phase="video">
      <video class="game-outcome-video" data-game-outcome-video data-runtime-token="${runtime.token}" autoplay muted playsinline preload="auto" aria-label="${escapeHTML(`${gameLabel(game)} · ${label}`)}">
        <source src="${escapeHTML(runtime.videoSrc)}" type="video/mp4">
      </video>
    </div>`;
  }

  function renderGameStage(game) {
    const runtime = runtimeFor(game);
    if (VIDEO_GAMES.has(game) && runtime?.phase === 'video' && runtime.videoSrc) return renderOutcomeVideoStage(game, runtime);
    if (game === 'aviator') return renderAviatorStage();
    if (game === 'chicken-road') return renderChickenStage();
    if (game === 'apple-of-fortune') return renderAppleStage();
    if (game === 'mines') return renderMinesStage();
    return renderFootballStage();
  }

  function renderResult(analysis) {
    if (!analysis) return `<div class="result-empty"><span class="empty-mark">◎</span><p>${t('noHistory')}</p><small>${t('resultAppearsHere')}</small></div>`;
    const details = analysis.game === 'aviator' ? `${t('multiplier')}: ${analysis.multiplier} · ${t('countdown')}: ${analysis.countdown}s` : analysis.game === 'chicken-road' ? `${t('safeSteps')}: ${analysis.safeSteps.join(', ')} · ${t('multiplier')}: ${analysis.multiplier}` : analysis.game === 'apple-of-fortune' ? `${t('rows')}: ${analysis.targetRow || analysis.rows.length} · ${t('safeCell')}: ${analysis.rows.slice(0, analysis.targetRow || analysis.rows.length).map((row) => row.recommendedCell).join(' → ')}` : analysis.game === 'mines' ? `${t('fieldSize')}: ${analysis.size} · ${t('mineCount')}: ${analysis.mines} · ${analysis.safeCount} SAFE · ${analysis.outcome} · ${analysis.multiplier}` : `${t('shotZones')}: ${analysis.zones} · ${t('direction')}: ${analysis.direction}`;
    const amount = Number(analysis.signalAmount || 0);
    const amountText = amount > 0 ? formatMoney(amount * (10 ** Number(state.player?.currencyFractionDigits ?? 2))) : '';
    return `<h3>${t('latestSignal')}</h3>${Number.isFinite(Number(analysis.accuracy)) ? `<div class="signal-accuracy"><span>${t('signalAccuracy')}</span><strong>${Number(analysis.accuracy)}%</strong></div>` : ''}<p class="result-detail">${escapeHTML(details)}</p>${amountText ? `<p class="signal-amount-result">${t('signalAmount')}: <strong>${escapeHTML(amountText)}</strong></p>` : ''}<p>${escapeHTML(analysis.note || analysis.disclaimer)}</p><div class="result-stamp">${t('demoAnalysis')} / ${t('simulatedData')}</div><div class="analysis-actions"><button class="button button-ghost" data-copy="${analysis.game}" type="button">${t('copyResult')}</button></div>`;
  }

  function renderHistory() {
    if (!state.history.length) return `<div class="result-empty"><p>${t('noHistory')}</p></div>`;
    return `<div class="history-list">${state.history.map((item) => `<div class="history-item"><strong>${escapeHTML(item.result?.status || t('demoAnalysis'))}</strong><span>${formatDate(item.createdAt)} · ${escapeHTML(item.result?.mode || t('simulatedData'))}</span></div>`).join('')}</div>`;
  }

  function gameControls(game) {
    const runtime = runtimeFor(game);
    const amount = Math.max(1, Number(state.signalAmounts[game]) || 100);
    const amountControl = `<label for="signal-amount">${t('signalAmount')}<div class="signal-amount-field"><input id="signal-amount" type="number" inputmode="decimal" min="1" max="1000000" step="1" value="${amount}"><span>${escapeHTML(state.player?.currencyCode || '')}</span></div></label>`;
    if (game === 'mines') { const active = state.busy || ['closing', 'revealing'].includes(runtime?.phase); return `${amountControl}<label for="mine-size">${t('fieldSize')}<select id="mine-size" ${active ? 'disabled' : ''}><option value="16" ${Number(runtime?.size || 25) === 16 ? 'selected' : ''}>4 × 4</option><option value="25" ${Number(runtime?.size || 25) === 25 ? 'selected' : ''}>5 × 5</option><option value="36" ${Number(runtime?.size || 25) === 36 ? 'selected' : ''}>6 × 6</option></select></label><label for="mine-count">${t('mineCount')}<select id="mine-count" ${active ? 'disabled' : ''}><option ${Number(runtime?.mines || 4) === 3 ? 'selected' : ''}>3</option><option ${Number(runtime?.mines || 4) === 4 ? 'selected' : ''}>4</option><option ${Number(runtime?.mines || 4) === 6 ? 'selected' : ''}>6</option><option ${Number(runtime?.mines || 4) === 8 ? 'selected' : ''}>8</option></select></label><div class="control-note">${t('signalAmountNote')}</div>`; }
    if (game === 'football-penalties') return `${amountControl}<div class="fixed-role"><span>${t('role')}</span><strong>${t('striker')}</strong></div><div class="control-note">${t('strikerOnlyNote')}</div>`;
    return `${amountControl}<div class="signal-state-card"><span class="status-dot"></span><strong data-runtime-state>${phaseLabel(runtime?.phase || 'ready')}</strong><small>${t('signalAmountNote')}</small></div>`;
  }

  function debugEffectButtons() {
    const effects = ['propeller', 'engineGlow', 'smoke', 'trail', 'crash', 'sparks', 'chickenJump', 'chickenFall', 'appleFlip', 'appleSafe', 'appleDanger', 'keeperDive'];
    return effects.map((effect) => `<button type="button" class="debug-effect-button ${state.debugRuntime?.effect === effect ? 'is-active' : ''}" data-debug-effect="${effect}">${t({ propeller: 'debugPropeller', engineGlow: 'debugEngineGlow', smoke: 'debugSmoke', trail: 'debugTrail', crash: 'debugCrash', sparks: 'debugSparks', chickenJump: 'debugChickenJump', chickenFall: 'debugChickenFall', appleFlip: 'debugAppleFlip', appleSafe: 'debugAppleSafe', appleDanger: 'debugAppleDanger', keeperDive: 'debugKeeperDive' }[effect])}</button>`).join('');
  }

  function renderArtDebug() {
    if (!isArtDebug()) return '';
    const effect = state.debugRuntime?.effect || 'propeller'; const domEffect = ['chickenJump', 'chickenFall', 'appleFlip', 'appleSafe', 'appleDanger', 'keeperDive'].includes(effect);
    return `<details class="art-debug-panel" open><summary>${t('artDebug')}</summary><p class="debug-hint">${t('debugHint')}</p><div class="debug-effect-list">${debugEffectButtons()}</div><div class="debug-preview ${domEffect ? 'is-dom-preview' : ''}" data-debug-effect-view="${effect}"><canvas data-debug-canvas aria-label="${t('artDebug')}"></canvas><div class="debug-dom-preview" data-debug-dom>${effect === 'chickenJump' || effect === 'chickenFall' ? `<img class="debug-chick" src="${ART.chicken.chick}" alt="${t('chickenRoad')}">` : effect === 'keeperDive' ? `<img class="debug-keeper" src="${ART.football.goalkeeper}" alt="${t('goalkeeper')}">` : `<div class="debug-apple-card"><img class="debug-apple-tile" src="${ART.apple.tile}" alt=""><img class="debug-apple ${effect === 'appleDanger' ? 'is-danger' : ''}" src="${effect === 'appleDanger' ? ART.apple.bitten : ART.apple.whole}" alt=""></div>`}</div><span class="debug-label">${t({ propeller: 'debugPropeller', engineGlow: 'debugEngineGlow', smoke: 'debugSmoke', trail: 'debugTrail', crash: 'debugCrash', sparks: 'debugSparks', chickenJump: 'debugChickenJump', chickenFall: 'debugChickenFall', appleFlip: 'debugAppleFlip', appleSafe: 'debugAppleSafe', appleDanger: 'debugAppleDanger', keeperDive: 'debugKeeperDive' }[effect])}</span></div><button class="button button-ghost" type="button" data-debug-stop>${t('resetPreview')}</button></details>`;
  }

  function renderGameView(game) {
    if (game === 'apple-of-fortune') return renderAppleGameView();
    const runtime = runtimeFor(game); const signalPlaying = runtime?.phase === 'video' || (game === 'mines' && ['closing', 'revealing'].includes(runtime?.phase));
    return `<header class="workspace-header game-header"><div><p class="eyebrow">${t('games')} / ${String(games.indexOf(game) + 1).padStart(2, '0')}</p><h1>${gameLabel(game)}</h1><p class="lede">${t('gameIntro')}</p></div><div class="header-actions"><button class="game-exit-button" data-view="overview" type="button"><span class="game-exit-icon" aria-hidden="true">&#8592;</span>${t('backToHome')}</button></div></header><div class="content-width game-view"><div class="game-layout"><section class="game-stage"><div class="stage-topline"><div><span class="stage-index">0${games.indexOf(game) + 1}</span><span class="status-badge muted">РАУНД</span></div><span class="round-state" data-game-live-state aria-live="polite">${signalPlaying ? 'СИГНАЛ' : phaseLabel(runtime?.phase || 'ready')}</span></div>${renderGameStage(game)}${renderArtDebug()}</section><aside class="game-side"><section class="panel control-panel"><div class="panel-head"><div><p class="panel-kicker">${t('controlStack')}</p><h2>${t('gameStatus')}</h2></div><span class="status-dot"></span></div><div class="panel-body control-fields">${gameControls(game)}<button class="button button-primary button-full" data-analyze="${game}" type="button" ${state.busy || signalPlaying ? 'disabled' : ''}>${state.busy || signalPlaying ? t('analysisLoading') : t('getSignal')}</button><button class="button button-ghost button-full" data-copy="${game}" type="button" ${state.analysis?.game === game ? '' : 'disabled'}>${t('copyResult')}</button><p class="form-message" role="alert" aria-live="polite">${escapeHTML(state.message)}</p></div></section><section class="panel result-panel"><div class="panel-head"><div><p class="panel-kicker">${t('result')}</p><h2>${t('latestSignal')}</h2></div></div><div class="panel-body">${renderResult(state.analysis?.game === game ? state.analysis : null)}</div></section><section class="panel history-panel"><div class="panel-head"><div><p class="panel-kicker">${t('history')}</p><h3>${t('attempts')}</h3></div></div><div class="panel-body">${renderHistory()}</div></section></aside></div>${renderFooter()}</div>`;
  }

  function renderActivityView() {
    const days = state.activity?.days || [];
    return `<header class="workspace-header"><div><p class="eyebrow">${t('activity')}</p><h1>${t('activeDays')}</h1><p class="lede">${t('realPlayersOnly')}</p></div><div class="header-actions"><button class="button button-ghost" data-view="overview" type="button">${t('overview')}</button></div></header><div class="content-width activity-view"><div class="two-column"><section class="panel"><div class="panel-head"><div><p class="panel-kicker">${t('activeDays')}</p><h2>${state.player.activeDays}</h2></div><span class="level-number">${String(state.player.level).padStart(2, '0')}</span></div><div class="panel-body"><dl class="data-list"><div><dt>${t('currentStreak')}</dt><dd>${state.player.consecutiveActiveDays}</dd></div><div><dt>${t('lastSeen')}</dt><dd>${escapeHTML(formatDate(state.player.lastSeenAt))}</dd></div><div><dt>${t('status')}</dt><dd>${state.player.profileCompleted ? t('profileComplete') : t('notAvailable')}</dd></div></dl></div></section><section class="panel"><div class="panel-head"><div><p class="panel-kicker">${t('activePlayers')}</p><h3>${t('byCountry')}</h3></div></div><div class="panel-body">${renderActivePlayers()}</div></section></div><section class="panel"><div class="panel-head"><div><p class="panel-kicker">${t('history')}</p><h2>${t('activity')}</h2></div></div><div class="panel-body table-overflow">${days.length ? `<table class="activity-table"><thead><tr><th>${t('date')}</th><th>${t('games')}</th><th>${t('signals')}</th><th>${t('sessions')}</th></tr></thead><tbody>${days.map((day) => `<tr><td><strong>${escapeHTML(day.activityDate)}</strong></td><td>${day.gamesUsed.map((game) => escapeHTML(gameLabel(game))).join(', ')}</td><td>${day.signalCount}</td><td>${day.sessionCount}</td></tr>`).join('')}</tbody></table>` : `<div class="empty-state"><p>${t('noHistory')}</p></div>`}</div></section>${renderFooter()}</div>`;
  }

  function renderProfileView() {
    const total = state.player.balanceMinor + state.player.bonusBalanceMinor; const meetsAmount = total >= state.minWithdrawalMinor; const canWithdraw = state.player.withdrawalEligible && meetsAmount; const reason = !state.player.withdrawalEligible ? t('withdrawalNeedDays') : !meetsAmount ? `${t('withdrawalNeedAmount')} (${formatMoney(state.minWithdrawalMinor)})` : t('withdrawalDemo');
    return `<header class="workspace-header"><div><p class="eyebrow">${t('profile')}</p><h1>${t('profile')}</h1><p class="lede">${t('profileNote')}</p></div><div class="header-actions"><button class="button button-ghost" data-view="overview" type="button">${t('overview')}</button></div></header><div class="content-width profile-view"><div class="profile-grid-large"><section class="panel"><div class="profile-identity"><span class="avatar" data-user-initial></span><div><h2 data-user-name></h2><p>${escapeHTML(state.player.playerId)}</p></div></div><div class="profile-body"><dl class="data-list"><div><dt>${t('country')}</dt><dd>${escapeHTML(state.player.countryName || state.player.countryCode || t('notAvailable'))}</dd></div><div><dt>${t('currency')}</dt><dd>${escapeHTML(state.player.currencyCode || t('notAvailable'))}</dd></div><div><dt>${t('level')}</dt><dd>${state.player.level}</dd></div><div><dt>${t('activeDays')}</dt><dd>${state.player.activeDays}</dd></div></dl></div></section><section class="withdrawal-card ${canWithdraw ? '' : 'locked'}"><p class="panel-kicker">${t('withdrawal')}</p><h2>${escapeHTML(formatMoney(total))}</h2><p>${escapeHTML(reason)}</p><button class="button ${canWithdraw ? 'button-primary' : 'button-ghost'} button-full" id="withdraw-button" type="button" ${canWithdraw ? '' : 'disabled'}>${t('withdrawBalance')}</button></section></div><section class="panel manual-balance-panel"><div class="panel-head"><div><p class="panel-kicker">${t('realBalance')}</p><h2>${t('manualBalanceTitle')}</h2></div></div><div class="panel-body"><p class="manual-balance-note">${t('manualBalanceNote')}</p><form id="balance-form" class="manual-balance-form"><label>${t('manualBalanceLabel')}<input type="text" inputmode="decimal" name="balanceAmount" placeholder="${formatMoney(state.player.balanceMinor)}" required></label><button class="button button-primary" type="submit" ${state.busy ? 'disabled' : ''}>${t('manualBalanceButton')}</button></form>${state.balanceMessage ? `<p class="form-message" role="status">${escapeHTML(state.balanceMessage)}</p>` : ''}</div></section><section class="panel profile-level"><div class="panel-head"><div><p class="panel-kicker">${t('level')} ${state.player.level}</p><h2>${t('bonusBalance')}</h2></div></div><div class="panel-body">${renderLevelPanel()}</div></section>${renderFooter()}</div>`;
  }

  function renderShell() {
    app.className = 'workspace'; const current = state.view === 'game' ? state.activeGame : state.view; const gameButtons = games.map((game, index) => `<button class="game-nav ${current === game ? 'active' : ''}" type="button" data-game="${game}"><span class="game-nav-icon">${String(index + 1).padStart(2, '0')}</span><span>${gameLabel(game)}</span><span class="game-dot"></span></button>`).join(''); const liveButton = ''; const main = state.view === 'overview' ? renderOverview() : state.view === 'activity' ? renderActivityView() : state.view === 'profile' ? renderProfileView() : renderGameView(state.activeGame);
    app.innerHTML = `${authModal()}<a class="skip-link" href="#main-content">${t('skipToContent')}</a><aside class="side-rail"><a class="brand-lockup brand-link" href="#" data-view="overview"><span class="brand-mark">B</span><span><strong>BET<em>WINNER</em></strong><small>LINE</small></span></a><p class="rail-label">${t('workspace')}</p><nav class="nav-list" aria-label="${t('workspace')}"><button class="nav-button ${state.view === 'overview' ? 'active' : ''}" type="button" data-view="overview"><span class="nav-icon">01</span>${t('overview')}</button><button class="nav-button ${state.view === 'activity' ? 'active' : ''}" type="button" data-view="activity"><span class="nav-icon">02</span>${t('activity')}</button><button class="nav-button ${state.view === 'profile' ? 'active' : ''}" type="button" data-view="profile"><span class="nav-icon">03</span>${t('profile')}</button></nav><p class="rail-label">${t('games')}</p><nav class="nav-list rail-games" aria-label="${t('games')}">${gameButtons}${liveButton}</nav><div class="rail-footer"><div class="player-chip"><span class="avatar" data-user-initial></span><span data-user-name></span></div><button class="nav-button" id="logout-button" type="button"><span class="nav-icon">↗</span>${t('signOut')}</button></div></aside><div class="workspace-main"><header class="platform-topbar"><a class="topbar-brand" href="#" data-view="overview"><span class="topbar-mark">B</span><span><strong>BET<em>WINNER</em> LINE</strong></span></a><nav class="topbar-categories" aria-label="${t('games')}"><span class="topbar-game-links">${gameButtons}</span></nav><div class="topbar-status"><select class="language-select topbar-language" name="language" aria-label="${t('language')}">${langOptions()}</select><button class="topbar-auth-button topbar-register" type="button" data-auth-action="register">Регистрация</button><button class="topbar-auth-button topbar-login" type="button" data-auth-action="login">Вход</button></div></header><main id="main-content">${main}</main><nav class="mobile-bottom-nav" aria-label="${t('workspace')}"><button class="nav-button ${state.view === 'overview' ? 'active' : ''}" type="button" data-view="overview"><span class="nav-icon">01</span>${t('overview')}</button><button class="nav-button ${state.view === 'activity' ? 'active' : ''}" type="button" data-view="activity"><span class="nav-icon">02</span>${t('activity')}</button><button class="nav-button ${state.view === 'profile' ? 'active' : ''}" type="button" data-view="profile"><span class="nav-icon">03</span>${t('profile')}</button></nav></div>${legalDialog()}`;
    document.querySelectorAll('[data-user-name]').forEach((node) => { node.textContent = state.player.nickname || state.player.playerId; }); document.querySelectorAll('[data-user-initial]').forEach((node) => { node.textContent = initial(state.player.nickname || state.player.playerId); }); document.querySelectorAll('[data-active-name]').forEach((node) => { node.textContent = state.activePlayers[Number(node.dataset.activeName)]?.nickname || t('notAvailable'); }); document.querySelectorAll('[data-active-country]').forEach((node) => { const item = state.activePlayers[Number(node.dataset.activeCountry)]; node.textContent = item?.countryName || item?.countryCode || ''; }); document.querySelectorAll('[data-active-initial]').forEach((node) => { node.textContent = initial(state.activePlayers[Number(node.dataset.activeInitial)]?.nickname); }); document.querySelectorAll('[data-progress]').forEach((node) => { node.style.width = `${Math.max(0, Math.min(100, Number(node.dataset.progress) || 0))}%`; });
    bindShell(); bindAuthModal(); hydrateSceneArt();
  }

  function render() { document.documentElement.lang = locale; document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'; if (!state.player && state.guestMode) state.player = guestPlayer(); if (!state.player) renderAuth(); else if (!state.player.profileCompleted) renderOnboarding(); else renderShell(); }

  async function handleLogin(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); state.busy = true; state.message = ''; render();
    try { const result = await api('/api/auth/login', { method: 'POST', body: { playerId: form.get('playerId'), accessCode: form.get('accessCode') } }); state.player = result.player; state.busy = false; state.message = ''; render(); if (state.player.profileCompleted) await refreshActivity(); }
    catch (error) { state.busy = false; state.message = error.message; render(); }
  }

  async function handleProfileSave(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); state.busy = true; state.message = ''; render();
    try { const result = await api('/api/player/profile', { method: 'PATCH', body: { nickname: form.get('nickname'), countryCode: form.get('countryCode'), currencyCode: form.get('currencyCode'), acceptedTerms: form.get('acceptedTerms') === 'on', acceptedDisclaimer: form.get('acceptedDisclaimer') === 'on' } }); state.player = result.player; state.busy = false; state.message = ''; render(); await refreshActivity(); }
    catch (error) { state.busy = false; state.message = error.message; render(); }
  }

  async function handleBalanceSave(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const fractionDigits = Number(state.player?.currencyFractionDigits ?? 2);
    const amount = Number(String(form.get('balanceAmount') || '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount < 0) { state.balanceMessage = t('manualBalanceInvalid'); render(); return; }
    const balanceMinor = Math.round(amount * 10 ** fractionDigits);
    state.busy = true; state.balanceMessage = ''; render();
    try { const result = await api('/api/player/balance', { method: 'PATCH', body: { balanceMinor } }); state.player = result.player; state.busy = false; state.balanceMessage = t('manualBalanceSaved'); render(); }
    catch (error) { state.busy = false; state.balanceMessage = error.message; render(); }
  }

  async function refreshActivity() {
    try { const result = await api('/api/player/activity'); state.activity = result; state.activePlayers = result.activePlayers || []; state.player = result.summary || state.player; state.minWithdrawalMinor = result.minWithdrawalMinor || state.minWithdrawalMinor; if (state.view !== 'auth') render(); }
    catch { /* Current workspace remains useful when activity is temporarily unavailable. */ }
  }

  async function openGame(game) {
  if (!games.includes(game)) return; stopGameAnimation(); state.view = 'game'; state.activeGame = game; state.analysis = null; state.history = []; state.message = ''; state.runtime = createReadyRuntime(game); render(); scrollWorkspaceToTop();
    try { const result = await api(`/api/games/${game}/history`); state.history = result.history || []; if (state.view === 'game' && state.activeGame === game) render(); }
    catch { /* Empty history is a valid first-run state. */ }
  }

  async function requestAnalysis(game) {
    const amount = Math.max(1, Math.min(1000000, Number(document.getElementById('signal-amount')?.value || state.signalAmounts[game] || 100)));
    const payload = { amount };
    state.signalAmounts[game] = amount;
    if (game === 'mines') { payload.size = Number(document.getElementById('mine-size')?.value || 25); payload.mines = Number(document.getElementById('mine-count')?.value || 4); }
    const previousRuntime = runtimeFor(game);
    if (game === 'mines' && previousRuntime?.revealedCells?.length && ['revealed', 'mine'].includes(previousRuntime.phase)) {
      state.busy = true;
      const analyzeButton = document.querySelector('[data-analyze="mines"]');
      if (analyzeButton) analyzeButton.disabled = true;
      await closeMineSignalBoard(previousRuntime);
      if (state.view !== 'game' || state.activeGame !== game) { state.busy = false; return; }
    }
    stopGameAnimation();
    state.runtime = createReadyRuntime(game);
    if (game === 'mines') { state.runtime.size = payload.size; state.runtime.mines = payload.mines; }
    state.busy = true; state.message = ''; render();
    const thinkingDelay = reducedMotion() ? 300 : 2100 + Math.floor(Math.random() * 900);
    try {
      const request = api(`/api/games/${game}/analyze`, { method: 'POST', body: payload }).catch((requestError) => ({ requestError }));
      let [result] = await Promise.all([request, new Promise((resolve) => window.setTimeout(resolve, thinkingDelay))]);
      if (result.requestError) {
        if (result.requestError.status !== 401) throw result.requestError;
        result = { analysis: createGuestSignal(game, payload), activity: { player: state.player } };
      }
      state.analysis = result.analysis; state.player = result.activity?.player || state.player; state.busy = false; state.runtime = createSignalRuntime(game, result.analysis); render(); startSignalPlayback(game);
      if (!state.guestMode) api(`/api/games/${game}/history`).then((history) => { state.history = history.history || []; if (state.view === 'game' && state.activeGame === game && !['video', 'closing', 'revealing'].includes(runtimeFor(game)?.phase)) render(); }).catch(() => {});
    }
    catch (error) { state.busy = false; state.message = error.message; render(); }
  }

  function localWeighted(entries) {
    const roll = Math.random(); let cursor = 0;
    for (const [value, weight] of entries) { cursor += weight; if (roll <= cursor) return value; }
    return entries[entries.length - 1][0];
  }

  function localVideoOutcome(game) {
    const outcomes = GAME_VIDEO_OUTCOMES[game] || [];
    const total = outcomes.reduce((sum, outcome) => sum + outcome[2], 0);
    let roll = Math.random() * total;
    const selected = outcomes.find((outcome) => { roll -= outcome[2]; return roll <= 0; }) || outcomes[outcomes.length - 1];
    if (!selected) return null;
    const [file, multiplier, , extra] = selected;
    return {
      src: `${GAME_VIDEO_ROOT}/${game}/${file}`,
      file,
      label: Number.isFinite(multiplier) ? `${multiplier}x` : 'LOSE',
      multiplier,
      outcome: game === 'mines' ? extra : 'win',
      step: game === 'chicken-road' ? extra : null,
    };
  }

  function localAccuracy(amount) {
    const normalized = Math.max(1, Math.min(1000000, Number(amount) || 100));
    return Math.max(82, Math.min(98, Math.round(82 + 15 * (1 - Math.exp(-normalized / 250)) + (Math.random() * 3.2 - 1.6))));
  }

  function localAviatorMultiplier() {
    const band = localWeighted([['low', .7], ['medium', .22], ['high', .07], ['rare', .01]]);
    const ranges = { low: [1.05, 1.99], medium: [2, 4.99], high: [5, 9.99], rare: [10, 25] };
    const [min, max] = ranges[band];
    return Number((min + Math.random() * (max - min)).toFixed(2));
  }

  function localSample(total, count, excluded = new Set()) {
    const values = Array.from({ length: total }, (_, index) => index).filter((index) => !excluded.has(index));
    for (let index = values.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [values[index], values[swap]] = [values[swap], values[index]]; }
    return values.slice(0, Math.min(count, values.length));
  }

  function localMinesOutcome(size, mines) {
    const minePositions = localSample(size, mines);
    const desiredSafeCount = localWeighted([[1,.08],[2,.2],[3,.25],[4,.2],[5,.13],[6,.08],[7,.04],[8,.02]]);
    const safeCount = Math.max(1, Math.min(desiredSafeCount, size - mines));
    const revealPath = localSample(size, safeCount, new Set(minePositions));
    const explosionChance = Math.min(.52, .22 + (mines / size) * .9);
    const explodes = Math.random() < explosionChance;
    const bombCell = explodes ? minePositions[Math.floor(Math.random() * minePositions.length)] : null;
    let survival = 1;
    for (let pick = 0; pick < safeCount; pick += 1) survival *= (size - mines - pick) / (size - pick);
    const multiplier = Number((survival > 0 ? .97 / survival : 0).toFixed(2));
    return { minePositions, revealPath, recommendedCells: revealPath, safeCount, bombCell, result: explodes ? 'mine' : 'safe', outcome: explodes ? 'MINE' : 'SAFE STOP', multiplier: `${multiplier.toFixed(2)}x` };
  }

  function createGuestSignal(game, payload) {
    const amount = Number(payload.amount) || 100;
    const base = { game, gameLabel: gameLabel(game), demo: true, mode: 'SIMULATED DATA', status: 'AI ANALYSIS', generatedAt: new Date().toISOString(), signalAmount: amount, accuracy: localAccuracy(amount), disclaimer: t('disclaimerText') };
    if (game === 'aviator') { const video = localVideoOutcome(game); return { ...base, video, multiplier: `${Number(video.multiplier).toFixed(2)}x`, countdown: 2 + Math.floor(Math.random() * 2), note: 'The generated outcome video plays automatically.' }; }
    if (game === 'chicken-road') { const video = localVideoOutcome(game); const targetStep = video.step; const multipliers = GAME_VIDEO_OUTCOMES[game].map((outcome) => `${outcome[1]}x`); return { ...base, video, targetStep, safeSteps: Array.from({ length: targetStep }, (_, index) => index + 1), multiplier: `${video.multiplier}x`, multipliers, note: 'The chicken follows the generated video signal automatically.' }; }
    if (game === 'apple-of-fortune') { const targetRow = localWeighted([[1,.2],[2,.22],[3,.2],[4,.15],[5,.1],[6,.06],[7,.04],[8,.02],[9,.008],[10,.002]]); return { ...base, targetRow, rows: APPLE_MULTIPLIERS.map((multiplier, index) => ({ level: index + 1, recommendedCell: 1 + Math.floor(Math.random() * 5), cells: [1,2,3,4,5], multiplier: `x${multiplier}` })), note: 'The generated signal opens the recommended path automatically.' }; }
    if (game === 'mines') { const size = [16,25,36].includes(Number(payload.size)) ? Number(payload.size) : 25; const mines = Math.min(Math.max(Number(payload.mines) || 4, 1), Math.floor(size / 2)); const outcome = localMinesOutcome(size, mines); return { ...base, size, mines, ...outcome, note: outcome.result === 'mine' ? 'The procedural signal opens safe cells, then reaches a mine.' : 'The procedural signal stops safely before a mine.' }; }
    const video = localVideoOutcome(game); const recommendedZone = 1 + Math.floor(Math.random() * 5); return { ...base, video, zones: 5, role: 'striker', recommendedZone, direction: ['left','left-center','center','right-center','right'][recommendedZone - 1], result: 'goal', outcome: 'GOAL', multiplier: `${video.multiplier}x`, note: 'The striker follows the generated video signal automatically.' };
  }

  async function copyResult(game) {
    const analysis = state.analysis?.game === game ? state.analysis : null; if (!analysis) return; const line = `${analysis.status} / ${analysis.gameLabel} / ${analysis.mode} / ${analysis.note || analysis.disclaimer}`; let copied = false;
    try { if (navigator.clipboard?.writeText) copied = (await Promise.race([navigator.clipboard.writeText(line).then(() => true), new Promise((resolve) => window.setTimeout(() => resolve(false), 600))])) === true; } catch { copied = false; }
    if (!copied) { const fallback = document.createElement('textarea'); fallback.value = line; fallback.setAttribute('readonly', ''); fallback.style.position = 'fixed'; fallback.style.opacity = '0'; document.body.appendChild(fallback); fallback.select(); try { copied = document.execCommand('copy'); } catch { copied = false; } fallback.remove(); }
    state.message = copied ? t('copied') : t('errorGeneric'); render();
  }

  function openLegal(kind) {
    const dialog = document.getElementById('legal-dialog'); if (!dialog) return; const titles = { privacy: t('legalPrivacy'), terms: t('legalTerms'), responsible: t('legalResponsible'), disclaimer: t('legalDisclaimer') }; const texts = { privacy: t('privacyText'), terms: t('termsText'), responsible: t('responsibleText'), disclaimer: t('disclaimerText') }; const body = dialog.querySelector('[data-legal-body]'); body.innerHTML = `<p class="eyebrow">BETWINNER / LINE</p><h2>${titles[kind]}</h2><p data-legal-text></p>`; body.querySelector('[data-legal-text]').textContent = texts[kind]; dialog.showModal();
  }

  function openRules() { const dialog = document.getElementById('legal-dialog'); if (!dialog) return; const body = dialog.querySelector('[data-legal-body]'); body.innerHTML = `<p class="eyebrow">${t('footballPenalties')} / ${t('simulationMode')}</p><h2>${t('rules')}</h2><p data-rules-text></p>`; body.querySelector('[data-rules-text]').textContent = t('footballRulesText'); dialog.showModal(); }
  function openAppleRules() { const dialog = document.getElementById('legal-dialog'); if (!dialog) return; const body = dialog.querySelector('[data-legal-body]'); body.innerHTML = `<p class="eyebrow">${t('appleFortune')}</p><h2>${t('rules')}</h2><p data-rules-text></p>`; body.querySelector('[data-rules-text]').textContent = t('appleRulesText'); dialog.showModal(); }
  function bindLegalLinks() { document.querySelectorAll('[data-legal]').forEach((button) => button.addEventListener('click', () => openLegal(button.dataset.legal))); }
  function bindDialogClose() { document.querySelector('[data-close-dialog]')?.addEventListener('click', () => document.getElementById('legal-dialog')?.close()); }

  function scrollWorkspaceToTop() { window.scrollTo(0, 0); document.querySelector('.workspace-main')?.scrollTo?.(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }

  function bindShell() {
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', async (event) => { event.preventDefault(); stopGameAnimation(); state.view = button.dataset.view; state.message = ''; scrollWorkspaceToTop(); if (state.view === 'activity') await refreshActivity(); else render(); }));
  document.querySelectorAll('[data-game]').forEach((button) => button.addEventListener('click', () => openGame(button.dataset.game)));
    document.querySelectorAll('[data-auth-action]').forEach((button) => button.addEventListener('click', () => openAuthModal(button.dataset.authAction)));
    document.querySelectorAll('[data-analyze]').forEach((button) => button.addEventListener('click', () => requestAnalysis(button.dataset.analyze)));
    document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', () => copyResult(button.dataset.copy)));
    document.querySelectorAll('.language-select, .rail-language').forEach((select) => select.addEventListener('change', () => { locale = select.value; localStorage.setItem('verdant-locale', locale); render(); }));
    document.getElementById('logout-button')?.addEventListener('click', logout); document.getElementById('withdraw-button')?.addEventListener('click', openWithdrawDialog); document.getElementById('balance-form')?.addEventListener('submit', handleBalanceSave);
    document.querySelectorAll('[data-game-action]').forEach((button) => button.addEventListener('click', () => handleGameAction(button.dataset.gameAction, button.dataset.cell, button.dataset.zone, button.dataset.stake)));
    document.querySelector('[data-apple-stake-input]')?.addEventListener('input', (event) => setAppleStake(event.target.value));
    document.getElementById('mine-size')?.addEventListener('change', resetMineFromControls); document.getElementById('mine-count')?.addEventListener('change', resetMineFromControls);
    document.getElementById('signal-amount')?.addEventListener('input', (event) => { state.signalAmounts[state.activeGame] = Math.max(1, Number(event.target.value) || 1); });
    document.querySelectorAll('[data-debug-effect]').forEach((button) => button.addEventListener('click', () => startDebugEffect(button.dataset.debugEffect))); document.querySelector('[data-debug-stop]')?.addEventListener('click', () => { stopGameAnimation(); render(); });
    bindLegalLinks();
    bindDialogClose();
  }

  function openWithdrawDialog() { const dialog = document.getElementById('legal-dialog'); if (!dialog) return; const body = dialog.querySelector('[data-legal-body]'); body.innerHTML = `<p class="eyebrow">${t('withdrawal')}</p><h2>${t('withdrawBalance')}</h2><p data-withdraw-copy></p><button class="button button-ghost" data-close-dialog type="button">${t('close')}</button>`; body.querySelector('[data-withdraw-copy]').textContent = t('withdrawalDemo'); body.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close()); dialog.showModal(); }
  async function logout() { try { await api('/api/auth/logout', { method: 'POST' }); } finally { stopGameAnimation(); state.player = null; state.activity = null; state.activePlayers = []; state.view = 'overview'; render(); } }

  function createReadyRuntime(game) {
    if (game === 'aviator') return { game, token: Date.now(), phase: 'ready', countdown: 0, multiplier: 1, progress: 0, takeoffProgress: 0, cruiseProgress: 0, startedAt: 0, crashAt: 0, sprites: createAtlasSet(), timers: new Set() };
    if (game === 'chicken-road') return createChickenRuntime();
    if (game === 'apple-of-fortune') return createAppleSignalRuntime();
    if (game === 'mines') return createMineRuntime();
    return createFootballRuntime();
  }

  function createSignalRuntime(game, analysis) {
    if (VIDEO_GAMES.has(game) && analysis.video?.src) {
      return { ...createReadyRuntime(game), token: Date.now(), phase: 'ready', videoSrc: analysis.video.src, videoLabel: analysis.video.label || '', videoOutcome: analysis.video.outcome || 'win' };
    }
    if (game === 'aviator') return { game, token: Date.now(), phase: 'ready', multiplier: 1, targetMultiplier: Number.parseFloat(analysis.multiplier) || 1.25, progress: 0, takeoffProgress: 0, cruiseProgress: 0, startedAt: 0, timers: new Set() };
    if (game === 'chicken-road') return { ...createChickenRuntime(), targetStep: Number(analysis.targetStep || analysis.safeSteps?.length || 1), multiplier: 1 };
    if (game === 'apple-of-fortune') return createAppleSignalRuntime(analysis);
    if (game === 'mines') return { ...createMineRuntime(), size: Number(analysis.size) || 25, mines: Number(analysis.mines) || 4, minePositions: analysis.minePositions || [], revealPath: analysis.revealPath || analysis.recommendedCells || [], bombCell: analysis.bombCell ?? null, result: analysis.result || 'safe', multiplier: analysis.multiplier || '1.00x', revealedCells: [], activeCell: null, phase: 'ready' };
    return { ...createFootballRuntime(), shotZone: Number(analysis.recommendedZone) || 3, result: analysis.result || 'goal', stake: Number(analysis.signalAmount) || 100 };
  }

  function startSignalPlayback(game) {
    const runtime = runtimeFor(game);
    if (!runtime) return;
    if (VIDEO_GAMES.has(game) && runtime.videoSrc) {
      runtime.phase = 'video';
      state.runtime = runtime;
      render();
      return;
    }
    if (game === 'aviator') {
      runtime.phase = 'takeoff'; runtime.startedAt = performance.now(); render();
      state.sceneLoop.start((now) => tickSignalAviator(runtime.token, now));
      return;
    }
    if (game === 'chicken-road') { runtime.phase = 'jumping'; runtime.step = 0; runtime.nextStep = 1; updateChickenSignalDom(runtime, true); advanceChickenSignal(runtime.token); return; }
    if (game === 'apple-of-fortune') { runtime.phase = 'opening'; runtime.activeRow = 1; runtime.revealedCells = {}; advanceAppleSignal(runtime.token, 0); return; }
    if (game === 'mines') { runtime.phase = 'revealing'; runtime.revealedCells = []; updateMineSignalDom(runtime); playMineSignal(runtime.token); return; }
    runtime.phase = 'kick'; runtime.score = 0; render();
    scheduleRuntime(() => { const current = runtimeFor('football-penalties'); if (!current) return; current.phase = current.result; current.score = current.result === 'goal' ? 1 : 0; state.footballHistory.unshift({ role: 'striker', stake: current.stake, zone: current.shotZone, result: current.result }); state.footballHistory = state.footballHistory.slice(0, 6); render(); }, 1250);
  }

  function tickSignalAviator(token, now) {
    const runtime = runtimeFor('aviator');
    if (!runtime || runtime.token !== token) return state.sceneLoop.stop();
    const target = Math.max(1.01, Number(runtime.targetMultiplier) || 1.25);
    const takeoffDuration = reducedMotion() ? 80 : 2600;
    const cruiseDuration = reducedMotion() ? 320 : Math.min(14000, 7200 + Math.log2(target) * 1700);
    const elapsed = Math.max(0, now - runtime.startedAt);
    if (elapsed < takeoffDuration) {
      const takeoff = Math.min(1, elapsed / takeoffDuration);
      runtime.takeoffProgress = 1 - Math.pow(1 - takeoff, 2.4);
      runtime.cruiseProgress = 0;
      runtime.progress = runtime.takeoffProgress * .34;
      runtime.phase = 'takeoff';
      runtime.multiplier = 1;
      updateRuntimeDom('aviator');
      return;
    }
    const cruise = Math.min(1, (elapsed - takeoffDuration) / cruiseDuration);
    const eased = 1 - Math.pow(1 - cruise, 1.8);
    runtime.takeoffProgress = 1;
    runtime.cruiseProgress = cruise;
    runtime.progress = .34 + eased * .66;
    runtime.phase = 'flying';
    runtime.multiplier = 1 + (target - 1) * eased;
    updateRuntimeDom('aviator');
    if (cruise < 1) return;
    runtime.multiplier = target; runtime.phase = 'ended'; state.sceneLoop.stop(); updateRuntimeDom('aviator');
  }

  function advanceChickenSignal(token) {
    const runtime = runtimeFor('chicken-road');
    if (!runtime || runtime.token !== token) return;
    runtime.nextStep = Math.min(runtime.targetStep, runtime.step + 1);
    runtime.phase = 'jumping';
    updateChickenSignalDom(runtime, true);
    scheduleRuntime(() => {
      const current = runtimeFor('chicken-road'); if (!current || current.token !== token) return;
      current.step = current.nextStep; current.multiplier = Number.parseFloat(state.analysis?.multipliers?.[current.step - 1] || state.analysis?.multiplier) || 1;
      current.phase = current.step >= current.targetStep ? 'ended' : 'safe'; updateChickenSignalDom(current);
      if (current.step < current.targetStep) scheduleRuntime(() => advanceChickenSignal(token), 280);
    }, 760);
  }

  function advanceAppleSignal(token, index) {
    const runtime = runtimeFor('apple-of-fortune');
    const rows = state.analysis?.game === 'apple-of-fortune' ? state.analysis.rows || [] : [];
    const targetRow = Math.max(1, Math.min(rows.length, Number(runtime?.targetRow) || 1));
    if (!runtime || runtime.token !== token || !rows.length) return;
    if (index >= targetRow) {
      runtime.phase = 'ended';
      const lastRow = rows[targetRow - 1];
      runtime.activeRow = targetRow;
      updateAppleSignalDom(runtime, lastRow, false);
      return;
    }
    const row = rows[index];
    runtime.phase = 'opening';
    runtime.activeRow = row.level;
    updateAppleSignalDom(runtime, row, true);
    scheduleRuntime(() => {
      const current = runtimeFor('apple-of-fortune'); if (!current || current.token !== token) return;
      current.revealedCells[row.level] = { level: row.level, cell: row.recommendedCell, safe: true };
      updateAppleSignalDom(current, row, false);
      scheduleRuntime(() => advanceAppleSignal(token, index + 1), 260);
    }, 620);
  }

  function waitForMineFrame(delay) { return new Promise((resolve) => window.setTimeout(resolve, delay)); }

  function setMineSpriteFrame(sprite, frame, config) {
    const column = frame % config.columns;
    const row = Math.floor(frame / config.columns);
    const x = config.columns === 1 ? 0 : (column / (config.columns - 1)) * 100;
    const y = config.rows === 1 ? 0 : (row / (config.rows - 1)) * 100;
    sprite.style.backgroundPosition = `${x}% ${y}%`;
  }

  async function animateMineCell(token, cellIndex, kind) {
    const runtime = runtimeFor('mines');
    const root = document.querySelector('[data-runtime-game="mines"]');
    const cell = root?.querySelector(`[data-mine-index="${cellIndex}"]`);
    const sprite = cell?.querySelector('.reference-mine-sprite');
    const config = MINES_ANIMATIONS[kind];
    if (!runtime || runtime.token !== token || !cell || !sprite || !config) return false;
    cell.classList.add('is-opening');
    sprite.className = `reference-mine-sprite is-active is-${kind}`;
    const startFrame = reducedMotion() ? config.frames - 1 : 0;
    for (let frame = startFrame; frame < config.frames; frame += 1) {
      const current = runtimeFor('mines');
      if (!current || current.token !== token) return false;
      setMineSpriteFrame(sprite, frame, config);
      if (kind === 'bomb') root.classList.toggle('is-blasting', frame >= 24);
      if (!reducedMotion()) await waitForMineFrame(config.frameDuration);
    }
    root.classList.remove('is-blasting');
    cell.classList.remove('is-opening');
    cell.classList.add(kind === 'bomb' ? 'is-bomb' : 'is-safe');
    sprite.className = `reference-mine-sprite is-${kind}`;
    setMineSpriteFrame(sprite, config.frames - 1, config);
    return true;
  }

  async function playMineSignal(token) {
    const runtime = runtimeFor('mines');
    if (!runtime || runtime.token !== token) return;
    for (const cellIndex of runtime.revealPath) {
      const current = runtimeFor('mines');
      if (!current || current.token !== token) return;
      current.phase = 'revealing';
      current.activeCell = cellIndex;
      updateMineSignalDom(current);
      if (!await animateMineCell(token, cellIndex, 'reveal')) return;
      current.revealedCells.push(cellIndex);
      current.activeCell = null;
      updateMineSignalDom(current);
      if (!reducedMotion()) await waitForMineFrame(180);
    }
    const current = runtimeFor('mines');
    if (!current || current.token !== token) return;
    if (current.result === 'mine' && Number.isInteger(current.bombCell)) {
      current.activeCell = current.bombCell;
      updateMineSignalDom(current);
      if (!reducedMotion()) await waitForMineFrame(220);
      if (!await animateMineCell(token, current.bombCell, 'bomb')) return;
      current.activeCell = null;
      current.phase = 'mine';
    } else {
      current.phase = 'revealed';
    }
    state.runtime = current;
    updateMineSignalDom(current);
  }

  async function closeMineSignalBoard(runtime) {
    if (!runtime?.revealedCells?.length) return;
    runtime.phase = 'closing';
    updateMineSignalDom(runtime);
    const nonce = `${runtime.token}-${Date.now()}`;
    runtime.revealedCells.forEach((cellIndex) => {
      const cell = document.querySelector(`[data-runtime-game="mines"] [data-mine-index="${cellIndex}"]`);
      if (!cell) return;
      cell.classList.add('is-closing');
      cell.insertAdjacentHTML('beforeend', `<img class="reference-mine-close" src="${MINES_SIGNAL_ART.close}?v=${nonce}-${cellIndex}" alt="" aria-hidden="true">`);
    });
    if (!reducedMotion()) await waitForMineFrame(MINES_ANIMATIONS.closeDuration);
  }

  function createAviatorRuntime() { const sprites = createAtlasSet(); Object.values(sprites).forEach((player) => player.play()); return { game: 'aviator', token: Date.now(), phase: 'countdown', countdown: 7, countdownStep: 0, countdownStartedAt: performance.now(), multiplier: 1, progress: 0, startedAt: 0, crashAt: 0, sprites, timers: new Set() }; }

  function scheduleAviatorCountdown(token) {
    scheduleRuntime(() => {
      const runtime = runtimeFor('aviator');
      if (!runtime || runtime.token !== token) return;
      runtime.countdown = Math.max(0, runtime.countdown - 1);
      runtime.countdownStep = Math.min(7, runtime.countdownStep + 1);
      runtime.countdownStartedAt = performance.now();
      updateRuntimeDom('aviator');
      drawAviatorScene();
      // Keep the final 0/orange slot visible for a complete second: 7 -> 0 is
      // an eight-second countdown, and takeoff begins only after that slot.
      if (runtime.countdown === 0) scheduleRuntime(startAviatorTakeoff, 1000);
      else scheduleAviatorCountdown(token);
    }, 1000);
  }

  function startAviatorRound() { stopGameAnimation(); state.runtime = createAviatorRuntime(); render(); scheduleAviatorCountdown(state.runtime.token); state.sceneLoop.start((now) => { const runtime = runtimeFor('aviator'); if (!runtime) return state.sceneLoop.stop(); if (runtime.phase === 'countdown') drawAviatorScene(now); else tickAviator(runtime.token, now); }); }
  function startAviatorTakeoff() { const runtime = runtimeFor('aviator'); if (!runtime) return; runtime.phase = 'takeoff'; runtime.startedAt = performance.now(); updateRuntimeDom('aviator'); drawAviatorScene(); }
  function tickAviator(token, now) {
    const runtime = runtimeFor('aviator'); if (!runtime || runtime.token !== token) return state.sceneLoop.stop(); const elapsed = now - runtime.startedAt; const takeoffDuration = 720; const flyingDuration = reducedMotion() ? 1200 : 5100;
    if (elapsed < takeoffDuration + flyingDuration) { runtime.phase = elapsed < takeoffDuration ? 'takeoff' : 'flying'; runtime.progress = Math.min(1, elapsed / (takeoffDuration + flyingDuration)); runtime.multiplier = 1 + Math.min(1.34, Math.max(0, elapsed - 240) / 4050); drawAviatorScene(now); updateRuntimeDom('aviator'); return; }
    if (!runtime.crashAt) { runtime.crashAt = now; runtime.phase = 'crash'; runtime.progress = 1; runtime.multiplier = 2.34; updateRuntimeDom('aviator'); }
    drawAviatorScene(now); updateRuntimeDom('aviator'); if (now - runtime.crashAt >= (reducedMotion() ? 0 : 1180)) { runtime.phase = 'ended'; state.sceneLoop.stop(); updateRuntimeDom('aviator'); drawAviatorScene(now); }
  }

  function createChickenRuntime() { return { game: 'chicken-road', token: Date.now(), phase: 'ready', step: 0, target: 1, multiplier: 1, motionStarted: 0, animationStartedAt: 0, timers: new Set() }; }
  function startChickenStep() { const runtime = runtimeFor('chicken-road') || createChickenRuntime(); if (runtime.phase === 'jumping' || runtime.phase === 'fallen' || runtime.step >= 5) return; runtime.target = runtime.step + 1; runtime.fromStep = runtime.step; runtime.motionStarted = performance.now(); runtime.animationStartedAt = runtime.motionStarted; runtime.phase = 'jumping'; state.runtime = runtime; render(); state.sceneLoop.start((now) => tickChicken(runtime.token, now)); }
  function tickChicken(token, now) { const runtime = runtimeFor('chicken-road'); if (!runtime || runtime.token !== token) return state.sceneLoop.stop(); const progress = Math.min(1, (now - runtime.motionStarted) / (reducedMotion() ? 0 : 620)); hydrateChickenPose(runtime, progress); if (progress < 1) return; const safeSteps = state.analysis?.game === 'chicken-road' ? state.analysis.safeSteps : [1, 2, 3]; if (safeSteps.includes(runtime.target)) { runtime.step = runtime.target; runtime.multiplier = 1 + runtime.step * 0.19; runtime.phase = 'safe'; runtime.animationStartedAt = now; state.sceneLoop.stop(); render(); } else { runtime.failedStep = runtime.target; runtime.phase = 'fallen'; runtime.motionStarted = now; runtime.animationStartedAt = now; state.sceneLoop.stop(); render(); state.sceneLoop.start((frameNow) => tickChickenFall(runtime.token, frameNow)); } }
  function tickChickenFall(token, now) { const runtime = runtimeFor('chicken-road'); if (!runtime || runtime.token !== token) return state.sceneLoop.stop(); const progress = Math.min(1, (now - runtime.motionStarted) / (reducedMotion() ? 0 : 520)); hydrateChickenPose(runtime, progress); if (progress >= 1) state.sceneLoop.stop(); }
  function resetChicken() { stopGameAnimation(); state.runtime = createChickenRuntime(); render(); }

  function createAppleSignalRuntime(analysis = null) { return { game: 'apple-of-fortune', token: Date.now(), phase: 'ready', activeRow: 1, targetRow: Math.max(1, Math.min(10, Number(analysis?.targetRow) || 1)), muted: false, revealedCells: {}, timers: new Set() }; }
  function createAppleRuntime() { return { game: 'apple-of-fortune', token: Date.now(), phase: 'idle', activeRow: 1, score: 0, stake: 10, auto: false, muted: false, revealed: null, revealedCells: {}, animationStartedAt: 0, timers: new Set() }; }
  function appleRows() { return state.analysis?.game === 'apple-of-fortune' && Array.isArray(state.analysis.rows) && state.analysis.rows.length ? state.analysis.rows : appleFallbackRows(); }
  function appleFractionDigits() { return Number(state.player?.currencyFractionDigits ?? 2); }
  function toAppleMinor(amount) { return Math.round((Number(amount) || 0) * (10 ** appleFractionDigits())); }
  function setAppleStake(value) { const runtime = runtimeFor('apple-of-fortune') || createAppleRuntime(); if (runtime.phase !== 'idle' && runtime.phase !== 'ended') return; runtime.stake = Math.max(0, Math.round(Number(value) || 0)); state.runtime = runtime; render(); }
  function toggleAppleMute() { const runtime = runtimeFor('apple-of-fortune') || createAppleRuntime(); runtime.muted = !runtime.muted; state.runtime = runtime; render(); }
  function toggleAppleAuto() { const wasAuto = runtimeFor('apple-of-fortune')?.auto; const runtime = runtimeFor('apple-of-fortune') || createAppleRuntime(); runtime.auto = !runtime.auto; state.runtime = runtime; render(); if (!wasAuto && runtime.auto && (runtime.phase === 'idle' || runtime.phase === 'ended')) startAppleRound(); }
  function startAppleRound() {
    const previous = runtimeFor('apple-of-fortune'); const stake = previous?.stake ?? 10; const auto = previous?.auto || false; const muted = previous?.muted || false;
    const stakeMinor = toAppleMinor(stake);
    if (stakeMinor <= 0) { state.message = t('appleInsufficientBalance'); if (auto) { const runtime = previous || createAppleRuntime(); runtime.auto = false; state.runtime = runtime; } render(); return; }
    if (stakeMinor > (state.player.balanceMinor || 0)) {
      state.message = t('appleInsufficientBalance');
      const runtime = previous || createAppleRuntime(); runtime.auto = false; state.runtime = runtime; render(); return;
    }
    state.player.balanceMinor -= stakeMinor;
    stopGameAnimation(); state.runtime = { ...createAppleRuntime(), stake, auto, muted, phase: 'safe', activeRow: 1 }; state.message = ''; render();
  }
  function revealApple(cell) { const runtime = runtimeFor('apple-of-fortune'); if (!runtime || runtime.phase !== 'safe') return; const rows = appleRows(); const row = rows.find((item) => item.level === runtime.activeRow) || rows[0]; runtime.revealed = { level: runtime.activeRow, cell: Number(cell), safe: Number(cell) === Number(row.recommendedCell) }; runtime.animationStartedAt = performance.now(); runtime.phase = 'opening'; state.runtime = runtime; render(); scheduleRuntime(() => { const wasSafe = runtime.revealed.safe; const multiplierValue = Number(String(row.multiplier || '1').replace(/^x/i, '')) || 1; runtime.revealedCells[runtime.revealed.level] = runtime.revealed; if (wasSafe) { runtime.score = Number((runtime.stake * multiplierValue).toFixed(2)); if (runtime.activeRow < rows.length) { runtime.activeRow += 1; runtime.phase = 'safe'; } else { runtime.phase = 'ended'; state.player.balanceMinor += toAppleMinor(runtime.score); } } else { runtime.score = 0; runtime.phase = 'ended'; } runtime.revealed = null; state.runtime = runtime; render(); if (runtime.auto) { if (runtime.phase === 'safe') { const nextRow = rows.find((item) => item.level === runtime.activeRow); scheduleRuntime(() => revealApple(nextRow?.recommendedCell || 1), 650); } else { scheduleRuntime(() => startAppleRound(), 1500); } } }, 560); }
  function cashOutApple() {
    const runtime = runtimeFor('apple-of-fortune'); if (!runtime || runtime.phase !== 'safe' || !(runtime.score > 0)) return;
    state.player.balanceMinor += toAppleMinor(runtime.score); runtime.phase = 'ended'; runtime.auto = false; state.runtime = runtime; render();
  }

  function createMineRuntime() { return { game: 'mines', token: Date.now(), phase: 'ready', size: Number(document.getElementById('mine-size')?.value || 25), mines: Number(document.getElementById('mine-count')?.value || 4), minePositions: [], revealPath: [], revealedCells: [], bombCell: null, activeCell: null, result: null, multiplier: null, accuracy: 0, animationStartedAt: 0, timers: new Set() }; }
  function startMineRound() {
    const runtime = runtimeFor('mines') || createMineRuntime();
    if (runtime.phase === 'analyzing') return;
    runtime.size = Number(document.getElementById('mine-size')?.value || runtime.size || 25);
    runtime.mines = Math.max(1, Math.min(runtime.size - 1, Number(document.getElementById('mine-count')?.value || runtime.mines || 4)));
    runtime.phase = 'analyzing'; runtime.minePositions = []; runtime.token = Date.now();
    state.runtime = runtime; render();
    scheduleRuntime(() => {
      const current = runtimeFor('mines'); if (!current || current.token !== runtime.token) return;
      const positions = new Set(); while (positions.size < current.mines) positions.add(Math.floor(Math.random() * current.size));
      current.minePositions = Array.from(positions); current.accuracy = 83 + Math.floor(Math.random() * 12); current.phase = 'revealed';
      state.runtime = current; render();
    }, 900);
  }
  function resetMineFromControls() { stopGameAnimation(); state.runtime = createMineRuntime(); render(); }

  function createFootballRuntime() { return { game: 'football-penalties', token: Date.now(), phase: 'ready', role: 'striker', selectedZone: 3, selectedDirection: 3, stake: 100, score: 0, shotZone: 3, result: null, animationStartedAt: 0, timers: new Set() }; }
  function selectFootballZone(zone, direction = false) { const runtime = runtimeFor('football-penalties') || createFootballRuntime(); if (runtime.phase !== 'ready') return; if (direction) runtime.selectedDirection = Number(zone); else runtime.selectedZone = Number(zone); state.runtime = runtime; render(); window.setTimeout(() => runFootball(), 40); }
  function runFootball() { const runtime = runtimeFor('football-penalties') || createFootballRuntime(); if (runtime.phase !== 'ready') return; runtime.role = document.getElementById('football-role')?.value || runtime.role || 'striker'; runtime.shotZone = runtime.role === 'striker' ? runtime.selectedZone : ((runtime.token % 5) + 1); runtime.result = null; runtime.phase = 'kick'; runtime.motionStarted = performance.now(); runtime.animationStartedAt = runtime.motionStarted; state.runtime = runtime; render(); state.sceneLoop.start((now) => tickFootball(runtime.token, now)); }
  function tickFootball(token, now) {
    const runtime = runtimeFor('football-penalties'); if (!runtime || runtime.token !== token) return state.sceneLoop.stop();
    const flightDuration = reducedMotion() ? 0 : 650; const reactionDuration = reducedMotion() ? 0 : 420;
    if (runtime.phase === 'kick') {
      const progress = flightDuration ? Math.min(1, (now - runtime.motionStarted) / flightDuration) : 1; hydrateFootballPose(runtime, progress); if (progress < 1) return;
      const chosen = runtime.role === 'striker' ? runtime.selectedZone : runtime.selectedDirection; runtime.result = runtime.role === 'keeper' ? (chosen === runtime.shotZone ? 'save' : 'goal') : (chosen === 1 ? 'miss' : chosen === 3 ? 'save' : 'goal'); runtime.score = (runtime.score || 0) + (runtime.result === 'goal' ? 1 : 0); runtime.phase = 'reaction'; runtime.resultStartedAt = now; runtime.animationStartedAt = now; state.footballHistory.unshift({ role: runtime.role, stake: runtime.stake, zone: chosen, result: runtime.result }); state.footballHistory = state.footballHistory.slice(0, 6); render(); return;
    }
    if (runtime.phase !== 'reaction') return;
    const reactionProgress = reactionDuration ? Math.min(1, (now - runtime.resultStartedAt) / reactionDuration) : 1; hydrateFootballPose(runtime, reactionProgress); if (reactionProgress < 1) return; runtime.phase = runtime.result; state.sceneLoop.stop(); render();
  }

  function handleGameAction(action, cell, zone, stake) {
    if (action === 'aviator-start') return startAviatorRound(); if (action === 'mine-start') return startMineRound(); if (action === 'chicken-step') return startChickenStep(); if (action === 'chicken-reset') return resetChicken(); if (action === 'apple-reveal') return revealApple(cell); if (action === 'apple-reset') { stopGameAnimation(); state.runtime = createAppleRuntime(); return render(); } if (action === 'apple-play') return startAppleRound(); if (action === 'apple-stake-chip') return setAppleStake(stake); if (action === 'apple-stake-clear') return setAppleStake(0); if (action === 'apple-auto') return toggleAppleAuto(); if (action === 'apple-cashout') return cashOutApple(); if (action === 'apple-mute') return toggleAppleMute(); if (action === 'apple-info') return openAppleRules(); if (action === 'mine-reset') return resetMineFromControls(); if (action === 'football-zone') return selectFootballZone(zone); if (action === 'football-direction') return selectFootballZone(zone, true); if (action === 'football-run') return runFootball(); if (action === 'football-next') { const previous = runtimeFor('football-penalties') || {}; stopGameAnimation(); state.runtime = { ...createFootballRuntime(), role: previous.role || 'striker', selectedZone: previous.selectedZone || 3, selectedDirection: previous.selectedDirection || 3, stake: previous.stake || 100 }; return render(); } if (action === 'football-rules') return openRules();
  }

  // One monotonic line is the only owner of aircraft translation. Flattened source sheets are
  // deliberately not moved through a second path because their frames already contain motion.
  function pointOnAviatorPath(width, height, progress) {
    const normalized = Math.max(0, Math.min(1, progress));
    // Keep the trajectory monotonic, but use eased travel and a slightly
    // deeper lift curve so takeoff accelerates smoothly without any orbiting.
    const travel = normalized * normalized * (3 - 2 * normalized);
    const lateral = Math.pow(normalized, 0.92);
    return { x: width * (0.08 + lateral * 0.44), y: height * (0.82 - travel * 0.50) };
  }
  function rotatePoint(x, y, centerX, centerY, rotation) { const dx = x - centerX; const dy = y - centerY; return { x: centerX + dx * Math.cos(rotation) - dy * Math.sin(rotation), y: centerY + dx * Math.sin(rotation) + dy * Math.cos(rotation) }; }
  function planePoint(center, width, height, localX, localY, rotation) { return rotatePoint(center.x + (localX - 0.5) * width, center.y + (localY - 0.5) * height, center.x, center.y, rotation); }
  function drawCenteredImage(context, source, centerX, centerY, width, height, options = {}) { const image = artImage(source); if (!image?.complete || !image.naturalWidth) return false; context.save(); context.globalAlpha = options.alpha ?? 1; context.translate(centerX, centerY); context.rotate(options.rotation || 0); context.drawImage(image, -width / 2, -height / 2, width, height); context.restore(); return true; }
  function drawAviatorCountdownSpinner(context, width, height, runtime, now) {
    if (!runtime || runtime.phase !== 'countdown') return;
    const totalMarkers = 8;
    const radius = Math.min(width * 0.24, 92);
    // The half-circle is anchored inside the lower-right corner. Its right
    // edge stays visible so the ball is never clipped on the first/last step.
    const centerX = width - 18;
    const centerY = height - radius - 14;
    const elapsed = Math.max(0, now - (runtime.countdownStartedAt || now));
    const transition = runtime.countdown === 0 ? 1 : Math.min(1, elapsed / 1000);
    const fromStep = Math.max(0, Math.min(totalMarkers - 1, (runtime.countdownStep || 0) - (runtime.countdownStep > 0 ? 1 : 0)));
    const toStep = Math.max(0, Math.min(totalMarkers - 1, runtime.countdownStep || 0));
    const ballStep = fromStep + (toStep - fromStep) * (transition * transition * (3 - 2 * transition));
    const markerPoint = (step) => {
      const angle = Math.PI / 2 + (step / (totalMarkers - 1)) * Math.PI;
      return { angle, x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
    };
    context.save();
    for (let index = 0; index < totalMarkers; index += 1) {
      const point = markerPoint(index);
      context.save(); context.translate(point.x, point.y); context.rotate(point.angle + Math.PI / 2); context.fillStyle = index === totalMarkers - 1 ? '#f47f22' : 'rgba(247, 249, 246, 0.94)'; context.shadowColor = index === totalMarkers - 1 ? 'rgba(244, 127, 34, 0.38)' : 'rgba(255, 255, 255, 0.22)'; context.shadowBlur = 8; context.beginPath(); context.roundRect(-10, -3, 20, 6, 3); context.fill(); context.restore();
    }
    const ball = markerPoint(ballStep);
    context.shadowColor = 'rgba(255, 255, 255, 0.45)'; context.shadowBlur = 14; context.fillStyle = '#f8faf8'; context.beginPath(); context.arc(ball.x, ball.y, 10, 0, Math.PI * 2); context.fill(); context.shadowBlur = 0;
    context.fillStyle = '#f8faf8'; context.font = '700 48px sans-serif'; context.textAlign = 'right'; context.textBaseline = 'middle'; context.fillText(String(runtime.countdown), width - 14, centerY - radius * 0.20); context.restore();
  }

  function drawAviatorScene(now = performance.now()) {
    document.querySelectorAll('[data-game-canvas="aviator"], [data-chart="aviator"]').forEach((canvas) => {
      const rect = canvas.getBoundingClientRect(); const ratio = Math.min(window.devicePixelRatio || 1, 2); const width = Math.max(1, Math.floor(rect.width)); const height = Math.max(1, Math.floor(rect.height)); const pixelWidth = Math.round(width * ratio); const pixelHeight = Math.round(height * ratio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
      const context = canvas.getContext('2d'); if (!context) return; context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height); context.imageSmoothingEnabled = true;
      const sky = context.createLinearGradient(0, 0, 0, height); sky.addColorStop(0, '#071d2b'); sky.addColorStop(0.58, '#0a392a'); sky.addColorStop(1, '#05160e'); context.fillStyle = sky; context.fillRect(0, 0, width, height);
      context.strokeStyle = 'rgba(163, 237, 140, 0.105)'; context.lineWidth = 1; for (let x = 0; x < width; x += Math.max(28, width / 12)) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); } for (let y = 0; y < height; y += Math.max(30, height / 8)) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
      const runtime = runtimeFor('aviator'); const phase = runtime?.phase || 'ready'; const progress = runtime?.progress ?? 0.58; const point = pointOnAviatorPath(width, height, progress); const mountain = artImage(ART.aviator.mountain);
      if (mountain?.complete && mountain.naturalWidth) { const mountainHeight = Math.min(height * 0.43, width * (mountain.naturalHeight / mountain.naturalWidth)); context.globalAlpha = 0.84; context.drawImage(mountain, 0, height - mountainHeight, width, mountainHeight); context.globalAlpha = 1; }
      const pathProgress = phase === 'countdown' ? 0.03 : progress; const tracePoint = pointOnAviatorPath(width, height, pathProgress); const traceStart = { x: 0, y: height }; context.beginPath(); context.moveTo(traceStart.x, traceStart.y); context.lineTo(tracePoint.x, tracePoint.y); context.lineTo(tracePoint.x, height); context.lineTo(traceStart.x, height); context.closePath(); const area = context.createLinearGradient(0, height, 0, 0); area.addColorStop(0, 'rgba(98, 215, 123, 0.18)'); area.addColorStop(1, 'rgba(98, 215, 123, 0)'); context.fillStyle = area; context.fill(); context.beginPath(); context.moveTo(traceStart.x, traceStart.y); context.lineTo(tracePoint.x, tracePoint.y); context.strokeStyle = phase === 'crash' || phase === 'ended' ? '#efbd58' : '#a4ee8e'; context.lineWidth = 3; context.stroke(); drawAviatorCountdownSpinner(context, width, height, runtime, now);
      const generatedAviatorClip = phase === 'countdown' || phase === 'ready' ? 'aviator_plane_idle' : phase === 'takeoff' ? 'aviator_round_launch' : phase === 'flying' ? 'aviator_flight_loop' : phase === 'crash' ? 'aviator_crash_explosion' : 'aviator_after_crash_dissipate';
      const generatedAviatorElapsed = phase === 'crash' ? Math.max(0, now - (runtime?.crashAt || now)) : phase === 'ended' ? animationClipDuration(generatedAviatorClip) : runtime?.startedAt ? Math.max(0, now - runtime.startedAt) : 0;
      const generatedAviatorSize = Math.min(width * 0.72, height * 0.94);
      const generatedAviatorAnchor = pointOnAviatorPath(width, height, phase === 'countdown' || phase === 'ready' ? 0.04 : progress);
      if (!isArtDebug() && AVIATOR_USE_FLATTENED_COMPOSITE && state.animationManifest) {
        const generatedX = generatedAviatorAnchor.x - generatedAviatorSize / 2;
        const generatedY = generatedAviatorAnchor.y - generatedAviatorSize / 2;
        const drawGenerated = (clipId, elapsed, alpha) => drawAnimationClip(context, clipId, elapsed, generatedX, generatedY, generatedAviatorSize, generatedAviatorSize, { alpha, alignAlphaBounds: true });
        let generatedRendered = false;
        // The supplied launch and flight sheets are flattened composites. Crossfade their
        // hand-off while keeping both alpha bounds on the exact same world anchor; this
        // prevents the first flight frame from popping to a different internal position.
        if (phase === 'takeoff' && generatedAviatorElapsed < 160) {
          const blend = Math.min(1, generatedAviatorElapsed / 160);
          generatedRendered = drawGenerated('aviator_plane_idle', animationClipDuration('aviator_plane_idle'), 0.98 * (1 - blend));
          generatedRendered = drawGenerated('aviator_round_launch', generatedAviatorElapsed, 0.98 * blend) || generatedRendered;
        } else if (phase === 'flying' && generatedAviatorElapsed < 900) {
          const blend = Math.min(1, Math.max(0, (generatedAviatorElapsed - 720) / 180));
          generatedRendered = drawGenerated('aviator_round_launch', animationClipDuration('aviator_round_launch'), 0.98 * (1 - blend));
          generatedRendered = drawGenerated('aviator_flight_loop', generatedAviatorElapsed, 0.98 * blend) || generatedRendered;
        } else {
          generatedRendered = drawGenerated(generatedAviatorClip, generatedAviatorElapsed, 0.98);
        }
        if (generatedRendered) return;
      }
      // Countdown owns the stage before launch: no aircraft or crash layer can
      // leak into the 7 -> 0 preflight view.
      if (phase !== 'countdown') {
        const sprites = runtime?.sprites || createAtlasSet(); const elapsed = runtime?.startedAt ? Math.max(0, now - runtime.startedAt) : 900; const crashElapsed = runtime?.crashAt ? Math.max(0, now - runtime.crashAt) : 0; const terminal = phase === 'crash'; const planeWidth = Math.min(142, Math.max(86, width * 0.27)); const planeHeight = planeWidth * (552 / 1063); const planeRotation = -0.04; const planeProgress = phase === 'ready' ? 0.08 : progress; const planePoint = pointOnAviatorPath(width, height, planeProgress); const planeCenter = { x: Math.max(planePoint.x, planeWidth / 2 + 6), y: planePoint.y };
        // The coefficient line is the only flight trail. Keep the aircraft silhouette clean:
        // no independently animated layers are allowed behind the body during takeoff/flight.
        const planeAlpha = phase === 'crash' ? Math.max(0, 1 - crashElapsed / 180) : phase === 'ended' ? 0 : 1; drawCenteredImage(context, ART.aviator.aircraftComposite, planeCenter.x, planeCenter.y, planeWidth, planeHeight, { alpha: planeAlpha, rotation: planeRotation });
        if (terminal) { const crashPoint = planeCenter; const effectSize = Math.min(220, Math.max(136, width * 0.42)); const crashTime = Math.min(crashElapsed, totalDuration(ATLAS.crash)); sprites.crash.draw(context, crashPoint.x, crashPoint.y, effectSize, effectSize, { elapsed: crashTime, alpha: 0.96 }); sprites.sparks.draw(context, crashPoint.x, crashPoint.y, effectSize * 0.9, effectSize * 0.9, { elapsed: Math.min(crashElapsed, totalDuration(ATLAS.sparks)), alpha: 0.92 }); }
        if (isArtDebug() && canvas.dataset.gameCanvas === 'aviator') drawAviatorAnchorDebug(context, planeCenter, planeWidth, planeHeight, planeRotation);
      }
    });
  }

  const AVIATOR_LAYER_ORDER = ['mountain backdrop', 'coefficient line', 'aircraft (integrated propeller)', 'crash + sparks (last aircraft position)'];

  function drawAviatorAnchorDebug(context, planeCenter, planeWidth, planeHeight, planeRotation) {
    context.save();
    context.font = '10px var(--font-mono, monospace)';
    context.lineWidth = 1;
    // Rotated bounding box around the plane sprite.
    context.save();
    context.translate(planeCenter.x, planeCenter.y);
    context.rotate(planeRotation);
    context.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    context.setLineDash([4, 3]);
    context.strokeRect(-planeWidth / 2, -planeHeight / 2, planeWidth, planeHeight);
    context.setLineDash([]);
    // Direction arrow from tail to nose.
    context.strokeStyle = '#ffcf5c';
    context.beginPath(); context.moveTo(-planeWidth / 2, 0); context.lineTo(planeWidth / 2, 0); context.stroke();
    context.beginPath(); context.moveTo(planeWidth / 2, 0); context.lineTo(planeWidth / 2 - 10, -5); context.lineTo(planeWidth / 2 - 10, 5); context.closePath(); context.fillStyle = '#ffcf5c'; context.fill();
    context.restore();
    const markers = [
      { key: 'pivot', point: planeCenter, color: '#ffffff' },
      { key: 'propeller', point: planePoint(planeCenter, planeWidth, planeHeight, AVIATOR_ANCHORS.propeller.x, AVIATOR_ANCHORS.propeller.y, planeRotation), color: '#7fe0ff' },
    ];
    markers.forEach(({ key, point, color }) => {
      context.beginPath(); context.arc(point.x, point.y, 4, 0, Math.PI * 2); context.fillStyle = color; context.fill();
      context.strokeStyle = 'rgba(0,0,0,0.6)'; context.lineWidth = 1; context.stroke();
      context.fillStyle = color; context.fillText(key, point.x + 7, point.y - 7);
    });
    context.fillStyle = 'rgba(4, 18, 12, 0.72)'; context.fillRect(8, 8, 172, 14 * AVIATOR_LAYER_ORDER.length + 10);
    context.fillStyle = '#dff7d2';
    context.fillText('z-order (back → front):', 14, 22);
    AVIATOR_LAYER_ORDER.forEach((label, index) => context.fillText(`${index + 1}. ${label}`, 14, 22 + (index + 1) * 14));
    context.restore();
  }

  function hydrateChickenPose(runtime, progress = 0) {
    const stage = document.querySelector('[data-runtime-game="chicken-road"] .road-playfield'); const actor = stage?.querySelector('.chick-object'); const van = stage?.querySelector('.van-object'); if (!stage || !actor) return; const width = stage.clientWidth; const height = stage.clientHeight; const from = CHICKEN_SCENE.stepAnchors[Math.max(0, Math.min(5, runtime.fromStep ?? runtime.step ?? 0))]; const to = CHICKEN_SCENE.stepAnchors[Math.max(0, Math.min(5, runtime.target ?? runtime.step ?? 0))]; const moving = runtime.phase === 'jumping'; const p = moving ? Math.max(0, Math.min(1, progress)) : 1; const eased = p < 1 ? p * p * (3 - 2 * p) : 1; const anchor = moving ? from + (to - from) * eased : CHICKEN_SCENE.stepAnchors[Math.max(0, Math.min(5, runtime.step || 0))]; const arc = moving ? Math.sin(Math.PI * p) * Math.min(56, height * 0.25) : 0; const fall = runtime.phase === 'fallen' ? Math.max(0, Math.min(1, progress)) : 0; actor.style.transform = `translate3d(${anchor * width}px, ${-arc + fall * 15}px, 0) translate(-50%, -100%) rotate(${moving ? -8 * Math.sin(Math.PI * p) : fall * 76}deg) scale(${1 + Math.sin(Math.PI * p) * 0.05}, ${1 - Math.sin(Math.PI * p) * 0.04})`; if (van) van.style.transform = `translate3d(${CHICKEN_SCENE.vanAnchor.x * width}px, ${CHICKEN_SCENE.vanAnchor.y * height}px, 0) translate(-50%, -78%) scale(${CHICKEN_SCENE.vanAnchor.scale})`;
  }

  function hydrateChickenAnimation(runtime, now = performance.now()) {
    const stage = document.querySelector('[data-runtime-game="chicken-road"] .road-playfield'); const canvas = stage?.querySelector('[data-animation-canvas="chicken"]'); if (!stage || !canvas || !state.animationManifest) return;
    const elapsed = Math.max(0, now - (runtime.animationStartedAt || now));
    const id = runtime.phase === 'jumping' ? 'chicken_chick_jump_forward' : runtime.phase === 'danger' ? 'chicken_chick_danger_reaction' : runtime.phase === 'fallen' ? 'chicken_chick_fail_fall' : runtime.phase === 'safe' ? 'chicken_chick_success_bounce' : 'chicken_chick_idle';
    const drawn = drawAnimationCanvas(canvas, id, elapsed);
    stage.classList.toggle('has-animation-clip', drawn);
  }

  function hydrateAppleAnimation(runtime, now = performance.now()) {
    if (!state.animationManifest) return;
    document.querySelectorAll('.apple-cell-animation').forEach((canvas) => {
      const button = canvas.closest('.apple-cell'); const [level, cell] = String(canvas.dataset.animationCell || '').split('-').map(Number); const revealed = runtime.revealed?.level === level && runtime.revealed?.cell === cell ? runtime.revealed : runtime.revealedCells?.[level]?.cell === cell ? runtime.revealedCells[level] : null;
      const id = revealed ? (revealed.safe ? 'applefortune_safe_reveal' : 'applefortune_loss_reveal') : button?.classList.contains('is-suggested') ? 'applefortune_selection_pulse' : null;
      const elapsed = revealed && runtime.phase !== 'opening' ? animationClipDuration(id) : Math.max(0, now - (runtime.animationStartedAt || now));
      const drawn = Boolean(id) && drawAnimationCanvas(canvas, id, elapsed); button?.classList.toggle('has-animation-clip', drawn);
    });
  }

  function hydrateAppleWinCelebration() {
    const overlay = document.querySelector('.apple-win-overlay[data-apple-win-token]');
    if (!overlay) return;
    const token = overlay.dataset.appleWinToken;
    if (state.appleWinAnimatedToken === token) return;
    state.appleWinAnimatedToken = token;
    const scoreEl = overlay.querySelector('[data-apple-win-score]');
    if (!scoreEl) return;
    const target = Number(scoreEl.dataset.target) || 0;
    const startedAt = performance.now();
    const duration = 900;
    const label = t('appleWin');
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased * 100) / 100;
      scoreEl.textContent = `${label} +${value} \u20BD`;
      if (progress < 1 && document.body.contains(scoreEl)) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  }

  function hydrateMinesAnimation(runtime, now = performance.now()) {
    if (!state.animationManifest) return;
    document.querySelectorAll('.mine-cell-animation').forEach((canvas) => {
      const index = Number(canvas.dataset.mineAnimation); const result = runtime.opened?.[index]?.result || (runtime.opening === index ? runtime.previewResult : null); const id = result === 'mine' ? 'mines_mine_open' : result === 'safe' ? 'mines_gem_open' : null; const elapsed = runtime.opening === index ? Math.max(0, now - (runtime.animationStartedAt || now)) : animationClipDuration(id); const drawn = Boolean(id) && drawAnimationCanvas(canvas, id, elapsed); canvas.closest('.mine-face')?.classList.toggle('has-animation-clip', drawn);
    });
  }

  function hydrateFootballPose(runtime, progress = 0) {
    const stage = document.querySelector('[data-runtime-game="football-penalties"] .goal-net'); const keeper = stage?.querySelector('.keeper-actor'); const ball = stage?.querySelector('.football-ball'); const canvas = stage?.querySelector('[data-animation-canvas="football"]'); if (!stage || !keeper || !ball) return;
    if (canvas && state.animationManifest) {
      const zone = Math.max(1, Math.min(5, runtime.shotZone || runtime.selectedZone || 3)); const direction = zone <= 2 ? 'left' : zone >= 4 ? 'right' : 'center'; const isOutcome = runtime.phase === 'reaction' || ['goal', 'save', 'miss'].includes(runtime.phase); const id = runtime.phase === 'kick' ? `footballpenalties_ball_flight_${direction}` : isOutcome && runtime.result === 'save' ? `footballpenalties_goalkeeper_save_${direction === 'right' ? 'right' : 'left'}` : isOutcome && runtime.result === 'goal' ? 'footballpenalties_goal_result' : isOutcome && runtime.result === 'miss' ? 'footballpenalties_miss_result' : 'footballpenalties_goalkeeper_idle'; const elapsed = Math.max(0, performance.now() - (runtime.animationStartedAt || performance.now())); if (drawAnimationCanvas(canvas, id, elapsed)) { stage.classList.add('has-animation-clip'); return; } stage.classList.remove('has-animation-clip');
    }
    const width = stage.clientWidth; const height = stage.clientHeight; const isKick = runtime.phase === 'kick'; const isReaction = runtime.phase === 'reaction'; const isTerminal = ['goal', 'save', 'miss'].includes(runtime.phase); const flightProgress = isKick ? Math.max(0, Math.min(1, progress)) : 1; const flightEased = flightProgress < 1 ? flightProgress * flightProgress * (3 - 2 * flightProgress) : 1; const keeperProgress = isReaction ? Math.max(0, Math.min(1, progress)) : isTerminal ? 1 : 0; const keeperEased = keeperProgress < 1 ? keeperProgress * keeperProgress * (3 - 2 * keeperProgress) : 1; const targetZone = Math.max(1, Math.min(5, runtime.shotZone || runtime.selectedZone || 3)); const target = FOOTBALL_SCENE.ballTargets[targetZone - 1]; const ballX = FOOTBALL_SCENE.ballStart.x + (target.x - FOOTBALL_SCENE.ballStart.x) * flightEased; const ballY = FOOTBALL_SCENE.ballStart.y + (target.y - FOOTBALL_SCENE.ballStart.y) * flightEased; const arc = Math.sin(Math.PI * flightEased) * height * 0.16; ball.style.transform = `translate3d(${ballX * width}px, ${ballY * height - arc}px, 0) translate(-50%, -50%) rotate(${flightEased * 540}deg)`; const keeperTarget = runtime.result === 'save' ? target.x : runtime.result === 'goal' ? (target.x < 0.5 ? 0.72 : 0.28) : 0.5; const keeperX = FOOTBALL_SCENE.keeperAnchor.x + (keeperTarget - FOOTBALL_SCENE.keeperAnchor.x) * keeperEased; const keeperY = FOOTBALL_SCENE.keeperAnchor.y * height; const dive = runtime.result ? (keeperTarget - 0.5) * 18 * keeperEased : 0; keeper.style.transform = `translate3d(${keeperX * width}px, ${keeperY}px, 0) translate(-50%, -100%) rotate(${dive}deg) scale(${1 + Math.sin(Math.PI * keeperEased) * 0.04})`;
  }

  function drawDebugCanvas(now = performance.now()) {
    const canvas = document.querySelector('[data-debug-canvas]'); const runtime = state.debugRuntime; if (!canvas || !runtime) return; const rect = canvas.getBoundingClientRect(); const ratio = Math.min(window.devicePixelRatio || 1, 2); const width = Math.max(240, Math.floor(rect.width)); const height = Math.max(180, Math.floor(rect.height)); const pixelWidth = Math.round(width * ratio); const pixelHeight = Math.round(height * ratio); if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; } const context = canvas.getContext('2d'); if (!context) return; context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height); context.fillStyle = '#071c13'; context.fillRect(0, 0, width, height); context.strokeStyle = 'rgba(163, 237, 140, 0.12)'; for (let x = 0; x < width; x += 32) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); } for (let y = 0; y < height; y += 32) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); } const elapsed = now - runtime.startedAt; const player = runtime.sprites?.[runtime.effect]; if (runtime.effect === 'trail') drawCenteredImage(context, ART.aviator.trail, width / 2, height / 2, Math.min(width * 0.78, 370), 88, { alpha: 0.9 }); else if (player) player.draw(context, width / 2, height / 2, Math.min(width * 0.62, 230), Math.min(width * 0.62, 230), { elapsed });
  }

  function tickDebug(token, now) {
    const runtime = state.debugRuntime; if (!runtime || runtime.token !== token) return state.sceneLoop.stop(); drawDebugCanvas(now); const elapsed = now - runtime.startedAt; const effect = runtime.effect;
    if (effect === 'chickenJump' || effect === 'chickenFall') { const node = document.querySelector('.debug-chick'); const p = Math.min(1, elapsed / 650); if (node) node.style.transform = `translateY(${-(effect === 'chickenJump' ? Math.sin(Math.PI * p) * 48 : p * 10)}px) rotate(${effect === 'chickenFall' ? p * 76 : -Math.sin(Math.PI * p) * 10}deg)`; }
    if (effect === 'appleFlip') { const node = document.querySelector('.debug-apple-card'); if (node) node.style.transform = `perspective(600px) rotateY(${Math.sin(Math.min(1, elapsed / 560) * Math.PI) * 90}deg)`; }
    if (effect === 'keeperDive') { const node = document.querySelector('.debug-keeper'); if (node) node.style.transform = `translateX(${Math.sin(Math.min(1, elapsed / 820) * Math.PI) * 54}px) rotate(${Math.sin(Math.min(1, elapsed / 820) * Math.PI) * 16}deg)`; }
    if (['crash', 'sparks'].includes(effect) && elapsed >= Math.max(totalDuration(ATLAS[effect]), 650)) state.sceneLoop.stop();
  }

  function startDebugEffect(effect) { stopGameAnimation(); const sprites = createAtlasSet(); Object.values(sprites).forEach((player) => player.play()); state.debugRuntime = { token: Date.now(), effect, startedAt: performance.now(), sprites }; render(); state.sceneLoop.start((now) => tickDebug(state.debugRuntime?.token, now)); }
  function hydrateOutcomeVideo() {
    const video = document.querySelector('[data-game-outcome-video]');
    if (!video || video.dataset.bound === 'true') return;
    const token = Number(video.dataset.runtimeToken);
    video.dataset.bound = 'true';
    const finish = (failed = false) => {
      const runtime = runtimeFor(state.activeGame);
      if (!runtime || runtime.token !== token || runtime.phase !== 'video') return;
      runtime.phase = 'ready';
      state.runtime = runtime;
      if (failed) state.message = 'Не удалось загрузить видео сигнала.';
      render();
    };
    video.addEventListener('ended', () => finish(false), { once: true });
    video.addEventListener('error', () => finish(true), { once: true });
    const playback = video.play();
    if (playback?.catch) playback.catch(() => finish(true));
  }
  function hydrateSceneArt() { hydrateOutcomeVideo(); const now = performance.now(); drawAviatorScene(now); const runtime = runtimeFor('chicken-road'); if (runtime) { const chickenProgress = runtime.phase === 'jumping' ? Math.min(1, Math.max(0, (now - (runtime.motionStarted || now)) / 620)) : runtime.phase === 'fallen' ? Math.min(1, Math.max(0, (now - (runtime.motionStarted || now)) / 520)) : 1; hydrateChickenPose(runtime, chickenProgress); hydrateChickenAnimation(runtime, now); } const apple = runtimeFor('apple-of-fortune'); if (apple) { hydrateAppleAnimation(apple, now); hydrateAppleWinCelebration(); } const mines = runtimeFor('mines'); if (mines) hydrateMinesAnimation(mines, now); const football = runtimeFor('football-penalties'); if (football) { const footballProgress = football.phase === 'kick' ? Math.min(1, Math.max(0, (now - (football.motionStarted || now)) / 650)) : football.phase === 'reaction' ? Math.min(1, Math.max(0, (now - (football.resultStartedAt || now)) / 420)) : 1; hydrateFootballPose(football, footballProgress); } if (state.debugRuntime) drawDebugCanvas(now); }
  function drawCharts() { drawAviatorScene(); }

  function guestPlayer() {
    return { playerId: 'guest-demo', nickname: 'Guest Player', countryCode: 'DE', currencyCode: 'EUR', currencyLocale: 'de-DE', currencyFractionDigits: 2, balanceMinor: 125000, bonusBalanceMinor: 25000, level: 3, levelProgress: 62, activeDays: 12, consecutiveActiveDays: 4, withdrawalEligible: false, withdrawalEligibleAt: null, profileCompleted: true };
  }

  async function init() {
    preloadArt();
    state.player = guestPlayer();
    // Render the sportsbook workspace immediately. Catalogs and art are enhancements,
    // so an unauthenticated visitor can see and open all six games without registering.
    render();
  if ('requestIdleCallback' in window) window.requestIdleCallback(() => loadAnimationManifest(), { timeout: 1800 }); else window.setTimeout(loadAnimationManifest, 1800);
  try {
      const [catalogs, config] = await Promise.all([api('/api/catalogs'), api('/api/config')]);
      state.catalogs = catalogs;
      state.minWithdrawalMinor = config.minWithdrawalMinor || state.minWithdrawalMinor;
      try { const me = await api('/api/player/me'); state.player = me.player; render(); if (state.player.profileCompleted) refreshActivity(); } catch (error) { if (error.status !== 401) state.message = error.message; }
    } catch (error) {
      state.message = error.message;
      render();
    }
  }

  // Delegated, bound once on document so dialog close buttons always work even if the
  // shell HTML (and therefore the button node) gets replaced by a render() while a
  // native <dialog> is open. Direct per-render bindings can miss a race where a click
  // lands right as innerHTML is swapped out.
  document.addEventListener('click', (event) => {
    const closeDialogTarget = event.target.closest('[data-close-dialog]');
    if (closeDialogTarget) { document.getElementById('legal-dialog')?.close(); return; }
    const closeAuthTarget = event.target.closest('[data-close-auth]');
    if (closeAuthTarget) { document.getElementById('auth-modal')?.close(); return; }
    if (event.target.id === 'legal-dialog' || event.target.id === 'auth-modal') event.target.close();
  });

  state.sceneLoop = new SceneAnimationLoop(); window.addEventListener('resize', () => { if (state.view === 'game' || state.view === 'overview') hydrateSceneArt(); }); window.addEventListener('pagehide', stopGameAnimation); init();
}());
