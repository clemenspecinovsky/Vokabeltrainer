"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import ComicButton from "@/components/ComicButton";
import MangaFace from "@/components/MangaFace";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Das hat nicht geklappt. Probier es noch einmal!");
        setShakeKey((value) => value + 1);
        return;
      }
      router.replace("/menu");
      router.refresh();
    } catch {
      setError("Kein Kontakt zum Server. Bitte versuch es gleich noch einmal.");
      setShakeKey((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 className="display title ink-outline">VOKABEL-TRAINER</h1>
        <p className="subtitle">Manga Edition – lernen, üben, stolpern, gewinnen!</p>

        <div className="panel panel--dots pop-in">
          <div className="stack">
            <MangaFace mood="wow" />

            <form onSubmit={onSubmit} className="stack" noValidate>
              <label className="field">
                <span className="field__label">Wer bist du?</span>
                <input
                  className="input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Benutzername"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  name="username"
                />
              </label>

              <label className="field">
                <span className="field__label">Geheimwort</span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Passwort"
                  autoComplete="current-password"
                  name="password"
                />
              </label>

              {error ? (
                <p key={shakeKey} className="error-box" role="alert">
                  {error}
                </p>
              ) : null}

              <ComicButton type="submit" tone="green" size="lg" block disabled={busy}>
                {busy ? "..." : "LOS GEHT'S!"}
              </ComicButton>
            </form>

            <p className="hint">
              Noch kein Zugang? Frag deine Lehrerin oder deinen Eltern nach deinem Namen.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
