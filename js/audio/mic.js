// Mikrofon bzw. ?testton= (Browser). Liefert pro read() Zeitsignal + dB-Spektrum.
export async function startInput() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error('Dieser Browser unterstützt keine Audio-Eingabe.');
  const ctx = new AC();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 4096;
  analyser.smoothingTimeConstant = 0;
  let stream = null;
  const oscs = [];
  const test = new URLSearchParams(location.search).get('testton');

  try {
    if (test) {
      // Testton: Oszillatoren nur in den Analyser, nicht zu den Lautsprechern
      const gain = ctx.createGain();
      gain.gain.value = 0.15;
      gain.connect(analyser);
      for (const f of test.split(',').map(Number).filter((x) => x > 0)) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.connect(gain);
        o.start();
        oscs.push(o);
      }
    } else {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Dieser Browser unterstützt kein Mikrofon.');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
      } catch (e) {
        if (e.name === 'NotAllowedError' || e.name === 'SecurityError') throw new Error('Bitte Mikrofon in den Einstellungen erlauben.');
        if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') throw new Error('Kein Mikrofon gefunden.');
        throw new Error('Mikrofon konnte nicht gestartet werden.');
      }
      ctx.createMediaStreamSource(stream).connect(analyser);
    }
    if (ctx.state === 'suspended') await ctx.resume();
  } catch (e) {
    stream?.getTracks().forEach((t) => t.stop());
    ctx.close();
    throw e;
  }

  const time = new Float32Array(analyser.fftSize);
  const spectrum = new Float32Array(analyser.frequencyBinCount);
  return {
    ctx,
    sampleRate: ctx.sampleRate,
    read() {
      analyser.getFloatTimeDomainData(time);
      analyser.getFloatFrequencyData(spectrum);
      return { time, spectrum };
    },
    stop() {
      stream?.getTracks().forEach((t) => t.stop());
      oscs.forEach((o) => { try { o.stop(); } catch {} });
      ctx.close();
    },
  };
}
