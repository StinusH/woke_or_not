// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchPage from "@/app/search/page";

const { mockedGetTitleCards, mockedFilterBar, mockedInfiniteTitleResults } = vi.hoisted(() => ({
  mockedGetTitleCards: vi.fn(),
  mockedFilterBar: vi.fn(),
  mockedInfiniteTitleResults: vi.fn()
}));

vi.mock("@/lib/catalog", () => ({
  getTitleCards: mockedGetTitleCards
}));

vi.mock("@/components/filter-bar", async () => {
  const React = await import("react");

  return {
    FilterBar: (props: { basePath: string; current: unknown }) => {
      mockedFilterBar(props);
      return React.createElement("div", { "data-testid": "filter-bar" }, "filters");
    }
  };
});

vi.mock("@/components/infinite-title-results", async () => {
  const React = await import("react");

  return {
    InfiniteTitleResults: (props: unknown) => {
      mockedInfiniteTitleResults(props);
      return React.createElement("div", { "data-testid": "results" }, "results");
    }
  };
});

vi.mock("@/components/page-hero", async () => {
  const React = await import("react");

  return {
    PageHero: ({ title }: { eyebrow: string; title: string; description: string }) =>
      React.createElement("div", null, title)
  };
});

describe("SearchPage", () => {
  it("defaults search results to english when no language filter is present", async () => {
    mockedGetTitleCards.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 1,
      page: 1,
      limit: 12
    });

    render(
      await SearchPage({
        searchParams: Promise.resolve({ q: "alien" })
      })
    );

    expect(screen.getByText("Search all titles")).toBeInTheDocument();
    expect(mockedGetTitleCards).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "alien",
        language: ["en"]
      })
    );
    expect(mockedFilterBar).toHaveBeenCalledWith(
      expect.objectContaining({
        basePath: "/search",
        current: expect.objectContaining({
          q: "alien",
          language: ["en"]
        })
      })
    );
    expect(mockedInfiniteTitleResults).toHaveBeenCalledWith(
      expect.objectContaining({
        basePath: "/search",
        filters: expect.objectContaining({
          q: "alien",
          language: ["en"]
        })
      })
    );
  });

  it("keeps explicit language filters when present", async () => {
    mockedGetTitleCards.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 1,
      page: 1,
      limit: 12
    });

    render(
      await SearchPage({
        searchParams: Promise.resolve({ q: "alien", language: ["fr", "ja"] })
      })
    );

    expect(mockedGetTitleCards).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "alien",
        language: ["fr", "ja"]
      })
    );
  });
});
