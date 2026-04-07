"use client";

import React from "react";
import { MultiSelectFilter } from "@/components/multi-select-filter";

interface PlatformFilterProps {
  options: string[];
  selected: string[];
}

export function PlatformFilter({ options, selected }: PlatformFilterProps) {
  return (
    <MultiSelectFilter
      label="Platform"
      name="platform"
      options={options.map((platform) => ({ value: platform, label: platform }))}
      selected={selected}
      searchPlaceholder="Filter platforms..."
      emptyMessage="No platforms match that filter."
    />
  );
}
