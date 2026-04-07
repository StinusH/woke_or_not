import { CrewJobType, TitleStatus, TitleType } from "@prisma/client";
import type { AdminTitlePayload } from "@/lib/validation";
import { slugify } from "@/lib/slugs";
import {
  normalizeWatchProviderLinks,
  normalizeWatchProviders,
  syncWatchProviderLinks,
  type WatchProviderLink
} from "@/lib/watch-providers";
import {
  inferStudioAttribution,
  normalizeProductionEntityNames,
  type StudioAttribution
} from "@/lib/studio-attribution";
import { canonicalizeWokeFactors, getDefaultWokeFactors } from "@/lib/woke-factors";
import { calculateWokeScoreFromFactors } from "@/lib/woke-score";

export interface GenreOption {
  slug: string;
  name: string;
}

export interface AdminTitleDraft {
  slug: string;
  name: string;
  type: TitleType;
  originalLanguage: string;
  releaseDate: string;
  ageRating: string;
  runtimeMinutes: number | null;
  synopsis: string;
  posterUrl: string;
  trailerYoutubeUrl: string;
  imdbUrl: string;
  imdbRating: string;
  rottenTomatoesUrl: string;
  rottenTomatoesCriticsScore: string;
  rottenTomatoesAudienceScore: string;
  amazonUrl: string;
  productionCompanies: string[];
  productionNetworks: string[];
  studioAttribution: StudioAttribution | null;
  watchProviders: string[];
  watchProviderLinks: WatchProviderLink[];
  wokeScore: number;
  wokeSummary: string;
  socialPostDraft: string;
  status: TitleStatus;
  genreSlugs: string[];
  cast: Array<{ name: string; roleName: string; billingOrder: number }>;
  crew: Array<{ name: string; jobType: CrewJobType }>;
  wokeFactors: Array<{ label: string; weight: number; displayOrder: number; notes: string }>;
}

export interface MetadataAutofillDraft {
  slug: string;
  name: string;
  type: TitleType;
  originalLanguage?: string | null;
  releaseDate: string;
  ageRating: string | null;
  runtimeMinutes: number | null;
  synopsis: string;
  posterUrl: string | null;
  trailerYoutubeUrl: string | null;
  imdbUrl: string | null;
  imdbRating?: number | null;
  rottenTomatoesUrl?: string | null;
  rottenTomatoesCriticsScore?: number | null;
  rottenTomatoesAudienceScore?: number | null;
  productionCompanies?: string[];
  productionNetworks?: string[];
  studioAttribution?: StudioAttribution | null;
  watchProviders: string[];
  watchProviderLinks: WatchProviderLink[];
  genreNames: string[];
  cast: Array<{ name: string; roleName: string; billingOrder: number }>;
  crew: Array<{ name: string; jobType: CrewJobType }>;
}

export function createEmptyAdminTitleDraft(): AdminTitleDraft {
  const wokeFactors = getDefaultWokeFactors();

  return {
    slug: "new-title-slug",
    name: "",
    type: "MOVIE",
    originalLanguage: "",
    releaseDate: "",
    ageRating: "",
    runtimeMinutes: null,
    synopsis: "",
    posterUrl: "",
    trailerYoutubeUrl: "",
    imdbUrl: "",
    imdbRating: "",
    rottenTomatoesUrl: "",
    rottenTomatoesCriticsScore: "",
    rottenTomatoesAudienceScore: "",
    amazonUrl: "",
    productionCompanies: [],
    productionNetworks: [],
    studioAttribution: null,
    watchProviders: [],
    watchProviderLinks: [],
    wokeScore: calculateWokeScoreFromFactors(wokeFactors),
    wokeSummary: "",
    socialPostDraft: "",
    status: "PUBLISHED",
    genreSlugs: [],
    cast: [{ name: "", roleName: "", billingOrder: 1 }],
    crew: [{ name: "", jobType: "DIRECTOR" }],
    wokeFactors
  };
}

export function guessRottenTomatoesUrl(name: string): string {
  const slug = slugify(name).replace(/-/g, "_");
  return slug ? `https://www.rottentomatoes.com/m/${slug}` : "";
}

export function buildAdminTitlePayload(draft: AdminTitleDraft): AdminTitlePayload {
  const watchProviders = normalizeWatchProviders(draft.watchProviders);
  const watchProviderLinks = syncWatchProviderLinks(watchProviders, normalizeWatchProviderLinks(draft.watchProviderLinks));
  const productionCompanies = normalizeProductionEntityNames(draft.productionCompanies);
  const productionNetworks = normalizeProductionEntityNames(draft.productionNetworks);
  const wokeFactors = canonicalizeWokeFactors(draft.wokeFactors, { fillMissing: true, rejectUnknown: true }).factors.map((factor) => ({
    label: factor.label,
    weight: factor.weight,
    displayOrder: factor.displayOrder,
    notes: emptyToNull(factor.notes)
  }));

  return {
    slug: draft.slug,
    name: draft.name,
    type: draft.type,
    originalLanguage: emptyToNull(draft.originalLanguage)?.toLowerCase() ?? null,
    releaseDate: draft.releaseDate,
    ageRating: emptyToNull(draft.ageRating),
    runtimeMinutes: draft.runtimeMinutes ?? null,
    synopsis: draft.synopsis,
    posterUrl: emptyToNull(draft.posterUrl),
    trailerYoutubeUrl: emptyToNull(draft.trailerYoutubeUrl),
    imdbUrl: emptyToNull(draft.imdbUrl),
    imdbRating: emptyToNumber(draft.imdbRating),
    rottenTomatoesUrl: emptyToNull(draft.rottenTomatoesUrl),
    rottenTomatoesCriticsScore: emptyToInteger(draft.rottenTomatoesCriticsScore),
    rottenTomatoesAudienceScore: emptyToInteger(draft.rottenTomatoesAudienceScore),
    amazonUrl: emptyToNull(draft.amazonUrl),
    productionCompanies,
    productionNetworks,
    studioAttribution: inferStudioAttribution({
      type: draft.type,
      productionCompanies,
      productionNetworks,
      watchProviderLinks
    }),
    watchProviders,
    watchProviderLinks,
    wokeScore: draft.wokeScore,
    wokeSummary: draft.wokeSummary,
    socialPostDraft: emptyToNull(draft.socialPostDraft),
    status: draft.status,
    genreSlugs: draft.genreSlugs,
    cast: draft.cast.filter((entry) => entry.name.trim() && entry.roleName.trim()),
    crew: draft.crew.filter((entry) => entry.name.trim()),
    wokeFactors
  };
}

export function normalizeAdminDraftWokeFactors(
  factors: Array<{ label: string; weight: number; displayOrder: number; notes: string | null }>
): {
  factors: AdminTitleDraft["wokeFactors"];
  unknownLabels: string[];
} {
  const normalized = canonicalizeWokeFactors(factors, { fillMissing: true });

  return {
    factors: normalized.factors.map((factor) => ({
      label: factor.label,
      weight: factor.weight,
      displayOrder: factor.displayOrder,
      notes: factor.notes
    })),
    unknownLabels: normalized.unknownLabels
  };
}

export function applyMetadataAutofill(
  current: AdminTitleDraft,
  metadata: MetadataAutofillDraft,
  genres: GenreOption[]
): AdminTitleDraft {
  const nextName = metadata.name || current.name;
  const nextWatchProviders =
    metadata.watchProviders.length > 0 ? normalizeWatchProviders(metadata.watchProviders) : current.watchProviders;
  const nextWatchProviderLinks =
    metadata.watchProviderLinks.length > 0
      ? syncWatchProviderLinks(nextWatchProviders, normalizeWatchProviderLinks(metadata.watchProviderLinks))
      : current.watchProviderLinks;
  const metadataProductionCompanies = metadata.productionCompanies ?? [];
  const metadataProductionNetworks = metadata.productionNetworks ?? [];
  const nextProductionCompanies =
    metadataProductionCompanies.length > 0
      ? normalizeProductionEntityNames(metadataProductionCompanies)
      : current.productionCompanies;
  const nextProductionNetworks =
    metadataProductionNetworks.length > 0
      ? normalizeProductionEntityNames(metadataProductionNetworks)
      : current.productionNetworks;
  const currentRottenTomatoesGuess = guessRottenTomatoesUrl(current.name);
  const shouldUpdateRottenTomatoesUrl =
    !current.rottenTomatoesUrl.trim() || current.rottenTomatoesUrl === currentRottenTomatoesGuess;

  return {
    ...current,
    slug: metadata.slug || current.slug || slugify(metadata.name),
    name: nextName,
    type: metadata.type,
    originalLanguage: metadata.originalLanguage ?? current.originalLanguage,
    releaseDate: metadata.releaseDate || current.releaseDate,
    ageRating: metadata.ageRating ?? current.ageRating,
    runtimeMinutes: metadata.runtimeMinutes,
    synopsis: metadata.synopsis || current.synopsis,
    posterUrl: metadata.posterUrl ?? current.posterUrl,
    trailerYoutubeUrl: metadata.trailerYoutubeUrl ?? current.trailerYoutubeUrl,
    imdbUrl: metadata.imdbUrl ?? current.imdbUrl,
    imdbRating: typeof metadata.imdbRating === "number" ? metadata.imdbRating.toString() : current.imdbRating,
    rottenTomatoesUrl: shouldUpdateRottenTomatoesUrl
      ? metadata.rottenTomatoesUrl ?? guessRottenTomatoesUrl(nextName)
      : current.rottenTomatoesUrl,
    rottenTomatoesCriticsScore:
      typeof metadata.rottenTomatoesCriticsScore === "number"
        ? metadata.rottenTomatoesCriticsScore.toString()
        : current.rottenTomatoesCriticsScore,
    rottenTomatoesAudienceScore:
      typeof metadata.rottenTomatoesAudienceScore === "number"
        ? metadata.rottenTomatoesAudienceScore.toString()
        : current.rottenTomatoesAudienceScore,
    productionCompanies: nextProductionCompanies,
    productionNetworks: nextProductionNetworks,
    studioAttribution:
      metadata.studioAttribution ??
      inferStudioAttribution({
        type: metadata.type,
        productionCompanies: nextProductionCompanies,
        productionNetworks: nextProductionNetworks,
        watchProviderLinks: nextWatchProviderLinks
      }),
    watchProviders: nextWatchProviders,
    watchProviderLinks: nextWatchProviderLinks,
    genreSlugs: mapGenreNamesToSlugs(metadata.genreNames, genres),
    cast: metadata.cast.length > 0 ? metadata.cast : current.cast,
    crew: metadata.crew.length > 0 ? metadata.crew : current.crew
  };
}

export function syncSlugFromName(name: string): string {
  return slugify(name) || "new-title-slug";
}

function emptyToNull(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function emptyToNumber(value: string): number | null {
  return value.trim() ? Number(value) : null;
}

function emptyToInteger(value: string): number | null {
  return value.trim() ? Number.parseInt(value, 10) : null;
}

export function mapGenreNamesToSlugs(names: string[], genres: GenreOption[]): string[] {
  const aliases = new Map<string, string[]>([
    ["action & adventure", ["action", "adventure"]],
    ["children", ["kids"]],
    ["kids", ["kids"]],
    ["sci-fi & fantasy", ["sci-fi", "fantasy"]],
    ["science fiction", ["sci-fi"]]
  ]);

  const genreBySlug = new Map(genres.map((genre) => [genre.slug, genre.slug]));
  const genreByName = new Map(genres.map((genre) => [genre.name.toLowerCase(), genre.slug]));

  return Array.from(
    new Set(
      names
        .flatMap((name) => {
          const normalizedName = name.trim().toLowerCase();
          const alias = aliases.get(normalizedName);
          if (alias) {
            return alias.filter((slug) => genreBySlug.has(slug));
          }

          const mappedGenre = genreByName.get(normalizedName) ?? genreBySlug.get(slugify(name));
          return mappedGenre ? [mappedGenre] : [];
        })
    )
  );
}
