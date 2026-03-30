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
      <AdminTitleForm genres={genres} metadataEnabled={hasTitleMetadataProviderConfig()} showAiPromptSection />
    </div>
  );
}
