"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

interface ProgressProps {
  value: number;
  max: number;
  label?: string;
  ariaLabel?: string;
  onSeek?: (value: number) => void;
}

export default function Progress({ value, max, label, ariaLabel = "Fortschritt", onSeek }: ProgressProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100));
  const interactive = Boolean(onSeek);

  const seekTo = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || !onSeek) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const next = Math.min(safeMax, Math.max(1, Math.round(fraction * safeMax)));
      onSeek(next);
    },
    [onSeek, safeMax],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    seekTo(event.clientX);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    seekTo(event.clientX);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const className = `progress${interactive ? " progress--seekable" : ""}${dragging ? " progress--dragging" : ""}`;

  return (
    <div
      ref={trackRef}
      className={className}
      role={interactive ? "slider" : "progressbar"}
      aria-label={ariaLabel}
      aria-valuemin={interactive ? 1 : 0}
      aria-valuemax={interactive ? safeMax : 100}
      aria-valuenow={interactive ? value : Math.round(percent)}
      tabIndex={interactive ? 0 : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="progress__bar">
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
      {interactive ? (
        <div className="progress__handle" style={{ left: `${percent}%` }} aria-hidden="true" />
      ) : null}
      <span className="progress__label">{label ?? `${value} / ${max}`}</span>
    </div>
  );
}
