import React from "react";
import clsx from "clsx";

interface ScoreBadgeProps {
  score: number;
  variant?: "badge" | "display";
}

function tone(score: number) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function ScoreBadge({ score, variant = "badge" }: ScoreBadgeProps) {
  const level = tone(score);
  const scoreHint = `Woke score ${score} out of 100. Lower scores are safer picks, higher scores signal stronger woke themes.`;

  if (variant === "display") {
    return (
      <div
        className={clsx(
          "w-full rounded-xl border p-4",
          level === "high" && "border-rose-200 bg-rose-50",
          level === "medium" && "border-amber-200 bg-amber-50",
          level === "low" && "border-emerald-200 bg-emerald-50"
        )}
        aria-label={scoreHint}
        title={scoreHint}
      >
        <p
          className={clsx(
            "mb-1 text-xs font-semibold uppercase tracking-widest",
            level === "high" && "text-rose-600",
            level === "medium" && "text-amber-600",
            level === "low" && "text-emerald-600"
          )}
        >
          Woke Score
        </p>
        <div className="flex items-baseline gap-2">
          <span
            className={clsx(
              "font-display text-6xl font-bold tabular-nums leading-none",
              level === "high" && "text-rose-600",
              level === "medium" && "text-amber-600",
              level === "low" && "text-emerald-600"
            )}
          >
            {score}
          </span>
          <span
            className={clsx(
              "text-sm font-medium",
              level === "high" && "text-rose-500",
              level === "medium" && "text-amber-500",
              level === "low" && "text-emerald-500"
            )}
          >
            / 100
          </span>
        </div>
        <p
          className={clsx(
            "mt-1 text-xs",
            level === "high" && "text-rose-500",
            level === "medium" && "text-amber-500",
            level === "low" && "text-emerald-500"
          )}
        >
          Lower is better
        </p>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "inline-flex min-w-[72px] items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold tabular-nums",
        level === "high" && "bg-rose-50 text-rose-600",
        level === "medium" && "bg-amber-50 text-amber-600",
        level === "low" && "bg-emerald-50 text-emerald-600"
      )}
      aria-label={scoreHint}
      title={scoreHint}
    >
      {score} / 100
    </div>
  );
}
