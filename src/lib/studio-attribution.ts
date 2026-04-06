import type { TitleType } from "@prisma/client";
import {
  normalizeWatchProviderLinks,
  type WatchProviderLink
} from "@/lib/watch-providers";

export const MAX_PRODUCTION_ENTITIES = 20;
export const STUDIO_ATTRIBUTION_SOURCES = [
  "PRODUCTION_COMPANY",
  "NETWORK",
  "EXCLUSIVE_STREAMING_PROVIDER"
] as const;

export type StudioAttributionSource = (typeof STUDIO_ATTRIBUTION_SOURCES)[number];

export interface StudioAttribution {
  label: string;
  source: StudioAttributionSource;
}

type SupportedStudioLabel = "Netflix" | "HBO" | "Apple TV";

const EXCLUSIVE_STREAMING_PROVIDER_LABELS = new Map<string, SupportedStudioLabel>([
  ["Netflix", "Netflix"],
  ["Apple TV+", "Apple TV"],
  ["Max", "HBO"],
  ["HBO Max", "HBO"],
  ["HBO", "HBO"]
]);

export function normalizeProductionEntityNames(values: string[]): string[] {
  const normalized = new Set<string>();

  for (const value of values) {
    const name = value.trim();
    if (!name) {
      continue;
    }

    if (!normalized.has(name)) {
      normalized.add(name);
    }
  }

  return Array.from(normalized).slice(0, MAX_PRODUCTION_ENTITIES);
}

export function inferStudioAttribution(options: {
  type: TitleType | "MOVIE" | "TV_SHOW";
  productionCompanies: string[];
  productionNetworks: string[];
  watchProviderLinks: WatchProviderLink[];
}): StudioAttribution | null {
  if (options.type === "TV_SHOW") {
    const networkBrands = collectSupportedBrands(options.productionNetworks);
    if (networkBrands.size > 1) {
      return null;
    }
    if (networkBrands.size === 1) {
      return {
        label: Array.from(networkBrands)[0],
        source: "NETWORK"
      };
    }
  }

  const productionCompanyBrands = collectSupportedBrands(options.productionCompanies);
  if (productionCompanyBrands.size > 1) {
    return null;
  }
  if (productionCompanyBrands.size === 1) {
    return {
      label: Array.from(productionCompanyBrands)[0],
      source: "PRODUCTION_COMPANY"
    };
  }

  return inferFromExclusiveStreamingProvider(options.watchProviderLinks);
}

export function isLikelyStudioAttribution(attribution: StudioAttribution | null | undefined): boolean {
  return attribution?.source === "EXCLUSIVE_STREAMING_PROVIDER";
}

function collectSupportedBrands(values: string[]): Set<SupportedStudioLabel> {
  const brands = new Set<SupportedStudioLabel>();

  for (const value of normalizeProductionEntityNames(values)) {
    const brand = mapEntityNameToBrand(value);
    if (brand) {
      brands.add(brand);
    }
  }

  return brands;
}

function inferFromExclusiveStreamingProvider(watchProviderLinks: WatchProviderLink[]): StudioAttribution | null {
  const normalizedLinks = normalizeWatchProviderLinks(watchProviderLinks);
  const streamingProviders = normalizedLinks.filter((provider) =>
    (provider.offerTypes ?? []).some((offerType) => offerType === "subscription" || offerType === "free" || offerType === "ads")
  );

  if (streamingProviders.length !== 1) {
    return null;
  }

  const label = EXCLUSIVE_STREAMING_PROVIDER_LABELS.get(streamingProviders[0].name);
  if (!label) {
    return null;
  }

  return {
    label,
    source: "EXCLUSIVE_STREAMING_PROVIDER"
  };
}

function mapEntityNameToBrand(name: string): SupportedStudioLabel | null {
  const normalized = name.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized.includes("netflix")) {
    return "Netflix";
  }

  if (
    normalized === "hbo" ||
    normalized.startsWith("hbo ") ||
    normalized.includes("home box office")
  ) {
    return "HBO";
  }

  if (
    normalized === "apple tv+" ||
    normalized === "apple tv plus" ||
    normalized === "apple studios" ||
    normalized === "apple original films" ||
    (normalized.includes("apple") && normalized.includes("tv"))
  ) {
    return "Apple TV";
  }

  return null;
}
