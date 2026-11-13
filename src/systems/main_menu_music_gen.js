/*!
 * main_menu_music_gen.js — v8.0-js «спокойная городская тема»
 *
 * JS-порт процедурного генератора меню-темы (оригинал — mondstadt_gen.py).
 * Вся музыка сочиняется в браузере/игре по числовому сиду: никаких WAV-файлов.
 * Вальс 3/4, 52 такта: интро 4 | A 16 (флейта) | B 16 (ремикс, флейта октавой
 * ниже) | C 12 (ремикс, струнный ансамбль) | таг 4 → каданс прямо в интро,
 * луп стык-в-стык.
 *
 * Детерминизм: внутри одного браузера/Node один сид всегда даёт один и тот же
 * звук (PRNG mulberry32 + фиксированный порядок вызовов, как в Python-версии).
 * Между браузерами и относительно Python-версии звук совпадает структурно
 * (те же ноты, тембры, сведение), но не побитово — float и libm отличаются.
 *
 * Рендер тяжёлый (~3–8 с): render(seed) делает его в Web Worker (не блокирует
 * интерфейс), при недоступности воркера — синхронно.
 *
 * Использование:
 *   import MondstadtGen from "./main_menu_music_gen.js";
 *   const { L, R, duration } = await MondstadtGen.render(seed);
 *   const buf = MondstadtGen.toAudioBuffer(audioCtx, { L, R });
 *
 *   // скачать как WAV (например, чтобы закэшировать файлом):
 *   const wav = MondstadtGen.encodeWav({ L, R });  // ArrayBuffer
 */
const MondstadtGen = (function () {
  'use strict';

  // Вся логика живёт внутри одной фабрики без внешних зависимостей:
  // главный поток использует её напрямую, а воркер собирается из её исходника.
  function coreFactory() {
    var VERSION = '8.0.0-js';
    var SR = 44100;
    var TAU = Math.PI * 2;

    // ------------------------------------------------------------ композиция

    // bpm и тональность выводятся из любого числового сида.
    function configForSeed(seed) {
      var s = Math.abs(Math.floor(seed));
      return {
        bpm: 104 + (s % 7),
        key: Math.floor(s / 7) % 12
      };
    }

    var NBARS = 52;
    var SEC = { intro: 1, A: 5, B: 21, C: 37, tag: 49 };

    var CH_MAP = [].concat(
      ['D', 'G', 'D', 'A'],                                        // интро 1–4
      ['D', 'G', 'D', 'A', 'Bm', 'G', 'D', 'A',
       'G', 'D', 'Em', 'A', 'Bm', 'G', 'A', 'A'],                  // A 5–20
      ['D', 'G', 'D', 'A', 'Bm', 'G', 'D', 'A',
       'G', 'D', 'Em', 'A', 'Bm', 'G', 'A', 'A'],                  // B 21–36
      ['D', 'D', 'G', 'A', 'D', 'Bm', 'G', 'A',
       'G', 'Em', 'A', 'A'],                                       // C 37–48
      ['Bm', 'G', 'A', 'A']                                        // таг 49–52
    );
    if (CH_MAP.length !== NBARS) throw new Error('CH_MAP: ' + CH_MAP.length + ' аккордов');

    var CHORDS = {
      'D':   { bass: 38, stab: [50, 57, 61], pad: [50, 57, 61] },
      'G':   { bass: 43, stab: [55, 59, 62], pad: [55, 59, 62] },
      'A':   { bass: 45, stab: [57, 61, 64], pad: [57, 61, 64] },
      'Bm':  { bass: 47, stab: [54, 59, 62], pad: [54, 59, 62] },
      'Em':  { bass: 40, stab: [52, 55, 59], pad: [52, 59, 64] },
      'F#m': { bass: 42, stab: [54, 57, 61], pad: [54, 61, 66] }
    };

    // (такт секции, доля, длительность в долях, midi)
    var MEL_A = [
      [1, 1, 2, 74], [1, 3, 1, 78],
      [2, 1, 2, 79], [2, 3, 1, 78],
      [3, 1, 2, 74], [3, 3, 1, 76],
      [4, 1, 3, 74],
      [5, 1, 2, 76], [5, 3, 1, 79],
      [6, 1, 2, 78], [6, 3, 1, 76],
      [7, 1, 2, 74], [7, 3, 1, 71],
      [8, 1, 3, 69],
      [9, 1, 2, 71], [9, 3, 1, 74],
      [10, 1, 2, 76], [10, 3, 1, 74],
      [11, 1, 2, 71], [11, 3, 1, 74],
      [12, 1, 3, 79],
      [13, 1, 1, 81], [13, 2, 1, 79], [13, 3, 2, 78],
      [14, 1, 1, 76], [14, 2, 1, 78], [14, 3, 2, 74],
      [15, 1, 2, 76], [15, 3, 1, 73],
      [16, 1, 3, 74]
    ];

    var MEL_B = [
      [1, 1, 1, 74], [1, 2, 1, 76], [1, 3, 2, 78],
      [2, 1, 1, 79], [2, 2, 1, 78], [2, 3, 2, 79],
      [3, 1, 1, 78], [3, 2, 1, 76], [3, 3, 2, 74],
      [4, 1, 2, 73], [4, 3, 1, 74],
      [5, 1, 1, 76], [5, 2, 1, 78], [5, 3, 2, 79],
      [6, 1, 1, 78], [6, 2, 1, 76], [6, 3, 2, 74],
      [7, 1, 1, 74], [7, 2, 1, 73], [7, 3, 2, 71],
      [8, 1, 3, 69],
      [9, 1, 1, 71], [9, 2, 1, 74], [9, 3, 2, 76],
      [10, 1, 1, 74], [10, 2, 1, 71], [10, 3, 2, 69],
      [11, 1, 1, 71], [11, 2, 1, 74], [11, 3, 2, 79],
      [12, 1, 3, 78],
      [13, 1, 1, 76], [13, 2, 1, 79], [13, 3, 2, 81],
      [14, 1, 1, 79], [14, 2, 1, 78], [14, 3, 2, 76],
      [15, 1, 1, 78], [15, 2, 1, 79], [15, 3, 2, 81],
      [16, 1, 3, 81]
    ];

    var MEL_C = [
      [1, 1, 2, 74], [1, 3, 1, 78],
      [2, 1, 2, 79], [2, 3, 1, 78],
      [3, 1, 2, 76], [3, 3, 1, 74],
      [4, 1, 3, 74],
      [5, 1, 2, 76], [5, 3, 1, 78],
      [6, 1, 2, 79], [6, 3, 1, 78],
      [7, 1, 1, 78], [7, 2, 1, 76], [7, 3, 2, 74],
      [8, 1, 3, 74],
      [9, 1, 2, 71], [9, 3, 1, 74],
      [10, 1, 2, 76], [10, 3, 1, 79],
      [11, 1, 2, 78], [11, 3, 1, 76],
      [12, 1, 3, 74]
    ];

    var TAG_CELESTA = [
      [1, 1, 2, 62], [1, 3, 1, 66],
      [2, 1, 2, 59], [2, 3, 1, 62],
      [3, 1, 3, 57]
    ];
    var TAG_HARP_ARP = [50, 54, 57, 61, 66, 69];

    var SEC_VEL = { intro: 0.95, A: 1.0, B: 0.88, C: 1.14, tag: 0.72 };

    function midi2hz(m) { return 440.0 * Math.pow(2.0, (m - 69) / 12.0); }

    // ---------------------------------------------------------------- утилиты

    // Детерминированный PRNG (mulberry32): та же роль, что default_rng(seed) в Python.
    function mulberry32(a) {
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function Rng(seed) {
      this.f = mulberry32(seed);
    }
    Rng.prototype.uniform = function (a, b) { return a + (b - a) * this.f(); };
    Rng.prototype.normal = function () { return this.f() * 2 - 1; }; // белый шум [-1..1)

    // Синус через таблицу (8192 точки, линейная интерполяция) — в разы быстрее
    // Math.sin, для аудио неотличимо. Используется во всех синтезах.
    var TABN = 8192;
    var TAB = new Float64Array(TABN + 1);
    for (var ti = 0; ti <= TABN; ti++) TAB[ti] = Math.sin(TAU * ti / TABN);
    var INV = TABN / TAU;

    function wsin(ph) {
      ph = ph % TAU; if (ph < 0) ph += TAU;
      var x = ph * INV;
      var i = x | 0;
      var fr = x - i;
      return TAB[i] + (TAB[i + 1] - TAB[i]) * fr;
    }

    function smoothstep(n) {
      var e = new Float64Array(n);
      for (var i = 0; i < n; i++) {
        var t = i / (n - 1 || 1);
        e[i] = t * t * (3 - 2 * t);
      }
      return e;
    }

    function panGains(pan) {
      var th = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4;
      return [Math.cos(th), Math.sin(th)];
    }

    // RBJ-биквад, ФНЧ 2-го порядка (Баттерворт). Два каскада = 4-й порядок —
    // аналог python-fft_lp (rolloff 1/(1+(f/fc)^4)), но причинный и дешёвый.
    function biquadLP(x, fc, Q) {
      fc = Math.min(fc, SR * 0.45);
      var w0 = TAU * fc / SR, cw = Math.cos(w0), sw = Math.sin(w0);
      var alpha = sw / (2 * Q);
      var a0 = 1 + alpha;
      var b0 = (1 - cw) / 2 / a0, b1 = (1 - cw) / a0, b2 = (1 - cw) / 2 / a0;
      var a1 = -2 * cw / a0, a2 = (1 - alpha) / a0;
      var x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (var i = 0; i < x.length; i++) {
        var xn = x[i];
        var yn = b0 * xn + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1; x1 = xn; y2 = y1; y1 = yn;
        x[i] = yn;
      }
      return x;
    }
    function lp4(x, fc) { biquadLP(x, fc, 0.7071); biquadLP(x, fc, 0.7071); return x; }

    function noiseBuf(n) { // n независимых draws — порядок как rng.standard_normal(n)
      var b = new Float64Array(n);
      for (var i = 0; i < n; i++) b[i] = RNG.normal();
      return b;
    }

    // RBJ-пик EQ для мастер-дипа (аналог трапеции 600–2800 Гц глубиной 0.22)
    function biquadPeak(x, f0, Q, gainDb) {
      var A = Math.pow(10, gainDb / 40);
      var w0 = TAU * f0 / SR, cw = Math.cos(w0), sw = Math.sin(w0);
      var alpha = sw / (2 * Q);
      var a0 = 1 + alpha / A;
      var b0 = (1 + alpha * A) / a0, b1 = -2 * cw / a0, b2 = (1 - alpha * A) / a0;
      var a1 = -2 * cw / a0, a2 = (1 - alpha / A) / a0;
      var x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (var i = 0; i < x.length; i++) {
        var xn = x[i];
        var yn = b0 * xn + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1; x1 = xn; y2 = y1; y1 = yn;
        x[i] = yn;
      }
      return x;
    }

    var RNG = null; // текущий rng (заполняется в ThemeGen)

    // -------------------------------------------------------------- генератор

    function ThemeGen(seed, bpm, key) {
      this.seed = seed;
      this.bpm = bpm;
      this.key = key;
      this.eighth = 30.0 / bpm;
      this.n = Math.round(NBARS * 6 * this.eighth * SR);
      this.rng = new Rng(seed);
      RNG = this.rng;               // для noiseBuf() — порядок вызовов как в Python
      this.L = new Float32Array(this.n);
      this.R = new Float32Array(this.n);
    }

    ThemeGen.prototype.bt = function (bar) { return (bar - 1) * 6 * this.eighth; };
    ThemeGen.prototype.bb = function (bar, beat, frac) {
      return this.bt(bar) + ((beat - 1) + (frac || 0)) * 2 * this.eighth;
    };
    ThemeGen.prototype.hz = function (midi) { return midi2hz(midi + this.key); };

    // Кольцевой буфер: хвост ноты за границей трека заворачивается в начало (луп).
    ThemeGen.prototype.add = function (t0, y, pan, gain) {
      pan = pan || 0; gain = gain ?? 1;
      var i0 = Math.round(t0 * SR) % this.n;
      if (i0 < 0) i0 += this.n;
      var pg = panGains(pan);
      var gl = pg[0] * gain, gr = pg[1] * gain;
      var len = y.length;
      var m = Math.min(len, this.n - i0);
      var i, L = this.L, R = this.R;
      for (i = 0; i < m; i++) { L[i0 + i] += y[i] * gl; R[i0 + i] += y[i] * gr; }
      for (i = m; i < len; i++) { L[i - m] += y[i] * gl; R[i - m] += y[i] * gr; }
    };

    // ---- инструменты (порты python-версий, те же параметры) ------------------

    ThemeGen.prototype.flute = function (f0, dur, vel, breath) {
      breath = breath ?? 1.0;
      var n = Math.max(8, Math.floor(dur * SR));
      var phi0 = this.rng.uniform(0, 6.28);
      var noise = noiseBuf(n);
      lp4(noise, 5200);
      var y = new Float64Array(n);
      var ph = 0.0, t, vibAmt, s1;
      for (var i = 0; i < n; i++) {
        t = i / SR;
        vibAmt = 0.004 * Math.min(1, Math.max(0, (t - 0.22) / 0.5));
        ph += TAU * f0 * (1 + vibAmt * wsin(TAU * 5.1 * t + phi0)) / SR;
        s1 = wsin(ph);
        var chiff = Math.exp(-t / 0.045) * 0.06;
        y[i] = s1 + 0.26 * wsin(2 * ph) + 0.09 * wsin(3 * ph) + 0.04 * wsin(4 * ph)
             + noise[i] * (0.028 * Math.abs(s1) + chiff) * breath;
      }
      // огибающая: атака 75 мс, релиз 110 мс
      var na = Math.max(1, Math.floor(0.075 * SR));
      var nr = Math.max(1, Math.floor(0.11 * SR));
      var ra = smoothstep(na), rr = smoothstep(nr);
      for (var k = 0; k < na && k < n; k++) y[k] *= ra[k];
      for (var k2 = 0; k2 < nr && k2 < n; k2++) y[n - 1 - k2] *= rr[k2];
      for (var v = 0; v < n; v++) y[v] *= vel;
      return lp4(y, 4200);
    };

    ThemeGen.prototype.bowed = function (f0, dur, vel, dark, voices) {
      dark = dark || 1.0; voices = voices || 7;
      var n = Math.max(8, Math.floor(dur * SR));
      var cents = new Float64Array(voices), vibf = new Float64Array(voices), vphp = new Float64Array(voices);
      for (var q = 0; q < voices; q++) {
        cents[q] = this.rng.uniform(-7.0, 7.0);
        vibf[q] = this.rng.uniform(4.3, 5.4);
        vphp[q] = this.rng.uniform(0, 6.28);
      }
      var y = new Float64Array(n);
      var norm = 1.0 / (Math.sqrt(voices) * 3.8);
      var hk = new Float64Array(9);
      for (var hk2 = 1; hk2 <= 8; hk2++) hk[hk2] = 1 / Math.pow(hk2, 1.45);
      for (var v = 0; v < voices; v++) {
        var f = f0 * Math.pow(2, cents[v] / 1200.0);
        var vp = vphp[v], vf = vibf[v];
        for (var i = 0; i < n; i++) {
          var t = i / SR;
          var vib = 1 + 0.0032 * wsin(TAU * vf * t + vp);
          var ph = TAU * f * vib * t + vp;
          var g = 0;
          for (var k = 1; k <= 8; k++) g += hk[k] * wsin(k * ph);
          y[i] += g;
        }
      }
      for (var s = 0; s < n; s++) y[s] *= norm;
      var na = Math.max(1, Math.floor(0.17 * SR));
      var nr = Math.max(1, Math.floor(0.28 * SR));
      if (n > na + nr) {
        var ra = smoothstep(na), rr = smoothstep(nr);
        for (var k1 = 0; k1 < na; k1++) y[k1] *= ra[k1];
        for (var k2 = 0; k2 < nr; k2++) y[n - 1 - k2] *= rr[k2];
      }
      for (var v2 = 0; v2 < n; v2++) y[v2] *= vel;
      return lp4(y, 2300.0 / dark);
    };

    ThemeGen.prototype.horn = function (f0, dur, vel, dark) {
      dark = dark || 1.0;
      var n = Math.max(8, Math.floor(dur * SR));
      var amps = new Float64Array(11);
      for (var k = 1; k <= 10; k++) {
        var a = 1.0 / Math.pow(k, 1.15);
        var fk = f0 * k;
        if (fk >= 320 && fk <= 720) a *= 1.5;   // «медный» формант
        amps[k] = a;
      }
      var spit = noiseBuf(n);
      lp4(spit, 3200);
      var y = new Float64Array(n);
      for (var i = 0; i < n; i++) {
        var t = i / SR;
        var ph = TAU * f0 * t;
        var s = 0;
        for (var k2 = 1; k2 <= 10; k2++) s += amps[k2] * wsin(k2 * ph);
        s += spit[i] * Math.exp(-t / 0.03) * 0.05;
        y[i] = s;
      }
      var na = Math.max(1, Math.floor(0.085 * SR));
      var nr = Math.max(1, Math.floor(0.2 * SR));
      if (n > na + nr) {
        var ra = smoothstep(na), rr = smoothstep(nr);
        for (var k1 = 0; k1 < na; k1++) y[k1] *= ra[k1];
        for (var k3 = 0; k3 < nr; k3++) y[n - 1 - k3] *= rr[k3];
      }
      for (var v = 0; v < n; v++) y[v] *= vel;
      return lp4(y, 1900.0 / dark);
    };

    ThemeGen.prototype.harp = function (f0, dur, vel) {
      var n = Math.max(8, Math.floor(dur * SR));
      var tau = Math.min(2.4, Math.max(0.35, 1.25 * Math.pow(220.0 / f0, 0.6)));
      var B = 0.00042;
      var fk = [], ak = [];
      for (var k = 1; k <= 6; k++) {
        var fr = f0 * k * Math.sqrt(1 + B * k * k);
        if (fr > SR / 2.2) break;
        fk.push(TAU * fr);
        ak.push(1 / Math.pow(k, 1.6));
      }
      var na = Math.max(1, Math.floor(0.004 * SR));
      var lin = new Float64Array(na);
      for (var li = 0; li < na; li++) lin[li] = li / (na - 1 || 1);
      var y = new Float64Array(n);
      for (var i = 0; i < n; i++) {
        var t = i / SR;
        var s = 0;
        for (var h = 0; h < fk.length; h++) s += ak[h] * wsin(fk[h] * t);
        y[i] = s * Math.exp(-t / tau);
      }
      for (var k1 = 0; k1 < na; k1++) y[k1] *= lin[k1];
      for (var v = 0; v < n; v++) y[v] *= vel;
      return lp4(y, 6200);
    };

    ThemeGen.prototype.pizz = function (f0, dur, vel) {
      var n = Math.max(8, Math.floor(dur * SR));
      var tau = Math.min(0.42, Math.max(0.12, 0.30 * Math.pow(220.0 / f0, 0.4)));
      var click = noiseBuf(n);
      lp4(click, 2400);
      var y = new Float64Array(n);
      var na = Math.max(1, Math.floor(0.003 * SR));
      var pk = new Float64Array(6);
      for (var pk2 = 1; pk2 <= 5; pk2++) pk[pk2] = 1 / Math.pow(pk2, 1.5);
      for (var i = 0; i < n; i++) {
        var t = i / SR;
        var s = 0;
        for (var k = 1; k <= 5; k++) s += pk[k] * wsin(TAU * f0 * k * t);
        y[i] = (s + click[i] * Math.exp(-t / 0.006) * 0.35) * Math.exp(-t / tau);
      }
      for (var k1 = 0; k1 < na; k1++) y[k1] *= k1 / (na - 1 || 1);
      for (var v = 0; v < n; v++) y[v] *= vel;
      return lp4(y, 3600);
    };

    ThemeGen.prototype.celesta = function (f0, dur, vel) {
      var n = Math.max(8, Math.floor(dur * SR));
      var tau = Math.min(1.4, Math.max(0.4, 0.85 * Math.pow(660.0 / f0, 0.3)));
      var parts = [[1.0, 1.0], [2.0, 0.22], [3.01, 0.10], [4.02, 0.055], [5.04, 0.03]];
      var fk = [], ak = [];
      for (var p = 0; p < parts.length; p++) {
        if (f0 * parts[p][0] < SR / 2.2) { fk.push(TAU * f0 * parts[p][0]); ak.push(parts[p][1]); }
      }
      var na = Math.max(1, Math.floor(0.002 * SR));
      var y = new Float64Array(n);
      for (var i = 0; i < n; i++) {
        var t = i / SR;
        var s = 0;
        for (var h = 0; h < fk.length; h++) s += ak[h] * wsin(fk[h] * t);
        y[i] = s * Math.exp(-t / tau);
      }
      for (var k1 = 0; k1 < na; k1++) y[k1] *= k1 / (na - 1 || 1);
      for (var v = 0; v < n; v++) y[v] *= vel;
      return lp4(y, 5200);
    };

    ThemeGen.prototype.timp = function (f0, dur, vel) {
      var n = Math.max(8, Math.floor(dur * SR));
      var thump = noiseBuf(n);
      lp4(thump, 160);
      var y = new Float64Array(n);
      var ph = 0.0;
      for (var i = 0; i < n; i++) {
        var t = i / SR;
        ph += TAU * f0 * (1 + 0.13 * Math.exp(-t / 0.05)) / SR;
        var body = wsin(ph) + 0.3 * wsin(2 * ph) + 0.12 * wsin(2.98 * ph);
        y[i] = body * Math.exp(-t / 0.5) + thump[i] * Math.exp(-t / 0.04) * 1.2;
      }
      var na = Math.max(1, Math.floor(0.002 * SR));
      for (var k1 = 0; k1 < na; k1++) y[k1] *= k1 / (na - 1 || 1);
      for (var v = 0; v < n; v++) y[v] *= vel;
      return lp4(y, 900);
    };

    // ---- человечность -------------------------------------------------------
    ThemeGen.prototype.jit = function (ms) {
      return this.rng.uniform(-(ms || 6.0), ms || 6.0) / 1000.0;
    };
    ThemeGen.prototype.vjit = function (v, frac) {
      frac = frac ?? 0.1;
      return v * this.rng.uniform(1.0 - frac, 1.0 + frac);
    };

    // ---- оркестровка (порядок вызовов rng — как в Python) --------------------
    ThemeGen.prototype.compose = function () {
      var E = this.eighth, sv = SEC_VEL, self = this;

      // интро: арфа + пад, без мелодии
      for (var bar = SEC.intro; bar < SEC.A; bar++) {
        var ch = CH_MAP[bar - 1];
        this._harp_arp(bar, ch, 0.10 * sv.intro);
        this._pad(bar, ch, 0.055 * sv.intro, 0.0);
      }
      for (var bar2 = SEC.intro; bar2 < SEC.A; bar2++) {
        var c2 = CHORDS[CH_MAP[bar2 - 1]];
        this.add(this.bb(bar2, 1) + this.jit(4),
          this.harp(this.hz(c2.bass + 12), 2.6 * E, this.vjit(0.11 * sv.intro)), -0.15);
      }

      // секция A: тема у флейты, вальс пиццикато
      for (var bar3 = SEC.A; bar3 < SEC.B; bar3++) {
        var ch3 = CH_MAP[bar3 - 1];
        this._waltz_pizz(bar3, ch3, 0.085 * sv.A, false);
        this._pad(bar3, ch3, 0.05 * sv.A, 0.0);
      }
      MEL_A.forEach(function (nt) {
        var t0 = self.bb(SEC.A + nt[0] - 1, nt[1]) + self.jit(5);
        var dur = nt[2] * 2 * E;
        self.add(t0, self.flute(self.hz(nt[3]), dur + 0.10, self.vjit(0.150 * sv.A)), 0.12);
      });
      this.add(this.bb(SEC.A, 1), this.timp(this.hz(38), 1.2, 0.085), 0.0);

      // секция B: РЕМИКС — тема октавой ниже, арфовая фактура
      for (var bar4 = SEC.B; bar4 < SEC.C; bar4++) {
        var ch4 = CH_MAP[bar4 - 1];
        this._harp_arp(bar4, ch4, 0.085 * sv.B);
        this._pad(bar4, ch4, 0.055 * sv.B, 0.0);
      }
      MEL_B.forEach(function (nt) {
        var t0 = self.bb(SEC.B + nt[0] - 1, nt[1]) + self.jit(5);
        var dur = nt[2] * 2 * E;
        self.add(t0, self.flute(self.hz(nt[3] - 12), dur + 0.10, self.vjit(0.145 * sv.B), 1.15), 0.05);
      });
      for (var bar5 = SEC.B + 8; bar5 < SEC.C; bar5++) {
        var c5 = CHORDS[CH_MAP[bar5 - 1]];
        for (var r5 = 0; r5 < 2; r5++) {
          var root = r5 === 0 ? c5.bass + 12 : c5.bass + 19;
          this.add(this.bb(bar5, 1) + this.jit(8),
            this.horn(this.hz(root), 5.4 * E, this.vjit(0.050 * sv.B)), -0.1);
        }
      }
      this.add(this.bb(SEC.B, 1), this.timp(this.hz(38), 1.2, 0.085), 0.0);

      // секция C: РЕМИКС — тема у струнного ансамбля, плотная фактура
      for (var bar6 = SEC.C; bar6 < SEC.tag; bar6++) {
        var ch6 = CH_MAP[bar6 - 1];
        this._waltz_pizz(bar6, ch6, 0.095 * sv.C, true);
        this._pad(bar6, ch6, 0.075 * sv.C, 0.0);
        var c6 = CHORDS[ch6];
        for (var r6 = 0; r6 < 2; r6++) {
          var root6 = r6 === 0 ? c6.bass + 12 : c6.bass + 19;
          this.add(this.bb(bar6, 1) + this.jit(8),
            this.horn(this.hz(root6), 5.4 * E, this.vjit(0.062 * sv.C)), -0.1);
        }
      }
      MEL_C.forEach(function (nt) {
        var t0 = self.bb(SEC.C + nt[0] - 1, nt[1]) + self.jit(4);
        var dur = nt[2] * 2 * E;
        var hi = (nt[3] + self.key) >= 80;         // верх — тише и темнее (урок v7)
        var vel = 0.150 * sv.C * (hi ? 0.90 : 1.0);
        var dark = hi ? 1.06 : 1.0;
        self.add(t0, self.bowed(self.hz(nt[3]), dur + 0.16, self.vjit(vel), dark), 0.0);
        self.add(t0, self.flute(self.hz(nt[3] - 12), dur + 0.10, self.vjit(0.075 * sv.C), 0.7), 0.2);
        if (nt[2] >= 2) {
          self.add(t0 + self.jit(10), self.celesta(self.hz(nt[3] - 24), dur + 0.4, self.vjit(0.040 * sv.C)), 0.3);
        }
      });
      this.add(this.bb(SEC.C, 1), this.timp(this.hz(38), 1.4, 0.11), 0.0);
      this.add(this.bb(SEC.tag - 1, 2), this.timp(this.hz(33), 0.7, 0.09), 0.0);
      this.add(this.bb(SEC.tag - 1, 3), this.timp(this.hz(35), 0.7, 0.09), 0.0);

      // таг: каданс в интро (луп!)
      for (var bar7 = SEC.tag; bar7 <= NBARS; bar7++) {
        var ch7 = CH_MAP[bar7 - 1];
        this._pad(bar7, ch7, 0.06 * sv.tag, 0.0);
        var c7 = CHORDS[ch7];
        this.add(this.bb(bar7, 1) + this.jit(5),
          this.pizz(this.hz(c7.bass), 2.4 * E, this.vjit(0.09 * sv.tag)), -0.1);
      }
      TAG_CELESTA.forEach(function (nt) {
        self.add(self.bb(SEC.tag + nt[0] - 1, nt[1]) + self.jit(8),
          self.celesta(self.hz(nt[3]), nt[2] * 2 * E + 0.5, self.vjit(0.045 * sv.tag)), 0.3);
      });
      this.add(this.bb(SEC.tag, 1), this.horn(this.hz(47 + 12), 5 * E, 0.055 * sv.tag), -0.05);
      this.add(this.bb(SEC.tag + 2, 1), this.horn(this.hz(45 + 12), 6 * E, 0.055 * sv.tag), -0.05);
      for (var ai = 0; ai < TAG_HARP_ARP.length; ai++) {
        var t0a = this.bb(NBARS, 1) + ai * E;
        this.add(t0a, this.harp(this.hz(TAG_HARP_ARP[ai]), 2.0 * E, this.vjit(0.085 * sv.tag)), -0.25 + 0.1 * ai);
      }
    };

    ThemeGen.prototype._waltz_pizz = function (bar, ch, vel, useHarp) {
      var c = CHORDS[ch];
      var self = this;
      var instr = function (f, d, v) { return useHarp ? self.harp(f, d, v) : self.pizz(f, d, v); };
      var t0 = this.bb(bar, 1) + this.jit(4);
      this.add(t0, instr(this.hz(c.bass), 2.0 * this.eighth, this.vjit(vel)), -0.1);
      [2, 3].forEach(function (beat) {
        var notes = self.rng.uniform(0, 1) > 0.12 ? c.stab : c.pad;
        for (var j = 0; j < notes.length; j++) {
          var g = self.vjit(vel * 0.8);
          var p = -0.25 + 0.25 * j;
          self.add(self.bb(bar, beat) + self.jit(4), instr(self.hz(notes[j]), 1.6 * self.eighth, g), p);
        }
      });
    };

    ThemeGen.prototype._harp_arp = function (bar, ch, vel) {
      var p = CHORDS[ch].pad;
      var seq = [p[0], p[1], p[2], p[0] + 12, p[1] + 12, p[2]];
      for (var i = 0; i < seq.length; i++) {
        var t0 = this.bt(bar) + i * this.eighth + this.jit(5);
        this.add(t0, this.harp(this.hz(seq[i]), 3.2 * this.eighth, this.vjit(vel)), -0.2 + 0.08 * i);
      }
    };

    ThemeGen.prototype._pad = function (bar, ch, vel, pan) {
      var c = CHORDS[ch];
      var dur = 6 * this.eighth + 0.12;
      var y = this.bowed(this.hz(c.pad[1]), dur, vel, 1.12, 5);
      this.add(this.bt(bar) - 0.02, y, pan);
      var p2 = (pan + 0.35 < 1) ? pan + 0.35 : pan;
      var y2 = this.bowed(this.hz(c.pad[2]), dur, vel * 0.7, 1.18, 4);
      this.add(this.bt(bar) - 0.02, y2, p2);
    };

    // ---- сведение -------------------------------------------------------------
    ThemeGen.prototype.reverb = function (wet) {
      wet = wet ?? 0.24;
      var n = this.n;
      var wetL = new Float32Array(n), wetR = new Float32Array(n);

      // ранние отражения: разреженные задержки с заворотом
      var taps = [[11, 0.20, -0.3], [13, -0.17, 0.3], [17, 0.14, -0.5], [23, -0.12, 0.5],
                  [29, 0.10, -0.2], [31, 0.09, 0.2], [37, -0.07, 0.0]];
      for (var t = 0; t < taps.length; t++) {
        var d = Math.round(taps[t][0] / 1000.0 * SR);
        var g = taps[t][1];
        var pg = panGains(taps[t][2]);
        for (var i = 0; i < n; i++) {
          var j = i + d; if (j >= n) j -= n;
          wetL[j] += this.L[i] * g * pg[0];
          wetR[j] += this.R[i] * g * pg[1];
        }
      }
      // гребенчатый хвост ~2.4 с: IIR-гребёнка поверх двух циклов буфера
      // (второй цикл = установившееся круговое состояние, хвост перетекает в луп)
      var combs = [[29.7, 0.77], [37.1, 0.74], [41.1, 0.71], [43.7, 0.68]];
      for (var c = 0; c < combs.length; c++) {
        var dL = Math.round(combs[c][0] / 1000.0 * SR);
        var dR = Math.round((combs[c][0] + 1.1) / 1000.0 * SR);
        combInto(wetL, this.L, dL, combs[c][1], 0.35, n);
        combInto(wetR, this.R, dR, combs[c][1], 0.35, n);
      }
      lp4(wetL, 5200); lp4(wetR, 5200);
      for (var k = 0; k < n; k++) {
        this.L[k] += wet * wetL[k];
        this.R[k] += wet * wetR[k];
      }

      function combInto(dst, src, d, g, scale, n) {
        var m = 2 * n;
        var yy = new Float32Array(m);
        var i;
        for (i = 0; i < m; i++) {
          var xn = i < n ? src[i] : src[i - n];
          yy[i] = xn + (i >= d ? g * yy[i - d] : 0);
        }
        for (i = 0; i < n; i++) dst[i] += scale * yy[n + i];
      }
    };

    ThemeGen.prototype.master = function (target) {
      target = target ?? 0.86;
      var n = this.n;
      // дип «жёсткости» 600–2800 Гц (≈ −2.2 дБ, как в python-версии)
      biquadPeak(this.L, 1400, 0.65, -2.2);
      biquadPeak(this.R, 1400, 0.65, -2.2);
      var norm = 1.0 / Math.tanh(1.25);
      var peak = 0;
      for (var i = 0; i < n; i++) {
        this.L[i] = Math.tanh(1.25 * this.L[i]) * norm;
        this.R[i] = Math.tanh(1.25 * this.R[i]) * norm;
        var a = Math.max(Math.abs(this.L[i]), Math.abs(this.R[i]));
        if (a > peak) peak = a;
      }
      if (peak > 1e-9) {
        var g = target / peak;
        for (var k = 0; k < n; k++) { this.L[k] *= g; this.R[k] *= g; }
      }
    };

    ThemeGen.prototype.render = function () {
      this.compose();
      this.reverb();
      this.master();
      return { L: this.L, R: this.R, duration: this.n / SR };
    };

    // ------------------------------------------------------------------- API

    function renderSync(seed) {
      var s = Math.floor(Number(seed));
      if (!Number.isFinite(s)) throw new Error('Сид должен быть числом: ' + seed);
      var cfg = configForSeed(s);
      var gen = new ThemeGen(s, cfg.bpm, cfg.key);
      var out = gen.render();
      out.seed = s; out.bpm = cfg.bpm; out.key = cfg.key; out.SR = SR;
      return out;
    }

    // Рендер в Web Worker (не блокирует UI); без воркера — синхронно.
    function render(seed) {
      return new Promise(function (resolve, reject) {
        var canWorker;
        try {
          canWorker = typeof Worker !== 'undefined' && typeof Blob !== 'undefined' &&
                      typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
        } catch { canWorker = false; }

        if (!canWorker) {
          try { resolve(renderSync(seed)); }
          catch (err) { reject(err); }
          return;
        }
        try {
          var src = 'const api = (' + coreFactory.toString() + ')();\n' +
            'self.onmessage = function (e) {\n' +
            '  try {\n' +
            '    var out = api.renderSync(e.data.seed);\n' +
            '    self.postMessage({ L: out.L, R: out.R, duration: out.duration, SR: out.SR, seed: out.seed, bpm: out.bpm, key: out.key }, [out.L.buffer, out.R.buffer]);\n' +
            '  } catch (err) { self.postMessage({ error: String(err && err.message || err) }); }\n' +
            '};';
          var url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
          var w = new Worker(url);
          w.onmessage = function (e) {
            w.terminate(); URL.revokeObjectURL(url);
            if (e.data.error) reject(new Error(e.data.error));
            else resolve(e.data);
          };
          w.onerror = function () {
            w.terminate(); URL.revokeObjectURL(url);
            try { resolve(renderSync(seed)); }  // запасной путь
            catch (err) { reject(err); }
          };
          w.postMessage({ seed: seed });
        } catch {
          try { resolve(renderSync(seed)); }
          catch (err2) { reject(err2); }
        }
      });
    }

    function toAudioBuffer(ctx, chans) {
      var len = chans.L.length;
      var buf = ctx.createBuffer(2, len, chans.SR || SR);
      if (buf.copyToChannel) {
        buf.copyToChannel(new Float32Array(chans.L), 0);
        buf.copyToChannel(new Float32Array(chans.R), 1);
      } else {
        buf.getChannelData(0).set(chans.L);
        buf.getChannelData(1).set(chans.R);
      }
      return buf;
    }

    // Кодирование в WAV (16 бит, стерео) — например, чтобы закэшировать файлом.
    function encodeWav(chans) {
      var len = chans.L.length;
      var bytes = 44 + len * 4;
      var ab = new ArrayBuffer(bytes);
      var dv = new DataView(ab);
      function str(off, s) { for (var i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); }
      str(0, 'RIFF'); dv.setUint32(4, bytes - 8, true); str(8, 'WAVE');
      str(12, 'fmt '); dv.setUint32(16, 16, true);
      dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
      dv.setUint32(24, chans.SR || SR, true);
      dv.setUint32(28, (chans.SR || SR) * 4, true);
      dv.setUint16(32, 4, true); dv.setUint16(34, 16, true);
      str(36, 'data'); dv.setUint32(40, len * 4, true);
      var off = 44;
      for (var i = 0; i < len; i++) {
        var l = Math.max(-1, Math.min(1, chans.L[i]));
        var r = Math.max(-1, Math.min(1, chans.R[i]));
        dv.setInt16(off, l < 0 ? l * 32768 : l * 32767, true); off += 2;
        dv.setInt16(off, r < 0 ? r * 32768 : r * 32767, true); off += 2;
      }
      return ab;
    }

    return {
      VERSION: VERSION,
      SR: SR,
      ThemeGen: ThemeGen,
      renderSync: renderSync,
      render: render,
      toAudioBuffer: toAudioBuffer,
      encodeWav: encodeWav
    };
  }

  var api = coreFactory();
  api.coreFactory = coreFactory;   // для сборки воркера и тестов
  return api;
})();

export default MondstadtGen;
