// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MoviesPage from "@/app/movies/page";

const { mockedGetTitleCards, mockedRedirect } = vi.hoisted(() => ({
  mockedGetTitleCards: vi.fn(),
  mockedRedirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  })
}));

vi.mock("@/lib/catalog", () => ({
  getTitleCards: mockedGetTitleCards
}));

vi.mock("next/navigation", () => ({
  redirect: mockedRedirect
}));

vi.mock("@/components/filter-bar", async () => {
  const React = await import("react");

  return {
    FilterBar: ({
      extraHiddenFields
    }: {
      basePath: string;
      current: unknown;
      lockType?: "MOVIE" | "TV_SHOW";
      extraHiddenFields?: Record<string, string | undefined>;
    }) =>
      React.createElement(
        "div",
        { "data-testid": "filter-bar" },
        extraHiddenFields?._defaults ? `defaults:${extraHiddenFields._defaults}` : "defaults:none"
      )
  };
});

vi.mock("@/components/infinite-title-results", async () => {
  const React = await import("react");

  return {
    InfiniteTitleResults: () => React.createElement("div", { "data-testid": "results" }, "results")
  };
});

vi.mock("@/components/page-hero", async () => {
  const React = await import("react");

  return {
    PageHero: ({ title }: { eyebrow: string; title: string; description: string }) =>
      React.createElement("div", null, title)
  };
});

describe("MoviesPage", () => {
  it("redirects a bare /movies visit to the recent-movies preset", async () => {
    await expect(
      MoviesPage({
        searchParams: Promise.resolve({})
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockedRedirect).toHaveBeenCalledWith("/movies?year_min=2022&_defaults=1");
    expect(mockedGetTitleCards).not.toHaveBeenCalled();
  });

  it("keeps the defaults token when rendering the preset movies page", async () => {
    mockedGetTitleCards.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 1,
      page: 1,
      limit: 12
    });

    render(
      await MoviesPage({
        searchParams: Promise.resolve({ year_min: "2022", _defaults: "1" })
      })
    );

    expect(screen.getByText("Movies")).toBeInTheDocument();
    expect(screen.getByTestId("filter-bar")).toHaveTextContent("defaults:1");
    expect(mockedGetTitleCards).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "MOVIE",
        year_min: 2022
      })
    );
  });
});
