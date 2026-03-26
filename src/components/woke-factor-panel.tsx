import React from "react";
import clsx from "clsx";

interface WokeFactorPanelProps {
  factors: Array<{ label: string; weight: number; displayOrder: number; notes: string | null }>;
  minimumWeight?: number;
}

function weightTone(weight: number) {
  if (weight >= 20) return "high";
  if (weight >= 10) return "medium";
  return "low";
}

export function WokeFactorPanel({ factors, minimumWeight = 0 }: WokeFactorPanelProps) {
  const visibleFactors = factors.filter((factor) => factor.weight >= minimumWeight);

  if (visibleFactors.length === 0) {
    return <p className="text-sm text-fgMuted">No factor breakdown available.</p>;
  }

  return (
    <div className="grid gap-2">
      {visibleFactors.map((factor) => (
        <div
          key={`${factor.displayOrder}-${factor.label}`}
          className="flex flex-col gap-2 rounded-lg bg-bgSoft px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
        >
          <div className="grid gap-0.5">
            <p className="text-sm font-semibold text-fg">{factor.label}</p>
            {factor.notes ? <p className="text-xs text-fgMuted">{factor.notes}</p> : null}
          </div>
          <span
            className={clsx(
              "w-fit shrink-0 rounded-md px-2.5 py-1 text-xs font-bold tabular-nums",
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
