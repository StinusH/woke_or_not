// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

const { mockedGetTitleCards, mockedGetGenresWithCount } = vi.hoisted(() => ({
  mockedGetTitleCards: vi.fn(),
  mockedGetGenresWithCount: vi.fn()
}));

vi.mock("@/lib/catalog", () => ({
  getTitleCards: mockedGetTitleCards,
  getGenresWithCount: mockedGetGenresWithCount
}));

vi.mock("@/components/title-grid", async () => {
  const React = await import("react");

  return {
    TitleGrid: () => React.createElement("div", { "data-testid": "title-grid" }, "grid")
  };
});

vi.mock("next/link", async () => {
  const React = await import("react");

  return {
    default: ({
      href,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
      React.createElement("a", { href, ...props }, children)
  };
});

describe("HomePage", () => {
  it("renders the hero search form and browse actions", async () => {
    mockedGetTitleCards.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 1,
      page: 1,
      limit: 8
    });
    mockedGetGenresWithCount.mockResolvedValue([{ id: "genre-1", slug: "animation", name: "Animation", count: 4 }]);

    const { container } = render(await HomePage());

    expect(screen.getByRole("searchbox", { name: "Search titles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse Movies" })).toHaveAttribute("href", "/movies");
    expect(screen.getByRole("link", { name: "View all →" })).toHaveAttribute(
      "href",
      "/search?type=MOVIE&year=2026&sort=recommended"
    );
    expect(screen.getByRole("heading", { name: "Top Recommended Movies (2026)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Animation/ })).toHaveAttribute("href", "/search?genre=animation");
    expect(container.querySelector('form[action="/search"]')).not.toBeNull();
    expect(container.querySelector('input[name="type"][value="MOVIE"]')).not.toBeNull();
    expect(container.querySelector('input[name="year_min"][value="2022"]')).not.toBeNull();
    expect(container.querySelector('input[name="year_max"]')).toBeNull();
    expect(mockedGetTitleCards).toHaveBeenCalledWith({
      page: 1,
      limit: 8,
      sort: "recommended",
      type: "MOVIE",
      year: 2026
    });
  });
});
