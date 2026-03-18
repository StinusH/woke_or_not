import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLinks } from "@/components/external-links";
import { ScoreBadge } from "@/components/score-badge";
import { TrailerEmbed } from "@/components/trailer-embed";
import { WokeFactorPanel } from "@/components/woke-factor-panel";
import { getTitleDetail } from "@/lib/catalog";
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

  const externalScores = [
    title.imdbRating !== null ? { label: "IMDb Rating", value: `${title.imdbRating.toFixed(1)} / 10` } : null,
    title.rottenTomatoesCriticsScore !== null
      ? { label: "RT Critics", value: `${title.rottenTomatoesCriticsScore}%` }
      : null,
    title.rottenTomatoesAudienceScore !== null
      ? { label: "RT Audience", value: `${title.rottenTomatoesAudienceScore}%` }
      : null
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry));

  return (
    <article className="grid gap-6">
      {/* Hero section */}
      <section className="grid gap-6 md:grid-cols-[280px,1fr] md:gap-8">
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

        <div className="grid auto-rows-min gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">
              {title.type === "MOVIE" ? "Movie" : "TV Show"}
            </p>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="font-display text-3xl font-bold leading-tight text-fg md:text-4xl">
                {title.name}
              </h1>
              <ScoreBadge score={title.wokeScore} />
            </div>
          </div>

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

          <p className="text-sm leading-relaxed text-fgMuted">{title.synopsis}</p>

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
            <div className="rounded-lg bg-bgSoft px-3 py-2.5 md:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-fgMuted">Score Summary</dt>
              <dd className="mt-0.5 text-fg">{title.wokeSummary}</dd>
            </div>
          </dl>

          {title.watchProviders.length > 0 ? (
            <div className="rounded-lg bg-bgSoft px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-fgMuted">Available On</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {title.watchProviders.map((provider) => (
                  <span key={provider} className="rounded-md border border-line bg-card px-2.5 py-1 text-xs font-medium text-fg">
                    {provider}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <ExternalLinks
            imdbUrl={title.imdbUrl}
            rottenTomatoesUrl={title.rottenTomatoesUrl}
            amazonUrl={title.amazonUrl}
          />

          {externalScores.length > 0 ? (
            <dl className="grid gap-2 text-sm md:grid-cols-3">
              {externalScores.map((score) => (
                <div key={score.label} className="rounded-lg bg-bgSoft px-3 py-2.5">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-fgMuted">{score.label}</dt>
                  <dd className="mt-0.5 font-medium text-fg">{score.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
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

      {/* Trailer */}
      <section className="rounded-xl border border-line bg-card p-5 shadow-card">
        <h2 className="mb-4 font-display text-lg font-bold text-fg">Trailer</h2>
        <TrailerEmbed embedUrl={toYoutubeEmbedUrl(title.trailerYoutubeUrl)} />
      </section>

      {/* Score Factors */}
      <section className="rounded-xl border border-line bg-card p-5 shadow-card">
        <h2 className="mb-4 font-display text-lg font-bold text-fg">Score Factors</h2>
        <WokeFactorPanel factors={title.wokeFactors} />
      </section>
    </article>
  );
}
