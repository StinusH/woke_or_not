import { notFound } from "next/navigation";
import { AdminTitleForm } from "@/components/admin-title-form";
import { prisma } from "@/lib/prisma";
import { hasTitleMetadataProviderConfig } from "@/lib/title-metadata";
import { parseWatchProviderLinks, syncWatchProviderLinks } from "@/lib/watch-providers";

export const dynamic = "force-dynamic";

interface EditTitlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTitlePage({ params }: EditTitlePageProps) {
  const { id } = await params;

  const [title, genres] = await Promise.all([
    prisma.title.findUnique({
      where: { id },
      include: {
        titleGenres: {
          select: {
            genre: {
              select: { slug: true }
            }
          }
        },
        cast: {
          orderBy: { billingOrder: "asc" },
          select: {
            billingOrder: true,
            roleName: true,
            person: {
              select: { name: true }
            }
          }
        },
        crew: {
          orderBy: { jobType: "asc" },
          select: {
            jobType: true,
            person: {
              select: { name: true }
            }
          }
        },
        wokeFactors: {
          orderBy: { displayOrder: "asc" },
          select: {
            label: true,
            weight: true,
            displayOrder: true,
            notes: true
          }
        }
      }
    }),
    prisma.genre.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true }
    })
  ]);

  if (!title) {
    notFound();
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-line bg-card p-5 text-sm text-fg/75">
        Editing `{title.name}`. Save changes to update the live or draft title data.
      </section>

      <AdminTitleForm
        mode="update"
        titleId={title.id}
        titleHeading={`Edit ${title.name}`}
        titleDescription="Review the existing values, optionally refresh metadata from TMDb, and save your changes."
        genres={genres}
        metadataEnabled={hasTitleMetadataProviderConfig()}
        initialDraft={{
          slug: title.slug,
          name: title.name,
          type: title.type,
          releaseDate: title.releaseDate.toISOString().slice(0, 10),
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
          watchProviders: title.watchProviders,
          watchProviderLinks: syncWatchProviderLinks(title.watchProviders, parseWatchProviderLinks(title.watchProviderLinks)),
          wokeScore: title.wokeScore,
          wokeSummary: title.wokeSummary,
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
          wokeFactors:
            title.wokeFactors.length > 0
              ? title.wokeFactors.map((entry) => ({
                  label: entry.label,
                  weight: entry.weight,
                  displayOrder: entry.displayOrder,
                  notes: entry.notes ?? ""
                }))
              : [{ label: "Representation breadth", weight: 15, displayOrder: 1, notes: "" }]
        }}
      />
    </div>
  );
}
