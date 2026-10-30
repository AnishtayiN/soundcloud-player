// Runs INSIDE the real app (Android WebView / Windows Electron) through CDP — no mocks of the player engine.
// A generated noise WAV is stored as an offline song with the app's own storage code (offPut), then played by the
// app's own player (playList → loadCurrent → offline copy, no network / login needed). Then:
//   • speed: setRate(1.5 / 0.75) → media time per wall-clock second
//   • EQ: presets measured on the app's own AnalyserNode (the last node before the speakers)
//   • sleep timer: fades out, then playback stops
export async function engineCheck() {
  const t = window.__scTest, R = { ua: navigator.userAgent, steps: [] };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const log = (s) => R.steps.push(`${Math.round(performance.now())} ${s}`);
  try {
    // 1) 90 s of white noise, 44.1 kHz mono 16-bit WAV
    const rate = 44100, sec = 90, n = rate * sec, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, "data"); v.setUint32(40, n * 2, true);
    let seed = 12345; for (let i = 0; i < n; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; v.setInt16(44 + i * 2, ((seed / 0x7fffffff) * 2 - 1) * 9000 | 0, true); }
    const tr = { id: 990001, title: "E2E noise", artist: "e2e", duration_ms: sec * 1000, artwork_url: null };
    await t.offPut(tr, new Blob([buf], { type: "audio/wav" }), true);
    R.stored = t.OFF.ids.has(tr.id); log("stored offline " + R.stored);
    t.playList([tr], 0);
    const a = t.audio;
    for (let i = 0; i < 150 && !(a.currentTime > 0.5 && !a.paused); i++) await sleep(100);
    R.playing = a.currentTime > 0.5 && !a.paused; R.src = String(a.currentSrc).slice(0, 5); log("playing " + R.playing + " t=" + a.currentTime.toFixed(2));
    if (!R.playing) return R;

    // 2) speed
    const speed = async () => { const a0 = a.currentTime, w0 = performance.now(); await sleep(3000); return +((a.currentTime - a0) / ((performance.now() - w0) / 1000)).toFixed(3); };
    R.speed1 = await speed();
    t.setRate(1.5); R.rate15 = a.playbackRate; R.speed15 = await speed();
    t.setRate(0.75); R.rate075 = a.playbackRate; R.speed075 = await speed();
    t.setRate(2); R.speed2 = await speed();
    t.setRate(1); log(`speed 1=${R.speed1} 1.5=${R.speed15} 0.75=${R.speed075} 2=${R.speed2}`);

    // 3) EQ on the app's own graph
    R.eqOk = !!t.EQ.ok;
    if (R.eqOk) {
      R.eqEnsure = t.eqEnsure();
      await sleep(800);
      const spectrum = () => new Promise((res) => {
        const an = t.EQ.an, d = new Float32Array(an.frequencyBinCount), hz = (i) => (i * an.context.sampleRate) / an.fftSize;
        let lo = 0, hi = 0, k = 0;
        const iv = setInterval(() => {
          an.getFloatFrequencyData(d); let l = 0, ln = 0, h = 0, hn = 0;
          d.forEach((x, i) => { const f = hz(i); if (f >= 30 && f <= 60) { l += x; ln++; } if (f >= 14000 && f <= 20000) { h += x; hn++; } });
          lo += l / ln; hi += h / hn;
          if (++k === 15) { clearInterval(iv); res({ lo: +(lo / k).toFixed(2), hi: +(hi / k).toFixed(2) }); }
        }, 80);
      });
      R.ctxState = t.EQ.ctx && t.EQ.ctx.state; R.ctxRate = t.EQ.ctx && t.EQ.ctx.sampleRate;
      t.eqSet("flat"); await sleep(600); R.flat = await spectrum();
      t.eqSet("bass"); await sleep(600); R.bass = await spectrum();
      t.eqSet("treble"); await sleep(600); R.treble = await spectrum();
      t.eqSet("flat");
      R.bassDelta = +((R.bass.lo - R.bass.hi) - (R.flat.lo - R.flat.hi)).toFixed(2);
      R.trebleDelta = +((R.treble.hi - R.treble.lo) - (R.flat.hi - R.flat.lo)).toFixed(2);
      R.stillPlaying = !a.paused && a.currentTime > 10;
      log(`eq ctx=${R.ctxState} bassΔ=${R.bassDelta} trebleΔ=${R.trebleDelta}`);
    }

    // 4) sleep timer: 0.3 min = 18 s → fades over the last 15 s → stops
    const t0 = performance.now(); let minVol = 1, vAt10 = null;
    t.sleepSet(0.3);
    while (performance.now() - t0 < 26000 && !a.paused) {
      await sleep(250);
      const vol = t.SL.vol >= 0 ? t.SL.vol : 1; minVol = Math.min(minVol, vol);
      if (vAt10 === null && performance.now() - t0 > 10500) vAt10 = +vol.toFixed(2);
    }
    R.timerStopped = a.paused; R.timerMs = Math.round(performance.now() - t0); R.fadeAt10s = vAt10; R.minVol = +minVol.toFixed(2);
    log(`timer stopped=${R.timerStopped} after ${R.timerMs} ms, vol@10.5s=${vAt10}`);
    await sleep(600);
    R.volRestored = (t.SL.vol >= 0 ? t.SL.vol : 1) === 1 || a.volume === 1;
  } catch (e) { R.error = String(e && e.stack || e); }
  return R;
}

export function verdict(R) {
  const fails = [];
  const between = (k, lo, hi) => { if (!(R[k] >= lo && R[k] <= hi)) fails.push(`${k}=${R[k]} not in [${lo}, ${hi}]`); };
  if (R.error) fails.push("error: " + R.error);
  if (!R.playing) fails.push("the offline song did not play");
  else {
    between("speed1", 0.85, 1.15); between("speed15", 1.3, 1.7); between("speed075", 0.62, 0.88); between("speed2", 1.75, 2.25);
    if (R.eqOk) { between("bassDelta", 3, 40); between("trebleDelta", 3, 40); /* design ≈ +8 dB; measured 5–9 dB, noise floor ±0.5 dB */ if (!R.stillPlaying) fails.push("playback stopped while switching EQ presets"); }
    if (!R.timerStopped) fails.push("sleep timer did not stop playback");
    between("timerMs", 16500, 21000);
    if (!(R.fadeAt10s < 0.9 && R.fadeAt10s > 0.2)) fails.push(`no fade before stopping (volume at 10.5 s = ${R.fadeAt10s})`);
  }
  return fails;
}
