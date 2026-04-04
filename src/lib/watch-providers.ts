export const WATCH_PROVIDER_OFFER_TYPES = ["subscription", "free", "ads", "rent", "buy"] as const;
export const MAX_WATCH_PROVIDERS = 12;
export type WatchProviderOfferType = (typeof WATCH_PROVIDER_OFFER_TYPES)[number];

export interface WatchProviderLink {
  name: string;
  url: string | null;
  offerTypes?: WatchProviderOfferType[];
}

const CANONICAL_WATCH_PROVIDER_NAMES = new Map<string, string>([
  ["amazon video", "Amazon Video"],
  ["amazon prime", "Amazon Prime"],
  ["apple tv+", "Apple TV+"],
  ["apple tv plus", "Apple TV+"],
  ["apple tv store", "Apple TV Store"],
  ["crunchyroll", "Crunchyroll"],
  ["disney plus", "Disney Plus"],
  ["disney+", "Disney Plus"],
  ["fandango at home", "Fandango At Home"],
  ["google play movies", "Google Play Movies"],
  ["hbo", "HBO"],
  ["hbo max", "HBO Max"],
  ["hulu", "Hulu"],
  ["lifetime movie club", "Lifetime Movie Club"],
  ["max", "Max"],
  ["mgm+", "MGM+"],
  ["mgm plus", "MGM+"],
  ["netflix", "Netflix"],
  ["paramount plus", "Paramount+"],
  ["paramount+", "Paramount+"],
  ["peacock", "Peacock"],
  ["plex", "Plex"],
  ["rakuten tv", "Rakuten TV"],
  ["sf anytime", "SF Anytime"],
  ["tubi", "Tubi"],
  ["viaplay", "Viaplay"],
  ["youtube", "YouTube"]
]);

const WATCH_PROVIDER_FALLBACK_URLS = new Map<string, string>([
  ["amazon video", "https://www.primevideo.com/"],
  ["amazon prime", "https://www.primevideo.com/"],
  ["amazon prime video", "https://www.primevideo.com/"],
  ["apple tv store", "https://tv.apple.com/"],
  ["apple tv plus", "https://tv.apple.com/"],
  ["apple tv+", "https://tv.apple.com/"],
  ["crunchyroll", "https://www.crunchyroll.com/"],
  ["disney plus", "https://www.disneyplus.com/"],
  ["disney+", "https://www.disneyplus.com/"],
  ["fandango at home", "https://www.vudu.com/"],
  ["google play movies", "https://play.google.com/store/movies"],
  ["hbo", "https://www.max.com/"],
  ["hbo max", "https://www.max.com/"],
  ["hulu", "https://www.hulu.com/"],
  ["max", "https://www.max.com/"],
  ["mgm+", "https://www.mgmplus.com/"],
  ["mgm plus", "https://www.mgmplus.com/"],
  ["netflix", "https://www.netflix.com/"],
  ["paramount plus", "https://www.paramountplus.com/"],
  ["paramount+", "https://www.paramountplus.com/"],
  ["peacock", "https://www.peacocktv.com/"],
  ["plex", "https://www.plex.tv/"],
  ["prime video", "https://www.primevideo.com/"],
  ["rakuten tv", "https://www.rakuten.tv/"],
  ["sf anytime", "https://www.sfanytime.com/"],
  ["tubi", "https://tubitv.com/"],
  ["viaplay", "https://viaplay.com/"],
  ["youtube", "https://www.youtube.com/"]
]);

export const KNOWN_WATCH_PROVIDERS = Array.from(
  new Set(CANONICAL_WATCH_PROVIDER_NAMES.values())
).sort((left, right) => left.localeCompare(right));

const WATCH_PROVIDER_OFFER_TYPE_LABELS: Record<WatchProviderOfferType | "other", string> = {
  subscription: "Stream",
  free: "Free",
  ads: "Ads",
  rent: "Rent",
  buy: "Buy",
  other: "Available"
};

export function normalizeWatchProviders(values: string[]): string[] {
  const normalized = new Set<string>();

  for (const value of values) {
    const name = normalizeWatchProviderName(value);
    if (name) {
      normalized.add(name);
    }
  }

  return Array.from(normalized).slice(0, MAX_WATCH_PROVIDERS);
}

export function getWatchProviderOfferTypeLabel(offerType: WatchProviderOfferType | "other"): string {
  return WATCH_PROVIDER_OFFER_TYPE_LABELS[offerType];
}

export function getWatchProviderFallbackUrl(name: string): string | null {
  const normalizedName = normalizeWatchProviderName(name);
  return normalizedName ? WATCH_PROVIDER_FALLBACK_URLS.get(normalizedName.toLowerCase()) ?? null : null;
}

export function normalizeWatchProviderLinks(values: WatchProviderLink[]): WatchProviderLink[] {
  const normalizedByKey = new Map<string, WatchProviderLink>();

  for (const value of values) {
    const name = normalizeWatchProviderName(value.name);
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    const existing = normalizedByKey.get(key);
    const nextOfferTypes = normalizeWatchProviderOfferTypes(value.offerTypes ?? []);

    if (existing) {
      existing.url = existing.url ?? normalizeWatchProviderUrl(value.url);
      const mergedOfferTypes = normalizeWatchProviderOfferTypes([...(existing.offerTypes ?? []), ...nextOfferTypes]);

      if (mergedOfferTypes.length > 0) {
        existing.offerTypes = mergedOfferTypes;
      }
      continue;
    }

    normalizedByKey.set(
      key,
      buildWatchProviderLink(name, normalizeWatchProviderUrl(value.url), nextOfferTypes)
    );
  }

  return Array.from(normalizedByKey.values()).slice(0, MAX_WATCH_PROVIDERS);
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
              url: typeof candidate.url === "string" ? candidate.url : null,
              offerTypes: Array.isArray(candidate.offerTypes) ? candidate.offerTypes : undefined
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

    return buildWatchProviderLink(name, existing?.url ?? null, normalizeWatchProviderOfferTypes(existing?.offerTypes ?? []));
  });
}

export function groupWatchProviderLinksByOfferType(
  values: WatchProviderLink[]
): Array<{ offerType: WatchProviderOfferType | "other"; label: string; providers: WatchProviderLink[] }> {
  const normalized = normalizeWatchProviderLinks(values);
  const groups = new Map<WatchProviderOfferType | "other", WatchProviderLink[]>();

  for (const offerType of [...WATCH_PROVIDER_OFFER_TYPES, "other"] as const) {
    groups.set(offerType, []);
  }

  for (const link of normalized) {
    const offerTypes = normalizeWatchProviderOfferTypes(link.offerTypes ?? []);

    if (offerTypes.length === 0) {
      groups.get("other")?.push(link);
      continue;
    }

    for (const offerType of offerTypes) {
      groups.get(offerType)?.push(link);
    }
  }

  return Array.from(groups.entries())
    .filter(([, providers]) => providers.length > 0)
    .map(([offerType, providers]) => ({
      offerType,
      label: getWatchProviderOfferTypeLabel(offerType),
      providers
    }));
}

function normalizeWatchProviderUrl(value: string | null): string | null {
  const url = value?.trim();
  return url ? url : null;
}

function normalizeWatchProviderOfferTypes(values: unknown[]): WatchProviderOfferType[] {
  const normalized = new Set<WatchProviderOfferType>();

  for (const value of values) {
    if (typeof value === "string" && WATCH_PROVIDER_OFFER_TYPES.includes(value as WatchProviderOfferType)) {
      normalized.add(value as WatchProviderOfferType);
    }
  }

  return WATCH_PROVIDER_OFFER_TYPES.filter((value) => normalized.has(value));
}

function buildWatchProviderLink(
  name: string,
  url: string | null,
  offerTypes: WatchProviderOfferType[]
): WatchProviderLink {
  return offerTypes.length > 0 ? { name, url, offerTypes } : { name, url };
}

function normalizeWatchProviderName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const normalized = trimmed.toLowerCase();

  if (normalized === "netflix standard with ads") {
    return "Netflix";
  }

  if (
    normalized === "amazon prime video" ||
    normalized === "amazon prime video with ads" ||
    normalized === "amazon prime video free with ads" ||
    normalized === "prime video" ||
    normalized === "prime video with ads"
  ) {
    return "Amazon Prime";
  }

  if (normalized === "hbo max amazon channel") {
    return "HBO Max";
  }

  if (
    normalized === "lifetime movie club" ||
    normalized === "lifetime movie club apple tv channel" ||
    normalized === "lifetime movie club amazon channel"
  ) {
    return "Lifetime Movie Club";
  }

  if (normalized === "apple tv amazon channel") {
    return "Apple TV";
  }

  if (normalized === "fandango at home free") {
    return "Fandango At Home";
  }

  if (normalized === "plex channel") {
    return "Plex";
  }

  if (normalized.startsWith("peacock premium")) {
    return "Peacock";
  }

  if (normalized.startsWith("paramount plus") || normalized.startsWith("paramount+")) {
    return "Paramount+";
  }

  if (normalized.startsWith("mgm plus") || normalized.startsWith("mgm+")) {
    return "MGM+";
  }

  const canonicalName = CANONICAL_WATCH_PROVIDER_NAMES.get(normalized);
  if (canonicalName) {
    return canonicalName;
  }

  return trimmed;
}
