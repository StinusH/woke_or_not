import { PrismaClient, TitleType } from "@prisma/client";
import { getTitleMetadataAutofill, searchTitleMetadata } from "@/lib/title-metadata";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type TmdbFindResponse = {
  movie_results?: Array<{ id: number }>;
  tv_results?: Array<{ id: number }>;
};

type BackfillResult = {
  slug: string;
  name: string;
  status: "updated" | "unchanged" | "skipped";
  previousAgeRating: string | null;
  nextAgeRating: string | null;
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
      ageRating: true
    }
  });

  const results: BackfillResult[] = [];

  for (const title of titles) {
    const previousAgeRating = title.ageRating;
    const providerId = await findProviderId(title);

    if (!providerId) {
      results.push({
        slug: title.slug,
        name: title.name,
        status: "skipped",
        previousAgeRating,
        nextAgeRating: previousAgeRating,
        reason: "No TMDb match found."
      });
      continue;
    }

    const metadata = await getTitleMetadataAutofill({
      providerId,
      type: title.type
    });
    const nextAgeRating = metadata.ageRating;

    if (!nextAgeRating) {
      results.push({
        slug: title.slug,
        name: title.name,
        status: "skipped",
        previousAgeRating,
        nextAgeRating: previousAgeRating,
        reason: "TMDb did not return an age rating."
      });
      continue;
    }

    if (previousAgeRating === nextAgeRating) {
      results.push({
        slug: title.slug,
        name: title.name,
        status: "unchanged",
        previousAgeRating,
        nextAgeRating
      });
      continue;
    }

    await prisma.title.update({
      where: { id: title.id },
      data: { ageRating: nextAgeRating }
    });

    results.push({
      slug: title.slug,
      name: title.name,
      status: "updated",
      previousAgeRating,
      nextAgeRating
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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
