import { PrismaClient, TitleType } from "@prisma/client";
import { mapGenreNamesToSlugs, type GenreOption } from "@/lib/admin-title-draft";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type TmdbFindResponse = {
  movie_results?: Array<{ id: number }>;
  tv_results?: Array<{ id: number }>;
};

type TmdbMovieDetails = {
  genres: Array<{ name: string }>;
};

type TmdbTvDetails = {
  genres: Array<{ name: string }>;
};

type SyncResult = {
  slug: string;
  name: string;
  status: "updated" | "unchanged" | "skipped";
  reason?: string;
  previousGenres: string[];
  nextGenres: string[];
  tmdbGenres: string[];
  unsupportedTmdbGenres: string[];
};

const prisma = new PrismaClient();

async function main() {
  assertTmdbConfigured();

  const [titles, genres] = await Promise.all([
    prisma.title.findMany({
      orderBy: [{ releaseDate: "desc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        imdbUrl: true,
        titleGenres: {
          select: {
            genre: {
              select: { slug: true }
            }
          },
          orderBy: { genre: { name: "asc" } }
        }
      }
    }),
    prisma.genre.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true, id: true }
    })
  ]);

  const genreOptions: GenreOption[] = genres.map((genre) => ({ slug: genre.slug, name: genre.name }));
  const genreIdBySlug = new Map(genres.map((genre) => [genre.slug, genre.id]));
  const genreOrder = new Map(genres.map((genre, index) => [genre.slug, index]));

  const results: SyncResult[] = [];

  for (const title of titles) {
    const previousGenres = sortGenreSlugs(
      title.titleGenres.map((entry) => entry.genre.slug),
      genreOrder
    );
    const imdbId = extractImdbId(title.imdbUrl);

    if (!imdbId) {
      results.push({
        slug: title.slug,
        name: title.name,
        status: "skipped",
        reason: "Missing or invalid IMDb URL.",
        previousGenres,
        nextGenres: previousGenres,
        tmdbGenres: [],
        unsupportedTmdbGenres: []
      });
      continue;
    }

    const providerId = await findTmdbProviderId(imdbId, title.type);
    if (!providerId) {
      results.push({
        slug: title.slug,
        name: title.name,
        status: "skipped",
        reason: `No TMDb ${title.type === "MOVIE" ? "movie" : "tv"} match found for IMDb ID ${imdbId}.`,
        previousGenres,
        nextGenres: previousGenres,
        tmdbGenres: [],
        unsupportedTmdbGenres: []
      });
      continue;
    }

    const tmdbGenres = await fetchTmdbGenreNames(providerId, title.type);
    const nextGenres = sortGenreSlugs(mapGenreNamesToSlugs(tmdbGenres, genreOptions), genreOrder);
    const unsupportedTmdbGenres = tmdbGenres.filter((genreName) => {
      const mapped = mapGenreNamesToSlugs([genreName], genreOptions);
      return mapped.length === 0;
    });

    if (nextGenres.length === 0) {
      results.push({
        slug: title.slug,
        name: title.name,
        status: "skipped",
        reason: "TMDb returned only unsupported genres.",
        previousGenres,
        nextGenres: previousGenres,
        tmdbGenres,
        unsupportedTmdbGenres
      });
      continue;
    }

    const unchanged = arraysEqual(previousGenres, nextGenres);

    if (!unchanged) {
      await prisma.$transaction([
        prisma.titleGenre.deleteMany({ where: { titleId: title.id } }),
        prisma.titleGenre.createMany({
          data: nextGenres.map((genreSlug) => ({
            titleId: title.id,
            genreId: genreIdBySlug.get(genreSlug)!
          }))
        })
      ]);
    }

    results.push({
      slug: title.slug,
      name: title.name,
      status: unchanged ? "unchanged" : "updated",
      previousGenres,
      nextGenres,
      tmdbGenres,
      unsupportedTmdbGenres
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

function extractImdbId(imdbUrl: string | null): string | null {
  if (!imdbUrl) {
    return null;
  }

  const match = imdbUrl.match(/\/title\/(tt\d+)\//);
  return match?.[1] ?? null;
}

async function findTmdbProviderId(imdbId: string, type: TitleType): Promise<number | null> {
  const response = await tmdbFetch<TmdbFindResponse>(`/find/${imdbId}`, {
    external_source: "imdb_id"
  });

  const match =
    type === "MOVIE"
      ? response.movie_results?.[0]
      : response.tv_results?.[0];

  return typeof match?.id === "number" ? match.id : null;
}

async function fetchTmdbGenreNames(providerId: number, type: TitleType): Promise<string[]> {
  if (type === "MOVIE") {
    const response = await tmdbFetch<TmdbMovieDetails>(`/movie/${providerId}`, {});
    return response.genres.map((genre) => genre.name);
  }

  const response = await tmdbFetch<TmdbTvDetails>(`/tv/${providerId}`, {});
  return response.genres.map((genre) => genre.name);
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

function sortGenreSlugs(values: string[], genreOrder: Map<string, number>): string[] {
  return [...values].sort((left, right) => (genreOrder.get(left) ?? Number.MAX_SAFE_INTEGER) - (genreOrder.get(right) ?? Number.MAX_SAFE_INTEGER));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
