import clsx from "clsx";

interface WokeFactorPanelProps {
  factors: Array<{ label: string; weight: number; displayOrder: number; notes: string | null }>;
}

function weightTone(weight: number) {
  if (weight >= 20) return "high";
  if (weight >= 10) return "medium";
  return "low";
}

export function WokeFactorPanel({ factors }: WokeFactorPanelProps) {
  if (factors.length === 0) {
    return <p className="text-sm text-fgMuted">No factor breakdown available.</p>;
  }

  return (
    <div className="grid gap-2">
      {factors.map((factor) => (
        <div
          key={`${factor.displayOrder}-${factor.label}`}
          className="flex items-start justify-between gap-4 rounded-lg bg-bgSoft px-4 py-3"
        >
          <div className="grid gap-0.5">
            <p className="text-sm font-semibold text-fg">{factor.label}</p>
            {factor.notes ? <p className="text-xs text-fgMuted">{factor.notes}</p> : null}
          </div>
          <span
            className={clsx(
              "shrink-0 rounded-md px-2.5 py-1 text-xs font-bold tabular-nums",
              weightTone(factor.weight) === "high" && "bg-rose-50 text-rose-600",
              weightTone(factor.weight) === "medium" && "bg-amber-50 text-amber-600",
              weightTone(factor.weight) === "low" && "bg-emerald-50 text-emerald-600"
            )}
          >
            +{factor.weight}
          </span>
        </div>
      ))}
    </div>
  );
}
