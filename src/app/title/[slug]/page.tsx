import type { Metadata } from "next";
import type React from "react";
import { notFound } from "next/navigation";
import { ScoreBadge } from "@/components/score-badge";
import { TrailerEmbed } from "@/components/trailer-embed";
import { WokeFactorPanel } from "@/components/woke-factor-panel";
import { getTitleDetail } from "@/lib/catalog";
import { getWatchProviderFallbackUrl } from "@/lib/watch-providers";
import { toYoutubeEmbedUrl } from "@/lib/youtube";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = await getTitleDetail(slug);

  if (!title) {
    return { title: "Title not found" };
  }

  return {
    title: title.name,
    description: title.synopsis.slice(0, 150),
    openGraph: {
      title: title.name,
      description: title.synopsis.slice(0, 150),
      images: title.posterUrl ? [{ url: title.posterUrl }] : undefined
    }
  };
}

export default async function TitleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const title = await getTitleDetail(slug);

  if (!title) {
    notFound();
  }

  const releaseDate = new Date(title.releaseDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const availableOn = title.watchProviderLinks.length > 0
    ? title.watchProviderLinks
    : title.watchProviders.map((provider) => ({ name: provider, url: null }));

  const trailerEmbedUrl = toYoutubeEmbedUrl(title.trailerYoutubeUrl);

  return (
    <article className="grid gap-6">
      {/* Hero section */}
      <section className="grid gap-6 md:grid-cols-[300px,1fr] md:gap-8">
        {/* Left column: poster + trailer */}
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-line bg-bgSoft shadow-card">
            {title.posterUrl ? (
              <img
                src={title.posterUrl}
                alt={`Poster for ${title.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-[380px] items-center justify-center text-sm text-fgMuted">
                No poster available
              </div>
            )}
          </div>

          {trailerEmbedUrl ? (
            <TrailerEmbed embedUrl={trailerEmbedUrl} />
          ) : null}
        </div>

        {/* Right column: title, woke score, info, ratings, score summary */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">
              {title.type === "MOVIE" ? "Movie" : "TV Show"}
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight text-fg md:text-4xl">
              {title.name}
            </h1>
          </div>

          <ScoreBadge score={title.wokeScore} variant="display" />

          <div className="flex flex-wrap gap-1.5">
            {title.genres.map((genre) => (
              <span
                key={genre.slug}
                className="rounded-md bg-bgSoft px-2.5 py-1 text-xs font-medium text-fgMuted"
              >
                {genre.name}
              </span>
            ))}
          </div>

          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <div className="rounded-lg bg-bgSoft px-3 py-2.5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-fgMuted">Release Date</dt>
              <dd className="mt-0.5 font-medium text-fg">{releaseDate}</dd>
            </div>
            <div className="rounded-lg bg-bgSoft px-3 py-2.5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-fgMuted">Runtime</dt>
              <dd className="mt-0.5 font-medium text-fg">
                {title.runtimeMinutes ? `${title.runtimeMinutes} min` : "N/A"}
              </dd>
            </div>
          </dl>

          {availableOn.length > 0 ? (
            <div className="rounded-lg bg-bgSoft px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-fgMuted">Available On</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {availableOn.map((provider) => {
                  const href = provider.url ?? getWatchProviderFallbackUrl(provider.name);

                  return href ? (
                    <a
                      key={provider.name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-line bg-card px-2.5 py-1 text-xs font-medium text-fg transition hover:border-accent hover:text-accent"
                    >
                      {provider.name}
                    </a>
                  ) : (
                    <span key={provider.name} className="rounded-md border border-line bg-card px-2.5 py-1 text-xs font-medium text-fg">
                      {provider.name}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Compact clickable ratings */}
          <div className="flex flex-wrap gap-2">
            {title.imdbRating !== null ? (
              <RatingChip
                icon={<ImdbStarIcon className="h-4 w-4 text-amber-500" />}
                value={`${title.imdbRating.toFixed(1)} / 10`}
                label="IMDb"
                href={title.imdbUrl ?? undefined}
              />
            ) : null}
            {(title.rottenTomatoesCriticsScore !== null || title.rottenTomatoesAudienceScore !== null) ? (
              <RTRatingChip
                criticsScore={title.rottenTomatoesCriticsScore}
                audienceScore={title.rottenTomatoesAudienceScore}
                href={title.rottenTomatoesUrl ?? undefined}
              />
            ) : null}
          </div>

          {/* Score summary fills remaining height to match left column */}
          <div className="flex-1 rounded-xl border border-line bg-card p-5 shadow-card">
            <h2 className="mb-3 font-display text-lg font-bold text-fg">Score Summary</h2>
            <p className="text-sm leading-relaxed text-fgMuted">{title.wokeSummary}</p>
          </div>
        </div>
      </section>

      {/* Score Factors */}
      <section className="rounded-xl border border-line bg-card p-5 shadow-card">
        <h2 className="mb-4 font-display text-lg font-bold text-fg">Score Factors</h2>
        <WokeFactorPanel factors={title.wokeFactors} minimumWeight={16} />
      </section>

      {/* Cast & Crew */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-card p-5 shadow-card">
          <h2 className="mb-3 font-display text-lg font-bold text-fg">Main Cast</h2>
          <ul className="grid gap-1.5">
            {title.cast.map((member) => (
              <li
                key={`${member.name}-${member.roleName}`}
                className="flex items-center justify-between rounded-lg bg-bgSoft px-3 py-2 text-sm"
              >
                <span className="font-medium text-fg">{member.name}</span>
                <span className="text-xs text-fgMuted">as {member.roleName}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-card">
          <h2 className="mb-3 font-display text-lg font-bold text-fg">Director &amp; Crew</h2>
          <ul className="grid gap-1.5">
            {title.crew.map((member) => (
              <li
                key={`${member.name}-${member.jobType}`}
                className="flex items-center justify-between rounded-lg bg-bgSoft px-3 py-2 text-sm"
              >
                <span className="font-medium text-fg">{member.name}</span>
                <span className="text-xs text-fgMuted">{member.jobType.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}

function RatingChip({
  icon,
  value,
  label,
  href
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  href?: string;
}) {
  const baseClass =
    "flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-sm text-fg shadow-card transition";

  const inner = (
    <>
      {icon}
      <span className="font-semibold">{value}</span>
      <span className="text-xs text-fgMuted">{label}</span>
      {href ? <span className="ml-0.5 text-xs text-fgMuted">↗</span> : null}
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`${baseClass} cursor-pointer hover:border-accent hover:text-accent`}>
        {inner}
      </a>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}

function ImdbStarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.75l2.67 5.41 5.97.87-4.32 4.21 1.02 5.95L12 16.38l-5.34 2.81 1.02-5.95-4.32-4.21 5.97-.87L12 2.75z" />
    </svg>
  );
}

function TomatoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M8.6 5.1c.6-2.1 2.2-3.4 3.4-4 .2-.1.4-.1.6 0 1.1.5 2.7 1.8 3.4 4 1.8.1 3.1.8 4 2-.8.4-1.8.7-2.9.8 1.7 1.4 2.6 3.3 2.6 5.6 0 4.9-3.5 8.5-8.1 8.5S3.5 18.4 3.5 13.5c0-2.2.9-4.1 2.6-5.6-1.1-.1-2.1-.4-2.9-.8.9-1.2 2.2-1.9 4-2Z"
        fill="currentColor"
      />
      <path
        d="M12 5.4c-1.4 0-2.7.6-3.7 1.5.9.2 1.9.3 2.9.3 2.1 0 4.1-.4 5.5-1.2A6 6 0 0 0 12 5.4Z"
        fill="#166534"
      />
      <path
        d="M12.3 4.6c.9-.5 1.7-1.4 2-2.6-1 .5-1.8 1.3-2.2 2.4l.2.2Z"
        fill="#166534"
      />
    </svg>
  );
}

function PopcornIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M7.2 8.4c-1.7 0-3.1 1.3-3.1 3 0 .4.1.7.2 1.1C2.9 12.9 2 14.1 2 15.6c0 1.9 1.6 3.4 3.5 3.4h12.9c2 0 3.6-1.5 3.6-3.4 0-1.5-.9-2.8-2.3-3.3.1-.3.2-.7.2-1.1 0-1.7-1.4-3-3.1-3-.8 0-1.6.3-2.1.8A3.7 3.7 0 0 0 12 6.9c-1.1 0-2.1.5-2.8 1.2a3.1 3.1 0 0 0-2-.7Z"
        fill="#f8fafc"
      />
      <path d="M6 10.5h12l-1.3 10.2H7.3L6 10.5Z" fill="currentColor" />
      <path d="M9.2 10.5 8.4 20.7" stroke="#f8fafc" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 10.5v10.2" stroke="#f8fafc" strokeWidth="1.4" strokeLinecap="round" />
      <path d="m14.8 10.5.8 10.2" stroke="#f8fafc" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
