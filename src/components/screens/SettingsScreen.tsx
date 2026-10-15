"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AchievementSticker from "@/components/AchievementSticker";
import ComicButton from "@/components/ComicButton";
import MangaPhotoButton from "@/components/MangaPhotoButton";
import TopBar from "@/components/TopBar";
import UserAvatar from "@/components/UserAvatar";
import { AVATARS } from "@/lib/avatars";
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS } from "@/lib/achievements";
import type { ActivityEntry } from "@/lib/types";

interface SettingsScreenProps {
  name: string;
  username: string;
  avatarId: string | null;
  avatarImage: string | null;
  avatarMode: "preset" | "photo" | null;
  history: ActivityEntry[];
  progressPercent: number;
  achievements: string[];
}

const ACTIVITY_LABELS: Record<ActivityEntry["type"], string> = {
  test: "Test gemacht",
  learn: "Gelernt",
};

function formatActivity(at: number): string {
  return new Date(at).toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsScreen({
  name,
  username,
  avatarId,
  avatarImage,
  avatarMode,
  history,
  progressPercent,
  achievements,
}: SettingsScreenProps) {
  const router = useRouter();
  const earned = new Set(achievements);
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

  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  async function onReset() {
    if (resetting) return;
    setResetting(true);
    setResetMessage("");
    try {
      const response = await fetch("/api/settings/reset", { method: "POST" });
      if (!response.ok) {
        setResetMessage("Das Zurücksetzen hat nicht geklappt.");
        return;
      }
      setConfirmingReset(false);
      setResetMessage("Fortschritt und Verlauf wurden gelöscht.");
      router.refresh();
    } catch {
      setResetMessage("Kein Kontakt zum Server.");
    } finally {
      setResetting(false);
    }
  }

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
        <TopBar showSettings={false} avatarPreset={avatarId} avatarImage={avatarImage} avatarMode={avatarMode} />

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

        <div className="panel panel--dots">
          <div className="stack">
            <h2 className="display" style={{ fontSize: "clamp(1.6rem, 5vw, 2.4rem)", margin: 0 }}>
              DEIN STICKER
            </h2>
            <AchievementSticker percent={progressPercent} />
          </div>
        </div>

        <div className="panel panel--dots">
          <div className="stack">
            <h2 className="display" style={{ fontSize: "clamp(1.6rem, 5vw, 2.4rem)", margin: 0 }}>
              MEINE ERFOLGE
            </h2>
            <p className="chip chip--info achievement-summary">
              {earned.size} von {ACHIEVEMENTS.length} freigeschaltet
            </p>
            {ACHIEVEMENT_GROUPS.map((group) => (
              <div key={group.id} className="stack" style={{ width: "100%", gap: "0.5rem" }}>
                <h3 className="subtitle" style={{ margin: 0 }}>
                  {group.label}
                </h3>
                <div className="achievement-grid">
                  {ACHIEVEMENTS.filter((achievement) => achievement.group === group.id).map(
                    (achievement) => {
                      const unlocked = earned.has(achievement.id);
                      return (
                        <div
                          key={achievement.id}
                          className={`achievement ${unlocked ? "achievement--unlocked" : "achievement--locked"}`}
                          title={achievement.description}
                        >
                          <span className="achievement__emoji">{unlocked ? achievement.emoji : "🔒"}</span>
                          <span className="achievement__title">{achievement.title}</span>
                          <span className="achievement__desc">{achievement.description}</span>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            ))}
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

        <div className="panel">
          <div className="stack">
            <h2 className="display" style={{ fontSize: "clamp(1.6rem, 5vw, 2.4rem)", margin: 0 }}>
              MEINE AKTIVITÄTEN
            </h2>
            {history.length > 0 ? (
              <ul className="list-reset stack" style={{ gap: "0.4rem", width: "100%" }}>
                {history.map((entry, position) => (
                  <li
                    key={`${entry.at}-${position}`}
                    className="chip"
                    style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: "0.6rem" }}
                  >
                    <span>{entry.type === "test" ? "📝" : "📚"} {ACTIVITY_LABELS[entry.type]}</span>
                    <span>{formatActivity(entry.at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">Noch keine Aktivitäten – starte einen Test oder das Lernen!</p>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="stack">
            <h2 className="display" style={{ fontSize: "clamp(1.6rem, 5vw, 2.4rem)", margin: 0 }}>
              DATEN ZURÜCKSETZEN
            </h2>
            <p className="hint">
              Löscht deinen Lernfortschritt, deine Aktivitäten und deine Erfolge. Konto und Avatar
              bleiben erhalten.
            </p>
            <ComicButton tone="red" size="md" icon="🗑" onClick={() => setConfirmingReset(true)}>
              FORTSCHRITT LÖSCHEN
            </ComicButton>
            {resetMessage ? <p className="chip chip--info">{resetMessage}</p> : null}
          </div>
        </div>

        <ComicButton tone="cyan" size="md" icon="←" onClick={() => router.push("/menu")}>
          ZURÜCK ZUM MENÜ
        </ComicButton>
      </div>

      {confirmingReset ? (
        <div className="feedback" role="dialog" aria-modal="true" aria-label="Wirklich zurücksetzen?">
          <div className="feedback__card pop-in">
            <p className="subtitle">Bist du dir ganz sicher?</p>
            <h2 className="display feedback__title ink-outline">ALLES LÖSCHEN?</h2>
            <p className="hint">
              Lernfortschritt, Verlauf und Erfolge werden unwiderruflich gelöscht. Das kann nicht
              rückgängig gemacht werden.
            </p>
            <div className="row">
              <ComicButton tone="white" size="md" disabled={resetting} onClick={() => setConfirmingReset(false)}>
                ABBRECHEN
              </ComicButton>
              <ComicButton tone="red" size="md" disabled={resetting} onClick={onReset}>
                {resetting ? "..." : "JA, LÖSCHEN"}
              </ComicButton>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
