"use client";

import { useRouter } from "next/navigation";
import ComicButton from "@/components/ComicButton";
import MangaFace from "@/components/MangaFace";
import TopBar from "@/components/TopBar";

interface MenuScreenProps {
  name: string;
}

export default function MenuScreen({ name }: MenuScreenProps) {
  const router = useRouter();

  return (
    <main className="page">
      <div className="container">
        <TopBar showMenu={false}>
          <span className="chip chip--info">Hallo, {name}!</span>
        </TopBar>

        <h1 className="display title ink-outline" style={{ fontSize: "clamp(2.4rem, 9vw, 4.6rem)" }}>
          WAS WOLLEN WIR MACHEN?
        </h1>

        <div className="row" style={{ width: "100%", alignItems: "stretch" }}>
          <button className="tile tile--learn" onClick={() => router.push("/learn")}>
            <MangaFace mood="happy" className="face--sm" />
            <span className="tile__badge">LERNEN</span>
            <span className="tile__text">
              Blättere durch alle Wörter mit Vor, Zurück und Ende.
            </span>
          </button>

          <button className="tile tile--test" onClick={() => router.push("/test")}>
            <MangaFace mood="wow" className="face--sm" />
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
