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
      <section className="rounded-2xl border border-line bg-card p-5 text-sm text-fg/75">
        Add new titles here. This page is focused on the structured creation flow.
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 text-xs text-fg/75">
        Available genres: {genres.map((genre) => genre.slug).join(", ")}
      </section>

      <AdminTitleForm genres={genres} metadataEnabled={hasTitleMetadataProviderConfig()} showAiPromptSection />
    </div>
  );
}
