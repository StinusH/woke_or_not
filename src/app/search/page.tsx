import React from "react";
import { FilterBar } from "@/components/filter-bar";
import { InfiniteTitleResults } from "@/components/infinite-title-results";
import { PageHero } from "@/components/page-hero";
import { getTitleCards } from "@/lib/catalog";
import { parseListQuery } from "@/lib/validation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const parsed = parseListQuery(raw);
  const filters = parsed.language && parsed.language.length > 0 ? parsed : { ...parsed, language: ["en"] };
  const results = await getTitleCards(filters);

  return (
    <div className="grid gap-4">
      <PageHero
        eyebrow="Search"
        title="Search all titles"
        description="Search by name or synopsis, then narrow results by genre, release years, ratings, and woke score to find safer picks faster."
      />
      <FilterBar basePath="/search" current={filters} />
      <InfiniteTitleResults
        basePath="/search"
        initialResults={results}
        filters={filters}
        showTomatoRatings={filters.tomatoes_min !== undefined}
      />
    </div>
  );
}
