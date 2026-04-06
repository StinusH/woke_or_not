import { PrismaClient, TitleType } from "@prisma/client";
import { searchTitleMetadata } from "@/lib/title-metadata";
import {
  inferStudioAttribution,
  normalizeProductionEntityNames,
  type StudioAttribution
} from "@/lib/studio-attribution";
import { normalizeWatchProviderLinks, parseWatchProviderLinks } from "@/lib/watch-providers";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type TmdbFindResponse = {
  movie_results?: Array<{ id: number }>;
  tv_results?: Array<{ id: number }>;
};

type TmdbProductionEntity = {
  name: string;
};

type TmdbMovieProductionDetails = {
  production_companies?: TmdbProductionEntity[];
};

type TmdbTvProductionDetails = {
  production_companies?: TmdbProductionEntity[];
  networks?: TmdbProductionEntity[];
};

type BackfillResult = {
  slug: string;
  name: string;
  status: "updated" | "unchanged" | "skipped";
  previousProductionCompanies: string[];
  nextProductionCompanies: string[];
  previousProductionNetworks: string[];
  nextProductionNetworks: string[];
  previousStudioAttribution: StudioAttribution | null;
  nextStudioAttribution: StudioAttribution | null;
  reason?: string;
};

const prisma = new PrismaClient();

async function main() {
  assertTmdbConfigured();

  const titles = await prisma.title.findMany({
    orderBy: [{ releaseDate: "desc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      releaseDate: true,
      imdbUrl: true,
      productionCompanies: true,
      productionNetworks: true,
      studioAttributionLabel: true,
      studioAttributionSource: true,
      watchProviderLinks: true
    }
  });

  const results: BackfillResult[] = [];

  for (const title of titles) {
    const previousStudioAttribution =
      title.studioAttributionLabel && title.studioAttributionSource
        ? {
            label: title.studioAttributionLabel,
            source: title.studioAttributionSource
          }
        : null;
    const providerId = await findProviderId(title);

    if (!providerId) {
      results.push({
        slug: title.slug,
        name: title.name,
        status: "skipped",
        previousProductionCompanies: title.productionCompanies,
        nextProductionCompanies: title.productionCompanies,
        previousProductionNetworks: title.productionNetworks,
        nextProductionNetworks: title.productionNetworks,
        previousStudioAttribution,
        nextStudioAttribution: previousStudioAttribution,
        reason: "No TMDb match found."
      });
      continue;
    }

    const metadata = await fetchProductionMetadata(providerId, title.type);
    const nextProductionCompanies = metadata.productionCompanies;
    const nextProductionNetworks = metadata.productionNetworks;
    const fallbackWatchProviderLinks =
      parseWatchProviderLinks(title.watchProviderLinks).length > 0
        ? normalizeWatchProviderLinks(parseWatchProviderLinks(title.watchProviderLinks))
        : [];
    const nextStudioAttribution = inferStudioAttribution({
      type: title.type,
      productionCompanies: nextProductionCompanies,
      productionNetworks: nextProductionNetworks,
      watchProviderLinks: fallbackWatchProviderLinks
    });

    const unchanged =
      arraysEqual(title.productionCompanies, nextProductionCompanies) &&
      arraysEqual(title.productionNetworks, nextProductionNetworks) &&
      studioAttributionsEqual(previousStudioAttribution, nextStudioAttribution);

    if (unchanged) {
      results.push({
        slug: title.slug,
        name: title.name,
        status: "unchanged",
        previousProductionCompanies: title.productionCompanies,
        nextProductionCompanies,
        previousProductionNetworks: title.productionNetworks,
        nextProductionNetworks,
        previousStudioAttribution,
        nextStudioAttribution
      });
      continue;
    }

    await prisma.title.update({
      where: { id: title.id },
      data: {
        productionCompanies: nextProductionCompanies,
        productionNetworks: nextProductionNetworks,
        studioAttributionLabel: nextStudioAttribution?.label ?? null,
        studioAttributionSource: nextStudioAttribution?.source ?? null
      }
    });

    results.push({
      slug: title.slug,
      name: title.name,
      status: "updated",
      previousProductionCompanies: title.productionCompanies,
      nextProductionCompanies,
      previousProductionNetworks: title.productionNetworks,
      nextProductionNetworks,
      previousStudioAttribution,
      nextStudioAttribution
    });
  }

  console.log(
    JSON.stringify(
      {
        totals: {
          titles: results.length,
          updated: results.filter((result) => result.status === "updated").length,
          unchanged: results.filter((result) => result.status === "unchanged").length,
          skipped: results.filter((result) => result.status === "skipped").length
        },
        results
      },
      null,
      2
    )
  );
}

function assertTmdbConfigured() {
  if (!process.env.TMDB_API_READ_ACCESS_TOKEN && !process.env.TMDB_API_KEY) {
    throw new Error("TMDb credentials are not configured.");
  }
}

async function findProviderId(title: {
  name: string;
  type: TitleType;
  releaseDate: Date;
  imdbUrl: string | null;
}): Promise<number | null> {
  const imdbId = extractImdbId(title.imdbUrl);

  if (imdbId) {
    const tmdbId = await findTmdbProviderIdByImdbId(imdbId, title.type);
    if (tmdbId) {
      return tmdbId;
    }
  }

  const releaseYear = title.releaseDate.getUTCFullYear();
  const matches = await searchTitleMetadata({
    query: title.name,
    year: releaseYear,
    type: title.type
  });

  return matches[0]?.providerId ?? null;
}

function extractImdbId(imdbUrl: string | null): string | null {
  if (!imdbUrl) {
    return null;
  }

  const match = imdbUrl.match(/\/title\/(tt\d+)\//);
  return match?.[1] ?? null;
}

async function findTmdbProviderIdByImdbId(imdbId: string, type: TitleType): Promise<number | null> {
  const response = await tmdbFetch<TmdbFindResponse>(`/find/${imdbId}`, {
    external_source: "imdb_id"
  });

  const match = type === "MOVIE" ? response.movie_results?.[0] : response.tv_results?.[0];
  return typeof match?.id === "number" ? match.id : null;
}

async function fetchProductionMetadata(
  providerId: number,
  type: TitleType
): Promise<{ productionCompanies: string[]; productionNetworks: string[] }> {
  if (type === "MOVIE") {
    const response = await tmdbFetch<TmdbMovieProductionDetails>(`/movie/${providerId}`, {});

    return {
      productionCompanies: normalizeProductionEntityNames(
        (response.production_companies ?? []).map((company) => company.name)
      ),
      productionNetworks: []
    };
  }

  const response = await tmdbFetch<TmdbTvProductionDetails>(`/tv/${providerId}`, {});

  return {
    productionCompanies: normalizeProductionEntityNames(
      (response.production_companies ?? []).map((company) => company.name)
    ),
    productionNetworks: normalizeProductionEntityNames((response.networks ?? []).map((network) => network.name))
  };
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
  } else {
    url.searchParams.set("api_key", process.env.TMDB_API_KEY ?? "");
  }

  const response = await fetch(url, {
    headers,
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`TMDb request failed for ${path} with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function studioAttributionsEqual(left: StudioAttribution | null, right: StudioAttribution | null): boolean {
  return left?.label === right?.label && left?.source === right?.source;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
