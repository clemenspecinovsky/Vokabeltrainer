"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import ComicButton from "./ComicButton";

interface TopBarProps {
  children?: ReactNode;
  showMenu?: boolean;
  showLogout?: boolean;
}

export default function TopBar({ children, showMenu = true, showLogout = true }: TopBarProps) {
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
      {showLogout ? (
        <ComicButton tone="red" size="sm" icon="✕" onClick={logout}>
          AUS
        </ComicButton>
      ) : (
        <span />
      )}
    </header>
  );
}
