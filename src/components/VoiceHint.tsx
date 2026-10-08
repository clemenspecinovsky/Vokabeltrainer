"use client";

import { useEffect, useState } from "react";
import { canSpeak, hasVoiceFor } from "@/lib/speech";

export default function VoiceHint() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!canSpeak()) return;
    const update = () => setLoaded(true);
    const timer = window.setTimeout(update, 900);
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", update);
      window.clearTimeout(timer);
    };
  }, []);

  if (!canSpeak() || !loaded) return null;
  if (hasVoiceFor("de-DE") && hasVoiceFor("en-US")) return null;

  const missing = [hasVoiceFor("de-DE") ? null : "deutsch", hasVoiceFor("en-US") ? null : "englisch"].filter(
    Boolean,
  );

  return (
    <p className="hint">
      Hinweis: Auf diesem Gerät fehlt eine {missing.join(" und ")} Sprachstimme – dann klingen die Wörter
      englisch. Unter Windows: Einstellungen → Zeit &amp; Sprache → Sprechen → Stimmen hinzufügen.
    </p>
  );
}
