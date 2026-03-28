import React from "react";
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
  const visibleFactors = [...factors].sort((left, right) => left.displayOrder - right.displayOrder);

  if (visibleFactors.length === 0) {
    return <p className="text-sm text-fgMuted">No factor breakdown available.</p>;
  }

  return (
    <div className="grid gap-2">
      {visibleFactors.map((factor) => (
        <div
          key={`${factor.displayOrder}-${factor.label}`}
          className="flex flex-col gap-3 rounded-lg border border-line bg-bgSoft px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
        >
          <div className="grid gap-0.5 sm:flex-1">
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
            {factor.weight} / 100
          </span>
        </div>
      ))}
    </div>
  );
}
