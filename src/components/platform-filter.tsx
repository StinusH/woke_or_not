"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";

interface PlatformFilterProps {
  options: string[];
  selected: string[];
}

function getSummaryLabel(selected: string[]) {
  if (selected.length === 0) {
    return "ALL";
  }

  if (selected.length === 1) {
    return selected[0];
  }

  return `${selected[0]} +${selected.length - 1}`;
}

export function PlatformFilter({ options, selected }: PlatformFilterProps) {
  const [open, setOpen] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(() => new Set(selected));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    setSelectedPlatforms(new Set(selected));
  }, [selected]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open && filterValue) {
      setFilterValue("");
    }
  }, [filterValue, open]);

  const summaryLabel = useMemo(
    () => getSummaryLabel(Array.from(selectedPlatforms).sort((left, right) => left.localeCompare(right))),
    [selectedPlatforms]
  );
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedFilterValue) {
      return options;
    }

    return options.filter((platform) => platform.toLocaleLowerCase().includes(normalizedFilterValue));
  }, [normalizedFilterValue, options]);

  return (
    <div ref={wrapperRef} className="relative grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-fgMuted">Platform</span>
      {!open
        ? Array.from(selectedPlatforms).map((platform) => (
            <input key={platform} type="hidden" name="platform" value={platform} />
          ))
        : null}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-[42px] items-center justify-between rounded-lg border border-line bg-bg px-3 py-2 text-left text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selectedPlatforms.size === 0 ? "text-fgMuted" : "text-fg"}>{summaryLabel}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={`h-4 w-4 text-fgMuted transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 6 8 10.5 12.5 6" />
        </svg>
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute top-full z-20 mt-2 w-full min-w-[240px] rounded-xl border border-line bg-card p-3 shadow-card"
        >
          <div className="grid gap-2">
            <input
              type="search"
              value={filterValue}
              onChange={(event) => setFilterValue(event.target.value)}
              placeholder="Filter platforms..."
              aria-label="Filter platforms"
              autoFocus
              className="min-h-[40px] rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none transition placeholder:text-fgMuted focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <div className="grid max-h-64 gap-2 overflow-y-auto overscroll-contain pr-1">
              {filteredOptions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line bg-bgSoft px-3 py-4 text-sm text-fgMuted">
                  No platforms match that filter.
                </p>
              ) : null}
              {filteredOptions.map((platform) => {
                const isChecked = selectedPlatforms.has(platform);

                return (
                  <label
                    key={platform}
                    className="flex items-center gap-3 rounded-lg border border-line bg-bgSoft px-3 py-2 text-sm font-medium text-fg transition hover:border-accent"
                  >
                    <input
                      type="checkbox"
                      name="platform"
                      value={platform}
                      checked={isChecked}
                      onChange={(event) => {
                        setSelectedPlatforms((current) => {
                          const next = new Set(current);

                          if (event.target.checked) {
                            next.add(platform);
                          } else {
                            next.delete(platform);
                          }

                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded border-line text-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <span>{platform}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
