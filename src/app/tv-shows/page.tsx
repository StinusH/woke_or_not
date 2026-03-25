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

export default async function TvShowsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const parsed = parseListQuery(raw);
  const filters = { ...parsed, type: "TV_SHOW" as const };
  const results = await getTitleCards(filters);

  return (
    <div className="grid gap-4">
      <PageHero
        eyebrow="Category"
        title="TV Shows"
        description="Screen shows by genre and woke score before you start something loaded with stronger woke messaging."
      />
      <FilterBar basePath="/tv-shows" current={filters} lockType="TV_SHOW" />
      <TitleGrid titles={results.data} showTomatoRatings={filters.tomatoes_min !== undefined} />
      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        createHref={(nextPage) => pageHref("/tv-shows", { ...filters, page: nextPage }, nextPage)}
      />
    </div>
  );
}
