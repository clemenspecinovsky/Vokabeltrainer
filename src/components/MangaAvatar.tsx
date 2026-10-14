import { getAvatar, type AvatarSpec } from "@/lib/avatars";

const INK = "#17131f";
const BLUSH = "#ff9db4";

interface MangaAvatarProps {
  id?: string | null;
  className?: string;
  title?: string;
}

function Accessory({ spec }: { spec: AvatarSpec }) {
  switch (spec.accessory) {
    case "bow":
      return (
        <g>
          <g fill={spec.accessoryColor} stroke={INK} strokeWidth="6" strokeLinejoin="round">
            <path d="M52 44 L20 24 L24 66 Z" />
            <path d="M52 44 L84 24 L80 66 Z" />
          </g>
          <circle cx="52" cy="45" r="9" fill={spec.accessoryColor} stroke={INK} strokeWidth="6" />
        </g>
      );
    case "headband":
      return (
        <g>
          <path d="M30 98 C52 34 168 34 190 98" fill="none" stroke={INK} strokeWidth="17" strokeLinecap="round" />
          <path d="M30 98 C52 34 168 34 190 98" fill="none" stroke={spec.accessoryColor} strokeWidth="11" strokeLinecap="round" />
        </g>
      );
    case "glasses":
      return (
        <g>
          <g fill="rgba(255,255,255,0.25)" stroke={INK} strokeWidth="6">
            <rect x="58" y="96" width="48" height="48" rx="15" />
            <rect x="114" y="96" width="48" height="48" rx="15" />
          </g>
          <path d="M106 118 L114 118" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <path d="M58 112 L34 102" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <path d="M162 112 L186 102" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M186 92 C208 88 218 96 214 106 C204 114 188 112 178 104 Z" fill={spec.accessoryColor} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <path d="M34 96 C34 40 76 12 110 12 C146 12 186 40 186 96 Z" fill={spec.accessoryColor} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <circle cx="110" cy="16" r="8" fill="#fff" stroke={INK} strokeWidth="5" />
        </g>
      );
    case "earring":
      return (
        <g fill={spec.accessoryColor} stroke={INK} strokeWidth="5">
          <circle cx="188" cy="156" r="7" />
          <circle cx="188" cy="173" r="5" />
        </g>
      );
    default:
      return null;
  }
}

export default function MangaAvatar({ id, className = "", title }: MangaAvatarProps) {
  const spec = getAvatar(id);
  if (!spec) return null;

  return (
    <svg
      viewBox="0 0 220 230"
      role="img"
      aria-label={title ?? `Comic-Avatar ${spec.name}`}
      className={`face avatar ${className}`}
    >
      <path
        d="M20 230 C28 198 70 184 110 184 C150 184 192 198 200 230 Z"
        fill={spec.outfit}
        stroke={INK}
        strokeWidth="7"
        strokeLinejoin="round"
      />

      <path d={spec.hairBack} fill={spec.hair} stroke={INK} strokeWidth="7" strokeLinejoin="round" />

      <ellipse cx="30" cy="140" rx="14" ry="18" fill={spec.skin} stroke={INK} strokeWidth="7" />
      <ellipse cx="190" cy="140" rx="14" ry="18" fill={spec.skin} stroke={INK} strokeWidth="7" />

      <ellipse cx="110" cy="138" rx="74" ry="72" fill={spec.skin} stroke={INK} strokeWidth="8" />

      <path d={spec.hairFront} fill={spec.hair} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
      <path d="M60 44 C74 30 96 24 112 26 C96 34 78 44 68 58 Z" fill={spec.hairLight} opacity="0.8" />

      <ellipse cx="58" cy="158" rx="16" ry="9" fill={BLUSH} opacity="0.85" />
      <ellipse cx="162" cy="158" rx="16" ry="9" fill={BLUSH} opacity="0.85" />

      <g>
        <ellipse cx="82" cy="120" rx="21" ry="25" fill="#fff" stroke={INK} strokeWidth="7" />
        <ellipse cx="138" cy="120" rx="21" ry="25" fill="#fff" stroke={INK} strokeWidth="7" />
        <circle cx="84" cy="124" r="14" fill={spec.eye} />
        <circle cx="140" cy="124" r="14" fill={spec.eye} />
        <circle cx="78" cy="116" r="6" fill="#fff" />
        <circle cx="134" cy="116" r="6" fill="#fff" />
        <circle cx="90" cy="132" r="3.5" fill="#fff" opacity="0.9" />
        <circle cx="146" cy="132" r="3.5" fill="#fff" opacity="0.9" />
      </g>

      {spec.gender === "girl" ? (
        <g stroke={INK} strokeWidth="8" strokeLinecap="round" fill="none">
          <path d="M61 97 Q82 81 104 97" />
          <path d="M116 97 Q138 81 159 97" />
        </g>
      ) : null}

      <path d="M86 164 Q110 180 134 164" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />

      <Accessory spec={spec} />
    </svg>
  );
}
