"use client";

import React from "react";
import { useState } from "react";
import {
  getWatchProviderFallbackUrl,
  groupWatchProviderLinksByOfferType,
  type WatchProviderLink,
  type WatchProviderOfferType
} from "@/lib/watch-providers";

interface WatchAvailabilityProps {
  providers: WatchProviderLink[];
}

interface WatchAvailabilityGroup {
  offerType: WatchProviderOfferType | "other";
  label: string;
  providers: WatchProviderLink[];
}

const DEFAULT_VISIBLE_WATCH_PROVIDERS = 6;

export function WatchAvailability({ providers }: WatchAvailabilityProps) {
  const [expanded, setExpanded] = useState(false);
  const groups = groupWatchProviderLinksByOfferType(providers);

  if (groups.length === 0) {
    return null;
  }

  const totalProviders = groups.reduce((count, group) => count + group.providers.length, 0);
  const hasOverflow = totalProviders > DEFAULT_VISIBLE_WATCH_PROVIDERS;
  const visibleGroups = expanded ? groups : limitWatchAvailabilityGroups(groups, DEFAULT_VISIBLE_WATCH_PROVIDERS);

  return (
    <div className="rounded-lg bg-bgSoft px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-fgMuted">Where to Watch</p>
      <div className="mt-2 grid gap-2">
        {visibleGroups.map((group) => (
          <div key={group.offerType} className="grid gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fgMuted">{group.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.providers.map((provider) => {
                const href = provider.url ?? getWatchProviderFallbackUrl(provider.name);

                return href ? (
                  <a
                    key={`${group.offerType}-${provider.name}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-line bg-card px-2.5 py-1 text-xs font-medium text-fg transition hover:border-accent hover:text-accent"
                  >
                    {provider.name}
                  </a>
                ) : (
                  <span
                    key={`${group.offerType}-${provider.name}`}
                    className="rounded-md border border-line bg-card px-2.5 py-1 text-xs font-medium text-fg"
                  >
                    {provider.name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {hasOverflow ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 text-xs font-semibold uppercase tracking-wide text-accent transition hover:text-accentHover"
        >
          {expanded ? "Show fewer watch options" : `Show all ${totalProviders} watch options`}
        </button>
      ) : null}
    </div>
  );
}

function limitWatchAvailabilityGroups(
  groups: WatchAvailabilityGroup[],
  maxProviders: number
): WatchAvailabilityGroup[] {
  let remaining = maxProviders;
  const limitedGroups: WatchAvailabilityGroup[] = [];

  for (const group of groups) {
    if (remaining <= 0) {
      break;
    }

    const nextProviders = group.providers.slice(0, remaining);
    remaining -= nextProviders.length;

    if (nextProviders.length > 0) {
      limitedGroups.push({
        ...group,
        providers: nextProviders
      });
    }
  }

  return limitedGroups;
}
