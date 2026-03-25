import { notFound } from "next/navigation";
import { FilterBar } from "@/components/filter-bar";
import { PageHero } from "@/components/page-hero";
import { Pagination } from "@/components/pagination";
import { TitleGrid } from "@/components/title-grid";
import { getTitleCards } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { pageHref } from "@/lib/url";
import { parseListQuery } from "@/lib/validation";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GenrePage({ params, searchParams }: PageProps) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);

  const genre = await prisma.genre.findUnique({
    where: { slug },
    select: { slug: true, name: true }
  });

  if (!genre) {
    notFound();
  }

  const parsed = parseListQuery(rawSearch);
  const filters = { ...parsed, genre: slug };
  const results = await getTitleCards(filters);

  return (
    <div className="grid gap-4">
      <PageHero
        eyebrow="Genre"
        title={genre.name}
        description={`Browse titles tagged in ${genre.name}.`}
      />
      <FilterBar basePath={`/genres/${slug}`} current={filters} lockGenre={slug} />
      <TitleGrid titles={results.data} showTomatoRatings={filters.tomatoes_min !== undefined} />
      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        createHref={(nextPage) => pageHref(`/genres/${slug}`, { ...filters, page: nextPage }, nextPage)}
      />
    </div>
  );
}
