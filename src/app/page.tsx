import React from "react";
import Link from "next/link";
import { getGenresWithCount, getTitleCards } from "@/lib/catalog";
import { TitleGrid } from "@/components/title-grid";

export default async function HomePage() {
  const [featured, genres] = await Promise.all([
    getTitleCards({ page: 1, limit: 8, sort: "score_asc" }),
    getGenresWithCount()
  ]);

  return (
    <div className="grid gap-10">
      {/* Hero */}
      <section className="py-4">
        <div className="rounded-xl border border-line bg-card px-4 py-8 text-center shadow-card sm:px-8 sm:py-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
            Avoid The Woke Stuff
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-fg sm:text-4xl md:text-5xl">
            <span>Find what to skip</span>
            <span className="sm:block"> before movie night.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-fgMuted sm:text-base">
            Manually curated woke score breakdowns for movies and TV shows so you can spot titles
            with stronger ideological themes and avoid them faster.
          </p>
          <form action="/search" method="GET" className="mx-auto mt-8 max-w-4xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                name="q"
                placeholder="Search titles or synopsis..."
                aria-label="Search titles"
                className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-5 py-4 text-base text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-lg"
              />
              <button
                type="submit"
                className="rounded-lg bg-accent px-6 py-4 text-sm font-semibold text-white transition hover:bg-accentHover sm:px-8"
              >
                Search
              </button>
            </div>
          </form>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/movies"
              className="rounded-lg bg-accent px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-accentHover"
            >
              Browse Movies
            </Link>
            <Link
              href="/tv-shows"
              className="rounded-lg border border-line bg-card px-5 py-2.5 text-center text-sm font-semibold text-fg shadow-card transition hover:bg-bgSoft"
            >
              Browse TV Shows
            </Link>
          </div>
        </div>
      </section>

      {/* Genres */}
      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-fg">Genres</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <Link
              key={genre.slug}
              href={`/genres/${genre.slug}`}
              className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium text-fgMuted shadow-card transition hover:border-accent hover:text-accent"
            >
              {genre.name}
              <span className="ml-1.5 rounded-md bg-bgSoft px-1.5 py-0.5 text-xs font-semibold text-fgMuted">
                {genre.count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top picks */}
      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-bold text-fg">Safest Picks First</h2>
          <Link
            href="/search?sort=score_asc"
            className="text-sm font-medium text-accent hover:underline"
          >
            View all →
          </Link>
        </div>
        <TitleGrid titles={featured.data} />
      </section>
    </div>
  );
}
