import { FilterBar } from "@/components/filter-bar";
import { InfiniteTitleResults } from "@/components/infinite-title-results";
import { PageHero } from "@/components/page-hero";
import { getTitleCards } from "@/lib/catalog";
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
      <InfiniteTitleResults initialResults={results} filters={filters} showTomatoRatings={filters.tomatoes_min !== undefined} />
    </div>
  );
}
