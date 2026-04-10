import React from "react";
import Link from "next/link";
import { TitleCardContentTags } from "@/components/title-card-content-tags";
import { TitleCard as TitleCardType } from "@/lib/types";
import { ScoreBadge } from "@/components/score-badge";
import { TitleCardHeading } from "@/components/title-card-heading";
import { getTitlePosterAltText } from "@/lib/title-seo";

interface TitleCardProps {
  title: TitleCardType;
  showTomatoRatings?: boolean;
}

export function TitleCard({ title, showTomatoRatings = false }: TitleCardProps) {
  const year = new Date(title.releaseDate).getFullYear();

  return (
    <article className="animate-rise group rounded-xl border border-line bg-card shadow-card transition-shadow hover:shadow-card-hover">
      <Link href={`/title/${title.slug}`} className="flex h-full flex-col">
        <div className="relative h-96 overflow-hidden rounded-t-xl bg-bgSoft">
          <TitleCardContentTags tags={title.contentTags} />
          {title.posterUrl ? (
            <img
              src={title.posterUrl}
              alt={getTitlePosterAltText(title)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-fgMuted">No poster</div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <TitleCardHeading
                title={title.name}
                metadata={`${title.type === "MOVIE" ? "Movie" : "TV Show"} · ${year}`}
              />
            </div>
            <ScoreBadge score={title.wokeScore} />
          </div>

          <div className="flex flex-wrap gap-1">
            {title.imdbRating !== null ? (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                ★ {title.imdbRating.toFixed(1)}
              </span>
            ) : null}
            {showTomatoRatings && title.rottenTomatoesCriticsScore !== null ? (
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                🍅 {title.rottenTomatoesCriticsScore}%
              </span>
            ) : null}
            {showTomatoRatings && title.rottenTomatoesAudienceScore !== null ? (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                🍿 {title.rottenTomatoesAudienceScore}%
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
