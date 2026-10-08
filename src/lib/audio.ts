type Wave = OscillatorType;

let context: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === "suspended") void context.resume();
  return context;
}

function note(frequency: number, at: number, duration: number, wave: Wave = "triangle", volume = 0.16): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime + at;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

export function playCorrect(): void {
  note(523.25, 0, 0.16);
  note(659.25, 0.1, 0.16);
  note(783.99, 0.2, 0.16);
  note(1046.5, 0.3, 0.34);
}

export function playWrong(): void {
  note(233.08, 0, 0.2, "sawtooth", 0.12);
  note(174.61, 0.18, 0.34, "sawtooth", 0.12);
}

export function playClick(): void {
  note(880, 0, 0.07, "square", 0.08);
}

export function playFanfare(): void {
  note(523.25, 0, 0.18);
  note(659.25, 0.14, 0.18);
  note(783.99, 0.28, 0.18);
  note(1046.5, 0.42, 0.2);
  note(783.99, 0.62, 0.18);
  note(1046.5, 0.76, 0.5);
}

export function playFanfareSad(): void {
  note(392, 0, 0.24, "triangle");
  note(349.23, 0.22, 0.24, "triangle");
  note(293.66, 0.44, 0.5, "triangle");
}
