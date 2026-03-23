import { AdminTitleForm } from "@/components/admin-title-form";
import { prisma } from "@/lib/prisma";
import { hasTitleMetadataProviderConfig } from "@/lib/title-metadata";

export const dynamic = "force-dynamic";

export default async function AddTitlePage() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true }
  });

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-line bg-card p-5 shadow-card text-sm text-fgMuted">
        Add new titles here. This page is focused on the structured creation flow.
      </section>

      <section className="rounded-xl border border-line bg-card p-5 shadow-card text-xs text-fgMuted">
        Available genres: {genres.map((genre) => genre.slug).join(", ")}
      </section>

      <AdminTitleForm genres={genres} metadataEnabled={hasTitleMetadataProviderConfig()} showAiPromptSection />
    </div>
  );
}
