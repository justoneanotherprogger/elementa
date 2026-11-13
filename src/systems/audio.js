import MondstadtGen from "./main_menu_music_gen.js";

export function createAudio() {
  let context = null;
  let ready = false;
  function init() {
    if (context) return context;
    try { context = new (window.AudioContext || window.webkitAudioContext)(); } catch (_error) { context = null; void _error; }
    return context;
  }
  window.addEventListener("pointerdown", () => { ready = true; if (!context) init(); if (menuActive) playMenuTheme(); }, { once: true });
  window.addEventListener("keydown", () => { ready = true; if (!context) init(); if (menuActive) playMenuTheme(); }, { once: true });
  function playSteam() {
    if (!ready) return;
    const ctx = context || init();
    if (!ctx) return;
    try { if (ctx.state === "suspended") ctx.resume(); } catch (error) { void error; }
    const sampleRate = ctx.sampleRate || 44100;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * 0.3), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 2000;
    const gain = ctx.createGain();
    gain.value = 0.2;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + 0.3);
  }

  // --- Music (public audio assets, no runtime directory probing) ---
  const MUTE_KEY = "elementa_audio_muted_v1";
  const VOLUME_KEY = "elementa_audio_volume_v1";
  const MUSIC_KEY = "elementa_music_enabled_v1";
  let muted = (localStorage.getItem(MUTE_KEY) === "1");
  let musicEnabled = (localStorage.getItem(MUSIC_KEY) !== "0");
  let volume = Number(localStorage.getItem(VOLUME_KEY));
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) volume = 1;

  const BASE = import.meta.env.BASE_URL;
  const withBase = (path) => `${BASE}${path.replace(/^\//, "")}`.replace(/\/{2,}/g, "/");

  // Pools contain explicit candidate URLs. They start with the known files and shed
  // any URL that fails to play, so missing variants do not repeat on every start.
  const forestPool = [
    withBase("assets/audio/ambient_goblin_forest.mp3"),
    withBase("assets/audio/ambient_goblin_forest_1.mp3"),
  ];
  const bossPool = [
    withBase("assets/audio/boss_fight_goblin_forest.mp3"),
    withBase("assets/audio/boss_fight_goblin_forest_1.mp3"),
  ];
  const menuPool = [];

  const forestAudio = new Audio();
  const bossAudio = new Audio();
  const menuAudio = new Audio();
  forestAudio.loop = true;
  bossAudio.loop = true;
  menuAudio.loop = true;
  forestAudio.preload = "auto";
  bossAudio.preload = "auto";
  menuAudio.preload = "auto";
  forestAudio.volume = muted ? 0 : volume;
  bossAudio.volume = muted ? 0 : volume;
  menuAudio.volume = muted ? 0 : volume;

  // Процедурная меню-тема: сид случайный на загрузку страницы, ?seed=... — для проверки.
  const MENU_SEED = (() => {
    const override = new URLSearchParams(window.location.search).get("seed");
    const parsed = Number(override);
    if (override !== null && Number.isFinite(parsed)) return Math.floor(parsed);
    return Math.floor(Math.random() * 2147483647);
  })();
  let menuChannelsPromise = null;
  let menuBufferPromise = null;
  let menuNode = null;

  let currentKey = null; // 'forest' | 'boss' | 'menu' | null
  let currentAudio = null;
  let transitionToken = 0;
  let fadeRaf = 0;
  let isTransitioning = false;
  let runActive = false;
  let bossActive = false;
  let menuActive = false;

  function poolFor(key) {
    if (key === "boss") return bossPool;
    if (key === "menu") return menuPool;
    return forestPool;
  }
  function audioFor(key) {
    if (key === "boss") return bossAudio;
    if (key === "menu") return menuAudio;
    return forestAudio;
  }

  function randomFromPool(pool) {
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function pruneInvalid(pool, badUrl) {
    const idx = pool.indexOf(badUrl);
    if (idx >= 0) pool.splice(idx, 1);
  }

  function loadMenuChannels() {
    if (!menuChannelsPromise) {
      console.info("[audio] menu theme seed", MENU_SEED);
      menuChannelsPromise = MondstadtGen.render(MENU_SEED).catch((error) => {
        menuChannelsPromise = null;
        throw error;
      });
    }
    return menuChannelsPromise;
  }

  function loadMenuBuffer(ctx) {
    if (!menuBufferPromise) {
      menuBufferPromise = loadMenuChannels()
        .then((channels) => {
          const buffer = MondstadtGen.toAudioBuffer(ctx, channels);
          menuChannelsPromise = null;
          return buffer;
        })
        .catch((error) => {
          menuBufferPromise = null;
          throw error;
        });
    }
    return menuBufferPromise;
  }

  function stopMenuTheme() {
    const node = menuNode;
    menuNode = null;
    if (!node || !context) return;
    try {
      const now = context.currentTime;
      node.gain.gain.cancelScheduledValues(now);
      node.gain.gain.setValueAtTime(node.gain.gain.value, now);
      node.gain.gain.linearRampToValueAtTime(0, now + 0.3);
      node.source.stop(now + 0.32);
    } catch (error) { void error; }
  }

  function playMenuTheme() {
    if (!menuActive || !musicEnabled || muted || !ready || menuNode) return;
    const ctx = context || init();
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") {
        const promise = ctx.resume();
        if (promise && typeof promise.catch === "function") promise.catch(() => {});
      }
    } catch (error) { void error; }
    loadMenuBuffer(ctx)
      .then((buffer) => {
        if (!menuActive || !musicEnabled || muted || !ready || menuNode) return;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.8);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        menuNode = { source, gain };
        source.onended = () => {
          if (menuNode && menuNode.source === source) menuNode = null;
        };
      })
      .catch((error) => {
        console.warn("[audio] menu theme failed", error);
      });
  }

  function playTrack(key) {
    if (!musicEnabled || isTransitioning) return false;
    const pool = poolFor(key);
    if (!pool.length) return false;
    const url = randomFromPool(pool);
    if (!url) return false;
    const audio = audioFor(key);
    const previousAudio = currentAudio;

    // Avoid changing src unless necessary; the browser reports play() rejected on reload.
    const srcChanged = (audio._musicSrc !== url);
    if (srcChanged) {
      try {
        audio._musicSrc = url;
        audio.src = url;
      } catch (_e) { void _e; }
    }

    const start = performance.now();
    const token = (transitionToken += 1);
    const duration = 700;
    isTransitioning = true;
    let settledByError = false;

    const errorHandler = () => {
      if (settledByError) return;
      settledByError = true;
      console.warn("[audio] failed to load", url);
      pruneInvalid(pool, url);
      isTransitioning = false;
      if (runActive && !muted) syncTracks();
    };
    audio.addEventListener("error", errorHandler, { once: true });

    try {
      audio.volume = 0;
      const promise = audio.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch((err) => {
          console.warn("[audio] play() rejected", err);
          errorHandler();
        });
      }
    } catch (_e) {
      void _e;
      errorHandler();
    }

    const step = (now) => {
      if (token !== transitionToken) return;
      const t = Math.min(1, (now - start) / duration);
      const gain = (muted ? 0 : volume);
      audio.volume = gain * t;
      if (previousAudio && previousAudio !== audio && !previousAudio.paused) {
        previousAudio.volume = gain * (1 - t);
      }
      if (t < 1) {
        fadeRaf = requestAnimationFrame(step);
      } else {
        audio.removeEventListener("error", errorHandler);
        try {
          if (previousAudio && previousAudio !== audio && !previousAudio.paused) {
            previousAudio.pause();
            previousAudio.volume = gain;
          }
        } catch (_e) { void _e; }
        audio.volume = gain;
        currentKey = key;
        currentAudio = audio;
        isTransitioning = false;
      }
    };
    cancelAnimationFrame(fadeRaf);
    fadeRaf = requestAnimationFrame(step);
    return true;
  }

  function isMuted() { return muted; }
  function getVolume() { return volume; }
  function isMusicEnabled() { return musicEnabled; }

  function setMusicEnabled(next) {
    musicEnabled = !!next;
    localStorage.setItem(MUSIC_KEY, musicEnabled ? "1" : "0");
    if (!musicEnabled) {
      pauseAll();
    } else if (!muted) {
      syncTracks();
    }
  }

  function toggleMusicEnabled() { setMusicEnabled(!musicEnabled); }

  function setMuted(next) {
    muted = !!next;
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    if (muted) {
      try { forestAudio.pause(); } catch (_e) { void _e; }
      try { bossAudio.pause(); } catch (_e) { void _e; }
      try { menuAudio.pause(); } catch (_e) { void _e; }
      currentKey = null;
      currentAudio = null;
    }
    syncTracks();
  }

  function toggleMuted() { setMuted(!muted); }

  function setVolume(next) {
    volume = Math.max(0, Math.min(1, Number(next) || 0));
    localStorage.setItem(VOLUME_KEY, String(volume));
    if (!muted) {
      if (currentKey === "forest") forestAudio.volume = volume;
      if (currentKey === "boss") bossAudio.volume = volume;
      if (currentKey === "menu") menuAudio.volume = volume;
      if (menuNode && context) {
        try { menuNode.gain.gain.setTargetAtTime(volume, context.currentTime, 0.05); } catch (error) { void error; }
      }
    }
  }

  function pauseAll() {
    stopMenuTheme();
    try { forestAudio.pause(); } catch (_e) { void _e; }
    try { bossAudio.pause(); } catch (_e) { void _e; }
    try { menuAudio.pause(); } catch (_e) { void _e; }
    currentAudio = null;
    currentKey = null;
  }

  function syncTracks() {
    if (muted || !musicEnabled) {
      pauseAll();
      return;
    }
    if (!runActive) {
      if (menuActive) {
        playMenuTheme();
      } else {
        pauseAll();
      }
      return;
    }
    stopMenuTheme();
    const nextKey = bossActive ? "boss" : "forest";
    if (currentKey !== nextKey) {
      playTrack(nextKey);
    } else {
      const audio = audioFor(nextKey);
      if (audio && audio.paused) {
        const promise = audio.play();
        if (promise && typeof promise.catch === "function") promise.catch(() => {});
      }
      if (audio && !muted) audio.volume = volume;
    }
  }

  function runStart() {
    menuActive = false;
    runActive = true;
    bossActive = false;
    init();
    syncTracks();
  }

  function runStop() {
    runActive = false;
    bossActive = false;
    pauseAll();
  }

  function setBossActive(active) {
    const normalized = !!active;
    if (bossActive === normalized && runActive) {
      syncTracks();
      return;
    }
    bossActive = normalized;
    if (runActive) syncTracks();
  }

  function menuStart() {
    menuActive = true;
    runActive = false;
    pauseAll();
    if (musicEnabled) {
      if (!menuBufferPromise) {
        loadMenuChannels().catch((error) => {
          console.warn("[audio] menu theme failed", error);
        });
      }
      playMenuTheme();
    }
  }

  function menuStop() {
    menuActive = false;
    pauseAll();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseAll();
    } else if (runActive && !muted) {
      syncTracks();
    } else if (menuActive && !muted && currentKey === null) {
      menuStart();
    }
  });

  const music = {
    isMuted,
    getVolume,
    isMusicEnabled,
    setMusicEnabled,
    toggleMusicEnabled,
    setMuted,
    toggleMuted,
    setVolume,
    runStart,
    runStop,
    setBossActive,
    menuStart,
    menuStop,
  };

  return { init, playSteam, music };
}