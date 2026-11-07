export function createAudio() {
  let context = null;
  let ready = false;
  function init() {
    if (context) return context;
    try { context = new (window.AudioContext || window.webkitAudioContext)(); } catch (_error) { context = null; void _error; }
    return context;
  }
  window.addEventListener("pointerdown", () => { ready = true; if (!context) init(); }, { once: true });
  window.addEventListener("keydown", () => { ready = true; if (!context) init(); }, { once: true });
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
    gain.gain.value = 0.2;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + 0.3);
  }

  // --- Music (HTMLAudio, pools + random selection) ---
  const MUTE_KEY = "elementa_audio_muted_v1";
  const VOLUME_KEY = "elementa_audio_volume_v1";
  let muted = (localStorage.getItem(MUTE_KEY) === "1");
  let volume = Number(localStorage.getItem(VOLUME_KEY));
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) volume = 0.45;

  const FOREST_TEMPLATES = ["ambient_goblin_forest", "ambient-goblin-forest", "forest-ambient", "forest_ambient", "ambient-forest", "forest", "Goblin Forest Ambience"];
  const BOSS_TEMPLATES = ["boss_fight_goblin_forest", "boss-fight-goblin-forest", "boss-battle", "boss_battle", "battle-boss", "boss", "Goblin Forest Boss"];
  const EXTENSIONS = ["mp3", "ogg", "wav", "webm", "m4a"];
  const INDEX_COUNT = 14;

  function basesWithIndices(base) {
    const out = [base];
    for (let i = 1; i <= INDEX_COUNT; i += 1) {
      out.push(`${base}_${i}`);
      out.push(`${base}-${i}`);
      out.push(`${base} (${i})`);
    }
    return out;
  }

  function candidateUrls(bases) {
    const urls = [];
    const seen = new Set();
    for (const base of bases) {
      for (const ext of EXTENSIONS) {
        const url = `/assets/audio/${encodeURIComponent(base)}.${ext}`;
        if (!seen.has(url)) { seen.add(url); urls.push(url); }
      }
    }
    return urls;
  }

  const forestUrls = candidateUrls(FOREST_TEMPLATES.flatMap(basesWithIndices));
  const bossUrls = candidateUrls(BOSS_TEMPLATES.flatMap(basesWithIndices));
  const MENU_TEMPLATES = [];
  const menuUrls = candidateUrls(MENU_TEMPLATES.flatMap(basesWithIndices));

  const forestPool = [];
  const bossPool = [];
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

  let runActive = false;
  let bossActive = false;
  let currentKey = null; // 'forest' | 'boss' | 'menu' | null
  let currentAudio = null;
  let transitionToken = 0;
  let fadeRaf = 0;
  let isTransitioning = false;

  function randomFromPool(pool) {
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function isMuted() { return muted; }
  function getVolume() { return volume; }

  function setMuted(next) {
    muted = !!next;
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    if (muted) {
      try { forestAudio.pause(); } catch (_e) { void _e; }
      try { bossAudio.pause(); } catch (_e) { void _e; }
      currentKey = null;
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
    }
  }

  function pauseAll() {
    try { forestAudio.pause(); } catch (_e) { void _e; }
    try { bossAudio.pause(); } catch (_e) { void _e; }
    try { menuAudio.pause(); } catch (_e) { void _e; }
    currentAudio = null;
    currentKey = null;
  }

  async function probeUrls(urls, pool) {
    for (const url of urls) {
      try {
        let response = await fetch(url, { method: "HEAD", cache: "no-store" });
        if (response.status === 405) response = await fetch(url, { method: "GET", cache: "no-store" });
        const contentType = (response.headers.get("content-type") || "").toLowerCase();
        const looksLikeAudio = /audio|octet-stream/i.test(contentType);
        if (response.ok && looksLikeAudio && !pool.includes(url)) {
          try { if (response.body && typeof response.body.cancel === "function") response.body.cancel(); } catch (_e) { void _e; }
          pool.push(url);
          console.info("[audio] found", url, "pool=", pool.length);
          if (runActive && !currentKey && !muted) syncTracks();
        }
      } catch (_e) {
        void _e;
      }
    }
    if (runActive && !currentKey && !muted) syncTracks();
  }

  // Start background discovery immediately (sequential HEAD probes, no extra media players)
  probeUrls(forestUrls, forestPool).catch(() => {});
  probeUrls(bossUrls, bossPool).catch(() => {});
  probeUrls(menuUrls, menuPool).catch(() => {});

  function playTrack(key) {
    if (isTransitioning) { console.info("[audio] playTrack skipped: transitioning"); return false; }
    const pool = poolFor(key);
    if (!pool.length) return false; // wait for discovery
    const url = randomFromPool(pool);
    if (!url) { console.warn("[audio] playTrack: empty pool", key); return false; }
    console.info("[audio] playTrack", key, url);
    const audio = audioFor(key);
    if (audio._musicSrc !== url) {
      try {
        audio._musicSrc = url;
        audio.src = url;
      } catch (_e) { void _e; }
    }
    const previousAudio = currentAudio;
    const start = performance.now();
    const token = (transitionToken += 1);
    const duration = 700;
    isTransitioning = true;
    try {
      audio.volume = 0;
      const promise = audio.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch((err) => { console.warn("[audio] play() rejected", err); isTransitioning = false; });
      }
    } catch (_e) { void _e; isTransitioning = false; }

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

  function syncTracks() {
    if (!runActive || muted) {
      console.info("[audio] syncTracks idle", { runActive, muted });
      pauseAll();
      currentKey = null;
      return;
    }
    const nextKey = bossActive ? "boss" : "forest";
    if (currentKey !== nextKey) {
      const ok = playTrack(nextKey);
      if (!ok) {
        // discovery still running; retry later when pool is ready
        currentKey = null;
      }
    } else {
      const audio = audioFor(currentKey);
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
    console.info("[audio] runStart", { muted, volume, pools: { forest: forestPool.length, boss: bossPool.length } });
    syncTracks();
  }

  function runStop() {
    runActive = false;
    bossActive = false;
    pauseAll();
    currentKey = null;
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

  let menuActive = false;
  function menuStart() {
    menuActive = true;
    runActive = false;
    pauseAll();
    currentKey = null;
    currentAudio = null;
    if (menuPool.length) playTrack("menu");
  }
  function menuStop() {
    menuActive = false;
    pauseAll();
    currentKey = null;
    currentAudio = null;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseAll();
    } else if (runActive && !muted) {
      syncTracks();
    }
  });

  const music = {
    isMuted,
    getVolume,
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