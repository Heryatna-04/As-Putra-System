"use client";

export interface ProgressRingProps {
  /** Completion percentage clamped between 0 and 100. */
  percentage: number;
  /** Diameter of the circular SVG in pixels. */
  size?: number;
  /** Stroke thickness of the track and progress arc in pixels. */
  strokeWidth?: number;
  /** Stroke color applied to the active progress arc. */
  color?: string;
  /** Accessible metric description exposed via `aria-label`. */
  label?: string;
}

/**
 * Animated circular SVG progress indicator with a centered percentage label.
 */
export default function ProgressRing({
  percentage,
  size = 64,
  strokeWidth = 6,
  color = "#E4002B",
  label,
}: ProgressRingProps) {
  const safePercentage = Number.isFinite(percentage) ? percentage : 0;
  const clamped = Math.max(0, Math.min(100, Math.round(safePercentage)));
  const radius = Math.max(1, (size - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ? `${label}: ${clamped}%` : `${clamped}%`}
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="admin-ring-animate"
        />
      </svg>
      <span className="absolute text-xs font-black text-slate-900 dark:text-white tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}
