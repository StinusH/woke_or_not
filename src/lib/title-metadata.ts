import { CrewJobType, TitleType } from "@prisma/client";
import { slugify } from "@/lib/slugs";
import type { MetadataAutofillDraft } from "@/lib/admin-title-draft";
import {
  ExternalScoreProviderError,
  fetchExternalScoresFromImdbUrl,
  hasExternalScoreProviderConfig,
  type RefreshedExternalScores
} from "@/lib/external-scores";
import {
  getWatchProviderFallbackUrl,
  normalizeWatchProviderLinks,
  type WatchProviderOfferType,
  type WatchProviderLink
} from "@/lib/watch-providers";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w780";
const DEFAULT_WATCH_PROVIDER_REGION = "US";

type SearchMediaType = "movie" | "tv";

interface SearchTitleMetadataOptions {
  query: string;
  year?: number;
  type?: TitleType;
}

interface LookupTitleMetadataOptions {
  providerId: number;
  type: TitleType;
  warnings?: string[];
}

export class TitleMetadataProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "tmdb_not_configured" | "tmdb_invalid_credentials" | "tmdb_request_failed"
  ) {
    super(message);
    this.name = "TitleMetadataProviderError";
  }
}

export interface TitleMetadataSearchResult {
  provider: "TMDB";
  providerId: number;
  type: TitleType;
  name: string;
  releaseDate: string | null;
  overview: string | null;
  posterUrl: string | null;
}

interface TmdbSearchResponse {
  results: TmdbSearchResult[];
}

interface TmdbSearchResult {
  id: number;
  popularity: number;
  overview: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  title?: string;
  name?: string;
}

interface TmdbCreditPerson {
  name: string;
  job?: string;
  department?: string;
  roles?: Array<{ character?: string }>;
  character?: string;
  order?: number;
}

interface TmdbVideo {
  site: string;
  type: string;
  official?: boolean;
  key: string;
}

interface TmdbGenre {
  name: string;
}

interface TmdbReleaseDate {
  certification: string;
  type: number;
}

interface TmdbReleaseDatesRegion {
  iso_3166_1: string;
  release_dates: TmdbReleaseDate[];
}

interface TmdbContentRatingRegion {
  iso_3166_1: string;
  rating: string;
}

interface TmdbWatchProvider {
  provider_id: number;
  provider_name: string;
  display_priority?: number;
}

interface TmdbWatchProviderRegion {
  flatrate?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
  ads?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
}

interface TmdbWatchProvidersResponse {
  results: Record<string, TmdbWatchProviderRegion | undefined>;
}

interface TmdbMovieDetails {
  title: string;
  release_date: string;
  release_dates: {
    results: TmdbReleaseDatesRegion[];
  };
  runtime: number | null;
  overview: string;
  poster_path: string | null;
  genres: TmdbGenre[];
  credits: {
    cast: TmdbCreditPerson[];
    crew: TmdbCreditPerson[];
  };
  videos: {
    results: TmdbVideo[];
  };
  external_ids: {
    imdb_id: string | null;
  };
}

interface TmdbTvDetails {
  name: string;
  first_air_date: string;
  content_ratings: {
    results: TmdbContentRatingRegion[];
  };
  episode_run_time: number[];
  overview: string;
  poster_path: string | null;
  genres: TmdbGenre[];
  aggregate_credits: {
    cast: TmdbCreditPerson[];
    crew: TmdbCreditPerson[];
  };
  videos: {
    results: TmdbVideo[];
  };
  external_ids: {
    imdb_id: string | null;
  };
}

export function hasTitleMetadataProviderConfig(): boolean {
  return Boolean(process.env.TMDB_API_READ_ACCESS_TOKEN || process.env.TMDB_API_KEY);
}

export async function searchTitleMetadata(
  options: SearchTitleMetadataOptions
): Promise<TitleMetadataSearchResult[]> {
  assertProviderConfigured();

  const query = options.query.trim();
  if (!query) {
    return [];
  }

  if (options.type) {
    const mediaType = toTmdbMediaType(options.type);
    return searchByType(mediaType, query, options.year);
  }

  const [movies, tv] = await Promise.all([
    searchByType("movie", query, options.year),
    searchByType("tv", query, options.year)
  ]);

  return [...movies, ...tv]
    .sort((left, right) => {
      const leftExactYear = matchesYear(left.releaseDate, options.year);
      const rightExactYear = matchesYear(right.releaseDate, options.year);

      if (leftExactYear !== rightExactYear) {
        return leftExactYear ? -1 : 1;
      }

      const leftName = left.name.toLowerCase();
      const rightName = right.name.toLowerCase();
      const queryLower = query.toLowerCase();
      const leftExactName = leftName === queryLower;
      const rightExactName = rightName === queryLower;

      if (leftExactName !== rightExactName) {
        return leftExactName ? -1 : 1;
      }

      return 0;
    })
    .slice(0, 10);
}

export async function getTitleMetadataAutofill(
  options: LookupTitleMetadataOptions
): Promise<MetadataAutofillDraft> {
  assertProviderConfigured();

  if (options.type === "MOVIE") {
    const [details, watchProviders] = await Promise.all([
      tmdbFetch<TmdbMovieDetails>(`/movie/${options.providerId}`, {
        append_to_response: "credits,videos,external_ids,release_dates"
      }),
      fetchWatchProviders(options.providerId, "movie")
    ]);
    const imdbUrl = buildImdbUrl(details.external_ids.imdb_id);
    const externalScores = await fetchMetadataExternalScores(imdbUrl, options.warnings);

    return {
      slug: slugify(details.title),
      name: details.title,
      type: "MOVIE",
      releaseDate: normalizeDate(details.release_date),
      ageRating: extractMovieAgeRating(details.release_dates.results),
      runtimeMinutes: details.runtime ?? null,
      synopsis: details.overview ?? "",
      posterUrl: buildImageUrl(details.poster_path),
      trailerYoutubeUrl: selectTrailerUrl(details.videos.results),
      imdbUrl,
      imdbRating: externalScores?.imdbRating ?? null,
      rottenTomatoesUrl: externalScores?.rottenTomatoesUrl ?? null,
      rottenTomatoesCriticsScore: externalScores?.rottenTomatoesCriticsScore ?? null,
      rottenTomatoesAudienceScore: externalScores?.rottenTomatoesAudienceScore ?? null,
      watchProviders: watchProviders.map((provider) => provider.name),
      watchProviderLinks: watchProviders,
      genreNames: details.genres.map((genre) => genre.name),
      cast: mapCast(details.credits.cast),
      crew: mapCrew(details.credits.crew)
    };
  }

  const [details, watchProviders] = await Promise.all([
    tmdbFetch<TmdbTvDetails>(`/tv/${options.providerId}`, {
      append_to_response: "aggregate_credits,videos,external_ids,content_ratings"
    }),
    fetchWatchProviders(options.providerId, "tv")
  ]);
  const imdbUrl = buildImdbUrl(details.external_ids.imdb_id);
  const externalScores = await fetchMetadataExternalScores(imdbUrl, options.warnings);

  return {
    slug: slugify(details.name),
    name: details.name,
    type: "TV_SHOW",
    releaseDate: normalizeDate(details.first_air_date),
    ageRating: extractTvAgeRating(details.content_ratings.results),
    runtimeMinutes: details.episode_run_time[0] ?? null,
    synopsis: details.overview ?? "",
    posterUrl: buildImageUrl(details.poster_path),
    trailerYoutubeUrl: selectTrailerUrl(details.videos.results),
    imdbUrl,
    imdbRating: externalScores?.imdbRating ?? null,
    rottenTomatoesUrl: externalScores?.rottenTomatoesUrl ?? null,
    rottenTomatoesCriticsScore: externalScores?.rottenTomatoesCriticsScore ?? null,
    rottenTomatoesAudienceScore: externalScores?.rottenTomatoesAudienceScore ?? null,
    watchProviders: watchProviders.map((provider) => provider.name),
    watchProviderLinks: watchProviders,
    genreNames: details.genres.map((genre) => genre.name),
    cast: mapCast(details.aggregate_credits.cast),
    crew: mapCrew(details.aggregate_credits.crew)
  };
}

async function searchByType(
  mediaType: SearchMediaType,
  query: string,
  year?: number
): Promise<TitleMetadataSearchResult[]> {
  const response = await tmdbFetch<TmdbSearchResponse>(`/search/${mediaType}`, {
    query,
    include_adult: "false",
    ...(year
      ? mediaType === "movie"
        ? { year: String(year) }
        : { first_air_date_year: String(year) }
      : {})
  });

  return response.results.slice(0, 8).map((result) => ({
    provider: "TMDB",
    providerId: result.id,
    type: mediaType === "movie" ? "MOVIE" : "TV_SHOW",
    name: result.title ?? result.name ?? "Untitled",
    releaseDate: normalizeDate(result.release_date ?? result.first_air_date),
    overview: result.overview || null,
    posterUrl: buildImageUrl(result.poster_path)
  }));
}

async function tmdbFetch<T>(path: string, query: Record<string, string>): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("language", "en-US");

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    accept: "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!token) {
    url.searchParams.set("api_key", process.env.TMDB_API_KEY ?? "");
  }

  const response = await fetch(url, {
    headers,
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new TitleMetadataProviderError(
        "TMDb rejected the configured credentials. Check TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY.",
        "tmdb_invalid_credentials"
      );
    }

    throw new TitleMetadataProviderError(`TMDb request failed with ${response.status}.`, "tmdb_request_failed");
  }

  return (await response.json()) as T;
}

function assertProviderConfigured(): void {
  if (!hasTitleMetadataProviderConfig()) {
    throw new TitleMetadataProviderError("TMDb credentials are not configured.", "tmdb_not_configured");
  }
}

function toTmdbMediaType(type: TitleType): SearchMediaType {
  return type === "MOVIE" ? "movie" : "tv";
}

function normalizeDate(value?: string): string {
  if (!value) {
    return "";
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function buildImageUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE_BASE_URL}${path}` : null;
}

function buildImdbUrl(imdbId: string | null): string | null {
  return imdbId ? `https://www.imdb.com/title/${imdbId}/` : null;
}

async function fetchMetadataExternalScores(
  imdbUrl: string | null,
  warnings: string[] = []
): Promise<RefreshedExternalScores | null> {
  if (!imdbUrl || !hasExternalScoreProviderConfig()) {
    if (imdbUrl && !hasExternalScoreProviderConfig()) {
      warnings.push("IMDb and Rotten Tomatoes autofill is unavailable because OMDB_API_KEY is not configured.");
    }

    return null;
  }

  try {
    return await fetchExternalScoresFromImdbUrl(imdbUrl);
  } catch (error) {
    if (error instanceof ExternalScoreProviderError) {
      if (error.code === "invalid_api_key") {
        warnings.push("IMDb and Rotten Tomatoes autofill failed because OMDB_API_KEY was rejected by OMDb.");
        return null;
      }

      if (error.code === "not_configured") {
        warnings.push("IMDb and Rotten Tomatoes autofill is unavailable because OMDB_API_KEY is not configured.");
        return null;
      }

      if (error.code === "not_found") {
        return null;
      }
    }

    console.warn(`Unable to enrich metadata with OMDb scores for ${imdbUrl}.`, error);
    warnings.push("IMDb and Rotten Tomatoes autofill failed. Check OMDB_API_KEY and try again.");
    return null;
  }
}

export function getTitleMetadataProviderErrorMessage(error: unknown): string {
  if (error instanceof TitleMetadataProviderError) {
    return error.message;
  }

  return "Unable to load title metadata.";
}

function extractMovieAgeRating(results: TmdbReleaseDatesRegion[]): string | null {
  const releaseDates = results.find((entry) => entry.iso_3166_1 === getTmdbMetadataRegion())?.release_dates ?? [];
  const bestMatch = releaseDates.find((entry) => entry.certification.trim());

  return bestMatch?.certification.trim() || null;
}

function extractTvAgeRating(results: TmdbContentRatingRegion[]): string | null {
  const bestMatch = results.find((entry) => entry.iso_3166_1 === getTmdbMetadataRegion() && entry.rating.trim());

  return bestMatch?.rating.trim() || null;
}

function selectTrailerUrl(videos: TmdbVideo[]): string | null {
  const bestMatch =
    videos.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official) ??
    videos.find((video) => video.site === "YouTube" && video.type === "Trailer") ??
    videos.find((video) => video.site === "YouTube" && video.type === "Teaser");

  return bestMatch ? `https://www.youtube.com/watch?v=${bestMatch.key}` : null;
}

async function fetchWatchProviders(providerId: number, mediaType: SearchMediaType): Promise<WatchProviderLink[]> {
  const response = await tmdbFetch<TmdbWatchProvidersResponse>(`/${mediaType}/${providerId}/watch/providers`, {});
  const configuredRegion = getTmdbMetadataRegion();

  return mapWatchProviders(response.results[configuredRegion]);
}

function getTmdbMetadataRegion(): string {
  return process.env.TMDB_WATCH_PROVIDER_REGION?.trim().toUpperCase() || DEFAULT_WATCH_PROVIDER_REGION;
}

function mapCast(people: TmdbCreditPerson[]): MetadataAutofillDraft["cast"] {
  return people.slice(0, 8).map((person, index) => ({
    name: person.name,
    roleName: person.character ?? person.roles?.[0]?.character ?? "Unknown",
    billingOrder: (person.order ?? index) + 1
  }));
}

function mapCrew(people: TmdbCreditPerson[]): MetadataAutofillDraft["crew"] {
  const selected: MetadataAutofillDraft["crew"] = [];
  const seen = new Set<string>();

  for (const person of people) {
    const jobType = mapCrewJobType(person);
    if (!jobType) {
      continue;
    }

    const key = `${person.name}:${jobType}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    selected.push({ name: person.name, jobType });
  }

  return selected.slice(0, 6);
}

function mapCrewJobType(person: TmdbCreditPerson): CrewJobType | null {
  const label = `${person.job ?? ""} ${person.department ?? ""}`.toLowerCase();

  if (label.includes("director")) {
    return "DIRECTOR";
  }

  if (label.includes("writer") || label.includes("screenplay") || label.includes("story")) {
    return "WRITER";
  }

  if (label.includes("producer")) {
    return "PRODUCER";
  }

  return null;
}

function matchesYear(value: string | null, expectedYear?: number): boolean {
  if (!value || !expectedYear) {
    return false;
  }

  return value.startsWith(String(expectedYear));
}

function mapWatchProviders(region?: TmdbWatchProviderRegion): WatchProviderLink[] {
  if (!region) {
    return [];
  }

  const orderedProviders = [
    ...(region.flatrate ?? []).map((provider) => ({ ...provider, offerType: "subscription" as WatchProviderOfferType })),
    ...(region.free ?? []).map((provider) => ({ ...provider, offerType: "free" as WatchProviderOfferType })),
    ...(region.ads ?? []).map((provider) => ({ ...provider, offerType: "ads" as WatchProviderOfferType })),
    ...(region.rent ?? []).map((provider) => ({ ...provider, offerType: "rent" as WatchProviderOfferType })),
    ...(region.buy ?? []).map((provider) => ({ ...provider, offerType: "buy" as WatchProviderOfferType }))
  ].sort((left, right) => (left.display_priority ?? Number.MAX_SAFE_INTEGER) - (right.display_priority ?? Number.MAX_SAFE_INTEGER));

  return normalizeWatchProviderLinks(
    orderedProviders.map((provider) => ({
      name: provider.provider_name,
      url: getWatchProviderFallbackUrl(provider.provider_name),
      offerTypes: [provider.offerType]
    }))
  );
}
