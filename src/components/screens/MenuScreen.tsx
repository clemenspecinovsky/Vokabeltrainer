"use client";

import { useRouter } from "next/navigation";
import AchievementSticker from "@/components/AchievementSticker";
import ComicButton from "@/components/ComicButton";
import Progress from "@/components/Progress";
import TopBar from "@/components/TopBar";
import UserAvatar from "@/components/UserAvatar";

interface MenuScreenProps {
  name: string;
  avatarId: string | null;
  avatarImage: string | null;
  avatarMode: "preset" | "photo" | null;
  progressPercent: number;
  learnedCount: number;
  wordCount: number;
}

export default function MenuScreen({
  name,
  avatarId,
  avatarImage,
  avatarMode,
  progressPercent,
  learnedCount,
  wordCount,
}: MenuScreenProps) {
  const router = useRouter();

  return (
    <main className="page">
      <div className="container">
        <TopBar showMenu={false} showSettings={false} showAvatar={false} />

        <section className="panel panel--dots pop-in" aria-label="Lernfortschritt">
          <div className="stack" style={{ width: "100%" }}>
            <div
              className="row"
              style={{
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: "clamp(1rem, 4vw, 2.6rem)",
              }}
            >
              <button
                type="button"
                className="topbar-avatar"
                onClick={() => router.push("/settings")}
                aria-label="Profil öffnen"
                title="Profil"
              >
                <UserAvatar
                  preset={avatarId}
                  image={avatarImage}
                  mode={avatarMode}
                  className="avatar--hero"
                />
              </button>
              <AchievementSticker percent={progressPercent} />
            </div>

            <div className="stack" style={{ width: "100%", maxWidth: 520 }}>
              <h2 className="subtitle">Mein Fortschritt</h2>
              <Progress
                value={learnedCount}
                max={wordCount * 2}
                label={`${progressPercent} %`}
                ariaLabel="Lernfortschritt"
              />
            </div>
          </div>
        </section>

        <h1 className="display title ink-outline" style={{ fontSize: "clamp(2.4rem, 9vw, 4.6rem)" }}>
          WAS WOLLEN WIR MACHEN?
        </h1>

        <div className="row" style={{ width: "100%", alignItems: "stretch" }}>
          <button className="tile tile--learn" onClick={() => router.push("/learn")}>
            <UserAvatar
              preset={avatarId}
              image={avatarImage}
              mode={avatarMode}
              className="face--sm face--happy"
            />
            <span className="tile__badge">LERNEN</span>
            <span className="tile__text">
              Blättere durch alle Wörter mit Vor, Zurück und Ende.
            </span>
          </button>

          <button className="tile tile--test" onClick={() => router.push("/test")}>
            <UserAvatar
              preset={avatarId}
              image={avatarImage}
              mode={avatarMode}
              className="face--sm face--wow"
            />
            <span className="tile__badge">TEST</span>
            <span className="tile__text">
              Übersetzen, sprechen, Punkte sammeln – bis alles sitzt!
            </span>
          </button>
        </div>

        <ComicButton tone="purple" size="md" icon="★">
          VIEL SPASS, {name.toUpperCase()}!
        </ComicButton>
      </div>
    </main>
  );
}
