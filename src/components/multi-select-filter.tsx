"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";

export interface MultiSelectFilterOption {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectFilterProps {
  label: string;
  name: string;
  options: MultiSelectFilterOption[];
  selected: string[];
  searchPlaceholder: string;
  emptyMessage: string;
}

function getSummaryLabel(selectedLabels: string[]) {
  if (selectedLabels.length === 0) {
    return "ALL";
  }

  if (selectedLabels.length === 1) {
    return selectedLabels[0];
  }

  return `${selectedLabels[0]} +${selectedLabels.length - 1}`;
}

export function MultiSelectFilter({
  label,
  name,
  options,
  selected,
  searchPlaceholder,
  emptyMessage
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [selectedValues, setSelectedValues] = useState(() => new Set(selected));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    setSelectedValues(new Set(selected));
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

  const optionLabelByValue = useMemo(
    () => new Map(options.map((option) => [option.value, option.label])),
    [options]
  );
  const summaryLabel = useMemo(() => {
    const selectedLabels = Array.from(selectedValues)
      .map((value) => optionLabelByValue.get(value) ?? value)
      .sort((left, right) => left.localeCompare(right));

    return getSummaryLabel(selectedLabels);
  }, [optionLabelByValue, selectedValues]);
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedFilterValue) {
      return options;
    }

    return options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedFilterValue));
  }, [normalizedFilterValue, options]);

  return (
    <div ref={wrapperRef} className="relative grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-fgMuted">{label}</span>
      {!open
        ? Array.from(selectedValues).map((value) => (
            <input key={value} type="hidden" name={name} value={value} />
          ))
        : null}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-[42px] items-center justify-between rounded-lg border border-line bg-bg px-3 py-2 text-left text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selectedValues.size === 0 ? "text-fgMuted" : "text-fg"}>{summaryLabel}</span>
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
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoFocus
              className="min-h-[40px] rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none transition placeholder:text-fgMuted focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <div className="grid max-h-64 gap-2 overflow-y-auto overscroll-contain pr-1">
              {filteredOptions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line bg-bgSoft px-3 py-4 text-sm text-fgMuted">
                  {emptyMessage}
                </p>
              ) : null}
              {filteredOptions.map((option) => {
                const isChecked = selectedValues.has(option.value);

                return (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 rounded-lg border border-line bg-bgSoft px-3 py-2 text-sm font-medium text-fg transition hover:border-accent"
                  >
                    <input
                      type="checkbox"
                      name={name}
                      value={option.value}
                      checked={isChecked}
                      onChange={(event) => {
                        setSelectedValues((current) => {
                          const next = new Set(current);

                          if (event.target.checked) {
                            next.add(option.value);
                          } else {
                            next.delete(option.value);
                          }

                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded border-line text-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span className="truncate">{option.label}</span>
                      {typeof option.count === "number" ? (
                        <span className="shrink-0 rounded-md bg-bg px-1.5 py-0.5 text-xs font-semibold text-fgMuted">
                          {option.count}
                        </span>
                      ) : null}
                    </span>
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
