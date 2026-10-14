"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import ComicButton from "@/components/ComicButton";
import MangaPhotoButton from "@/components/MangaPhotoButton";
import TopBar from "@/components/TopBar";
import UserAvatar from "@/components/UserAvatar";
import { AVATARS } from "@/lib/avatars";

interface SettingsScreenProps {
  name: string;
  username: string;
  avatarId: string | null;
  avatarImage: string | null;
  avatarMode: "preset" | "photo" | null;
}

export default function SettingsScreen({
  name,
  username,
  avatarId,
  avatarImage,
  avatarMode,
}: SettingsScreenProps) {
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(avatarId);
  const [image, setImage] = useState<string | null>(avatarImage);
  const [mode, setMode] = useState<string>(avatarMode ?? "preset");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveAvatar(body: Record<string, string>, apply: () => void) {
    if (savingAvatar) return;
    setAvatarMessage("");
    setSavingAvatar(true);
    try {
      const response = await fetch("/api/settings/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setAvatarMessage("Der Avatar konnte nicht gespeichert werden.");
        return;
      }
      apply();
      setAvatarMessage("Avatar gespeichert!");
    } catch {
      setAvatarMessage("Kein Kontakt zum Server.");
    } finally {
      setSavingAvatar(false);
    }
  }

  function chooseAvatar(id: string) {
    if (id === avatar && mode === "preset") return;
    void saveAvatar({ avatar: id }, () => {
      setAvatar(id);
      setMode("preset");
    });
  }

  function choosePhoto() {
    if (mode === "photo") return;
    void saveAvatar({ mode: "photo" }, () => setMode("photo"));
  }

  function onPhotoSaved(filename: string) {
    setImage(filename);
    setMode("photo");
    setAvatarMessage("Dein Bild-Avatar ist fertig!");
  }

  async function onSubmitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingPassword) return;
    setPasswordError("");
    setPasswordMessage("");

    if (next.length < 4) {
      setPasswordError("Das neue Passwort muss mindestens 4 Zeichen haben.");
      return;
    }
    if (next !== confirm) {
      setPasswordError("Die beiden neuen Passwörter sind nicht gleich.");
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setPasswordError(data.error ?? "Das hat nicht geklappt.");
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setPasswordMessage("Passwort geändert!");
    } catch {
      setPasswordError("Kein Kontakt zum Server.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <main className="page">
      <div className="container">
        <TopBar showSettings={false} />

        <h1 className="display title ink-outline" style={{ fontSize: "clamp(2rem, 8vw, 3.6rem)" }}>
          MEIN PROFIL
        </h1>

        <div className="panel panel--dots pop-in">
          <div className="stack">
            <UserAvatar preset={avatar} image={image} mode={mode} className="face--lg" />
            <p className="subtitle">{name}</p>
            <p className="hint">Angemeldet als {username}</p>

            <h2 className="display" style={{ fontSize: "clamp(1.6rem, 5vw, 2.4rem)", margin: 0 }}>
              WÄHLE DEINEN AVATAR
            </h2>

            <div className="avatar-grid">
              {AVATARS.map((spec) => (
                <button
                  key={spec.id}
                  type="button"
                  className="avatar-choice"
                  aria-pressed={mode === "preset" && avatar === spec.id}
                  title={spec.name}
                  onClick={() => chooseAvatar(spec.id)}
                >
                  <UserAvatar preset={spec.id} className="avatar-choice__img" />
                </button>
              ))}

              {image ? (
                <button
                  type="button"
                  className="avatar-choice"
                  aria-pressed={mode === "photo"}
                  title="Mein Foto"
                  onClick={choosePhoto}
                >
                  <img className="avatar-choice__photo" src={`/api/avatar/${encodeURIComponent(image)}`} alt="Mein Comic-Foto" />
                </button>
              ) : null}
            </div>

            <MangaPhotoButton onSaved={onPhotoSaved} disabled={savingAvatar} />

            {avatarMessage ? <p className="chip chip--info">{avatarMessage}</p> : null}
          </div>
        </div>

        <div className="panel">
          <form className="stack" onSubmit={onSubmitPassword} noValidate>
            <h2 className="display" style={{ fontSize: "clamp(1.6rem, 5vw, 2.4rem)", margin: 0 }}>
              PASSWORT ÄNDERN
            </h2>

            <label className="field">
              <span className="field__label">Aktuelles Passwort</span>
              <input
                className="input"
                type="password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
                autoComplete="current-password"
                name="current-password"
              />
            </label>

            <label className="field">
              <span className="field__label">Neues Passwort</span>
              <input
                className="input"
                type="password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
                autoComplete="new-password"
                name="new-password"
              />
            </label>

            <label className="field">
              <span className="field__label">Neues Passwort nochmal</span>
              <input
                className="input"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                name="confirm-password"
              />
            </label>

            {passwordError ? (
              <p className="error-box" role="alert">
                {passwordError}
              </p>
            ) : null}
            {passwordMessage ? <p className="chip chip--correct">{passwordMessage}</p> : null}

            <ComicButton type="submit" tone="green" size="md" block disabled={savingPassword}>
              {savingPassword ? "..." : "PASSWORT SPEICHERN"}
            </ComicButton>
          </form>
        </div>

        <ComicButton tone="cyan" size="md" icon="←" onClick={() => router.push("/menu")}>
          ZURÜCK ZUM MENÜ
        </ComicButton>
      </div>
    </main>
  );
}
