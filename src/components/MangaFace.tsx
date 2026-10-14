import type { Mood } from "@/lib/types";

interface MangaFaceProps {
  mood?: Mood;
  className?: string;
}

const INK = "#17131f";
const SKIN = "#ffe0c2";
const HAIR = "#2c2340";
const HAIR_LIGHT = "#6d5bd0";

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "happy" || mood === "love") {
    return (
      <g stroke={INK} strokeWidth="9" strokeLinecap="round" fill="none">
        <path d="M62 122 Q82 96 102 122" />
        <path d="M118 122 Q138 96 158 122" />
      </g>
    );
  }

  if (mood === "sad" || mood === "angry") {
    return (
      <g>
        <ellipse cx="82" cy="122" rx="19" ry="21" fill="#fff" stroke={INK} strokeWidth="7" />
        <ellipse cx="138" cy="122" rx="19" ry="21" fill="#fff" stroke={INK} strokeWidth="7" />
        <circle cx="86" cy="126" r="12" fill={INK} />
        <circle cx="142" cy="126" r="12" fill={INK} />
        <circle cx="81" cy="120" r="5" fill="#fff" />
        <circle cx="137" cy="120" r="5" fill="#fff" />
        {mood === "angry" ? (
          <g stroke={INK} strokeWidth="8" strokeLinecap="round">
            <path d="M60 92 L102 106" />
            <path d="M160 92 L118 106" />
          </g>
        ) : (
          <g stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none">
            <path d="M62 96 Q82 86 100 94" />
            <path d="M158 96 Q138 86 120 94" />
          </g>
        )}
      </g>
    );
  }

  return (
    <g>
      <ellipse cx="82" cy="120" rx="21" ry="25" fill="#fff" stroke={INK} strokeWidth="7" />
      <ellipse cx="138" cy="120" rx="21" ry="25" fill="#fff" stroke={INK} strokeWidth="7" />
      <circle cx="84" cy="124" r="14" fill={INK} />
      <circle cx="140" cy="124" r="14" fill={INK} />
      <circle cx="78" cy="116" r="6" fill="#fff" />
      <circle cx="134" cy="116" r="6" fill="#fff" />
      <circle cx="90" cy="132" r="3.5" fill="#fff" opacity="0.9" />
      <circle cx="146" cy="132" r="3.5" fill="#fff" opacity="0.9" />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === "happy" || mood === "love") {
    return (
      <path
        d="M74 154 C92 200 128 200 146 154 C124 172 96 172 74 154 Z"
        fill="#ff5f7e"
        stroke={INK}
        strokeWidth="7"
        strokeLinejoin="round"
      />
    );
  }

  if (mood === "sad") {
    return (
      <path d="M80 182 Q110 152 140 182" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
    );
  }

  if (mood === "angry") {
    return (
      <path d="M82 174 L98 164 L114 174 L130 164 L140 172" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    );
  }

  if (mood === "wow") {
    return <ellipse cx="110" cy="170" rx="17" ry="22" fill="#ff5f7e" stroke={INK} strokeWidth="7" />;
  }

  return (
    <path d="M86 164 Q110 178 134 164" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
  );
}

export default function MangaFace({ mood = "happy", className = "" }: MangaFaceProps) {
  const motionClass = mood === "happy" || mood === "love" ? "face--happy" : mood === "sad" ? "face--sad" : mood === "wow" ? "face--wow" : "";

  return (
    <svg
      viewBox="0 0 220 230"
      role="img"
      aria-label={mood === "happy" ? "Fröhliche Comic Figur" : mood === "sad" ? "Traurige Comic Figur" : "Comic Figur"}
      className={`face ${motionClass} ${className}`}
    >
      {mood === "happy" || mood === "love" ? (
        <g opacity="0.95">
          <path d="M14 60 L34 66 L20 78 Z" fill="var(--yellow)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <path d="M206 54 L186 60 L200 72 Z" fill="var(--cyan)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <path d="M196 176 L214 182 L200 194 Z" fill="var(--pink)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        </g>
      ) : null}

      <ellipse cx="30" cy="140" rx="14" ry="18" fill={SKIN} stroke={INK} strokeWidth="7" />
      <ellipse cx="190" cy="140" rx="14" ry="18" fill={SKIN} stroke={INK} strokeWidth="7" />

      <path
        d="M28 130 C18 54 64 14 110 14 C158 14 202 56 192 132 C186 104 174 96 164 106 C158 78 134 68 120 84 C112 60 84 56 72 76 C58 60 36 74 34 104 C30 104 28 116 28 130 Z"
        fill={HAIR}
        stroke={INK}
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path d="M60 44 C74 30 96 24 112 26 C96 34 78 44 68 58 Z" fill={HAIR_LIGHT} opacity="0.85" />

      <ellipse cx="110" cy="138" rx="74" ry="72" fill={SKIN} stroke={INK} strokeWidth="8" />

      <path
        d="M36 124 C26 50 70 12 112 12 C160 12 202 54 194 126 C188 100 176 92 166 102 C160 74 136 64 122 80 C114 56 86 52 74 72 C60 56 38 70 36 100 Z"
        fill={HAIR}
        stroke={INK}
        strokeWidth="7"
        strokeLinejoin="round"
      />

      <ellipse cx="58" cy="158" rx="16" ry="9" fill="#ff9db4" opacity="0.85" />
      <ellipse cx="162" cy="158" rx="16" ry="9" fill="#ff9db4" opacity="0.85" />

      <Eyes mood={mood} />
      <Mouth mood={mood} />

      {mood === "sad" ? (
        <path d="M154 138 C164 152 168 164 158 168 C150 171 144 160 150 150 Z" fill="#7fd8ff" stroke={INK} strokeWidth="5" />
      ) : null}

      {mood === "love" ? (
        <g fill="var(--pink)" stroke={INK} strokeWidth="5">
          <path d="M104 186 C96 176 82 182 84 194 C86 206 104 214 104 214 C104 214 122 206 124 194 C126 182 112 176 104 186 Z" />
        </g>
      ) : null}
    </svg>
  );
}
