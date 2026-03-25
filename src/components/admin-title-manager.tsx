"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptionalAdminSecret } from "@/components/admin-shell";
import { ScoreBadge } from "@/components/score-badge";

interface AdminTitleManagerProps {
  titles: Array<{
    id: string;
    slug: string;
    name: string;
    type: "MOVIE" | "TV_SHOW";
    status: "PUBLISHED" | "DRAFT";
    releaseDate: string;
    wokeScore: number;
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
  const [titleRows, setTitleRows] = useState(titles);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [scoreDraft, setScoreDraft] = useState("");
  const [savingScoreId, setSavingScoreId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setTitleRows(titles);
  }, [titles]);

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

  function startEditingScore(title: AdminTitleManagerProps["titles"][number]) {
    setEditingScoreId(title.id);
    setScoreDraft(String(title.wokeScore));
    setStatus(null);
  }

  function cancelEditingScore() {
    setEditingScoreId(null);
    setScoreDraft("");
  }

  async function saveWokeScore(titleId: string) {
    if (!secret) {
      setStatus("Set ADMIN_SECRET before updating woke scores.");
      return;
    }

    const wokeScore = Number(scoreDraft);

    if (!Number.isInteger(wokeScore) || wokeScore < 0 || wokeScore > 100) {
      setStatus("Woke score must be a whole number from 0 to 100.");
      return;
    }

    setSavingScoreId(titleId);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/titles/${titleId}/woke-score`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret
        },
        body: JSON.stringify({ wokeScore })
      });
      const body = await response.json();

      if (!response.ok) {
        setStatus(`${response.status}: ${body.error ?? "Unable to update woke score."}`);
        return;
      }

      setTitleRows((current) =>
        current.map((title) =>
          title.id === titleId
            ? {
                ...title,
                wokeScore: body.data.wokeScore,
                updatedAt: body.data.updatedAt
              }
            : title
        )
      );
      setEditingScoreId(null);
      setScoreDraft("");
      setStatus(`Updated woke score for ${body.data.name}.`);
      router.refresh();
    } catch (error) {
      setStatus(`Unable to update woke score: ${String(error)}`);
    } finally {
      setSavingScoreId(null);
    }
  }

  return (
    <section className="grid gap-4 rounded-xl border border-line bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-fg">Manage Titles</h2>
          <p className="text-sm text-fgMuted">
            Search titles, filter draft versus live content, refresh external scores, or open a title for editing.
          </p>
        </div>

        <Link href="/admin/add-title" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentHover">
          Add title
        </Link>
      </div>

      {!scoreRefreshEnabled ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Set `OMDB_API_KEY` to enable score refresh from IMDb-backed external data.
        </p>
      ) : null}

      <div className="grid gap-3">
        {titleRows.map((title) => (
          <article
            key={title.id}
            className="grid gap-3 rounded-xl border border-line bg-bgSoft/50 p-4 md:grid-cols-[1fr_auto]"
          >
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {editingScoreId === title.id ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveWokeScore(title.id);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5"
                  >
                    <label htmlFor={`woke-score-${title.id}`} className="text-[11px] font-semibold uppercase tracking-wide text-fgMuted">
                      Woke score
                    </label>
                    <input
                      id={`woke-score-${title.id}`}
                      type="number"
                      min={0}
                      max={100}
                      inputMode="numeric"
                      value={scoreDraft}
                      onChange={(event) => setScoreDraft(event.target.value)}
                      className="w-20 rounded-md border border-line bg-bg px-2 py-1 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                    <button
                      type="submit"
                      disabled={savingScoreId === title.id}
                      className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-accentHover disabled:opacity-50"
                    >
                      {savingScoreId === title.id ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      disabled={savingScoreId === title.id}
                      onClick={cancelEditingScore}
                      className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold transition hover:bg-bgSoft disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditingScore(title)}
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-left transition hover:bg-bgSoft"
                    aria-label={`Edit woke score for ${title.name}`}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-fgMuted">Woke score</span>
                    <ScoreBadge score={title.wokeScore} />
                  </button>
                )}
                <h3 className="font-semibold">{title.name}</h3>
                <span className="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-fg/70">
                  {title.status === "PUBLISHED" ? "Live" : "Draft"}
                </span>
                <span className="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-fg/70">
                  {title.type === "MOVIE" ? "Movie" : "TV show"}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-fgMuted">
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
                className="rounded-lg border border-line px-4 py-2 text-sm font-semibold transition hover:bg-bgSoft disabled:opacity-50"
              >
                {refreshingId === title.id ? "Refreshing..." : "Refresh scores"}
              </button>
              <Link
                href={`/title/${title.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-line px-4 py-2 text-sm font-semibold transition hover:bg-bgSoft"
              >
                View
              </Link>
              <Link
                href={`/admin/titles/${title.id}`}
                className="rounded-lg bg-fg px-4 py-2 text-sm font-semibold text-white transition hover:bg-fg/90"
              >
                Edit
              </Link>
            </div>
          </article>
        ))}

        {titleRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-fg/70">
            No titles matched the current filters.
          </p>
        ) : null}
      </div>

      {status ? <output className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fgMuted">{status}</output> : null}
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
