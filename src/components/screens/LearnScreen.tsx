"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ComicButton from "@/components/ComicButton";
import Progress from "@/components/Progress";
import TopBar from "@/components/TopBar";
import VoiceHint from "@/components/VoiceHint";
import { playClick } from "@/lib/audio";
import { WordProgress } from "@/lib/progress";
import { canSpeak, speak } from "@/lib/speech";
import type { StoredProgress, VocabEntry } from "@/lib/types";

interface LearnScreenProps {
  name: string;
  words: VocabEntry[];
  progress?: StoredProgress | null;
  avatarId?: string | null;
  avatarImage?: string | null;
  avatarMode?: string | null;
}

export default function LearnScreen({
  name,
  words,
  progress,
  avatarId = null,
  avatarImage = null,
  avatarMode = null,
}: LearnScreenProps) {
  const router = useRouter();
  const topbarAvatar = {
    avatarPreset: avatarId,
    avatarImage,
    avatarMode,
  };
  const model = useMemo(() => new WordProgress(words.map((word) => word.id), progress), [words, progress]);
  const startIndex = useMemo(() => {
    const id = model.firstUnknownId();
    if (!id) return 0;
    const found = words.findIndex((entry) => entry.id === id);
    return found < 0 ? 0 : found;
  }, [model, words]);
  const [index, setIndex] = useState(startIndex);
  const [confirming, setConfirming] = useState(false);
  const loggedRef = useRef(false);

  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;
    void fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "learn" }),
    }).catch(() => {});
  }, []);

  const total = words.length;
  const word = words[index];
  const status = word ? model.status(word.id) : null;

  const goNext = useCallback(() => {
    playClick();
    setIndex((value) => Math.min(total - 1, value + 1));
  }, [total]);

  const goPrev = useCallback(() => {
    playClick();
    setIndex((value) => Math.max(0, value - 1));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (confirming) {
        if (event.key === "Escape") setConfirming(false);
        return;
      }
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "Escape") setConfirming(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, confirming]);

  if (!word) {
    return (
      <main className="page">
        <div className="container">
          <TopBar {...topbarAvatar} />
          <div className="panel">
            <p className="subtitle">Es gibt noch keine Vokabeln.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <TopBar {...topbarAvatar}>
          <span className="chip chip--info">👤 {name}</span>
          <span className="chip">Wort {index + 1} / {total}</span>
        </TopBar>

        <Progress
          value={index + 1}
          max={total}
          label={`${Math.round(((index + 1) / total) * 100)} %`}
          ariaLabel="Wortfortschritt"
          onSeek={(value) => setIndex(value - 1)}
        />

        <section key={index} className="panel card-enter" aria-live="polite">
          <div className="stack">
            <span className="chip chip--info">🇩🇪 DEUTSCH</span>

            {status ? (
              <div className="row" aria-label="Lernstand dieser Vokabel">
                <span className={status.de2en ? "chip chip--correct" : "chip"}>
                  DE→EN {status.de2en ? "✓ bekannt" : "○ offen"}
                </span>
                <span className={status.en2de ? "chip chip--correct" : "chip"}>
                  EN→DE {status.en2de ? "✓ bekannt" : "○ offen"}
                </span>
                {!status.de2en && !status.en2de ? (
                  <span className="chip chip--info">noch nicht getestet</span>
                ) : null}
              </div>
            ) : null}

            <p className="word">{word.de}</p>
            <ComicButton
              tone="cyan"
              size="sm"
              icon="🔊"
              disabled={!canSpeak()}
              onClick={() => speak(word.de, "de-DE")}
            >
              VORLESEN
            </ComicButton>

            <div className="bubble bubble--yellow" style={{ width: "100%" }}>
              <p className="hint" style={{ marginBottom: "0.35rem" }}>
                bedeutet auf Englisch:
              </p>
              <p className="word word--answer" style={{ textAlign: "center" }}>
                {word.en}
              </p>
            </div>

            <ComicButton
              tone="pink"
              size="sm"
              icon="🔊"
              disabled={!canSpeak()}
              onClick={() => speak(word.en, "en-US")}
            >
              ANHÖREN
            </ComicButton>
          </div>
        </section>

        <nav className="row" style={{ width: "100%" }} aria-label="Navigation">
          <ComicButton tone="cyan" size="lg" icon="◀" disabled={index === 0} onClick={goPrev}>
            ZURÜCK
          </ComicButton>
          <ComicButton tone="red" size="lg" icon="🏁" onClick={() => setConfirming(true)}>
            ENDE
          </ComicButton>
          <ComicButton
            tone="green"
            size="lg"
            icon="▶"
            disabled={index >= total - 1}
            onClick={goNext}
          >
            WEITER
          </ComicButton>
        </nav>

        <p className="hint">Tipp: Balken oben anklicken oder ziehen, mit ← → blättern, ESC beendet.</p>
        <VoiceHint />
      </div>

      {confirming ? (
        <div className="feedback" role="dialog" aria-modal="true" aria-label="Wirklich beenden?">
          <div className="feedback__card pop-in">
            <p className="subtitle">Schon fertig gelernt?</p>
            <h2 className="display feedback__title ink-outline">PAUSE?</h2>
            <div className="row">
              <ComicButton tone="white" size="md" onClick={() => setConfirming(false)}>
                WEITER LERNEN
              </ComicButton>
              <ComicButton tone="green" size="md" onClick={() => router.push("/menu")}>
                ZUM MENÜ
              </ComicButton>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
