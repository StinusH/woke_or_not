export interface WatchProviderLink {
  name: string;
  url: string | null;
}

const WATCH_PROVIDER_FALLBACK_URLS = new Map<string, string>([
  ["amazon prime video", "https://www.primevideo.com/"],
  ["apple tv plus", "https://tv.apple.com/"],
  ["apple tv+", "https://tv.apple.com/"],
  ["crunchyroll", "https://www.crunchyroll.com/"],
  ["disney plus", "https://www.disneyplus.com/"],
  ["disney+", "https://www.disneyplus.com/"],
  ["hbo", "https://www.max.com/"],
  ["hbo max", "https://www.max.com/"],
  ["hulu", "https://www.hulu.com/"],
  ["max", "https://www.max.com/"],
  ["netflix", "https://www.netflix.com/"],
  ["paramount plus", "https://www.paramountplus.com/"],
  ["paramount+", "https://www.paramountplus.com/"],
  ["peacock", "https://www.peacocktv.com/"],
  ["prime video", "https://www.primevideo.com/"],
  ["tubi", "https://tubitv.com/"],
  ["youtube", "https://www.youtube.com/"]
]);

export function normalizeWatchProviders(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function getWatchProviderFallbackUrl(name: string): string | null {
  return WATCH_PROVIDER_FALLBACK_URLS.get(name.trim().toLowerCase()) ?? null;
}

export function normalizeWatchProviderLinks(values: WatchProviderLink[]): WatchProviderLink[] {
  const seen = new Set<string>();
  const normalized: WatchProviderLink[] = [];

  for (const value of values) {
    const name = value.name.trim();
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push({
      name,
      url: normalizeWatchProviderUrl(value.url)
    });
  }

  return normalized;
}

export function parseWatchProviderLinks(value: unknown): WatchProviderLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return normalizeWatchProviderLinks(
    value.flatMap((entry) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }

      const candidate = entry as Record<string, unknown>;

      return typeof candidate.name === "string"
        ? [
            {
              name: candidate.name,
              url: typeof candidate.url === "string" ? candidate.url : null
            }
          ]
        : [];
    })
  );
}

export function syncWatchProviderLinks(
  providerNames: string[],
  existingLinks: WatchProviderLink[]
): WatchProviderLink[] {
  const names = normalizeWatchProviders(providerNames);
  const linksByName = new Map(
    normalizeWatchProviderLinks(existingLinks).map((entry) => [entry.name.toLowerCase(), entry])
  );

  return names.map((name) => {
    const existing = linksByName.get(name.toLowerCase());

    return {
      name,
      url: existing?.url ?? null
    };
  });
}

function normalizeWatchProviderUrl(value: string | null): string | null {
  const url = value?.trim();
  return url ? url : null;
}
