import { CrewJobType, TitleStatus, TitleType } from "@prisma/client";
import type { AdminTitlePayload } from "@/lib/validation";
import { slugify } from "@/lib/slugs";
import {
  normalizeWatchProviderLinks,
  normalizeWatchProviders,
  syncWatchProviderLinks,
  type WatchProviderLink
} from "@/lib/watch-providers";
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
  watchProviders: string[];
  watchProviderLinks: WatchProviderLink[];
  wokeScore: number;
  wokeSummary: string;
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
  releaseDate: string;
  ageRating: string | null;
  runtimeMinutes: number | null;
  synopsis: string;
  posterUrl: string | null;
  trailerYoutubeUrl: string | null;
  imdbUrl: string | null;
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
    watchProviders: [],
    watchProviderLinks: [],
    wokeScore: calculateWokeScoreFromFactors(wokeFactors),
    wokeSummary: "",
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
    watchProviders,
    watchProviderLinks: syncWatchProviderLinks(watchProviders, normalizeWatchProviderLinks(draft.watchProviderLinks)),
    wokeScore: draft.wokeScore,
    wokeSummary: draft.wokeSummary,
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
  const currentRottenTomatoesGuess = guessRottenTomatoesUrl(current.name);
  const shouldUpdateRottenTomatoesUrl =
    !current.rottenTomatoesUrl.trim() || current.rottenTomatoesUrl === currentRottenTomatoesGuess;

  return {
    ...current,
    slug: metadata.slug || current.slug || slugify(metadata.name),
    name: nextName,
    type: metadata.type,
    releaseDate: metadata.releaseDate || current.releaseDate,
    ageRating: metadata.ageRating ?? current.ageRating,
    runtimeMinutes: metadata.runtimeMinutes,
    synopsis: metadata.synopsis || current.synopsis,
    posterUrl: metadata.posterUrl ?? current.posterUrl,
    trailerYoutubeUrl: metadata.trailerYoutubeUrl ?? current.trailerYoutubeUrl,
    imdbUrl: metadata.imdbUrl ?? current.imdbUrl,
    rottenTomatoesUrl: shouldUpdateRottenTomatoesUrl ? guessRottenTomatoesUrl(nextName) : current.rottenTomatoesUrl,
    watchProviders: metadata.watchProviders.length > 0 ? metadata.watchProviders : current.watchProviders,
    watchProviderLinks: metadata.watchProviderLinks.length > 0 ? metadata.watchProviderLinks : current.watchProviderLinks,
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
