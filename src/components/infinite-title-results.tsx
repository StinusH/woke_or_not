"use client";

import React from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TitleGrid } from "@/components/title-grid";
import { SortOption } from "@/lib/constants";
import { PaginatedTitles } from "@/lib/types";
import { pageHref } from "@/lib/url";
import { ListQuery } from "@/lib/validation";

interface InfiniteTitleResultsProps {
  basePath: string;
  initialResults: PaginatedTitles;
  filters: ListQuery;
  emptyLabel?: string;
  showTomatoRatings?: boolean;
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "recommended", label: "Recommended" },
  { value: "score_asc", label: "Lowest woke score first" },
  { value: "score_desc", label: "Highest woke score first" },
  { value: "imdb_desc", label: "Highest IMDb first" },
  { value: "imdb_asc", label: "Lowest IMDb first" },
  { value: "tomatoes_desc", label: "Highest Rotten Tomatoes first" },
  { value: "tomatoes_asc", label: "Lowest Rotten Tomatoes first" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title_asc", label: "Title A-Z" },
  { value: "title_desc", label: "Title Z-A" }
];

export function InfiniteTitleResults({
  basePath,
  initialResults,
  filters,
  emptyLabel,
  showTomatoRatings = false
}: InfiniteTitleResultsProps) {
  const router = useRouter();
  const [results, setResults] = useState(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);
  const pageRef = useRef(initialResults.page);
  const totalPagesRef = useRef(initialResults.totalPages);

  useEffect(() => {
    pageRef.current = results.page;
    totalPagesRef.current = results.totalPages;
  }, [results.page, results.totalPages]);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    isLoadingRef.current = false;
    setIsLoading(false);
    setLoadError(null);
    startTransition(() => {
      setResults(initialResults);
    });
  }, [initialResults, startTransition]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function handleSortChange(nextSort: SortOption) {
    if (nextSort === filters.sort) {
      return;
    }

    const href = pageHref(basePath, { ...filters, sort: nextSort }, 1);
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  async function loadMore() {
    if (isLoadingRef.current || pageRef.current >= totalPagesRef.current) {
      return;
    }

    const nextPage = pageRef.current + 1;
    const controller = new AbortController();

    abortRef.current?.abort();
    abortRef.current = controller;
    isLoadingRef.current = true;
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(
        pageHref("/api/titles", { ...filters, limit: initialResults.limit }, nextPage),
        {
          cache: "no-store",
          signal: controller.signal
        }
      );

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }

      const nextResults = (await response.json()) as PaginatedTitles;

      startTransition(() => {
        setResults((current) => ({
          ...nextResults,
          data: [...current.data, ...nextResults.data]
        }));
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setLoadError("Unable to load more titles.");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }

      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || results.page >= results.totalPages) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [filters, initialResults.limit, results.page, results.totalPages]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-line bg-card px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fgMuted">
          {results.total === 0
            ? "No titles match these filters."
            : `Showing ${results.data.length} of ${results.total} titles.`}
        </p>

        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-fgMuted sm:min-w-[240px]">
          Sort
          <select
            value={filters.sort}
            onChange={(event) => handleSortChange(event.target.value as SortOption)}
            disabled={isPending}
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-wait disabled:opacity-70"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <TitleGrid titles={results.data} emptyLabel={emptyLabel} showTomatoRatings={showTomatoRatings} />

      {results.data.length > 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          {results.page < results.totalPages ? (
            <>
              <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
              {loadError ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-center shadow-card">
                  <p className="text-sm text-fgMuted">{loadError}</p>
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentHover"
                  >
                    Retry loading more
                  </button>
                </div>
              ) : (
                <p role="status" aria-live="polite" className="text-sm text-fgMuted">
                  {isLoading
                    ? "Loading more titles..."
                    : "Scroll to load more."}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-fgMuted">Showing all {results.total} titles.</p>
          )}
        </div>
      ) : null}
    </>
  );
}
