import { AdminJsonTools } from "@/components/admin-json-tools";
import { AdminTitleManager } from "@/components/admin-title-manager";
import { TitleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasExternalScoreProviderConfig } from "@/lib/external-scores";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const statusFilter: TitleStatus | "ALL" =
    resolvedSearchParams?.status === "DRAFT" || resolvedSearchParams?.status === "PUBLISHED"
      ? resolvedSearchParams.status
      : "ALL";

  const where = {
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { slug: { contains: query, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const titles = await prisma.title.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      status: true,
      releaseDate: true,
      imdbUrl: true,
      imdbRating: true,
      rottenTomatoesCriticsScore: true,
      rottenTomatoesAudienceScore: true,
      externalScoresUpdatedAt: true,
      updatedAt: true
    },
    take: 200
  });
  const scoreRefreshEnabled = hasExternalScoreProviderConfig();

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-line bg-card p-5 shadow-card">
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="grid gap-1 text-sm font-medium">
            Search titles
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by title or slug"
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Status
            <select name="status" defaultValue={statusFilter} className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20">
              <option value="ALL">All titles</option>
              <option value="PUBLISHED">Live titles</option>
              <option value="DRAFT">Draft titles</option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentHover">
              Apply
            </button>
          </div>
        </form>
      </section>

      <AdminTitleManager
        titles={titles.map((title) => ({
          ...title,
          releaseDate: title.releaseDate.toISOString(),
          externalScoresUpdatedAt: title.externalScoresUpdatedAt?.toISOString() ?? null,
          updatedAt: title.updatedAt.toISOString()
        }))}
        scoreRefreshEnabled={scoreRefreshEnabled}
      />

      <AdminJsonTools
        titleSummaries={titles.map((title) => ({
          id: title.id,
          name: title.name,
          slug: title.slug
        }))}
      />
    </div>
  );
}
