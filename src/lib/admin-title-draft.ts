import { CrewJobType, TitleStatus, TitleType } from "@prisma/client";
import type { AdminTitlePayload } from "@/lib/validation";
import { slugify } from "@/lib/slugs";

export interface GenreOption {
  slug: string;
  name: string;
}

export interface AdminTitleDraft {
  slug: string;
  name: string;
  type: TitleType;
  releaseDate: string;
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
  runtimeMinutes: number | null;
  synopsis: string;
  posterUrl: string | null;
  trailerYoutubeUrl: string | null;
  imdbUrl: string | null;
  watchProviders: string[];
  genreNames: string[];
  cast: Array<{ name: string; roleName: string; billingOrder: number }>;
  crew: Array<{ name: string; jobType: CrewJobType }>;
}

const defaultWokeFactors: AdminTitleDraft["wokeFactors"] = [
  {
    label: "Representation breadth",
    weight: 15,
    displayOrder: 1,
    notes: ""
  }
];

export function createEmptyAdminTitleDraft(): AdminTitleDraft {
  return {
    slug: "new-title-slug",
    name: "",
    type: "MOVIE",
    releaseDate: "",
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
    wokeScore: 50,
    wokeSummary: "",
    status: "DRAFT",
    genreSlugs: [],
    cast: [{ name: "", roleName: "", billingOrder: 1 }],
    crew: [{ name: "", jobType: "DIRECTOR" }],
    wokeFactors: defaultWokeFactors
  };
}

export function buildAdminTitlePayload(draft: AdminTitleDraft): AdminTitlePayload {
  return {
    slug: draft.slug,
    name: draft.name,
    type: draft.type,
    releaseDate: draft.releaseDate,
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
    watchProviders: normalizeStringList(draft.watchProviders),
    wokeScore: draft.wokeScore,
    wokeSummary: draft.wokeSummary,
    status: draft.status,
    genreSlugs: draft.genreSlugs,
    cast: draft.cast.filter((entry) => entry.name.trim() && entry.roleName.trim()),
    crew: draft.crew.filter((entry) => entry.name.trim()),
    wokeFactors: draft.wokeFactors
      .filter((factor) => factor.label.trim())
      .map((factor, index) => ({
        label: factor.label,
        weight: factor.weight,
        displayOrder: index + 1,
        notes: emptyToNull(factor.notes)
      }))
  };
}

export function applyMetadataAutofill(
  current: AdminTitleDraft,
  metadata: MetadataAutofillDraft,
  genres: GenreOption[]
): AdminTitleDraft {
  return {
    ...current,
    slug: metadata.slug || current.slug || slugify(metadata.name),
    name: metadata.name || current.name,
    type: metadata.type,
    releaseDate: metadata.releaseDate || current.releaseDate,
    runtimeMinutes: metadata.runtimeMinutes,
    synopsis: metadata.synopsis || current.synopsis,
    posterUrl: metadata.posterUrl ?? current.posterUrl,
    trailerYoutubeUrl: metadata.trailerYoutubeUrl ?? current.trailerYoutubeUrl,
    imdbUrl: metadata.imdbUrl ?? current.imdbUrl,
    watchProviders: metadata.watchProviders.length > 0 ? metadata.watchProviders : current.watchProviders,
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

function normalizeStringList(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function mapGenreNamesToSlugs(names: string[], genres: GenreOption[]): string[] {
  const aliases = new Map<string, string>([
    ["science fiction", "sci-fi"]
  ]);

  const genreBySlug = new Map(genres.map((genre) => [genre.slug, genre.slug]));
  const genreByName = new Map(genres.map((genre) => [genre.name.toLowerCase(), genre.slug]));

  return Array.from(
    new Set(
      names
        .map((name) => {
          const normalizedName = name.trim().toLowerCase();
          const alias = aliases.get(normalizedName);
          if (alias && genreBySlug.has(alias)) {
            return alias;
          }

          return genreByName.get(normalizedName) ?? genreBySlug.get(slugify(name));
        })
        .filter((value): value is string => Boolean(value))
    )
  );
}
