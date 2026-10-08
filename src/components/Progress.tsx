interface ProgressProps {
  value: number;
  max: number;
  label?: string;
}

export default function Progress({ value, max, label }: ProgressProps) {
  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100));

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Testfortschritt"
    >
      <div className="progress__fill" style={{ width: `${percent}%` }} />
      <span className="progress__label">{label ?? `${value} / ${max}`}</span>
    </div>
  );
}
