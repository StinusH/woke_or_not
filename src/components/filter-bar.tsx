import React from "react";
import { AutoSubmitFilterForm } from "@/components/auto-submit-filter-form";
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { PlatformFilter } from "@/components/platform-filter";
import { getAgeRatingOptions, getGenresWithCount, getPlatformOptions } from "@/lib/catalog";
import { MIN_PUBLIC_RELEASE_YEAR } from "@/lib/constants";
import { ListQuery } from "@/lib/validation";

interface FilterBarProps {
  basePath: string;
  current: ListQuery;
  lockType?: "MOVIE" | "TV_SHOW";
  extraHiddenFields?: Record<string, string | undefined>;
}

export async function FilterBar({
  basePath,
  current,
  lockType,
  extraHiddenFields
}: FilterBarProps) {
  const scopedFilters = {
    ...current,
    type: lockType ?? current.type
  };
  const [genres, platforms, ageRatings] = await Promise.all([
    getGenresWithCount(scopedFilters),
    getPlatformOptions(scopedFilters),
    getAgeRatingOptions(scopedFilters)
  ]);

  return (
    <AutoSubmitFilterForm action={basePath}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {!lockType && (
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
            Type
            <select
              name="type"
              defaultValue={current.type ?? ""}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">All</option>
              <option value="MOVIE">Movies</option>
              <option value="TV_SHOW">TV Shows</option>
            </select>
          </label>
        )}

        {genres.length > 0 ? (
          <MultiSelectFilter
            label="Genre"
            name="genre"
            options={genres.map((genre) => ({
              value: genre.slug,
              label: genre.name,
              count: genre.count
            }))}
            selected={current.genre ?? []}
            searchPlaceholder="Filter genres..."
            emptyMessage="No genres match that filter."
          />
        ) : null}

        {ageRatings.length > 0 ? (
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
            Age rating
            <select
              name="age_rating"
              defaultValue={current.age_rating ?? ""}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">All</option>
              {ageRatings.map((ageRating) => (
                <option key={ageRating} value={ageRating}>
                  {ageRating}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {platforms.length > 0 ? <PlatformFilter options={platforms} selected={current.platform ?? []} /> : null}

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          Year from
          <input
            type="number"
            name="year_min"
            min={MIN_PUBLIC_RELEASE_YEAR}
            max={2100}
            defaultValue={current.year_min ?? current.year ?? ""}
            placeholder={String(MIN_PUBLIC_RELEASE_YEAR)}
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          Year to
          <input
            type="number"
            name="year_max"
            min={MIN_PUBLIC_RELEASE_YEAR}
            max={2100}
            defaultValue={current.year_max ?? current.year ?? ""}
            placeholder="2026"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          IMDb min
          <input
            type="number"
            name="imdb_min"
            min={0}
            max={10}
            step="0.1"
            defaultValue={current.imdb_min ?? ""}
            placeholder="7.0"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          Rotten Tomatoes min
          <input
            type="number"
            name="tomatoes_min"
            min={0}
            max={100}
            defaultValue={current.tomatoes_min ?? ""}
            placeholder="75"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          Woke min
          <input
            type="number"
            name="score_min"
            min={0}
            max={100}
            defaultValue={current.score_min ?? ""}
            placeholder="0"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          Woke max
          <input
            type="number"
            name="score_max"
            min={0}
            max={100}
            defaultValue={current.score_max ?? ""}
            placeholder="100"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr),200px,auto]">
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          Search
          <input
            type="search"
            name="q"
            defaultValue={current.q ?? ""}
            placeholder="Title or synopsis…"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          Sort
          <select
            name="sort"
            defaultValue={current.sort}
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="recommended">Recommended</option>
            <option value="score_asc">Lowest woke score first</option>
            <option value="score_desc">Highest woke score first</option>
            <option value="imdb_desc">Highest IMDb first</option>
            <option value="imdb_asc">Lowest IMDb first</option>
            <option value="tomatoes_desc">Highest Rotten Tomatoes first</option>
            <option value="tomatoes_asc">Lowest Rotten Tomatoes first</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title_asc">Title A–Z</option>
            <option value="title_desc">Title Z–A</option>
          </select>
        </label>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="limit" value={String(current.limit)} />
          {lockType ? <input type="hidden" name="type" value={lockType} /> : null}
          {extraHiddenFields
            ? Object.entries(extraHiddenFields).map(([key, value]) =>
                value !== undefined ? <input key={key} type="hidden" name={key} value={value} /> : null
              )
            : null}
          <button
            type="submit"
            className="h-[38px] w-full rounded-lg bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accentHover sm:w-auto"
          >
            Apply
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-fgMuted">
        Filter by age rating, platform, release window, minimum ratings, and woke score caps. Lower woke scores are safer picks.
      </p>
    </AutoSubmitFilterForm>
  );
}
