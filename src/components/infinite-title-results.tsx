"use client";

import React from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { TitleGrid } from "@/components/title-grid";
import { PaginatedTitles } from "@/lib/types";
import { pageHref } from "@/lib/url";
import { ListQuery } from "@/lib/validation";

interface InfiniteTitleResultsProps {
  initialResults: PaginatedTitles;
  filters: ListQuery;
  emptyLabel?: string;
  showTomatoRatings?: boolean;
}

export function InfiniteTitleResults({
  initialResults,
  filters,
  emptyLabel,
  showTomatoRatings = false
}: InfiniteTitleResultsProps) {
  const [results, setResults] = useState(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
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
                    : `Showing ${results.data.length} of ${results.total} titles. Scroll to load more.`}
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
