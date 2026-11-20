let audioCtx: AudioContext | null = null;
let lastPlayedAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playNotes(notes: Array<{ freq: number; delay: number; duration: number; gain: number }>) {
  if (typeof window === "undefined") return;
  const nowMs = Date.now();
  if (nowMs - lastPlayedAt < 500) return;
  lastPlayedAt = nowMs;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const base = ctx.currentTime + 0.01;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(n.freq, base + n.delay);

      amp.gain.setValueAtTime(0.0001, base + n.delay);
      amp.gain.exponentialRampToValueAtTime(n.gain, base + n.delay + 0.015);
      amp.gain.exponentialRampToValueAtTime(0.0001, base + n.delay + n.duration);

      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(base + n.delay);
      osc.stop(base + n.delay + n.duration + 0.02);
    }
  } catch {
    // Ignore autoplay restriction errors before first user gesture
  }
}

/** Gentle two-note bell chime for dashboard notifications. */
export function playNotificationSound() {
  playNotes([
    { freq: 880, delay: 0, duration: 0.16, gain: 0.06 },
    { freq: 1174.66, delay: 0.09, duration: 0.24, gain: 0.055 },
  ]);
}

/** Soft warm chime for incoming live chat messages. */
export function playChatSound() {
  playNotes([
    { freq: 659.25, delay: 0, duration: 0.12, gain: 0.055 },
    { freq: 987.77, delay: 0.08, duration: 0.18, gain: 0.05 },
  ]);
}
