import { Prisma, PrismaClient, TitleType } from "@prisma/client";
import { getTitleMetadataAutofill, searchTitleMetadata } from "@/lib/title-metadata";
import {
  getWatchProviderFallbackUrl,
  normalizeWatchProviderLinks,
  normalizeWatchProviders
} from "@/lib/watch-providers";

const prisma = new PrismaClient();

async function main() {
  const titles = await prisma.title.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      releaseDate: true,
      watchProviders: true,
      watchProviderLinks: true
    }
  });

  for (const title of titles) {
    const existingLinks = normalizeWatchProviderLinks(Array.isArray(title.watchProviderLinks) ? (title.watchProviderLinks as any[]) : []);
    const needsProviders = title.watchProviders.length === 0;
    let desiredProviders = normalizeWatchProviders(title.watchProviders);

    if (needsProviders) {
      const year = title.releaseDate.getUTCFullYear();
      const matches = await searchTitleMetadata({
        query: title.name,
        year,
        type: title.type as TitleType
      });

      const candidate = selectBestCandidate(matches, title.name, year);
      if (!candidate) {
        console.log(`skip ${title.slug}: no TMDB match`);
        continue;
      }

      const metadata = await getTitleMetadataAutofill({
        providerId: candidate.providerId,
        type: candidate.type
      });

      desiredProviders = normalizeWatchProviders(metadata.watchProviders);
    }

    const desiredLinks = desiredProviders.map((name) => ({
      name,
      url: getWatchProviderFallbackUrl(name)
    }));

    const shouldUpdateProviders = needsProviders && desiredProviders.length > 0;
    const shouldUpdateLinks = !sameLinks(existingLinks, desiredLinks);

    if (!shouldUpdateProviders && !shouldUpdateLinks) {
      console.log(`skip ${title.slug}: already aligned`);
      continue;
    }

    await prisma.title.update({
      where: { id: title.id },
      data: {
        ...(shouldUpdateProviders ? { watchProviders: desiredProviders } : {}),
        ...(shouldUpdateLinks ? { watchProviderLinks: desiredLinks as unknown as Prisma.InputJsonValue } : {})
      }
    });

    console.log(
      `updated ${title.slug}: providers=${shouldUpdateProviders ? desiredProviders.length : title.watchProviders.length} links=${shouldUpdateLinks ? desiredLinks.length : existingLinks.length}`
    );
  }
}

function selectBestCandidate(
  matches: Array<{ providerId: number; type: TitleType; name: string; releaseDate: string | null }>,
  expectedName: string,
  expectedYear: number
) {
  const normalizedExpectedName = expectedName.trim().toLowerCase();

  return (
    matches.find(
      (match) => match.name.trim().toLowerCase() === normalizedExpectedName && match.releaseDate?.startsWith(String(expectedYear))
    ) ??
    matches.find((match) => match.name.trim().toLowerCase() === normalizedExpectedName) ??
    matches[0] ??
    null
  );
}

function sameLinks(
  left: Array<{ name: string; url: string | null }>,
  right: Array<{ name: string; url: string | null }>
) {
  return JSON.stringify(left) === JSON.stringify(right);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
