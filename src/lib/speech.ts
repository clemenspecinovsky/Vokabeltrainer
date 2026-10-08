export type SpeechLang = "de-DE" | "en-US";

let cachedVoices: SpeechSynthesisVoice[] = [];
let listenerAttached = false;
let speakToken = 0;

function attachListener(): void {
  if (listenerAttached || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  listenerAttached = true;
  const refresh = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) cachedVoices = voices;
  };
  window.speechSynthesis.addEventListener("voiceschanged", refresh);
  refresh();
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function canListen(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function recognitionStatus(): { ok: boolean; reason: string } {
  if (typeof window === "undefined") return { ok: false, reason: "" };
  if (!canListen()) {
    return {
      ok: false,
      reason: "Dein Browser kann kein Sprechen – bitte Chrome oder Edge verwenden.",
    };
  }
  if (!window.isSecureContext) {
    return {
      ok: false,
      reason: "Spracherkennung braucht https://localhost oder eine HTTPS-Verbindung.",
    };
  }
  return { ok: true, reason: "" };
}

export function listenErrorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Der Mikrofon-Zugriff ist blockiert. Erlaube das Mikrofon für diese Seite (Schloss in der Adressleiste).";
    case "no-speech":
      return "Ich habe nichts gehört – sprich bitte noch einmal.";
    case "network":
      return "Für die Spracherkennung wird eine Internetverbindung benötigt.";
    case "audio-capture":
      return "Ich finde kein Mikrofon.";
    case "language-not-supported":
      return "Diese Sprache wird nicht unterstützt.";
    case "aborted":
      return "";
    default:
      return "Das hat nicht funktioniert – bitte noch einmal sprechen.";
  }
}

export function availableVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  attachListener();
  const live = window.speechSynthesis.getVoices();
  if (live.length > 0) {
    cachedVoices = live;
    return live;
  }
  return cachedVoices;
}

function normalizedLang(value: string): string {
  return value.replace("_", "-").toLowerCase();
}

function speaksLang(voice: SpeechSynthesisVoice, lang: SpeechLang): boolean {
  return normalizedLang(voice.lang).startsWith(lang.slice(0, 2).toLowerCase());
}

export function pickVoice(lang: SpeechLang): SpeechSynthesisVoice | null {
  const voices = availableVoices();
  if (voices.length === 0) return null;
  const target = normalizedLang(lang);
  const byName = lang.startsWith("de") ? /german|deutsch/i : /english|englisch|us english|united states/i;
  return (
    voices.find((voice) => normalizedLang(voice.lang) === target) ??
    voices.find((voice) => speaksLang(voice, lang)) ??
    voices.find((voice) => byName.test(voice.name)) ??
    null
  );
}

export function hasVoiceFor(lang: SpeechLang): boolean {
  return pickVoice(lang) !== null;
}

function waitForVoices(timeout = 900): Promise<void> {
  return new Promise((resolve) => {
    if (availableVoices().length > 0) {
      resolve();
      return;
    }
    const synth = window.speechSynthesis;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      synth.removeEventListener("voiceschanged", finish);
      window.clearTimeout(timer);
      resolve();
    };
    synth.addEventListener("voiceschanged", finish);
    const timer = window.setTimeout(finish, timeout);
  });
}

export function stopSpeaking(): void {
  speakToken += 1;
  if (canSpeak()) window.speechSynthesis.cancel();
}

export function speak(text: string, lang: SpeechLang = "de-DE", rate = 0.9, pitch = 1.1): boolean {
  if (!canSpeak() || !text) return false;

  stopSpeaking();
  const token = speakToken;

  const run = () => {
    if (token !== speakToken) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      const voice = pickVoice(lang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      window.setTimeout(() => {
        if (token !== speakToken) return;
        window.speechSynthesis.speak(utterance);
      }, 30);
    } catch {
      return;
    }
  };

  if (availableVoices().length > 0) run();
  else void waitForVoices().then(run);

  return true;
}

export interface ListenHandle {
  stop: () => void;
}

export interface ListenOptions {
  onText: (text: string, isFinal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (code: string) => void;
}

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

type ResultLike = {
  isFinal?: boolean;
  length?: number;
} & Record<number, { transcript?: string } | undefined>;

export function listen(lang: SpeechLang, options: ListenOptions): ListenHandle | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;

  let instance: RecognitionLike;
  try {
    instance = new Ctor();
  } catch {
    return null;
  }

  instance.lang = lang;
  instance.interimResults = true;
  instance.continuous = false;
  instance.maxAlternatives = 5;

  let finished = false;
  const finish = (code?: string) => {
    if (finished) return;
    finished = true;
    if (code) options.onError?.(code);
    options.onEnd?.();
  };

  instance.onresult = (event: unknown) => {
    const list = (event as { results?: Record<number, ResultLike | undefined> & { length?: number; resultIndex?: number } })?.results;
    if (!list) return;
    const count = list.length ?? 0;
    const start = typeof list.resultIndex === "number" && list.resultIndex > 0 ? list.resultIndex : 0;
    let finalText = "";
    let interimText = "";
    let isFinal = false;
    for (let i = start; i < count; i += 1) {
      const result = list[i];
      if (!result) continue;
      const transcript = String(result[0]?.transcript ?? "");
      if (result.isFinal) {
        finalText += transcript;
        isFinal = true;
      } else {
        interimText += transcript;
      }
    }
    const text = (finalText || interimText).trim();
    if (text) options.onText(text, isFinal);
  };
  instance.onerror = (event: unknown) => finish((event as { error?: string })?.error ?? "unknown");
  instance.onend = () => finish();

  try {
    instance.start();
    options.onStart?.();
  } catch {
    finish("started-failed");
    return null;
  }

  return {
    stop: () => {
      try {
        instance.stop();
      } catch {
        finish("stopped");
      }
    },
  };
}
