(function () {
  'use strict';

  const dictionaries = window.VERDANT_TRANSLATIONS || {};
  const locales = ['en', 'ru', 'uk', 'pl', 'es', 'pt', 'de', 'fr', 'it', 'tr', 'ar'];
  const games = ['aviator', 'chicken-road', 'apple-of-fortune', 'mines', 'football-penalties'];
  const ART_ROOT = '/assets/verdant-artpack';
  const PACKAGE_ART_ROOT = '/assets/game-animations-ready/SourceArt';
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
    history: [], activePlayers: [], activity: null, busy: false, message: '', minWithdrawalMinor: 10000,
    runtime: null, footballHistory: [], debugRuntime: null, sceneLoop: null, animationManifest: null,
  };

  function guestPlayer() {
    return { playerId: 'guest-line', nickname: 'Гость', profileCompleted: true, balanceMinor: 0, bonusBalanceMinor: 0, currencyCode: 'RUB', currencyFractionDigits: 2, currencyLocale: 'ru-RU', level: 1, activeDays: 0, consecutiveActiveDays: 0, withdrawalEligible: false };
  }

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
  window.render_game_to_text = () => JSON.stringify({ view: state.view, game: state.activeGame, phase: state.runtime?.phase || 'ready', animationManifest: Boolean(state.animationManifest), multiplier: state.runtime?.multiplier || null, step: state.runtime?.step ?? null, opened: state.runtime?.opened ? Object.keys(state.runtime.opened).length : 0 });
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
      const multiplier = document.querySelector('[data-runtime-multiplier]'); const status = document.querySelector('[data-runtime-state]'); const countdown = document.querySelector('[data-runtime-countdown]'); const countdownHero = document.querySelector('[data-countdown-hero]'); const countdownHeroNumber = document.querySelector('[data-runtime-countdown-hero]'); const caption = document.querySelector('[data-runtime-caption]'); const liveState = document.querySelector('[data-game-live-state]'); const startButton = document.querySelector('[data-game-action="aviator-start"]');
      if (multiplier) multiplier.textContent = `${Number(runtime.multiplier || 1).toFixed(2)}x`;
      if (status) status.textContent = phaseLabel(runtime.phase);
      if (countdown) countdown.textContent = runtime.phase === 'countdown' ? `${t('countdown')}: ${runtime.countdown}` : '';
      if (countdownHero) countdownHero.hidden = runtime.phase !== 'countdown';
      if (countdownHeroNumber) countdownHeroNumber.textContent = runtime.phase === 'countdown' ? String(runtime.countdown) : '';
      if (caption) caption.textContent = runtime.phase === 'countdown' ? `${t('countdown')}: ${runtime.countdown}` : 'РАУНД';
      if (liveState) liveState.textContent = phaseLabel(runtime.phase);
      if (startButton) { startButton.disabled = ['countdown', 'takeoff', 'flying'].includes(runtime.phase); startButton.textContent = runtime.phase === 'ended' ? t('nextRound') : t('startRound'); }
    }
  }
  function phaseLabel(phase) {
    return t({ ready: 'ready', countdown: 'countdownState', takeoff: 'takeoff', flying: 'flying', crash: 'crash', ended: 'roundEnded', jumping: 'jumping', safe: 'safeStep', fallen: 'stepFailed', opening: 'opening', mine: 'cellMine', goal: 'goal', save: 'save', miss: 'miss', kick: 'kick', reaction: 'kick' }[phase] || 'ready');
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
  function openAuthModal(mode = 'login') { const modal = document.getElementById('auth-modal'); if (!modal) return; modal.dataset.mode = mode; modal.querySelector('[data-auth-title]').textContent = mode === 'register' ? 'Создать аккаунт' : 'Вход в аккаунт'; modal.querySelector('.modal-name-field').hidden = mode !== 'register'; modal.querySelector('[data-auth-switch]').textContent = mode === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'; modal.showModal(); }
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
    return `<header class="workspace-header"><div><p class="eyebrow">${t('dashboardKicker')}</p><h1>${t('dashboardTitle')}</h1><p class="lede">${t('dashboardCopy')}</p></div><div class="header-actions"><button class="button button-ghost" data-view="profile" type="button">${t('profile')}</button></div></header><div class="content-width"><div class="status-strip"><span class="status-badge">${t('demoAnalysis')}</span><span class="status-badge muted">${t('simulatedData')}</span><span class="status-badge warning">${t('noGuarantee')}</span><span class="status-strip-note">${t('patternBased')}</span></div>${renderMetrics()}<div class="dashboard-grid"><div>${gameCards()}<section class="beta-section"><div class="section-heading"><div><p class="panel-kicker">${t('betaGames')}</p><h3>${t('keepExploring')}</h3></div><span class="beta-stamp">${t('inDevelopment')}</span></div><p>${t('futureSurfaces')}</p></section></div><aside class="analysis-side"><details class="mobile-utility" open><summary>${t('utilityPanel')}</summary><div class="utility-stack">${renderLevelPanel()}<section class="panel"><div class="panel-head"><div><p class="panel-kicker">${t('activePlayers')}</p><h3>${t('byCountry')}</h3><p class="panel-copy">${t('realPlayersOnly')}</p></div></div><div class="panel-body">${renderActivePlayers()}</div></section></div></details><div class="desktop-utility">${renderLevelPanel()}<section class="panel"><div class="panel-head"><div><p class="panel-kicker">${t('activePlayers')}</p><h3>${t('byCountry')}</h3><p class="panel-copy">${t('realPlayersOnly')}</p></div></div><div class="panel-body">${renderActivePlayers()}</div></section></div></aside></div>${renderFooter()}</div>`;
  }

  function renderFooter() { return `<footer class="statement-footer"><div><p>BETWINNER LINE / ${t('analysisEngine')} / ${t('simulatedData')}</p><div class="footer-links"><button class="text-link" data-legal="privacy" type="button">${t('legalPrivacy')}</button><button class="text-link" data-legal="terms" type="button">${t('legalTerms')}</button><button class="text-link" data-legal="responsible" type="button">${t('legalResponsible')}</button><button class="text-link" data-legal="disclaimer" type="button">${t('legalDisclaimer')}</button></div></div><p>${t('disclaimerText')}</p></footer>`; }

  function renderAviatorStage() {
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 780;
    const aviatorUrl = `https://gx-games-54rg78cw-tralt14.click/fg-aviashow-client/game/?activeGameId=0&partnerId=2695&token=&playerId=0&culture=en&isDemo=true&isMobile=${isMobileViewport}&referer=&isFeatureMessagePackEnabled=true&isMessagePackEnabled=false&backUrl=gx-games-54rg78cw-tralt14.click/fg-aviashow-api&gameKindName=AviaShow&gameTypeName=AviaShow&mode=2&partnerPlayerId=`;
    return `<div class="visual-stage external-game-stage aviator-embed-stage" data-runtime-game="aviator"><iframe class="external-game-embed" src="${aviatorUrl}" title="Aviator game" referrerpolicy="no-referrer" allow="fullscreen; autoplay; gamepad" loading="eager"></iframe></div>`;
  }

  function renderChickenStage() {
    const chickenUrl = 'https://chicken-road-stage.inoutgames.dev/api/modes/game?gameMode=chicken-road&operatorId=1a1233dd-527d-472a-a5d9-f3d816550d15&authToken=e1405a2945d7e42111f20dfa62717753760b738c5599f17d1dde7e21353004e05238e12d04fe0e5ed1f7846257e59f6fbc3ab152b59d482f7b8671494daf14e3&currency=USD&lang=en&_enableCanvasTestGrid=1&theme=&lobbyUrl=';
    return `<div class="visual-stage external-game-stage" data-runtime-game="chicken-road"><iframe class="external-game-embed" src="${chickenUrl}" title="Chicken Road game" referrerpolicy="no-referrer" allow="fullscreen; autoplay; gamepad" loading="eager"></iframe></div>`;
  }

  function renderChickenStageLegacy() {
    const analysis = state.analysis?.game === 'chicken-road' ? state.analysis : null; const runtime = runtimeFor('chicken-road') || { phase: 'ready', step: 0, target: 1, multiplier: 1 }; const safeSteps = analysis?.safeSteps || [1, 2, 3];
    const cells = [1, 2, 3, 4, 5].map((step) => `<div class="road-step ${runtime.step >= step ? 'is-cleared' : ''} ${runtime.target === step && runtime.phase === 'ready' ? 'is-target' : ''} ${runtime.failedStep === step ? 'is-danger' : ''}" aria-label="${t('step')} ${step}"><span class="step-number">${step}</span><span class="step-marker">${runtime.step >= step ? '✓' : step === runtime.target ? '→' : '·'}</span><small>${safeSteps.includes(step) ? t('safe') : t('risk')}</small></div>`).join('');
    return `<div class="visual-stage chicken-road-stage pipeline-stage ${runtime.phase === 'jumping' ? 'is-jumping' : ''} ${runtime.phase === 'fallen' ? 'is-fallen' : ''}" data-runtime-game="chicken-road" data-step="${runtime.step}"><div class="road-sky" aria-hidden="true"><span class="road-light"></span><span class="road-cloud cloud-a"></span><span class="road-cloud cloud-b"></span></div><div class="road-playfield"><div class="road-shoulder"></div><div class="road-cells">${cells}</div><canvas class="scene-animation-canvas chicken-animation-canvas" data-animation-canvas="chicken" aria-hidden="true"></canvas><img class="van-object" data-art-layer="vehicle" src="${ART.chicken.van}" alt="" aria-hidden="true"><div class="chick-object" data-art-layer="chick"><img src="${ART.chicken.chick}" alt="${t('chickenRoad')}"></div><div class="road-shadow" aria-hidden="true"></div></div><div class="road-readout"><div><span class="readout-label">${t('roadProgress')}</span><strong data-chicken-step>${runtime.step}/5</strong></div><div><span class="readout-label">${t('multiplier')}</span><strong data-chicken-multiplier>${runtime.multiplier.toFixed(2)}x</strong></div></div><div class="stage-caption"><span data-runtime-caption>${runtime.phase === 'ready' ? t('targetStep') : phaseLabel(runtime.phase)}</span><span>РАУНД</span></div></div>`;
  }

  function renderAppleStage() {
    const analysis = state.analysis?.game === 'apple-of-fortune' ? state.analysis : null; const runtime = runtimeFor('apple-of-fortune') || { phase: 'ready', activeRow: 1, revealedCells: {} }; const rows = analysis?.rows || Array.from({ length: 4 }, (_, index) => ({ level: index + 1, recommendedCell: index + 2, multiplier: `${(1.1 + index * 0.34).toFixed(2)}x` })); const revealedCells = runtime.revealedCells || {};
    return `<div class="visual-stage apple-stage pipeline-stage" data-runtime-game="apple-of-fortune"><div class="orchard-glow" aria-hidden="true"></div><div class="apple-board">${rows.map((row) => { const revealed = revealedCells[row.level]; const activeReveal = runtime.revealed?.level === row.level ? runtime.revealed : revealed; const current = row.level === runtime.activeRow; const locked = !current || runtime.phase === 'opening' || runtime.phase === 'ended'; return `<div class="apple-row ${current ? 'is-current' : ''} ${activeReveal ? 'is-revealed' : ''}"><span class="row-number">L${row.level}<small>${escapeHTML(row.multiplier || '')}</small></span><div class="apple-cells">${[1, 2, 3, 4, 5].map((cell) => { const selected = activeReveal?.cell === cell; const safe = selected && activeReveal.safe; const suggested = current && !activeReveal && Number(row.recommendedCell) === cell; const stateClass = selected ? (safe ? 'is-safe' : 'is-danger') : suggested ? 'is-suggested' : ''; return `<button class="apple-cell ${stateClass} ${selected && runtime.phase === 'opening' ? 'is-opening' : ''}" type="button" data-game-action="apple-reveal" data-cell="${cell}" ${locked ? 'disabled' : ''} aria-label="${t('cell')} ${cell}, ${current ? t('available') : t('locked')}"><span class="apple-cell-inner"><img class="apple-tile" src="${ART.apple.tile}" alt="" aria-hidden="true">${selected || suggested ? `<img class="apple-sprite" src="${safe || suggested ? ART.apple.whole : ART.apple.bitten}" alt="${safe || suggested ? t('safe') : t('danger')}">` : ''}${selected || suggested ? `<canvas class="apple-cell-animation" data-animation-cell="${row.level}-${cell}" aria-hidden="true"></canvas>` : ''}<span class="apple-cell-mark">${selected ? (safe ? 'SAFE' : 'DANGER') : suggested ? '•' : ''}</span></span></button>`; }).join('')}</div></div>`; }).join('')}</div><div class="apple-axis"><span>${t('currentRow')}: ${runtime.activeRow}</span><strong class="apple-score" data-apple-score>Счёт: ${runtime.score || 0}</strong></div><div class="stage-caption"><span data-runtime-caption>${runtime.phase === 'ready' ? t('suggestedSafeCell') : phaseLabel(runtime.phase)}</span><span>РАУНД</span></div></div>`;
  }

  function renderMinesStage() {
    const minesGameUrl = 'https://democasino.betsoftgaming.com/cwguestlogin.do?bankId=675&CDN=AUTO&gameId=959';
    return `<div class="visual-stage mines-stage mines-embedded-stage" data-runtime-game="mines"><iframe class="mines-game-embed" src="${minesGameUrl}" title="Mines casino game" referrerpolicy="no-referrer" allow="fullscreen; autoplay" loading="eager"></iframe></div>`;
  }

  function renderFootballStage() {
    const footballGameUrl = 'https://run.demo-evoplay.games/instant/evoplay/penaltyshootout/?operator=250&session=10257241663&window=1&demo=1&s=b4cdf363ff6e026e277829e8a3938187';
    return `<div class="visual-stage football-stage football-embedded-stage" data-runtime-game="football-penalties"><iframe class="football-game-embed" src="${footballGameUrl}" title="Football Penalty Shootout game" referrerpolicy="no-referrer" allow="fullscreen; autoplay; gamepad" loading="eager"></iframe></div>`;
  }
  function renderFootballStageLegacy() {
    const analysis = state.analysis?.game === 'football-penalties' ? state.analysis : null; const runtime = runtimeFor('football-penalties') || { phase: 'ready', role: 'striker', selectedZone: analysis?.recommendedZone || 3, selectedDirection: 3, stake: 100 }; const chosen = runtime.role === 'striker' ? runtime.selectedZone : runtime.selectedDirection; const terminal = ['goal', 'save', 'miss'].includes(runtime.phase);
    return `<div class="visual-stage football-stage pipeline-stage ${runtime.phase !== 'ready' ? `is-${runtime.phase}` : ''}" data-runtime-game="football-penalties"><div class="goal-scene"><div class="goal-net"><div class="goal-grid" aria-hidden="true"></div><canvas class="scene-animation-canvas football-animation-canvas" data-animation-canvas="football" aria-hidden="true"></canvas><div class="goal-zones">${[1, 2, 3, 4, 5].map((zone) => `<button class="goal-zone ${chosen === zone ? 'is-selected' : ''} ${terminal && ((runtime.result === 'goal' && zone === chosen) || (runtime.result === 'save' && zone === chosen)) ? 'is-correct' : ''} ${terminal && runtime.result === 'miss' && zone === chosen ? 'is-wrong' : ''}" type="button" data-game-action="${runtime.role === 'striker' ? 'football-zone' : 'football-direction'}" data-zone="${zone}" ${runtime.phase !== 'ready' ? 'disabled' : ''} aria-label="${t('zone')} ${zone}"><span class="zone-number">${zone}</span><small class="zone-coefficient">${['1.42x','1.68x','2.00x','1.68x','1.42x'][zone - 1]}</small></button>`).join('')}</div><div class="keeper-actor" data-art-layer="keeper"><img class="keeper-sprite" src="${ART.football.goalkeeper}" alt="${t('goalkeeper')}"></div><div class="football-ball" data-art-layer="ball" aria-hidden="true"><img src="${ART.football.ball}" alt=""></div></div></div><div class="football-readout"><span class="readout-label">${t('result')}</span><strong data-football-result aria-live="polite">${runtime.result ? phaseLabel(runtime.result) : t('chooseZone')}</strong><small>${terminal && runtime.result === 'goal' ? `${t('simulatedReturn')}: 2x · ${formatMoney(runtime.stake || 100, { currencyFractionDigits: 0, currencyCode: 'RUB' })}` : t('virtualOnly')}</small></div><div class="stage-caption"><span>${runtime.role === 'striker' ? t('striker') : t('keeper')} / ${t('shotZones')}: 5</span><strong class="football-score"><img class="score-ball-icon" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/41932-tNuBJBWvgro2bhl92YEnqMtghclOte.jpg" alt="" aria-hidden="true"> Счёт: ${runtime.score || 0}</strong></div></div>`;
  }

  function renderGameStage(game) { if (game === 'aviator') return renderAviatorStage(); if (game === 'chicken-road') return renderChickenStage(); if (game === 'apple-of-fortune') return renderAppleStage(); if (game === 'mines') return renderMinesStage(); return renderFootballStage(); }

  function renderResult(analysis) {
    if (!analysis) return `<div class="result-empty"><span class="empty-mark">◎</span><p>${t('noHistory')}</p><small>${t('resultAppearsHere')}</small></div>`;
    const details = analysis.game === 'aviator' ? `${t('multiplier')}: ${analysis.multiplier} · ${t('countdown')}: ${analysis.countdown}s` : analysis.game === 'chicken-road' ? `${t('safeSteps')}: ${analysis.safeSteps.join(', ')} · ${t('multiplier')}: ${analysis.multiplier}` : analysis.game === 'apple-of-fortune' ? `${t('rows')}: ${analysis.rows.length} · ${t('safeCell')}: ${analysis.rows[0].recommendedCell}` : analysis.game === 'mines' ? `${t('fieldSize')}: ${analysis.size} · ${t('mineCount')}: ${analysis.mines}` : `${t('shotZones')}: ${analysis.zones} · ${t('direction')}: ${analysis.direction}`;
    return `<h3>${t('latestSignal')}</h3><p class="result-detail">${escapeHTML(details)}</p><p>${escapeHTML(analysis.note || analysis.disclaimer)}</p><div class="result-stamp">${t('demoAnalysis')} / ${t('simulatedData')}</div><div class="analysis-actions"><button class="button button-ghost" data-copy="${analysis.game}" type="button">${t('copyResult')}</button></div>`;
  }

  function renderHistory() {
    if (!state.history.length) return `<div class="result-empty"><p>${t('noHistory')}</p></div>`;
    return `<div class="history-list">${state.history.map((item) => `<div class="history-item"><strong>${escapeHTML(item.result?.status || t('demoAnalysis'))}</strong><span>${formatDate(item.createdAt)} · ${escapeHTML(item.result?.mode || t('simulatedData'))}</span></div>`).join('')}</div>`;
  }

  function gameControls(game) {
    if (game === 'chicken-road') return `<label for="difficulty">${t('difficulty')}<select id="difficulty"><option value="calm">${t('calm')}</option><option value="balanced" selected>${t('balanced')}</option><option value="sharp">${t('sharp')}</option></select></label><div class="control-note">${t('probabilisticNote')}</div>`;
    if (game === 'mines') { const runtime = runtimeFor(game); const active = ['playing', 'opening', 'mine'].includes(runtime?.phase); return `<label for="mine-stake">Ставка<input id="mine-stake" type="number" min="10" max="10000" step="10" value="${runtime?.stake || 100}" ${active ? 'disabled' : ''}><span class="field-hint">Виртуальная ставка · RUB</span></label><label for="mine-size">${t('fieldSize')}<select id="mine-size" ${active ? 'disabled' : ''}><option value="16">4 × 4</option><option value="25" ${Number(runtime?.size || 25) === 25 ? 'selected' : ''}>5 × 5</option><option value="36" ${Number(runtime?.size || 25) === 36 ? 'selected' : ''}>6 × 6</option></select></label><label for="mine-count">${t('mineCount')}<select id="mine-count" ${active ? 'disabled' : ''}><option ${Number(runtime?.mines || 4) === 3 ? 'selected' : ''}>3</option><option ${Number(runtime?.mines || 4) === 4 ? 'selected' : ''}>4</option><option ${Number(runtime?.mines || 4) === 6 ? 'selected' : ''}>6</option><option ${Number(runtime?.mines || 4) === 8 ? 'selected' : ''}>8</option></select></label><div class="control-note">${t('mineNote')}</div>`; }
    if (game === 'football-penalties') { const runtime = runtimeFor(game); return `<label for="football-role">${t('role')}<select id="football-role" ${runtime?.phase && runtime.phase !== 'ready' ? 'disabled' : ''}><option value="striker" ${(runtime?.role || 'striker') === 'striker' ? 'selected' : ''}>${t('striker')}</option><option value="keeper" ${runtime?.role === 'keeper' ? 'selected' : ''}>${t('keeper')}</option></select></label><label for="football-stake">${t('virtualStake')}<input id="football-stake" type="number" min="10" max="10000" step="10" value="${runtime?.stake || 100}" ${runtime?.phase && runtime.phase !== 'ready' ? 'disabled' : ''}><span class="field-hint">${t('stakeRange')}</span></label><div class="control-note">${t('virtualOnly')}</div>`; }
    const runtime = runtimeFor(game); const active = ['countdown', 'takeoff', 'flying'].includes(runtime?.phase); return `<div class="aviator-control-grid"><label for="aviator-stake">Ставка<input id="aviator-stake" type="number" min="10" max="10000" step="10" value="100" ${active ? 'disabled' : ''}><span class="field-hint">Виртуальная ставка · RUB</span></label><div class="aviator-live-badge"><span class="status-dot"></span><strong data-runtime-state>${phaseLabel(runtime?.phase || 'ready')}</strong><small>раунд в реальном времени</small></div></div><div class="control-note">${t('aviatorRoundNote')}</div>`;
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
    const runtime = runtimeFor(game); const terminalFootball = game === 'football-penalties' && ['goal', 'save', 'miss'].includes(runtime?.phase);
    return `<header class="workspace-header game-header"><div><p class="eyebrow">${t('games')} / ${String(games.indexOf(game) + 1).padStart(2, '0')}</p><h1>${gameLabel(game)}</h1><p class="lede">${t('gameIntro')}</p></div><div class="header-actions"><button class="game-exit-button" data-view="overview" type="button"><span class="game-exit-icon" aria-hidden="true">&#8592;</span>${t('backToHome')}</button></div></header><div class="content-width game-view"><div class="game-layout"><section class="game-stage"><div class="stage-topline"><div><span class="stage-index">0${games.indexOf(game) + 1}</span><span class="status-badge muted">РАУНД</span></div><span class="round-state" data-game-live-state aria-live="polite">${phaseLabel(runtime?.phase || 'ready')}</span></div>${renderGameStage(game)}<div class="game-action-row">${game === 'aviator' ? `<button class="button button-primary" data-game-action="aviator-start" type="button" ${runtime && ['countdown', 'takeoff', 'flying'].includes(runtime.phase) ? 'disabled' : ''}>${runtime?.phase === 'ended' ? t('nextRound') : t('startRound')}</button>` : game === 'chicken-road' ? `<button class="button button-primary" data-game-action="chicken-step" type="button" ${runtime?.phase === 'jumping' || runtime?.phase === 'fallen' || runtime?.step >= 5 ? 'disabled' : ''}>${t('jumpStep')}</button><button class="button button-ghost" data-game-action="chicken-reset" type="button">${t('resetRoad')}</button>` : game === 'apple-of-fortune' ? `<button class="button button-ghost" data-game-action="apple-reset" type="button">${t('resetBoard')}</button>` : game === 'mines' ? `<button class="button button-primary" data-game-action="mine-start" type="button" ${runtime?.phase !== 'ready' ? 'disabled' : ''}>${runtime?.phase === 'ready' ? 'Start' : 'Round active'}</button><button class="button button-ghost" data-game-action="mine-reset" type="button">${t('resetField')}</button>` : `<button class="button button-primary" data-game-action="${terminalFootball ? 'football-next' : 'football-run'}" type="button" ${runtime?.phase === 'kick' || runtime?.phase === 'reaction' ? 'disabled' : ''}>${terminalFootball ? t('nextRound') : t('runPenalty')}</button><button class="button button-ghost" data-game-action="football-rules" type="button">${t('rules')}</button>`}</div>${renderArtDebug()}</section><aside class="game-side"><section class="panel control-panel"><div class="panel-head"><div><p class="panel-kicker">${t('controlStack')}</p><h2>${t('gameStatus')}</h2></div><span class="status-dot"></span></div><div class="panel-body control-fields">${gameControls(game)}<button class="button button-primary button-full" data-analyze="${game}" type="button" ${state.busy ? 'disabled' : ''}>${state.busy ? t('analysisLoading') : t('getAnalysis')}</button><button class="button button-ghost button-full" data-copy="${game}" type="button" ${state.analysis?.game === game ? '' : 'disabled'}>${t('copyResult')}</button><p class="form-message" role="alert" aria-live="polite">${escapeHTML(state.message)}</p></div></section><section class="panel result-panel"><div class="panel-head"><div><p class="panel-kicker">${t('result')}</p><h2>${t('latestSignal')}</h2></div></div><div class="panel-body">${renderResult(state.analysis?.game === game ? state.analysis : null)}</div></section><section class="panel history-panel"><div class="panel-head"><div><p class="panel-kicker">${t('history')}</p><h3>${t('attempts')}</h3></div></div><div class="panel-body">${game === 'football-penalties' && state.footballHistory.length ? `<div class="history-list">${state.footballHistory.map((item) => `<div class="history-item"><strong>${phaseLabel(item.result)}</strong><span>${item.role === 'striker' ? t('striker') : t('keeper')} · ${item.zone} · ${formatMoney(item.stake, { currencyFractionDigits: 0, currencyCode: 'RUB' })}</span></div>`).join('')}</div>` : renderHistory()}</div></section></aside></div>${renderFooter()}</div>`;
  }

  function renderActivityView() {
    const days = state.activity?.days || [];
    return `<header class="workspace-header"><div><p class="eyebrow">${t('activity')}</p><h1>${t('activeDays')}</h1><p class="lede">${t('realPlayersOnly')}</p></div><div class="header-actions"><button class="button button-ghost" data-view="overview" type="button">${t('overview')}</button></div></header><div class="content-width activity-view"><div class="two-column"><section class="panel"><div class="panel-head"><div><p class="panel-kicker">${t('activeDays')}</p><h2>${state.player.activeDays}</h2></div><span class="level-number">${String(state.player.level).padStart(2, '0')}</span></div><div class="panel-body"><dl class="data-list"><div><dt>${t('currentStreak')}</dt><dd>${state.player.consecutiveActiveDays}</dd></div><div><dt>${t('lastSeen')}</dt><dd>${escapeHTML(formatDate(state.player.lastSeenAt))}</dd></div><div><dt>${t('status')}</dt><dd>${state.player.profileCompleted ? t('profileComplete') : t('notAvailable')}</dd></div></dl></div></section><section class="panel"><div class="panel-head"><div><p class="panel-kicker">${t('activePlayers')}</p><h3>${t('byCountry')}</h3></div></div><div class="panel-body">${renderActivePlayers()}</div></section></div><section class="panel"><div class="panel-head"><div><p class="panel-kicker">${t('history')}</p><h2>${t('activity')}</h2></div></div><div class="panel-body table-overflow">${days.length ? `<table class="activity-table"><thead><tr><th>${t('date')}</th><th>${t('games')}</th><th>${t('signals')}</th><th>${t('sessions')}</th></tr></thead><tbody>${days.map((day) => `<tr><td><strong>${escapeHTML(day.activityDate)}</strong></td><td>${day.gamesUsed.map((game) => escapeHTML(gameLabel(game))).join(', ')}</td><td>${day.signalCount}</td><td>${day.sessionCount}</td></tr>`).join('')}</tbody></table>` : `<div class="empty-state"><p>${t('noHistory')}</p></div>`}</div></section>${renderFooter()}</div>`;
  }

  function renderProfileView() {
    const total = state.player.balanceMinor + state.player.bonusBalanceMinor; const meetsAmount = total >= state.minWithdrawalMinor; const canWithdraw = state.player.withdrawalEligible && meetsAmount; const reason = !state.player.withdrawalEligible ? t('withdrawalNeedDays') : !meetsAmount ? `${t('withdrawalNeedAmount')} (${formatMoney(state.minWithdrawalMinor)})` : t('withdrawalDemo');
    return `<header class="workspace-header"><div><p class="eyebrow">${t('profile')}</p><h1>${t('profile')}</h1><p class="lede">${t('profileNote')}</p></div><div class="header-actions"><button class="button button-ghost" data-view="overview" type="button">${t('overview')}</button></div></header><div class="content-width profile-view"><div class="profile-grid-large"><section class="panel"><div class="profile-identity"><span class="avatar" data-user-initial></span><div><h2 data-user-name></h2><p>${escapeHTML(state.player.playerId)}</p></div></div><div class="profile-body"><dl class="data-list"><div><dt>${t('country')}</dt><dd>${escapeHTML(state.player.countryName || state.player.countryCode || t('notAvailable'))}</dd></div><div><dt>${t('currency')}</dt><dd>${escapeHTML(state.player.currencyCode || t('notAvailable'))}</dd></div><div><dt>${t('level')}</dt><dd>${state.player.level}</dd></div><div><dt>${t('activeDays')}</dt><dd>${state.player.activeDays}</dd></div></dl></div></section><section class="withdrawal-card ${canWithdraw ? '' : 'locked'}"><p class="panel-kicker">${t('withdrawal')}</p><h2>${escapeHTML(formatMoney(total))}</h2><p>${escapeHTML(reason)}</p><button class="button ${canWithdraw ? 'button-primary' : 'button-ghost'} button-full" id="withdraw-button" type="button" ${canWithdraw ? '' : 'disabled'}>${t('withdrawBalance')}</button></section></div><section class="panel profile-level"><div class="panel-head"><div><p class="panel-kicker">${t('level')} ${state.player.level}</p><h2>${t('bonusBalance')}</h2></div></div><div class="panel-body">${renderLevelPanel()}</div></section>${renderFooter()}</div>`;
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
    const payload = {}; if (game === 'chicken-road') payload.difficulty = document.getElementById('difficulty')?.value || 'balanced'; if (game === 'mines') { payload.size = Number(document.getElementById('mine-size')?.value || 25); payload.mines = Number(document.getElementById('mine-count')?.value || 4); }
    stopGameAnimation(); state.busy = true; state.message = ''; render();
    try { const result = await api(`/api/games/${game}/analyze`, { method: 'POST', body: payload }); state.analysis = result.analysis; state.player = result.activity.player; state.busy = false; state.runtime = createReadyRuntime(game); const history = await api(`/api/games/${game}/history`); state.history = history.history || []; render(); }
    catch (error) { state.busy = false; state.message = error.message; render(); }
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
  function bindLegalLinks() { document.querySelectorAll('[data-legal]').forEach((button) => button.addEventListener('click', () => openLegal(button.dataset.legal))); }
  function bindDialogClose() { document.querySelector('[data-close-dialog]')?.addEventListener('click', () => document.getElementById('legal-dialog')?.close()); }

  const LIVE_GAME_URL = 'https://betwinner-72427.pro/games-frame/games/373?co=1&cu=1&lg=ru&wh=55&tzo=3';
  function openGameFrame() {
    let dialog = document.getElementById('game-frame-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'game-frame-dialog';
      dialog.className = 'game-frame-dialog';
      dialog.innerHTML = `<button class="dialog-close" data-close-frame type="button" aria-label="${t('close')}">×</button><div class="game-frame-head"><span class="game-frame-title">Betwinner Live</span></div><iframe class="game-frame-embed" title="Betwinner Live" allow="autoplay; fullscreen; payment" allowfullscreen referrerpolicy="no-referrer"></iframe>`;
      document.body.appendChild(dialog);
      dialog.querySelector('[data-close-frame]').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => { const frame = dialog.querySelector('iframe'); if (frame) frame.src = 'about:blank'; });
      dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    }
    dialog.querySelector('iframe').src = LIVE_GAME_URL;
    dialog.showModal();
  }

  function scrollWorkspaceToTop() { window.scrollTo(0, 0); document.querySelector('.workspace-main')?.scrollTo?.(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }

  function bindShell() {
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', async (event) => { event.preventDefault(); stopGameAnimation(); state.view = button.dataset.view; state.message = ''; scrollWorkspaceToTop(); if (state.view === 'activity') await refreshActivity(); else render(); }));
  document.querySelectorAll('[data-game]').forEach((button) => button.addEventListener('click', () => openGame(button.dataset.game)));
    document.querySelectorAll('[data-auth-action]').forEach((button) => button.addEventListener('click', () => openAuthModal(button.dataset.authAction)));
    document.querySelectorAll('[data-game-frame]').forEach((button) => button.addEventListener('click', () => openGameFrame()));
    document.querySelectorAll('[data-analyze]').forEach((button) => button.addEventListener('click', () => requestAnalysis(button.dataset.analyze)));
    document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', () => copyResult(button.dataset.copy)));
    document.querySelectorAll('.language-select, .rail-language').forEach((select) => select.addEventListener('change', () => { locale = select.value; localStorage.setItem('verdant-locale', locale); render(); }));
    document.getElementById('logout-button')?.addEventListener('click', logout); document.getElementById('withdraw-button')?.addEventListener('click', openWithdrawDialog);
    document.querySelectorAll('[data-game-action]').forEach((button) => button.addEventListener('click', () => handleGameAction(button.dataset.gameAction, button.dataset.cell, button.dataset.zone)));
    document.getElementById('mine-size')?.addEventListener('change', resetMineFromControls); document.getElementById('mine-count')?.addEventListener('change', resetMineFromControls);
    document.getElementById('football-role')?.addEventListener('change', (event) => { const runtime = runtimeFor('football-penalties') || createFootballRuntime(); runtime.role = event.target.value; state.runtime = runtime; render(); });
    document.querySelectorAll('[data-debug-effect]').forEach((button) => button.addEventListener('click', () => startDebugEffect(button.dataset.debugEffect))); document.querySelector('[data-debug-stop]')?.addEventListener('click', () => { stopGameAnimation(); render(); });
    bindLegalLinks();
  }

  function openWithdrawDialog() { const dialog = document.getElementById('legal-dialog'); if (!dialog) return; const body = dialog.querySelector('[data-legal-body]'); body.innerHTML = `<p class="eyebrow">${t('withdrawal')}</p><h2>${t('withdrawBalance')}</h2><p data-withdraw-copy></p><button class="button button-ghost" data-close-dialog type="button">${t('close')}</button>`; body.querySelector('[data-withdraw-copy]').textContent = t('withdrawalDemo'); body.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close()); dialog.showModal(); }
  async function logout() { try { await api('/api/auth/logout', { method: 'POST' }); } finally { stopGameAnimation(); state.player = null; state.activity = null; state.activePlayers = []; state.view = 'overview'; render(); } }

  function createReadyRuntime(game) {
    if (game === 'aviator') return { game, token: Date.now(), phase: 'ready', countdown: 0, multiplier: 1.27, progress: 0.58, startedAt: 0, crashAt: 0, sprites: createAtlasSet(), timers: new Set() };
    if (game === 'chicken-road') return createChickenRuntime();
    if (game === 'apple-of-fortune') return createAppleRuntime();
    if (game === 'mines') return createMineRuntime();
    return createFootballRuntime();
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

  function createAppleRuntime() { return { game: 'apple-of-fortune', token: Date.now(), phase: 'ready', activeRow: 1, score: 0, revealed: null, revealedCells: {}, animationStartedAt: 0, timers: new Set() }; }
  function revealApple(cell) { const runtime = runtimeFor('apple-of-fortune') || createAppleRuntime(); if (runtime.phase === 'opening' || runtime.phase === 'ended') return; const rows = state.analysis?.game === 'apple-of-fortune' ? state.analysis.rows : Array.from({ length: 4 }, (_, index) => ({ level: index + 1, recommendedCell: index + 2 })); const row = rows.find((item) => item.level === runtime.activeRow) || rows[0]; runtime.revealed = { level: runtime.activeRow, cell: Number(cell), safe: Number(cell) === Number(row.recommendedCell) }; runtime.animationStartedAt = performance.now(); runtime.phase = 'opening'; state.runtime = runtime; render(); scheduleRuntime(() => { runtime.revealedCells[runtime.revealed.level] = runtime.revealed; if (runtime.revealed.safe) runtime.score = (runtime.score || 0) + 100 * runtime.activeRow; if (runtime.revealed.safe && runtime.activeRow < rows.length) { runtime.activeRow += 1; runtime.phase = 'safe'; } else runtime.phase = 'ended'; runtime.revealed = null; render(); }, 560); }

  function createMineRuntime() { return { game: 'mines', token: Date.now(), phase: 'ready', size: Number(document.getElementById('mine-size')?.value || 25), mines: Number(document.getElementById('mine-count')?.value || 4), stake: Number(document.getElementById('mine-stake')?.value || 100), opened: {}, opening: null, previewResult: null, animationStartedAt: 0, timers: new Set() }; }
  function startMineRound() { const runtime = runtimeFor('mines') || createMineRuntime(); if (runtime.phase !== 'ready') return; const rawStake = Number(document.getElementById('mine-stake')?.value || runtime.stake || 100); runtime.stake = Math.max(10, Math.min(10000, Number.isFinite(rawStake) ? Math.round(rawStake) : 100)); runtime.size = Number(document.getElementById('mine-size')?.value || runtime.size || 25); runtime.mines = Number(document.getElementById('mine-count')?.value || runtime.mines || 4); runtime.phase = 'playing'; runtime.token = Date.now(); state.runtime = runtime; render(); }
  function resetMineFromControls() { stopGameAnimation(); state.runtime = createMineRuntime(); render(); }
  function openMine(cell) { const runtime = runtimeFor('mines') || createMineRuntime(); if (runtime.phase !== 'playing' || runtime.phase === 'opening' || runtime.phase === 'mine' || runtime.opened[cell]) return; const recommended = state.analysis?.game === 'mines' ? state.analysis.recommendedCells : [0, 2, 7]; runtime.opening = Number(cell); runtime.previewResult = recommended.includes(Number(cell)) ? 'safe' : 'mine'; runtime.animationStartedAt = performance.now(); runtime.phase = 'opening'; state.runtime = runtime; render(); scheduleRuntime(() => { const result = runtime.previewResult; runtime.opened[cell] = { result }; runtime.opening = null; runtime.phase = result === 'mine' ? 'mine' : 'playing'; render(); }, 460); }

  function createFootballRuntime() { return { game: 'football-penalties', token: Date.now(), phase: 'ready', role: 'striker', selectedZone: 3, selectedDirection: 3, stake: 100, score: 0, shotZone: 3, result: null, animationStartedAt: 0, timers: new Set() }; }
  function selectFootballZone(zone, direction = false) { const runtime = runtimeFor('football-penalties') || createFootballRuntime(); if (runtime.phase !== 'ready') return; if (direction) runtime.selectedDirection = Number(zone); else runtime.selectedZone = Number(zone); state.runtime = runtime; render(); window.setTimeout(() => runFootball(), 40); }
  function runFootball() { const runtime = runtimeFor('football-penalties') || createFootballRuntime(); if (runtime.phase !== 'ready') return; runtime.role = document.getElementById('football-role')?.value || runtime.role || 'striker'; const rawStake = Number(document.getElementById('football-stake')?.value || runtime.stake || 100); runtime.stake = Math.max(10, Math.min(10000, Number.isFinite(rawStake) ? Math.round(rawStake) : 100)); runtime.shotZone = runtime.role === 'striker' ? runtime.selectedZone : ((runtime.token % 5) + 1); runtime.result = null; runtime.phase = 'kick'; runtime.motionStarted = performance.now(); runtime.animationStartedAt = runtime.motionStarted; state.runtime = runtime; render(); state.sceneLoop.start((now) => tickFootball(runtime.token, now)); }
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

  function handleGameAction(action, cell, zone) {
    if (action === 'aviator-start') return startAviatorRound(); if (action === 'mine-start') return startMineRound(); if (action === 'chicken-step') return startChickenStep(); if (action === 'chicken-reset') return resetChicken(); if (action === 'apple-reveal') return revealApple(cell); if (action === 'apple-reset') { stopGameAnimation(); state.runtime = createAppleRuntime(); return render(); } if (action === 'mine-open') return openMine(cell); if (action === 'mine-reset') return resetMineFromControls(); if (action === 'football-zone') return selectFootballZone(zone); if (action === 'football-direction') return selectFootballZone(zone, true); if (action === 'football-run') return runFootball(); if (action === 'football-next') { const previous = runtimeFor('football-penalties') || {}; stopGameAnimation(); state.runtime = { ...createFootballRuntime(), role: previous.role || 'striker', selectedZone: previous.selectedZone || 3, selectedDirection: previous.selectedDirection || 3, stake: previous.stake || 100 }; return render(); } if (action === 'football-rules') return openRules();
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
  function hydrateSceneArt() { const now = performance.now(); drawAviatorScene(now); const runtime = runtimeFor('chicken-road'); if (runtime) { const chickenProgress = runtime.phase === 'jumping' ? Math.min(1, Math.max(0, (now - (runtime.motionStarted || now)) / 620)) : runtime.phase === 'fallen' ? Math.min(1, Math.max(0, (now - (runtime.motionStarted || now)) / 520)) : 1; hydrateChickenPose(runtime, chickenProgress); hydrateChickenAnimation(runtime, now); } const apple = runtimeFor('apple-of-fortune'); if (apple) hydrateAppleAnimation(apple, now); const mines = runtimeFor('mines'); if (mines) hydrateMinesAnimation(mines, now); const football = runtimeFor('football-penalties'); if (football) { const footballProgress = football.phase === 'kick' ? Math.min(1, Math.max(0, (now - (football.motionStarted || now)) / 650)) : football.phase === 'reaction' ? Math.min(1, Math.max(0, (now - (football.resultStartedAt || now)) / 420)) : 1; hydrateFootballPose(football, footballProgress); } if (state.debugRuntime) drawDebugCanvas(now); }
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

  state.sceneLoop = new SceneAnimationLoop(); window.addEventListener('resize', () => { if (state.view === 'game' || state.view === 'overview') hydrateSceneArt(); }); window.addEventListener('pagehide', stopGameAnimation); init();
}());
