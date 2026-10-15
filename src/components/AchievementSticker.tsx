import { nextSticker, stickerForPercent } from "@/lib/stickers";

interface AchievementStickerProps {
  percent: number;
}

export default function AchievementSticker({ percent }: AchievementStickerProps) {
  const earned = stickerForPercent(percent);
  const upcoming = nextSticker(percent);
  const remaining = upcoming ? Math.max(0, upcoming.minPercent - Math.round(percent)) : 0;

  return (
    <div className="sticker-wrap">
      <div
        className={`sticker ${earned ? `sticker--${earned.id}` : "sticker--locked"}`}
        role="img"
        aria-label={earned ? `Sticker ${earned.label}` : "Noch kein Sticker"}
      >
        <span className="sticker__emoji" aria-hidden="true">
          {earned ? earned.emoji : "🔒"}
        </span>
        <span className="sticker__label">{earned ? earned.label : "Noch kein Sticker"}</span>
      </div>
      <p className="sticker__hint">
        {earned ? earned.description : "Sammle deinen ersten Sticker!"}
        {upcoming ? ` · Noch ${remaining} % bis ${upcoming.label} ${upcoming.emoji}` : ""}
      </p>
    </div>
  );
}
