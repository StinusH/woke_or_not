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

export default async function SearchPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const filters = parseListQuery(raw);
  const results = await getTitleCards(filters);

  return (
    <div className="grid gap-4">
      <PageHero
        eyebrow="Search"
        title="Search all titles"
        description="Search by name or synopsis, then refine by category, genre, and score range."
      />
      <FilterBar basePath="/search" current={filters} />
      <TitleGrid titles={results.data} />
      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        createHref={(nextPage) => pageHref("/search", { ...filters, page: nextPage }, nextPage)}
      />
    </div>
  );
}
