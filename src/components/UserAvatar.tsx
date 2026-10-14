import MangaAvatar from "./MangaAvatar";

interface UserAvatarProps {
  preset?: string | null;
  image?: string | null;
  mode?: string | null;
  className?: string;
  title?: string;
}

export default function UserAvatar({
  preset,
  image,
  mode,
  className = "",
  title,
}: UserAvatarProps) {
  if (mode === "photo" && image) {
    return (
      <img
        src={`/api/avatar/${encodeURIComponent(image)}`}
        alt={title ?? "Avatar"}
        className={`avatar-img ${className}`}
        width={512}
        height={512}
      />
    );
  }
  return <MangaAvatar id={preset} className={className} title={title} />;
}
