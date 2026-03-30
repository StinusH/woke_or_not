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
    mockedGetGenresWithCount.mockResolvedValue([]);

    const { container } = render(await HomePage());

    expect(screen.getByRole("searchbox", { name: "Search titles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse Movies" })).toHaveAttribute("href", "/movies");
    expect(screen.getByRole("heading", { name: "New Movies (2026) - Safest Picks First" })).toBeInTheDocument();
    expect(container.querySelector('form[action="/search"]')).not.toBeNull();
  });
});
