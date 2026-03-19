"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptionalAdminSecret } from "@/components/admin-shell";

interface AdminTitleManagerProps {
  titles: Array<{
    id: string;
    slug: string;
    name: string;
    type: "MOVIE" | "TV_SHOW";
    status: "PUBLISHED" | "DRAFT";
    releaseDate: string;
    imdbUrl: string | null;
    imdbRating: number | null;
    rottenTomatoesCriticsScore: number | null;
    rottenTomatoesAudienceScore: number | null;
    externalScoresUpdatedAt: string | null;
    updatedAt: string;
  }>;
  scoreRefreshEnabled: boolean;
}

export function AdminTitleManager({ titles, scoreRefreshEnabled }: AdminTitleManagerProps) {
  const router = useRouter();
  const adminSecret = useOptionalAdminSecret();
  const secret = adminSecret?.secret ?? "";
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function refreshScores(titleId: string) {
    if (!secret) {
      setStatus("Set ADMIN_SECRET before refreshing scores.");
      return;
    }

    setRefreshingId(titleId);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/titles/${titleId}/refresh-external-scores`, {
        method: "POST",
        headers: {
          "x-admin-secret": secret
        }
      });
      const body = await response.json();

      if (!response.ok) {
        setStatus(`${response.status}: ${body.error ?? "Unable to refresh scores."}`);
        return;
      }

      setStatus(`Updated scores for ${body.data.name}.`);
      router.refresh();
    } catch (error) {
      setStatus(`Unable to refresh scores: ${String(error)}`);
    } finally {
      setRefreshingId(null);
    }
  }

  return (
    <section className="grid gap-4 rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Manage Titles</h2>
          <p className="text-sm text-fg/75">
            Search titles, filter draft versus live content, refresh external scores, or open a title for editing.
          </p>
        </div>

        <Link href="/admin/add-title" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
          Add title
        </Link>
      </div>

      {!scoreRefreshEnabled ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Set `OMDB_API_KEY` to enable score refresh from IMDb-backed external data.
        </p>
      ) : null}

      <div className="grid gap-3">
        {titles.map((title) => (
          <article
            key={title.id}
            className="grid gap-3 rounded-xl border border-line bg-bgSoft/50 p-4 md:grid-cols-[1fr_auto]"
          >
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{title.name}</h3>
                <span className="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-fg/70">
                  {title.status === "PUBLISHED" ? "Live" : "Draft"}
                </span>
                <span className="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-fg/70">
                  {title.type === "MOVIE" ? "Movie" : "TV show"}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-fg/75">
                <span>{title.slug}</span>
                <span>{title.releaseDate.slice(0, 10)}</span>
                <span>Updated {new Date(title.updatedAt).toLocaleDateString("en-US")}</span>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span>IMDb: {title.imdbRating !== null ? title.imdbRating.toFixed(1) : "N/A"}</span>
                <span>RT Critics: {title.rottenTomatoesCriticsScore !== null ? `${title.rottenTomatoesCriticsScore}%` : "N/A"}</span>
                <span>RT Audience: {title.rottenTomatoesAudienceScore !== null ? `${title.rottenTomatoesAudienceScore}%` : "N/A"}</span>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-label={refreshIndicatorLabel(title.externalScoresUpdatedAt)}
                    className={`h-2.5 w-2.5 rounded-full ${refreshIndicatorTone(title.externalScoresUpdatedAt)}`}
                  />
                  Scores refreshed{" "}
                  {title.externalScoresUpdatedAt
                    ? new Date(title.externalScoresUpdatedAt).toLocaleDateString("en-US")
                    : "never"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-end gap-2">
              <button
                type="button"
                disabled={refreshingId === title.id || !title.imdbUrl || !scoreRefreshEnabled}
                onClick={() => refreshScores(title.id)}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {refreshingId === title.id ? "Refreshing..." : "Refresh scores"}
              </button>
              <Link
                href={`/title/${title.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
              >
                View
              </Link>
              <Link
                href={`/admin/titles/${title.id}`}
                className="rounded-full bg-fg px-4 py-2 text-sm font-semibold text-white"
              >
                Edit
              </Link>
            </div>
          </article>
        ))}

        {titles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-fg/70">
            No titles matched the current filters.
          </p>
        ) : null}
      </div>

      {status ? <output className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg/80">{status}</output> : null}
    </section>
  );
}

function refreshIndicatorTone(externalScoresUpdatedAt: string | null): string {
  const ageInMs = getRefreshAgeInMs(externalScoresUpdatedAt);

  if (ageInMs === null || ageInMs >= 365 * 24 * 60 * 60 * 1000) {
    return "bg-red-500";
  }

  if (ageInMs >= 183 * 24 * 60 * 60 * 1000) {
    return "bg-orange-400";
  }

  return "bg-emerald-500";
}

function refreshIndicatorLabel(externalScoresUpdatedAt: string | null): string {
  const ageInMs = getRefreshAgeInMs(externalScoresUpdatedAt);

  if (ageInMs === null || ageInMs >= 365 * 24 * 60 * 60 * 1000) {
    return "External scores stale";
  }

  if (ageInMs >= 183 * 24 * 60 * 60 * 1000) {
    return "External scores aging";
  }

  return "External scores fresh";
}

function getRefreshAgeInMs(externalScoresUpdatedAt: string | null): number | null {
  if (!externalScoresUpdatedAt) {
    return null;
  }

  return Date.now() - new Date(externalScoresUpdatedAt).getTime();
}
