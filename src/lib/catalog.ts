import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LIMIT, DEFAULT_PAGE, SortOption } from "@/lib/constants";
import { isMissingWatchProviderLinksColumn } from "@/lib/prisma-watch-provider-links";
import { ListQuery } from "@/lib/validation";
import { PaginatedTitles, TitleCard, TitleDetail } from "@/lib/types";
import { normalizeWatchProviders, parseWatchProviderLinks, syncWatchProviderLinks } from "@/lib/watch-providers";

export function listOrderBy(sort: SortOption): Prisma.TitleOrderByWithRelationInput[] {
  switch (sort) {
    case "score_asc":
      return [{ wokeScore: "asc" }, { name: "asc" }];
    case "imdb_desc":
      return [{ imdbRating: { sort: "desc", nulls: "last" } }, { name: "asc" }];
    case "imdb_asc":
      return [{ imdbRating: { sort: "asc", nulls: "last" } }, { name: "asc" }];
    case "tomatoes_desc":
      return [{ rottenTomatoesCriticsScore: { sort: "desc", nulls: "last" } }, { name: "asc" }];
    case "tomatoes_asc":
      return [{ rottenTomatoesCriticsScore: { sort: "asc", nulls: "last" } }, { name: "asc" }];
    case "newest":
      return [{ releaseDate: "desc" }, { name: "asc" }];
    case "oldest":
      return [{ releaseDate: "asc" }, { name: "asc" }];
    case "title_asc":
      return [{ name: "asc" }];
    case "title_desc":
      return [{ name: "desc" }];
    case "score_desc":
    default:
      return [{ wokeScore: "desc" }, { name: "asc" }];
  }
}

export function buildTitleWhere(filters: ListQuery): Prisma.TitleWhereInput {
  const where: Prisma.TitleWhereInput = {
    status: "PUBLISHED"
  };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.genre) {
    where.titleGenres = {
      some: {
        genre: {
          slug: filters.genre
        }
      }
    };
  }

  if (filters.platform && filters.platform.length > 0) {
    where.watchProviders = {
      hasSome: filters.platform
    };
  }

  if (filters.year_min !== undefined || filters.year_max !== undefined) {
    const range: Prisma.DateTimeFilter = {};

    if (filters.year_min !== undefined) {
      range.gte = new Date(Date.UTC(filters.year_min, 0, 1));
    }

    if (filters.year_max !== undefined) {
      range.lt = new Date(Date.UTC(filters.year_max + 1, 0, 1));
    }

    where.releaseDate = range;
  }

  if (filters.score_min !== undefined || filters.score_max !== undefined) {
    const range: Prisma.IntFilter = {};
    if (filters.score_min !== undefined) {
      range.gte = filters.score_min;
    }
    if (filters.score_max !== undefined) {
      range.lte = filters.score_max;
    }
    where.wokeScore = range;
  }

  if (filters.imdb_min !== undefined) {
    where.imdbRating = {
      gte: filters.imdb_min
    };
  }

  if (filters.tomatoes_min !== undefined) {
    where.rottenTomatoesCriticsScore = {
      gte: filters.tomatoes_min
    };
  }

  if (filters.q) {
    where.OR = [
      {
        name: {
          contains: filters.q,
          mode: "insensitive"
        }
      },
      {
        synopsis: {
          contains: filters.q,
          mode: "insensitive"
        }
      }
    ];
  }

  return where;
}

function mapTitleCard(item: {
  id: string;
  slug: string;
  name: string;
  type: "MOVIE" | "TV_SHOW";
  releaseDate: Date;
  posterUrl: string | null;
  wokeScore: number;
  wokeSummary: string;
  imdbRating: number | null;
  rottenTomatoesCriticsScore: number | null;
  rottenTomatoesAudienceScore: number | null;
  titleGenres: Array<{ genre: { slug: string; name: string } }>;
}): TitleCard {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    type: item.type,
    releaseDate: item.releaseDate.toISOString(),
    posterUrl: item.posterUrl,
    wokeScore: item.wokeScore,
    wokeSummary: item.wokeSummary,
    imdbRating: item.imdbRating,
    rottenTomatoesCriticsScore: item.rottenTomatoesCriticsScore,
    rottenTomatoesAudienceScore: item.rottenTomatoesAudienceScore,
    genres: item.titleGenres.map((entry) => entry.genre)
  };
}

export async function getTitleCards(filters: ListQuery): Promise<PaginatedTitles> {
  const where = buildTitleWhere(filters);
  const skip = (filters.page - 1) * filters.limit;

  const [rows, total] = await Promise.all([
    prisma.title.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: listOrderBy(filters.sort),
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        releaseDate: true,
        posterUrl: true,
        wokeScore: true,
        wokeSummary: true,
        imdbRating: true,
        rottenTomatoesCriticsScore: true,
        rottenTomatoesAudienceScore: true,
        titleGenres: {
          select: {
            genre: {
              select: {
                slug: true,
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.title.count({ where })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  return {
    data: rows.map(mapTitleCard),
    total,
    totalPages,
    page: filters.page,
    limit: filters.limit
  };
}

export async function getTitleDetail(slug: string): Promise<TitleDetail | null> {
  let row: Awaited<ReturnType<typeof findTitleDetailWithWatchProviderLinks>> | Awaited<ReturnType<typeof findTitleDetailWithoutWatchProviderLinks>>;

  try {
    row = await findTitleDetailWithWatchProviderLinks(slug);
  } catch (error) {
    if (!isMissingWatchProviderLinksColumn(error)) {
      throw error;
    }

    row = await findTitleDetailWithoutWatchProviderLinks(slug);
  }

  if (!row) return null;

  const watchProviderLinks = syncWatchProviderLinks(
    row.watchProviders,
    "watchProviderLinks" in row ? parseWatchProviderLinks(row.watchProviderLinks) : []
  );

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    releaseDate: row.releaseDate.toISOString(),
    ageRating: row.ageRating,
    runtimeMinutes: row.runtimeMinutes,
    synopsis: row.synopsis,
    posterUrl: row.posterUrl,
    trailerYoutubeUrl: row.trailerYoutubeUrl,
    imdbUrl: row.imdbUrl,
    imdbRating: row.imdbRating,
    rottenTomatoesUrl: row.rottenTomatoesUrl,
    rottenTomatoesCriticsScore: row.rottenTomatoesCriticsScore,
    rottenTomatoesAudienceScore: row.rottenTomatoesAudienceScore,
    amazonUrl: row.amazonUrl,
    watchProviders: row.watchProviders,
    watchProviderLinks,
    wokeScore: row.wokeScore,
    wokeSummary: row.wokeSummary,
    genres: row.titleGenres.map((entry) => entry.genre),
    cast: row.cast.map((member) => ({
      name: member.person.name,
      roleName: member.roleName,
      billingOrder: member.billingOrder
    })),
    crew: row.crew.map((member) => ({
      name: member.person.name,
      jobType: member.jobType
    })),
    wokeFactors: row.wokeFactors
  };
}

const titleDetailBaseSelect = {
  id: true,
  slug: true,
  name: true,
  type: true,
  releaseDate: true,
  ageRating: true,
  runtimeMinutes: true,
  synopsis: true,
  posterUrl: true,
  trailerYoutubeUrl: true,
  imdbUrl: true,
  imdbRating: true,
  rottenTomatoesUrl: true,
  rottenTomatoesCriticsScore: true,
  rottenTomatoesAudienceScore: true,
  amazonUrl: true,
  watchProviders: true,
  wokeScore: true,
  wokeSummary: true,
  titleGenres: {
    select: {
      genre: {
        select: {
          slug: true,
          name: true
        }
      }
    }
  },
  cast: {
    orderBy: { billingOrder: "asc" as const },
    select: {
      billingOrder: true,
      roleName: true,
      person: {
        select: {
          name: true
        }
      }
    }
  },
  crew: {
    orderBy: { jobType: "asc" as const },
    select: {
      jobType: true,
      person: {
        select: {
          name: true
        }
      }
    }
  },
  wokeFactors: {
    orderBy: { displayOrder: "asc" as const },
    select: {
      label: true,
      weight: true,
      displayOrder: true,
      notes: true
    }
  }
} satisfies Prisma.TitleSelect;

async function findTitleDetailWithWatchProviderLinks(slug: string) {
  return prisma.title.findUnique({
    where: { slug },
    select: {
      ...titleDetailBaseSelect,
      watchProviderLinks: true
    }
  });
}

async function findTitleDetailWithoutWatchProviderLinks(slug: string) {
  return prisma.title.findUnique({
    where: { slug },
    select: titleDetailBaseSelect
  });
}

export async function getGenresWithCount(filters: Partial<ListQuery> = {}) {
  const titleWhere = buildTitleWhere({
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    sort: "score_asc",
    ...filters,
    genre: undefined
  });

  const [genres, groupedCounts] = await Promise.all([
    prisma.genre.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true
      }
    }),
    prisma.titleGenre.groupBy({
      by: ["genreId"],
      where: {
        title: titleWhere
      },
      _count: {
        _all: true
      }
    })
  ]);

  const countByGenreId = new Map(groupedCounts.map((entry) => [entry.genreId, entry._count._all]));

  return genres.map((genre) => ({
    id: genre.id,
    slug: genre.slug,
    name: genre.name,
    count: countByGenreId.get(genre.id) ?? 0
  }));
}

export async function getPlatformOptions(filters: Partial<ListQuery> = {}) {
  const titleWhere = buildTitleWhere({
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    sort: "score_asc",
    ...filters,
    platform: undefined
  });

  const rows = await prisma.title.findMany({
    where: titleWhere,
    select: {
      watchProviders: true
    }
  });

  const providers = new Set<string>();

  for (const row of rows) {
    for (const provider of normalizeWatchProviders(row.watchProviders)) {
      providers.add(provider);
    }
  }

  return Array.from(providers).sort((left, right) => left.localeCompare(right));
}
