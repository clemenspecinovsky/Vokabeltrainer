"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import ComicButton from "./ComicButton";
import UserAvatar from "./UserAvatar";

interface TopBarProps {
  children?: ReactNode;
  showMenu?: boolean;
  showLogout?: boolean;
  showSettings?: boolean;
  avatarPreset?: string | null;
  avatarImage?: string | null;
  avatarMode?: string | null;
  showAvatar?: boolean;
}

export default function TopBar({
  children,
  showMenu = true,
  showLogout = true,
  showSettings = true,
  avatarPreset = null,
  avatarImage = null,
  avatarMode = null,
  showAvatar = true,
}: TopBarProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="topbar">
      {showMenu ? (
        <ComicButton tone="white" size="sm" icon="←" onClick={() => router.push("/menu")}>
          MENÜ
        </ComicButton>
      ) : (
        <span />
      )}
      <div className="row">{children}</div>
      <div className="row" style={{ alignItems: "center", gap: "clamp(0.5rem, 2vw, 0.9rem)" }}>
        {showAvatar ? (
          <button
            type="button"
            className="topbar-avatar"
            onClick={() => router.push("/settings")}
            aria-label="Profil öffnen"
            title="Profil"
          >
            <UserAvatar
              preset={avatarPreset}
              image={avatarImage}
              mode={avatarMode}
              className="avatar--chip"
            />
          </button>
        ) : null}
        {showSettings ? (
          <ComicButton
            tone="purple"
            size="sm"
            icon="⚙"
            onClick={() => router.push("/settings")}
            aria-label="Einstellungen"
            title="Einstellungen"
          />
        ) : null}
        {showLogout ? (
          <ComicButton tone="red" size="sm" icon="✕" onClick={logout}>
            AUS
          </ComicButton>
        ) : null}
      </div>
    </header>
  );
}
