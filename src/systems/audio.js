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
  return { init, playSteam };
}
