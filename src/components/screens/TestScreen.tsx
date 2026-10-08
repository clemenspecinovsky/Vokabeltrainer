"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import ComicButton from "@/components/ComicButton";
import Confetti from "@/components/Confetti";
import MangaFace from "@/components/MangaFace";
import Progress from "@/components/Progress";
import TopBar from "@/components/TopBar";
import VoiceHint from "@/components/VoiceHint";
import { isCorrect } from "@/lib/answers";
import { playClick, playCorrect, playFanfare, playFanfareSad, playWrong } from "@/lib/audio";
import { numbersToWords } from "@/lib/numbers";
import { randomInt, shuffle } from "@/lib/shuffle";
import {
  canSpeak,
  listen,
  listenErrorMessage,
  recognitionStatus,
  speak,
  stopSpeaking,
  type ListenHandle,
  type SpeechLang,
} from "@/lib/speech";
import type { Direction, SingleDirection, VocabEntry } from "@/lib/types";

interface Question {
  entry: VocabEntry;
  dir: SingleDirection;
  reask: boolean;
}

interface Feedback {
  ok: boolean;
  source: string;
  expected: string;
  given: string;
}

type Phase = "settings" | "running" | "done";

const DIRECTIONS: { value: Direction; emoji: string; label: string; hint: string }[] = [
  { value: "de2en", emoji: "🇩🇪 → 🇬🇧", label: "Deutsch → Englisch", hint: "Deutsche Wörter übersetzen" },
  { value: "en2de", emoji: "🇬🇧 → 🇩🇪", label: "Englisch → Deutsch", hint: "Englische Wörter übersetzen" },
  { value: "mixed", emoji: "🔀", label: "Beide Richtungen", hint: "Gemischt – Überraschung!" },
];

const COUNTS: { value: number; label: string }[] = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 0, label: "ALLE" },
];

function pickDirection(direction: Direction): SingleDirection {
  if (direction === "mixed") return Math.random() < 0.5 ? "de2en" : "en2de";
  return direction;
}

function sourceText(question: Question): string {
  return question.dir === "de2en" ? question.entry.de : question.entry.en;
}

function targetText(question: Question): string {
  return question.dir === "de2en" ? question.entry.en : question.entry.de;
}

function sourceLang(question: Question): SpeechLang {
  return question.dir === "de2en" ? "de-DE" : "en-US";
}

function targetLang(question: Question): SpeechLang {
  return question.dir === "de2en" ? "en-US" : "de-DE";
}

interface TestScreenProps {
  name: string;
  words: VocabEntry[];
}

export default function TestScreen({ name, words }: TestScreenProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("settings");
  const [settings, setSettings] = useState({
    direction: "de2en" as Direction,
    count: 20,
    speakWord: true,
  });

  const [queue, setQueue] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [mastered, setMastered] = useState<string[]>([]);
  const [retried, setRetried] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState("");
  const [heard, setHeard] = useState<string | null>(null);
  const [celebrateKey, setCelebrateKey] = useState(0);

  const totalRef = useRef(0);
  const pendingRef = useRef<{ mastered: string[]; queue: Question[] } | null>(null);
  const advancedRef = useRef(false);
  const lockedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const speechTimerRef = useRef<number | null>(null);
  const listenRef = useRef<ListenHandle | null>(null);
  const manualStopRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (speechTimerRef.current !== null) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    listenRef.current?.stop();
    listenRef.current = null;
    setListening(false);
  }, []);

  useEffect(
    () => () => {
      clearTimer();
      listenRef.current?.stop();
      stopSpeaking();
    },
    [clearTimer],
  );

  const startTest = useCallback(
    (nextSettings = settings) => {
      clearTimer();
      stopListening();
      stopSpeaking();

      const pool = shuffle(words);
      const selected = nextSettings.count > 0 ? pool.slice(0, nextSettings.count) : pool;
      if (selected.length === 0) return;

      const questions: Question[] = selected.map((entry) => ({
        entry,
        dir: pickDirection(nextSettings.direction),
        reask: false,
      }));

      totalRef.current = questions.length;
      pendingRef.current = null;
      advancedRef.current = false;
      lockedRef.current = false;

      setTotal(questions.length);
      setQueue(questions.slice(1));
      setCurrent(questions[0]);
      setMastered([]);
      setRetried([]);
      setCorrect(0);
      setWrong(0);
      setAnswer("");
      setFeedback(null);
      setVoiceHint("");
      setHeard(null);
      setPhase("running");
      setCelebrateKey((value) => value + 1);
    },
    [settings, words, clearTimer, stopListening],
  );

  const advance = useCallback(() => {
    if (advancedRef.current) return;
    const pending = pendingRef.current;
    if (!pending) {
      setPhase("done");
      return;
    }
    advancedRef.current = true;
    clearTimer();
    stopSpeaking();
    stopListening();

    if (pending.mastered.length >= totalRef.current || pending.queue.length === 0) {
      setPhase("done");
      setCurrent(null);
      setQueue([]);
      setFeedback(null);
      setAnswer("");
      return;
    }

    const [next, ...rest] = pending.queue;
    lockedRef.current = false;
    setQueue(rest);
    setCurrent(next);
    setAnswer("");
    setHeard(null);
    setFeedback(null);
  }, [clearTimer, stopListening, stopSpeaking]);

  const scheduleReask = useCallback(
    (existing: Question[], question: Question): Question[] => {
      const again: Question = {
        entry: question.entry,
        dir: pickDirection(settings.direction),
        reask: true,
      };
      const copy = [...existing];
      const insertAt = copy.length === 0 ? 0 : randomInt(1, Math.min(4, copy.length));
      copy.splice(insertAt, 0, again);
      return copy;
    },
    [settings.direction],
  );

  const submit = useCallback(
    (raw: string) => {
      if (!current || feedback || lockedRef.current) return;
      const given = raw.trim();
      if (!given) return;

      lockedRef.current = true;
      stopListening();

      const expected = targetText(current);
      const ok = isCorrect(given, expected, targetLang(current));

      let nextMastered = mastered;
      let nextQueue = queue;
      let nextRetried = retried;

      if (ok) {
        if (!mastered.includes(current.entry.id)) nextMastered = [...mastered, current.entry.id];
        setCorrect((value) => value + 1);
        playCorrect();
        setCelebrateKey((value) => value + 1);
      } else {
        setWrong((value) => value + 1);
        playWrong();
        nextQueue = scheduleReask(queue, current);
        if (!retried.includes(current.entry.id)) nextRetried = [...retried, current.entry.id];
        const spoken = expected;
        const lang = targetLang(current);
        if (speechTimerRef.current !== null) window.clearTimeout(speechTimerRef.current);
        speechTimerRef.current = window.setTimeout(() => speak(spoken, lang), 650);
      }

      setMastered(nextMastered);
      setQueue(nextQueue);
      setRetried(nextRetried);
      setFeedback({
        ok,
        source: sourceText(current),
        expected,
        given,
      });

      pendingRef.current = { mastered: nextMastered, queue: nextQueue };
      advancedRef.current = false;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = window.setTimeout(advance, ok ? 1900 : 4600);
    },
    [current, feedback, mastered, queue, retried, scheduleReask, advance, clearTimer, stopListening],
  );

  const toggleListening = useCallback(() => {
    if (listening) {
      manualStopRef.current = true;
      stopListening();
      return;
    }
    if (!current) return;

    const status = recognitionStatus();
    if (!status.ok) {
      setVoiceHint(status.reason);
      return;
    }

    const lang = targetLang(current);
    let gotText = false;
    let failed = false;

    const startRecognition = (attempt: number): ListenHandle | null => {
      let endedSync = false;

      const handle = listen(lang, {
        onText: (text, isFinal) => {
          gotText = true;
          setVoiceHint("");
          setAnswer(numbersToWords(text, lang));
          if (isFinal) {
            setHeard(text);
            inputRef.current?.focus();
          }
        },
        onEnd: () => {
          endedSync = true;
          listenRef.current = null;

          if (manualStopRef.current) {
            setListening(false);
            return;
          }

          if (!gotText && !failed && attempt < 1) {
            startRecognition(attempt + 1);
            return;
          }

          setListening(false);
          if (!gotText && !failed) setVoiceHint("Ich habe nichts verstanden – bitte noch einmal drücken.");
        },
        onError: (code) => {
          failed = true;
          const message = listenErrorMessage(code);
          if (message) setVoiceHint(`${message} (Code: ${code})`);
        },
      });

      if (!handle) return null;
      if (endedSync) return handle;

      listenRef.current = handle;
      manualStopRef.current = false;
      setListening(true);
      setVoiceHint("");
      return handle;
    };

    setHeard(null);
    if (!startRecognition(0)) {
      setVoiceHint("Spracherkennung ist hier nicht verfügbar – bitte tippen.");
    }
  }, [current, listening, stopListening]);

  useEffect(() => {
    if (phase !== "running" || !current || feedback || !settings.speakWord) return;
    const timer = window.setTimeout(() => speak(sourceText(current), sourceLang(current)), 400);
    return () => window.clearTimeout(timer);
  }, [phase, current, feedback, settings.speakWord]);

  useEffect(() => {
    if (phase === "running" && !feedback) inputRef.current?.focus();
  }, [phase, current, feedback]);

  useEffect(() => {
    if (phase !== "done") return;
    stopSpeaking();
    const score = correct + wrong;
    if (score > 0 && correct / score >= 0.7) playFanfare();
    else playFanfareSad();
    setCelebrateKey((value) => value + 1);
  }, [phase]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(answer);
  }

  if (words.length === 0) {
    return (
      <main className="page">
        <div className="container">
          <TopBar />
          <div className="panel">
            <p className="subtitle">Es gibt noch keine Vokabeln im Ordner data.</p>
          </div>
        </div>
      </main>
    );
  }

  const directionInfo = DIRECTIONS.find((item) => item.value === settings.direction) ?? DIRECTIONS[0];
  const pendingReasks = queue.filter((question) => question.reask).length;
  const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const doneFace = accuracy >= 70 ? "happy" : "sad";

  if (phase === "settings") {
    return (
      <main className="page">
        <div className="container" style={{ maxWidth: 860 }}>
          <TopBar showMenu={false}>
            <span className="chip chip--info">👤 {name}</span>
          </TopBar>

          <h1 className="display title ink-outline" style={{ fontSize: "clamp(2.4rem, 9vw, 4.6rem)" }}>
            TEST-SETUP
          </h1>

          <section className="panel panel--dots pop-in">
            <div className="stack">
              <h2 className="subtitle">1. In welche Richtung?</h2>
              <div className="row" style={{ width: "100%" }}>
                {DIRECTIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className="option"
                    aria-pressed={settings.direction === item.value}
                    onClick={() => {
                      playClick();
                      setSettings((value) => ({ ...value, direction: item.value }));
                    }}
                  >
                    <span className="option__emoji">{item.emoji}</span>
                    <span>{item.label}</span>
                    <span className="option__hint">{item.hint}</span>
                  </button>
                ))}
              </div>

              <h2 className="subtitle">2. Wie viele Wörter?</h2>
              <div className="row">
                {COUNTS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className="option"
                    style={{ flex: "0 1 150px" }}
                    aria-pressed={settings.count === item.value}
                    onClick={() => {
                      playClick();
                      setSettings((value) => ({ ...value, count: item.value }));
                    }}
                  >
                    <span className="option__emoji">{item.label}</span>
                    <span className="option__hint">
                      {item.value === 0 ? `${words.length} Wörter` : "Wörter"}
                    </span>
                  </button>
                ))}
              </div>

              <h2 className="subtitle">3. Soll das Wort vorgelesen werden?</h2>
              <div className="row">
                <button
                  type="button"
                  className="option"
                  style={{ flex: "0 1 220px" }}
                  aria-pressed={settings.speakWord}
                  onClick={() => {
                    playClick();
                    setSettings((value) => ({ ...value, speakWord: !value.speakWord }));
                  }}
                >
                  <span className="option__emoji">{settings.speakWord ? "🔊" : "🔇"}</span>
                  <span>{settings.speakWord ? "Ja, vorlesen" : "Nein, nur lesen"}</span>
                </button>
              </div>

              <ComicButton
                tone="green"
                size="lg"
                block
                disabled={words.length === 0}
                onClick={() => startTest()}
              >
                TEST STARTEN ▶
              </ComicButton>
              <p className="hint">
                Richtung: {directionInfo.label} · {settings.count === 0 ? words.length : settings.count} Wörter
                {recognitionStatus().ok ? " · 🎤 Antwort auch sprechen möglich" : " · 🎤 nicht verfügbar"}
              </p>
              <VoiceHint />
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (phase === "done") {
    const retriedEntries = words.filter((entry) => retried.includes(entry.id));
    return (
      <main className="page">
        <div className="container" style={{ maxWidth: 820 }}>
          <Confetti key={`done-${celebrateKey}`} count={40} />

          <TopBar>
            <span className="chip chip--info">👤 {name}</span>
          </TopBar>

          <h1 className="display title ink-outline" style={{ fontSize: "clamp(2.6rem, 10vw, 5rem)" }}>
            {accuracy >= 70 ? "SUPER!" : "FAST!"}
          </h1>

          <section className="panel pop-in" style={{ textAlign: "center" }}>
            <div className="stack">
              <MangaFace mood={doneFace} />
              <div className="row">
                <span className="chip chip--correct">✅ {correct} richtig</span>
                <span className="chip chip--wrong">❌ {wrong} falsch</span>
                <span className="chip">🎯 {accuracy} %</span>
              </div>
              <p className="subtitle">
                {accuracy >= 70
                  ? "Die Vokabeln sitzen. Klasse!"
                  : "Übung macht den Meister – nochmal versuchen?"}
              </p>

              {retriedEntries.length > 0 ? (
                <div className="stack" style={{ gap: "0.6rem" }}>
                  <p className="hint">Diese Wörter mussten noch einmal vorkommen:</p>
                  <ul className="word-cloud list-reset">
                    {retriedEntries.map((entry) => (
                      <li key={entry.id} className="word-cloud__item word-cloud__item--wrong">
                        {entry.de} = {entry.en}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="hint">Kein einziges Wort musste wiederholt werden. Perfekt!</p>
              )}
            </div>
          </section>

          <nav className="row" style={{ width: "100%" }}>
            <ComicButton tone="green" size="lg" onClick={() => startTest()}>
              NOCHMAL ▶
            </ComicButton>
            <ComicButton tone="cyan" size="lg" onClick={() => setPhase("settings")}>
              SETUP
            </ComicButton>
            <ComicButton tone="purple" size="lg" onClick={() => router.push("/menu")}>
              MENÜ
            </ComicButton>
          </nav>
        </div>
      </main>
    );
  }

  const question = current;

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 860 }}>
        <TopBar>
          <span className="chip chip--info">👤 {name}</span>
          <span className="chip chip--correct">✅ {correct}</span>
          <span className="chip chip--wrong">❌ {wrong}</span>
        </TopBar>

        <Progress
          value={mastered.length}
          max={total}
          label={`${mastered.length} von ${total} gemeistert`}
        />

        {pendingReasks > 0 ? (
          <span className="chip">🔁 {pendingReasks} Wörter kommen noch einmal</span>
        ) : null}

        {question ? (
          <section key={question.entry.id} className="panel card-enter">
            <div className="stack">
              <div className="row">
                <span className="chip chip--info">
                  {question.dir === "de2en" ? "🇩🇪 DEUTSCH → 🇬🇧 ENGLISCH" : "🇬🇧 ENGLISCH → 🇩🇪 DEUTSCH"}
                </span>
                {question.reask ? <span className="chip chip--wrong">🔁 NOCHMAL</span> : null}
              </div>

              <p className="word">{sourceText(question)}</p>

              <ComicButton
                tone="cyan"
                size="md"
                icon="🔊"
                disabled={!canSpeak()}
                onClick={() => speak(sourceText(question), sourceLang(question))}
              >
                VORLESEN
              </ComicButton>

              <form onSubmit={onSubmit} className="stack" style={{ width: "100%" }}>
                <label className="field">
                  <span className="field__label">
                    Wie sagt man das auf {question.dir === "de2en" ? "Englisch" : "Deutsch"}?
                  </span>
                  <input
                    ref={inputRef}
                    className="input"
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      setHeard(null);
                    }}
                    placeholder={question.dir === "de2en" ? "type in English ..." : "Schreib auf Deutsch ..."}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="off"
                    disabled={Boolean(feedback)}
                  />
                </label>

                <div className="row" style={{ width: "100%" }}>
                  <ComicButton
                    type="submit"
                    tone="green"
                    size="lg"
                    disabled={Boolean(feedback) || answer.trim().length === 0}
                  >
                    PRÜFEN ✓
                  </ComicButton>
                  <ComicButton
                    tone={listening ? "red" : "purple"}
                    size="lg"
                    icon="🎤"
                    className={listening ? "mic mic--listening" : "mic"}
                    onClick={toggleListening}
                    disabled={Boolean(feedback)}
                  >
                    {listening ? "HÖRT ZU ..." : "SPRECHEN"}
                  </ComicButton>
                </div>
              </form>

              {listening ? (
                <p className="hint hint--live" role="status">
                  🎤 Hört zu … jetzt bitte sprechen.
                </p>
              ) : null}
              {heard ? (
                <span className="chip chip--correct" role="status">
                  🎤 Verstanden: {heard}
                </span>
              ) : null}
              {voiceHint ? <p className="hint">{voiceHint}</p> : null}
              {!canSpeak() ? <p className="hint">Vorlesen wird von diesem Browser nicht unterstützt.</p> : null}
            </div>
          </section>
        ) : null}

        <p className="hint">Enter prüft · falsche Wörter kommen nach einer zufälligen Pause wieder.</p>
        <VoiceHint />
      </div>

      {feedback ? (
        <div className="feedback">
          {feedback.ok ? <Confetti key={`c-${celebrateKey}`} count={26} /> : null}
          <div
            className={`feedback__card ${feedback.ok ? "feedback__card--ok" : "feedback__card--no"}`}
            role="status"
            aria-live="assertive"
          >
            <MangaFace mood={feedback.ok ? "happy" : "sad"} />
            <h2 className={`display feedback__title ${feedback.ok ? "ink-outline ink-outline--green" : "ink-outline ink-outline--red"}`}>
              {feedback.ok ? "RICHTIG!" : "FALSCH!"}
            </h2>
            <p className="feedback__answer">
              {feedback.ok ? (
                <>
                  {feedback.source} = <strong>{feedback.expected}</strong>
                </>
              ) : (
                <>
                  Richtig wäre: <strong>{feedback.expected}</strong>
                </>
              )}
            </p>
            {!feedback.ok ? (
              <div className="row" style={{ marginBottom: "0.9rem" }}>
                <span className="chip word-cloud__item--wrong">Deine Antwort: {feedback.given}</span>
              </div>
            ) : null}
            <div className="row">
              {!feedback.ok ? (
                <ComicButton
                  tone="white"
                  size="md"
                  icon="🔊"
                  disabled={!canSpeak()}
                  onClick={() => speak(feedback.expected, question ? targetLang(question) : "de-DE")}
                >
                  VORLESEN
                </ComicButton>
              ) : null}
              <ComicButton tone={feedback.ok ? "green" : "red"} size="lg" onClick={advance}>
                WEITER ▶
              </ComicButton>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
