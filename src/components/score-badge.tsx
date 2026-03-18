import clsx from "clsx";

interface ScoreBadgeProps {
  score: number;
}

function tone(score: number) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const level = tone(score);
  const scoreHint = `Woke score ${score} out of 100. 0 is least woke, 100 is most woke.`;

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
