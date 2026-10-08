import { useMemo } from "react";

const COLORS = ["#ffd23f", "#ff5fa2", "#45d5ff", "#2fd97b", "#8b5cf6", "#ff9f1c", "#ffffff"];
const SHAPES = ["2px", "50%", "2px"];

interface ConfettiProps {
  count?: number;
}

export default function Confetti({ count = 30 }: ConfettiProps) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        color: COLORS[index % COLORS.length],
        shape: SHAPES[index % SHAPES.length],
        left: (index * 37 + Math.random() * 18) % 100,
        delay: Math.random() * 0.5,
        duration: 1.6 + Math.random() * 1.4,
        size: `${10 + Math.random() * 14}px`,
        rotate: `${Math.random() * 360}deg`,
      })),
    [count],
  );

  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((bit) => (
        <span
          key={bit.id}
          className="confetti__bit"
          style={
            {
              "--color": bit.color,
              "--shape": bit.shape,
              "--left": `${bit.left}%`,
              "--delay": `${bit.delay}s`,
              "--duration": `${bit.duration}s`,
              "--size": bit.size,
              "--rotate": bit.rotate,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
