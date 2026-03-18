import { AutoSubmitFilterForm } from "@/components/auto-submit-filter-form";
import { getGenresWithCount } from "@/lib/catalog";
import { ListQuery } from "@/lib/validation";

interface FilterBarProps {
  basePath: string;
  current: ListQuery;
  lockType?: "MOVIE" | "TV_SHOW";
  lockGenre?: string;
}

export async function FilterBar({ basePath, current, lockType, lockGenre }: FilterBarProps) {
  const genres = await getGenresWithCount();

  return (
    <AutoSubmitFilterForm action={basePath}>
      <div className="grid gap-3 md:grid-cols-5">
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

        {!lockGenre && (
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
            Genre
            <select
              name="genre"
              defaultValue={current.genre ?? ""}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">All</option>
              {genres.map((genre) => (
                <option key={genre.slug} value={genre.slug}>
                  {genre.name} ({genre.count})
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          Year
          <input
            type="number"
            name="year"
            min={1888}
            max={2100}
            defaultValue={current.year ?? ""}
            placeholder="2023"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          Min score
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
          Max score
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

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr,200px,auto]">
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
            <option value="score_asc">Least woke → most woke</option>
            <option value="score_desc">Most woke → least woke</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title_asc">Title A–Z</option>
            <option value="title_desc">Title Z–A</option>
          </select>
        </label>

        <div className="flex items-end gap-2">
          <input type="hidden" name="limit" value={String(current.limit)} />
          {lockType ? <input type="hidden" name="type" value={lockType} /> : null}
          {lockGenre ? <input type="hidden" name="genre" value={lockGenre} /> : null}
          <button
            type="submit"
            className="h-[38px] rounded-lg bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accentHover"
          >
            Apply
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-fgMuted">Score scale: 0 = least woke, 100 = most woke.</p>
    </AutoSubmitFilterForm>
  );
}
