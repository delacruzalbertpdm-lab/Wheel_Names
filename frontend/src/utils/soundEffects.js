/**
 * Pure Web Audio API Sound Engine for PulseDraw.
 * 100% client-side, zero network calls, zero tracking, no external iframe/adblock blocks.
 * Provides crisp digital audio effects for scanning, locking, and celebratory fanfare.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Crisp futuristic spotlight scan tick during player selection.
 * Frequencies smoothly rise as the selection accelerates.
 */
export function playScanTick(step = 1, totalSteps = 24) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const progress = Math.min(1, Math.max(0, step / totalSteps));
    const baseFreq = 420 + progress * 480;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.18, now + 0.065);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // AudioContext silenced or not permitted yet
  }
}

/**
 * High-tech target lock-on double-chime when spotlights lock onto the selected winners.
 */
export function playTargetLockSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 783.99, offset: 0, duration: 0.12 },    // G5
      { freq: 1046.5, offset: 0.09, duration: 0.28 }, // C6
    ];

    notes.forEach(({ freq, offset, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + offset);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.22, now + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + duration + 0.02);
    });
  } catch {
    // Ignore
  }
}

/**
 * Triumphant celebratory fanfare arpeggio + sustained major chord
 * when selected winners are simultaneously revealed on stage.
 */
export function playWinnerRevealFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const arpeggio = [
      { freq: 523.25, start: 0.0, duration: 0.22, type: 'triangle', vol: 0.25 }, // C5
      { freq: 659.25, start: 0.09, duration: 0.22, type: 'triangle', vol: 0.25 }, // E5
      { freq: 783.99, start: 0.18, duration: 0.25, type: 'triangle', vol: 0.28 }, // G5
      { freq: 1046.5, start: 0.28, duration: 0.95, type: 'triangle', vol: 0.32 }, // C6
    ];

    arpeggio.forEach(({ freq, start, duration, type, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(vol, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.03);
    });

    const chordFreqs = [523.25, 659.25, 783.99, 987.77, 1174.66];
    chordFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.28);

      const peakVol = idx === 0 ? 0.16 : 0.10;
      gain.gain.setValueAtTime(0.001, now + 0.28);
      gain.gain.linearRampToValueAtTime(peakVol, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.28);
      osc.stop(now + 1.6);
    });
  } catch {
    // Ignore
  }
}
