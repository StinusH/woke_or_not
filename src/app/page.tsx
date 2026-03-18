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
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
          Editorial Catalog
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight text-fg md:text-5xl">
          Find what fits
          <br />
          your preference.
        </h1>
        <p className="mt-4 max-w-lg text-base text-fgMuted">
          Transparent, manually curated woke score breakdowns for movies and TV shows. Seek
          specific themes — or filter them out.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/movies"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accentHover"
          >
            Browse Movies
          </Link>
          <Link
            href="/tv-shows"
            className="rounded-lg border border-line bg-card px-5 py-2.5 text-sm font-semibold text-fg shadow-card transition hover:bg-bgSoft"
          >
            Browse TV Shows
          </Link>
        </div>
      </section>

      {/* Browse cards */}
      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/movies"
          className="group rounded-xl border border-line bg-card p-6 shadow-card transition hover:shadow-card-hover"
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">Browse</p>
          <h2 className="font-display text-2xl font-bold text-fg">Movies</h2>
          <p className="mt-2 text-sm text-fgMuted">
            Action, comedy, drama and more with sortable score ranges.
          </p>
        </Link>

        <Link
          href="/tv-shows"
          className="group rounded-xl border border-line bg-card p-6 shadow-card transition hover:shadow-card-hover"
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">Browse</p>
          <h2 className="font-display text-2xl font-bold text-fg">TV Shows</h2>
          <p className="mt-2 text-sm text-fgMuted">
            Series with cast, creators, trailer embeds, and factor details.
          </p>
        </Link>
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-fg">Least Woke First</h2>
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
