import { afterEach, describe, expect, it, vi } from "vitest";
import {
  availableVoices,
  canListen,
  canSpeak,
  hasVoiceFor,
  listen,
  listenErrorMessage,
  pickVoice,
  recognitionStatus,
  speak,
  stopSpeaking,
} from "../src/lib/speech";

class Utterance {
  text: string;
  lang = "";
  rate = 1;
  pitch = 1;
  voice: SpeechSynthesisVoice | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

class FakeRecognition {
  lang = "";
  interimResults = false;
  continuous = false;
  maxAlternatives = 0;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

function fakeVoice(lang: string, name: string): SpeechSynthesisVoice {
  return { lang, name, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice;
}

interface WindowOptions {
  voices?: SpeechSynthesisVoice[];
  secure?: boolean;
  recognition?: unknown;
}

function installWindow(options: WindowOptions): {
  speak: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
} {
  const speakFn = vi.fn();
  const cancelFn = vi.fn();
  const win: Record<string, unknown> = {
    speechSynthesis: {
      getVoices: () => options.voices ?? [],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      speak: speakFn,
      cancel: cancelFn,
    },
    isSecureContext: options.secure ?? true,
    setTimeout: (callback: () => void) => globalThis.setTimeout(callback, 0),
    clearTimeout: (id: number) => globalThis.clearTimeout(id),
  };
  if (options.recognition) win.SpeechRecognition = options.recognition;
  vi.stubGlobal("window", win);
  return { speak: speakFn, cancel: cancelFn };
}

describe("speech without a browser window", () => {
  it("reports speech and recognition as unsupported", () => {
    expect(canSpeak()).toBe(false);
    expect(canListen()).toBe(false);
    expect(recognitionStatus()).toEqual({ ok: false, reason: "" });
    expect(availableVoices()).toEqual([]);
    expect(pickVoice("de-DE")).toBeNull();
    expect(hasVoiceFor("en-US")).toBe(false);
  });

  it("does not speak or listen", () => {
    expect(speak("hallo")).toBe(false);
    expect(stopSpeaking()).toBeUndefined();
    expect(listen("de-DE", { onText: () => undefined })).toBeNull();
  });
});

describe("listenErrorMessage", () => {
  it("maps recognised error codes", () => {
    expect(listenErrorMessage("not-allowed")).toContain("Mikrofon");
    expect(listenErrorMessage("service-not-allowed")).toContain("Mikrofon");
    expect(listenErrorMessage("no-speech")).toContain("nichts gehört");
    expect(listenErrorMessage("network")).toContain("Internetverbindung");
    expect(listenErrorMessage("audio-capture")).toContain("Mikrofon");
    expect(listenErrorMessage("language-not-supported")).toContain("Sprache");
    expect(listenErrorMessage("aborted")).toBe("");
    expect(listenErrorMessage("weird")).toContain("noch einmal");
  });
});

describe("speech with a stubbed window", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("waits for voices before speaking when none are ready yet", async () => {
    const { speak: speakFn } = installWindow({ voices: [] });
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);

    expect(speak("hallo", "de-DE")).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(speakFn).toHaveBeenCalledTimes(1);
  });

  it("detects support and picks a matching voice", () => {
    installWindow({ voices: [fakeVoice("en-US", "English (US)"), fakeVoice("de-DE", "German")] });

    expect(canSpeak()).toBe(true);
    expect(availableVoices()).toHaveLength(2);
    expect(pickVoice("de-DE")?.lang).toBe("de-DE");
    expect(pickVoice("en-US")?.lang).toBe("en-US");
    expect(hasVoiceFor("de-DE")).toBe(true);
  });

  it("falls back to the language prefix", () => {
    installWindow({ voices: [fakeVoice("en-GB", "English (United Kingdom)")] });

    expect(pickVoice("en-US")?.lang).toBe("en-GB");
  });

  it("falls back to a named voice and finally to null", () => {
    installWindow({ voices: [fakeVoice("xx-XX", "Deutsch Stimme")] });
    expect(pickVoice("de-DE")?.name).toBe("Deutsch Stimme");

    installWindow({ voices: [fakeVoice("fr-FR", "French")] });
    expect(pickVoice("de-DE")).toBeNull();
  });

  it("speaks through the synthesis API", async () => {
    const { speak: speakFn } = installWindow({ voices: [fakeVoice("de-DE", "German")] });
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);

    expect(speak("hallo", "de-DE")).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(speakFn).toHaveBeenCalledTimes(1);
    const utterance = speakFn.mock.calls[0][0] as Utterance;
    expect(utterance.text).toBe("hallo");
    expect(utterance.lang).toBe("de-DE");
  });

  it("cancels before speaking and on stop", () => {
    const { cancel } = installWindow({ voices: [fakeVoice("de-DE", "German")] });
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);

    speak("hallo");
    expect(cancel).toHaveBeenCalledTimes(1);

    stopSpeaking();
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it("describes the recognition status", () => {
    installWindow({ voices: [], recognition: FakeRecognition, secure: true });
    expect(recognitionStatus()).toEqual({ ok: true, reason: "" });

    installWindow({ voices: [], recognition: FakeRecognition, secure: false });
    expect(recognitionStatus().ok).toBe(false);
    expect(recognitionStatus().reason).toContain("HTTPS");

    installWindow({ voices: [], secure: true });
    expect(recognitionStatus().ok).toBe(false);
    expect(recognitionStatus().reason).toContain("Chrome");
  });

  it("returns null when recognition is unsupported", () => {
    installWindow({ voices: [] });
    expect(listen("de-DE", { onText: () => undefined })).toBeNull();
  });

  it("streams interim and final results and stops cleanly", () => {
    let instance: FakeRecognition | undefined;
    class Ctor extends FakeRecognition {
      constructor() {
        super();
        instance = this;
      }
    }
    installWindow({ voices: [], recognition: Ctor });

    const onText = vi.fn();
    const onEnd = vi.fn();
    const onError = vi.fn();
    const handle = listen("de-DE", { onText, onEnd, onError });

    expect(handle).not.toBeNull();
    expect(instance?.start).toHaveBeenCalled();

    instance?.onresult?.({ results: { length: 1, 0: { 0: { transcript: "hel" }, isFinal: false } } });
    expect(onText).toHaveBeenLastCalledWith("hel", false);

    instance?.onresult?.({ results: { length: 1, 0: { 0: { transcript: "hello" }, isFinal: true } } });
    expect(onText).toHaveBeenLastCalledWith("hello", true);

    instance?.onerror?.({ error: "no-speech" });
    expect(onError).toHaveBeenCalledWith("no-speech");
    expect(onEnd).toHaveBeenCalledTimes(1);

    handle?.stop();
    expect(instance?.stop).toHaveBeenCalled();
  });

  it("returns null when starting recognition throws", () => {
    class Ctor extends FakeRecognition {
      constructor() {
        super();
        this.start = vi.fn(() => {
          throw new Error("nope");
        });
      }
    }
    installWindow({ voices: [], recognition: Ctor });

    const onError = vi.fn();
    const handle = listen("de-DE", { onText: () => undefined, onError });

    expect(handle).toBeNull();
    expect(onError).toHaveBeenCalledWith("started-failed");
  });

  it("returns null when the recognition constructor throws", () => {
    class Ctor {
      constructor() {
        throw new Error("no mic");
      }
    }
    installWindow({ voices: [], recognition: Ctor });

    expect(listen("de-DE", { onText: () => undefined })).toBeNull();
  });
});
