import { notFound } from "next/navigation";
import { AdminTitleForm } from "@/components/admin-title-form";
import { normalizeAdminDraftWokeFactors } from "@/lib/admin-title-draft";
import { prisma } from "@/lib/prisma";
import { isMissingWatchProviderLinksColumn } from "@/lib/prisma-watch-provider-links";
import { hasTitleMetadataProviderConfig } from "@/lib/title-metadata";
import { parseWatchProviderLinks, syncWatchProviderLinks } from "@/lib/watch-providers";

export const dynamic = "force-dynamic";

interface EditTitlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTitlePage({ params }: EditTitlePageProps) {
  const { id } = await params;

  const [title, genres] = await Promise.all([
    findEditableTitle(id),
    prisma.genre.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true }
    })
  ]);

  if (!title) {
    notFound();
  }

  const normalizedWokeFactors = normalizeAdminDraftWokeFactors(
    title.wokeFactors.map((entry) => ({
      label: entry.label,
      weight: entry.weight,
      displayOrder: entry.displayOrder,
      notes: entry.notes
    }))
  );
  const wokeFactorWarning =
    normalizedWokeFactors.unknownLabels.length > 0
      ? `Unsupported stored woke factor labels were ignored during normalization: ${normalizedWokeFactors.unknownLabels.join(", ")}.`
      : undefined;

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-line bg-card p-5 shadow-card text-sm text-fgMuted">
        Editing `{title.name}`. Save changes to update the live or draft title data.
      </section>

      <AdminTitleForm
        mode="update"
        titleId={title.id}
        titleHeading={`Edit ${title.name}`}
        titleDescription="Review the existing values, optionally refresh metadata from TMDb, and save your changes."
        genres={genres}
        metadataEnabled={hasTitleMetadataProviderConfig()}
        wokeFactorWarning={wokeFactorWarning}
        initialDraft={{
          slug: title.slug,
          name: title.name,
          type: title.type,
          originalLanguage: title.originalLanguage ?? "",
          releaseDate: title.releaseDate.toISOString().slice(0, 10),
          ageRating: title.ageRating ?? "",
          runtimeMinutes: title.runtimeMinutes,
          synopsis: title.synopsis,
          posterUrl: title.posterUrl ?? "",
          trailerYoutubeUrl: title.trailerYoutubeUrl ?? "",
          imdbUrl: title.imdbUrl ?? "",
          imdbRating: title.imdbRating?.toString() ?? "",
          rottenTomatoesUrl: title.rottenTomatoesUrl ?? "",
          rottenTomatoesCriticsScore: title.rottenTomatoesCriticsScore?.toString() ?? "",
          rottenTomatoesAudienceScore: title.rottenTomatoesAudienceScore?.toString() ?? "",
          amazonUrl: title.amazonUrl ?? "",
          productionCompanies: title.productionCompanies,
          productionNetworks: title.productionNetworks,
          studioAttribution:
            title.studioAttributionLabel && title.studioAttributionSource
              ? {
                  label: title.studioAttributionLabel,
                  source: title.studioAttributionSource
                }
              : null,
          watchProviders: title.watchProviders,
          watchProviderLinks: syncWatchProviderLinks(
            title.watchProviders,
            "watchProviderLinks" in title ? parseWatchProviderLinks(title.watchProviderLinks) : []
          ),
          wokeScore: title.wokeScore,
          wokeSummary: title.wokeSummary,
          socialPostDraft: title.socialPostDraft ?? "",
          status: title.status,
          genreSlugs: title.titleGenres.map((entry) => entry.genre.slug),
          cast:
            title.cast.length > 0
              ? title.cast.map((entry) => ({
                  name: entry.person.name,
                  roleName: entry.roleName,
                  billingOrder: entry.billingOrder
                }))
              : [{ name: "", roleName: "", billingOrder: 1 }],
          crew:
            title.crew.length > 0
              ? title.crew.map((entry) => ({
                  name: entry.person.name,
                  jobType: entry.jobType
                }))
              : [{ name: "", jobType: "DIRECTOR" }],
          wokeFactors: normalizedWokeFactors.factors
        }}
      />
    </div>
  );
}

const editableTitleBaseSelect = {
  id: true,
  slug: true,
  name: true,
  type: true,
  originalLanguage: true,
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
  productionCompanies: true,
  productionNetworks: true,
  studioAttributionLabel: true,
  studioAttributionSource: true,
  watchProviders: true,
  wokeScore: true,
  wokeSummary: true,
  socialPostDraft: true,
  status: true,
  titleGenres: {
    select: {
      genre: {
        select: { slug: true }
      }
    }
  },
  cast: {
    orderBy: { billingOrder: "asc" as const },
    select: {
      billingOrder: true,
      roleName: true,
      person: {
        select: { name: true }
      }
    }
  },
  crew: {
    orderBy: { jobType: "asc" as const },
    select: {
      jobType: true,
      person: {
        select: { name: true }
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
} as const;

async function findEditableTitle(id: string) {
  try {
    return await prisma.title.findUnique({
      where: { id },
      select: {
        ...editableTitleBaseSelect,
        watchProviderLinks: true
      }
    });
  } catch (error) {
    if (!isMissingWatchProviderLinksColumn(error)) {
      throw error;
    }

    return prisma.title.findUnique({
      where: { id },
      select: editableTitleBaseSelect
    });
  }
}
