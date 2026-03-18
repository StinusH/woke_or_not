import { FilterBar } from "@/components/filter-bar";
import { PageHero } from "@/components/page-hero";
import { Pagination } from "@/components/pagination";
import { TitleGrid } from "@/components/title-grid";
import { getTitleCards } from "@/lib/catalog";
import { pageHref } from "@/lib/url";
import { parseListQuery } from "@/lib/validation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MoviesPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const parsed = parseListQuery(raw);
  const filters = { ...parsed, type: "MOVIE" as const };
  const results = await getTitleCards(filters);

  return (
    <div className="grid gap-4">
      <PageHero
        eyebrow="Category"
        title="Movies"
        description="Filter movies by genre, score range, and search keywords."
      />
      <FilterBar basePath="/movies" current={filters} lockType="MOVIE" />
      <TitleGrid titles={results.data} />
      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        createHref={(nextPage) => pageHref("/movies", { ...filters, page: nextPage }, nextPage)}
      />
    </div>
  );
}
