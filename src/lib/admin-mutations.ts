import { Prisma, PrismaClient } from "@prisma/client";
import { fetchExternalScoresFromImdbUrl } from "@/lib/external-scores";
import { isMissingWatchProviderLinksColumn } from "@/lib/prisma-watch-provider-links";
import { AdminTitlePayload } from "@/lib/validation";

const includeShape = {
  titleGenres: {
    select: {
      genre: { select: { slug: true, name: true } }
    }
  },
  cast: {
    orderBy: { billingOrder: "asc" as const },
    select: {
      billingOrder: true,
      roleName: true,
      person: { select: { name: true } }
    }
  },
  crew: {
    orderBy: { jobType: "asc" as const },
    select: {
      jobType: true,
      person: { select: { name: true } }
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
};

const transactionOptions = {
  maxWait: 10_000,
  timeout: 20_000
} satisfies Parameters<PrismaClient["$transaction"]>[1];

function hasExternalScores(payload: AdminTitlePayload): boolean {
  return (
    payload.imdbRating !== null ||
    payload.rottenTomatoesCriticsScore !== null ||
    payload.rottenTomatoesAudienceScore !== null
  );
}

function shouldStampExternalScoresUpdatedAt(
  payload: AdminTitlePayload,
  existing?: {
    imdbRating: number | null;
    rottenTomatoesCriticsScore: number | null;
    rottenTomatoesAudienceScore: number | null;
    externalScoresUpdatedAt: Date | null;
  }
): Date | null | undefined {
  if (!hasExternalScores(payload)) {
    return existing ? null : null;
  }

  if (!existing) {
    return new Date();
  }

  const scoresChanged =
    existing.imdbRating !== payload.imdbRating ||
    existing.rottenTomatoesCriticsScore !== payload.rottenTomatoesCriticsScore ||
    existing.rottenTomatoesAudienceScore !== payload.rottenTomatoesAudienceScore;

  if (scoresChanged || existing.externalScoresUpdatedAt === null) {
    return new Date();
  }

  return undefined;
}

async function linkRelations(
  tx: Prisma.TransactionClient,
  titleId: string,
  payload: AdminTitlePayload
): Promise<void> {
  const genres = await tx.genre.findMany({
    where: {
      slug: {
        in: payload.genreSlugs
      }
    }
  });

  if (genres.length !== payload.genreSlugs.length) {
    throw new Error("One or more genre slugs are invalid.");
  }

  await tx.titleGenre.createMany({
    data: genres.map((genre) => ({
      titleId,
      genreId: genre.id
    }))
  });

  const peopleNames = Array.from(
    new Set([...payload.cast.map((entry) => entry.name), ...payload.crew.map((entry) => entry.name)])
  );

  if (peopleNames.length > 0) {
    await tx.person.createMany({
      data: peopleNames.map((name) => ({ name })),
      skipDuplicates: true
    });
  }

  const people = await tx.person.findMany({
    where: {
      name: {
        in: peopleNames
      }
    }
  });

  const peopleByName = new Map(people.map((person) => [person.name, person.id]));
  const castLinks: Prisma.TitleCastCreateManyInput[] = [];

  for (const cast of payload.cast) {
    const personId = peopleByName.get(cast.name);
    if (!personId) continue;

    castLinks.push({
      titleId,
      personId,
      roleName: cast.roleName,
      billingOrder: cast.billingOrder
    });
  }

  if (castLinks.length > 0) {
    await tx.titleCast.createMany({
      data: castLinks
    });
  }

  const crewLinks: Prisma.TitleCrewCreateManyInput[] = [];

  for (const crew of payload.crew) {
    const personId = peopleByName.get(crew.name);
    if (!personId) continue;

    crewLinks.push({
      titleId,
      personId,
      jobType: crew.jobType
    });
  }

  if (crewLinks.length > 0) {
    await tx.titleCrew.createMany({
      data: crewLinks
    });
  }

  await tx.wokeFactor.createMany({
    data: payload.wokeFactors.map((factor) => ({
      titleId,
      label: factor.label,
      weight: factor.weight,
      displayOrder: factor.displayOrder,
      notes: factor.notes ?? null
    }))
  });
}

type ExistingExternalScores = {
  imdbRating: number | null;
  rottenTomatoesCriticsScore: number | null;
  rottenTomatoesAudienceScore: number | null;
  externalScoresUpdatedAt: Date | null;
};

function titleData(payload: AdminTitlePayload): Prisma.TitleUncheckedCreateInput;
function titleData(
  payload: AdminTitlePayload,
  existing: undefined,
  includeWatchProviderLinks: boolean
): Prisma.TitleUncheckedCreateInput;
function titleData(
  payload: AdminTitlePayload,
  existing: ExistingExternalScores,
  includeWatchProviderLinks?: boolean
): Prisma.TitleUncheckedUpdateInput;
function titleData(
  payload: AdminTitlePayload,
  existing?: ExistingExternalScores,
  includeWatchProviderLinks = true
): Prisma.TitleUncheckedCreateInput | Prisma.TitleUncheckedUpdateInput {
  const externalScoresUpdatedAt = shouldStampExternalScoresUpdatedAt(payload, existing);

  return {
    slug: payload.slug,
    name: payload.name,
    type: payload.type,
    releaseDate: new Date(payload.releaseDate),
    runtimeMinutes: payload.runtimeMinutes ?? null,
    synopsis: payload.synopsis,
    posterUrl: payload.posterUrl ?? null,
    trailerYoutubeUrl: payload.trailerYoutubeUrl ?? null,
    imdbUrl: payload.imdbUrl ?? null,
    imdbRating: payload.imdbRating ?? null,
    rottenTomatoesUrl: payload.rottenTomatoesUrl ?? null,
    rottenTomatoesCriticsScore: payload.rottenTomatoesCriticsScore ?? null,
    rottenTomatoesAudienceScore: payload.rottenTomatoesAudienceScore ?? null,
    amazonUrl: payload.amazonUrl ?? null,
    watchProviders: payload.watchProviders,
    ...(includeWatchProviderLinks ? { watchProviderLinks: payload.watchProviderLinks } : {}),
    wokeScore: payload.wokeScore,
    wokeSummary: payload.wokeSummary,
    status: payload.status,
    ...(externalScoresUpdatedAt !== undefined ? { externalScoresUpdatedAt } : {})
  };
}

export async function createTitle(prisma: PrismaClient, payload: AdminTitlePayload) {
  try {
    return await createTitleInternal(prisma, payload, true);
  } catch (error) {
    if (!isMissingWatchProviderLinksColumn(error)) {
      throw error;
    }

    return createTitleInternal(prisma, payload, false);
  }
}

export async function updateTitle(prisma: PrismaClient, id: string, payload: AdminTitlePayload) {
  try {
    return await updateTitleInternal(prisma, id, payload, true);
  } catch (error) {
    if (!isMissingWatchProviderLinksColumn(error)) {
      throw error;
    }

    return updateTitleInternal(prisma, id, payload, false);
  }
}

export async function deleteTitle(prisma: PrismaClient, id: string) {
  await prisma.title.delete({ where: { id } });
  return { ok: true };
}

export async function importTitles(prisma: PrismaClient, payloads: AdminTitlePayload[]) {
  const results = [];

  for (const payload of payloads) {
    const existing = await prisma.title.findUnique({
      where: { slug: payload.slug },
      select: { id: true }
    });

    if (existing) {
      const updated = await updateTitle(prisma, existing.id, payload);
      results.push({ slug: payload.slug, action: "updated", id: updated.id });
    } else {
      const created = await createTitle(prisma, payload);
      results.push({ slug: payload.slug, action: "created", id: created.id });
    }
  }

  return results;
}

async function createTitleInternal(prisma: PrismaClient, payload: AdminTitlePayload, includeWatchProviderLinks: boolean) {
  return prisma.$transaction(
    async (tx) => {
      const created = await tx.title.create({
        data: titleData(payload, undefined, includeWatchProviderLinks)
      });

      await linkRelations(tx, created.id, payload);

      return tx.title.findUniqueOrThrow({
        where: { id: created.id },
        include: includeShape
      });
    },
    transactionOptions
  );
}

async function updateTitleInternal(
  prisma: PrismaClient,
  id: string,
  payload: AdminTitlePayload,
  includeWatchProviderLinks: boolean
) {
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.title.findUniqueOrThrow({
        where: { id },
        select: {
          imdbRating: true,
          rottenTomatoesCriticsScore: true,
          rottenTomatoesAudienceScore: true,
          externalScoresUpdatedAt: true
        }
      });

      await tx.title.update({
        where: { id },
        data: titleData(payload, existing, includeWatchProviderLinks)
      });

      await Promise.all([
        tx.titleGenre.deleteMany({ where: { titleId: id } }),
        tx.titleCast.deleteMany({ where: { titleId: id } }),
        tx.titleCrew.deleteMany({ where: { titleId: id } }),
        tx.wokeFactor.deleteMany({ where: { titleId: id } })
      ]);

      await linkRelations(tx, id, payload);

      return tx.title.findUniqueOrThrow({
        where: { id },
        include: includeShape
      });
    },
    transactionOptions
  );
}

export async function refreshExternalScores(prisma: PrismaClient, id: string) {
  const title = await prisma.title.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      imdbUrl: true,
      rottenTomatoesUrl: true
    }
  });

  if (!title) {
    throw new Error("Title not found.");
  }

  if (!title.imdbUrl) {
    throw new Error("This title does not have an IMDb URL yet.");
  }

  const scores = await fetchExternalScoresFromImdbUrl(title.imdbUrl);

  const updated = await prisma.title.update({
    where: { id },
    data: {
      imdbRating: scores.imdbRating,
      rottenTomatoesCriticsScore: scores.rottenTomatoesCriticsScore,
      rottenTomatoesAudienceScore: scores.rottenTomatoesAudienceScore,
      rottenTomatoesUrl: scores.rottenTomatoesUrl ?? title.rottenTomatoesUrl,
      externalScoresUpdatedAt: new Date()
    },
    select: {
      id: true,
      name: true,
      imdbRating: true,
      rottenTomatoesCriticsScore: true,
      rottenTomatoesAudienceScore: true,
      rottenTomatoesUrl: true,
      externalScoresUpdatedAt: true
    }
  });

  return updated;
}
