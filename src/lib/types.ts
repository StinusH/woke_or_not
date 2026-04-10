import type { WatchProviderLink } from "@/lib/watch-providers";
import type { StudioAttribution } from "@/lib/studio-attribution";
import type { TitleContentTag } from "@/lib/title-tags";

export type CrewJobType = "DIRECTOR" | "WRITER" | "PRODUCER";

export interface TitleCard {
  id: string;
  slug: string;
  name: string;
  type: "MOVIE" | "TV_SHOW";
  releaseDate: string;
  posterUrl: string | null;
  wokeScore: number;
  wokeSummary: string;
  imdbRating: number | null;
  rottenTomatoesCriticsScore: number | null;
  rottenTomatoesAudienceScore: number | null;
  contentTags: TitleContentTag[];
  genres: Array<{ slug: string; name: string }>;
}

export interface TitleDetail extends TitleCard {
  originalLanguage: string | null;
  ageRating: string | null;
  runtimeMinutes: number | null;
  synopsis: string;
  trailerYoutubeUrl: string | null;
  imdbUrl: string | null;
  imdbRating: number | null;
  rottenTomatoesUrl: string | null;
  rottenTomatoesCriticsScore: number | null;
  rottenTomatoesAudienceScore: number | null;
  amazonUrl: string | null;
  productionCompanies: string[];
  productionNetworks: string[];
  studioAttribution: StudioAttribution | null;
  watchProviders: string[];
  watchProviderLinks: WatchProviderLink[];
  cast: Array<{ name: string; roleName: string; billingOrder: number }>;
  crew: Array<{ name: string; jobType: CrewJobType }>;
  wokeFactors: Array<{ label: string; weight: number; displayOrder: number; notes: string | null }>;
}

export interface PaginatedTitles {
  data: TitleCard[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
