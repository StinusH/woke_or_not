import React from "react";
import { redirect } from "next/navigation";
import { FilterBar } from "@/components/filter-bar";
import { InfiniteTitleResults } from "@/components/infinite-title-results";
import { PageHero } from "@/components/page-hero";
import { getTitleCards } from "@/lib/catalog";
import { parseListQuery } from "@/lib/validation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MoviesPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const currentYear = new Date().getFullYear();
  const defaultYearMin = currentYear - 4;
  const defaultsToken = Array.isArray(raw._defaults) ? raw._defaults[0] : raw._defaults;

  if (Object.keys(raw).length === 0) {
    redirect(`/movies?year_min=${defaultYearMin}&_defaults=1`);
  }

  const parsed = parseListQuery(raw);
  const filters = { ...parsed, type: "MOVIE" as const };
  const results = await getTitleCards(filters);

  return (
    <div className="grid gap-4">
      <PageHero
        eyebrow="Category"
        title="Movies"
        description="Filter movies by genre, woke score, and keywords so you can avoid the ones most likely to push woke themes."
      />
      <FilterBar
        basePath="/movies"
        current={filters}
        lockType="MOVIE"
        extraHiddenFields={{ _defaults: defaultsToken }}
      />
      <InfiniteTitleResults initialResults={results} filters={filters} showTomatoRatings={filters.tomatoes_min !== undefined} />
    </div>
  );
}
