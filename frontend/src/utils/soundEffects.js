/**
 * Studio-grade Audio & YouTube Sound Engine for PulseDraw.
 * Plays https://www.youtube.com/watch?v=wKw0pvc1HiE ("MAY NANALO NA!.... SOUND EFFECTS!")
 * during the player selection process via the official YouTube IFrame Player API,
 * with Web Audio API synthesizer fallback and celebratory fanfare.
 */

const DEFAULT_YOUTUBE_VIDEO_ID = 'wKw0pvc1HiE';

let audioCtx = null;
let ytPlayer = null;
let ytReady = false;
let ytPendingPlay = false;

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
 * Preloads the hidden YouTube IFrame Player for `wKw0pvc1HiE` so that clicking
 * "Start Selection" plays the exact YouTube audio immediately.
 */
export function initYouTubeChoosingSound(videoId = DEFAULT_YOUTUBE_VIDEO_ID) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Ensure hidden container exists
  let container = document.getElementById('pulsedraw-yt-audio-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pulsedraw-yt-audio-container';
    container.style.position = 'fixed';
    container.style.bottom = '0';
    container.style.left = '0';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.opacity = '0.01';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';
    const playerDiv = document.createElement('div');
    playerDiv.id = 'pulsedraw-yt-player';
    container.appendChild(playerDiv);
    document.body.appendChild(container);
  }

  const createPlayer = () => {
    if (ytPlayer || !window.YT || !window.YT.Player) return;
    ytPlayer = new window.YT.Player('pulsedraw-yt-player', {
      height: '1',
      width: '1',
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: (event) => {
          ytReady = true;
          try {
            event.target.unMute();
            event.target.setVolume(100);
            if (ytPendingPlay) {
              ytPendingPlay = false;
              event.target.seekTo(0, true);
              event.target.playVideo();
            }
          } catch {
            // Ignore
          }
        },
      },
    });
  };

  if (window.YT && window.YT.Player) {
    createPlayer();
  } else {
    const existingScript = document.getElementById('pulsedraw-yt-iframe-api');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'pulsedraw-yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevCallback === 'function') prevCallback();
      createPlayer();
    };
  }
}

/**
 * Starts playing the YouTube choosing sound (`https://www.youtube.com/watch?v=wKw0pvc1HiE`)
 * from the beginning. Returns true if the YouTube player was triggered.
 */
export function startYouTubeChoosingSound() {
  try {
    initYouTubeChoosingSound();
    if (ytPlayer && ytReady && typeof ytPlayer.playVideo === 'function') {
      ytPlayer.unMute();
      ytPlayer.setVolume(100);
      ytPlayer.seekTo(0, true);
      ytPlayer.playVideo();
      return true;
    } else {
      ytPendingPlay = true;
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Stops the YouTube choosing sound if needed (e.g. when muting or cancelling).
 */
export function stopYouTubeChoosingSound() {
  ytPendingPlay = false;
  try {
    if (ytPlayer && ytReady && typeof ytPlayer.stopVideo === 'function') {
      ytPlayer.stopVideo();
    }
  } catch {
    // Ignore
  }
}

/**
 * Fallback crisp digital spotlight tick if YouTube audio is still loading or offline.
 */
export function playScanTick(step = 1, totalSteps = 16) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const progress = Math.min(1, Math.max(0, step / totalSteps));
    const baseFreq = 420 + progress * 460;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.18, now + 0.065);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Ignore
  }
}

/**
 * Plays a high-tech target lock-on double-chime when the spotlights lock onto the winners.
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
      gain.gain.linearRampToValueAtTime(0.2, now + offset + 0.015);
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
 * Plays an exciting celebratory fanfare arpeggio + sustained major chord
 * when all selected players are simultaneously revealed on stage.
 */
export function playWinnerRevealFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const arpeggio = [
      { freq: 523.25, start: 0.0, duration: 0.22, type: 'triangle', vol: 0.22 }, // C5
      { freq: 659.25, start: 0.09, duration: 0.22, type: 'triangle', vol: 0.22 }, // E5
      { freq: 783.99, start: 0.18, duration: 0.25, type: 'triangle', vol: 0.24 }, // G5
      { freq: 1046.5, start: 0.28, duration: 0.85, type: 'triangle', vol: 0.28 }, // C6
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

      const peakVol = idx === 0 ? 0.14 : 0.09;
      gain.gain.setValueAtTime(0.001, now + 0.28);
      gain.gain.linearRampToValueAtTime(peakVol, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.28);
      osc.stop(now + 1.5);
    });
  } catch {
    // Ignore
  }
}
