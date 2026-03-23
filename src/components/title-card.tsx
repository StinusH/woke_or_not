import Link from "next/link";
import { TitleCard as TitleCardType } from "@/lib/types";
import { ScoreBadge } from "@/components/score-badge";

interface TitleCardProps {
  title: TitleCardType;
}

export function TitleCard({ title }: TitleCardProps) {
  const year = new Date(title.releaseDate).getFullYear();

  return (
    <article className="animate-rise group rounded-xl border border-line bg-card shadow-card transition-shadow hover:shadow-card-hover">
      <Link href={`/title/${title.slug}`} className="flex h-full flex-col">
        <div className="relative h-48 overflow-hidden rounded-t-xl bg-bgSoft">
          {title.posterUrl ? (
            <img
              src={title.posterUrl}
              alt={`Poster for ${title.name}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-fgMuted">No poster</div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base font-bold leading-snug text-fg">{title.name}</h3>
            <ScoreBadge score={title.wokeScore} />
          </div>

          <p className="text-xs text-fgMuted">
            {title.type === "MOVIE" ? "Movie" : "TV Show"} · {year}
          </p>

          <div className="flex flex-wrap gap-1">
            {title.imdbRating !== null ? (
              <span className="rounded-md bg-bgSoft px-2 py-0.5 text-xs font-medium text-fgMuted">
                IMDb {title.imdbRating.toFixed(1)}
              </span>
            ) : null}
            {title.rottenTomatoesCriticsScore !== null ? (
              <span className="rounded-md bg-bgSoft px-2 py-0.5 text-xs font-medium text-fgMuted">
                RT {title.rottenTomatoesCriticsScore}%
              </span>
            ) : null}
            {title.genres.slice(0, 3).map((genre) => (
              <span
                key={genre.slug}
                className="rounded-md bg-bgSoft px-2 py-0.5 text-xs font-medium text-fgMuted"
              >
                {genre.name}
              </span>
            ))}
          </div>

          <p className="line-clamp-2 text-sm text-fgMuted">{title.wokeSummary}</p>
        </div>
      </Link>
    </article>
  );
}
