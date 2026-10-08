import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "yellow" | "pink" | "cyan" | "green" | "red" | "purple" | "white";
type Size = "sm" | "md" | "lg";

interface ComicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
}

export default function ComicButton({
  tone = "yellow",
  size = "md",
  block = false,
  icon,
  children,
  className = "",
  type = "button",
  ...rest
}: ComicButtonProps) {
  const classes = ["btn", `btn--${tone}`, `btn--${size}`, block ? "btn--block" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {icon ? <span className="btn__icon">{icon}</span> : null}
      {children}
    </button>
  );
}
