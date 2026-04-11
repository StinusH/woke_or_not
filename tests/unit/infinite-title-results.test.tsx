// @vitest-environment jsdom

import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InfiniteTitleResults } from "@/components/infinite-title-results";
import { PaginatedTitles, TitleCard } from "@/lib/types";
import { ListQuery } from "@/lib/validation";

const mockedReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockedReplace
  })
}));

vi.mock("@/components/title-grid", () => ({
  TitleGrid: ({
    titles
  }: {
    titles: TitleCard[];
    emptyLabel?: string;
    showTomatoRatings?: boolean;
  }) => <div>{titles.map((title) => <div key={title.id}>{title.name}</div>)}</div>
}));

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  root = null;
  rootMargin = "";
  thresholds = [0];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting = true) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

const baseFilters: ListQuery = {
  page: 1,
  limit: 12,
  sort: "score_asc"
};

const firstTitle: TitleCard = {
  id: "title-1",
  slug: "first-title",
  name: "First Title",
  type: "MOVIE",
  releaseDate: "2025-01-01T00:00:00.000Z",
  posterUrl: null,
  wokeScore: 10,
  wokeSummary: "First summary",
  imdbRating: 7.1,
  rottenTomatoesCriticsScore: 80,
  rottenTomatoesAudienceScore: 81,
  contentTags: [],
  genres: []
};

const secondTitle: TitleCard = {
  ...firstTitle,
  id: "title-2",
  slug: "second-title",
  name: "Second Title"
};

describe("InfiniteTitleResults", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    mockedReplace.mockReset();
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("loads the next page when the sentinel enters view", async () => {
    const mockedFetch = vi.mocked(fetch);
    const initialResults: PaginatedTitles = {
      data: [firstTitle],
      page: 1,
      limit: 12,
      total: 2,
      totalPages: 2
    };

    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [secondTitle],
        page: 2,
        limit: 12,
        total: 2,
        totalPages: 2
      })
    } as Response);

    render(<InfiniteTitleResults basePath="/search" initialResults={initialResults} filters={baseFilters} />);

    expect(screen.getByText("First Title")).toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 2 titles.")).toBeInTheDocument();

    await act(async () => {
      MockIntersectionObserver.instances[0]?.trigger();
    });

    await waitFor(() => {
      expect(screen.getByText("Second Title")).toBeInTheDocument();
    });

    const [requestedUrl, options] = mockedFetch.mock.calls[0] ?? [];
    expect(String(requestedUrl)).toContain("/api/titles?");
    expect(String(requestedUrl)).toContain("page=2");
    expect(String(requestedUrl)).toContain("limit=12");
    expect(options).toMatchObject({ cache: "no-store" });
    expect(screen.getByText("Showing all 2 titles.")).toBeInTheDocument();
  });

  it("moves sort controls into the results toolbar and updates the route", () => {
    const initialResults: PaginatedTitles = {
      data: [firstTitle],
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1
    };

    render(<InfiniteTitleResults basePath="/search" initialResults={initialResults} filters={baseFilters} />);

    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "recommended" } });

    expect(mockedReplace).toHaveBeenCalledWith("/search?limit=12&sort=recommended&page=1", {
      scroll: false
    });
  });
});
