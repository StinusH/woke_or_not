// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "@/components/filter-bar";

const { mockedGetGenresWithCount, mockedGetPlatformOptions, mockedGetAgeRatingOptions } = vi.hoisted(() => ({
  mockedGetGenresWithCount: vi.fn(),
  mockedGetPlatformOptions: vi.fn(),
  mockedGetAgeRatingOptions: vi.fn()
}));

vi.mock("@/lib/catalog", () => ({
  getGenresWithCount: mockedGetGenresWithCount,
  getPlatformOptions: mockedGetPlatformOptions,
  getAgeRatingOptions: mockedGetAgeRatingOptions
}));

vi.mock("@/components/auto-submit-filter-form", async () => {
  const React = await import("react");

  return {
    AutoSubmitFilterForm: ({ action, children }: { action: string; children: React.ReactNode }) =>
      React.createElement("form", { action }, children)
  };
});

describe("FilterBar", () => {
  it("renders the platform filter collapsed by default and keeps selected platforms checked", async () => {
    mockedGetGenresWithCount.mockResolvedValue([
      { id: "genre-1", slug: "action", name: "Action", count: 12 }
    ]);
    mockedGetPlatformOptions.mockResolvedValue(["Max", "Netflix", "Peacock"]);
    mockedGetAgeRatingOptions.mockResolvedValue(["PG-13", "R"]);

    render(
      await FilterBar({
        basePath: "/search",
        current: {
          page: 1,
          limit: 12,
          sort: "score_asc"
        }
      })
    );

    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("Genre")).toBeInTheDocument();
    expect(screen.getByLabelText("Age rating")).toHaveValue("");
    expect(screen.getAllByRole("button", { name: "ALL" })).toHaveLength(2);
  });

  it("shows selected genres in the multi-select filter and keeps them in hidden inputs while collapsed", async () => {
    mockedGetGenresWithCount.mockResolvedValue([
      { id: "genre-1", slug: "action", name: "Action", count: 12 },
      { id: "genre-2", slug: "comedy", name: "Comedy", count: 7 }
    ]);
    mockedGetPlatformOptions.mockResolvedValue([]);
    mockedGetAgeRatingOptions.mockResolvedValue([]);

    const { container } = render(
      await FilterBar({
        basePath: "/search",
        current: {
          page: 1,
          limit: 12,
          sort: "score_asc",
          genre: ["action", "comedy"]
        }
      })
    );

    const hiddenInputs = Array.from(container.querySelectorAll('input[type="hidden"][name="genre"]'));

    expect(hiddenInputs).toHaveLength(2);
    expect(hiddenInputs.map((input) => input.getAttribute("value"))).toEqual(["action", "comedy"]);

    fireEvent.click(screen.getByRole("button", { name: "Action +1" }));

    expect(screen.getByRole("checkbox", { name: /Action/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Comedy/ })).toBeChecked();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("shows selected platforms when the platform filter is opened", async () => {
    mockedGetGenresWithCount.mockResolvedValue([
      { id: "genre-1", slug: "action", name: "Action", count: 12 }
    ]);
    mockedGetPlatformOptions.mockResolvedValue(["Max", "Netflix", "Peacock"]);
    mockedGetAgeRatingOptions.mockResolvedValue(["PG-13", "R"]);

    render(
      await FilterBar({
        basePath: "/search",
        current: {
          page: 1,
          limit: 12,
          sort: "score_asc",
          age_rating: "R",
          platform: ["Netflix", "Peacock"]
        }
      })
    );

    expect(screen.getByLabelText("Age rating")).toHaveValue("R");
    fireEvent.click(screen.getByRole("button", { name: "Netflix +1" }));

    expect(screen.getByLabelText("Netflix")).toBeChecked();
    expect(screen.getByLabelText("Peacock")).toBeChecked();
    expect(screen.getByLabelText("Max")).not.toBeChecked();
  });

  it("renders extra hidden fields when provided", async () => {
    mockedGetGenresWithCount.mockResolvedValue([]);
    mockedGetPlatformOptions.mockResolvedValue([]);
    mockedGetAgeRatingOptions.mockResolvedValue([]);

    const { container } = render(
      await FilterBar({
        basePath: "/movies",
        current: {
          page: 1,
          limit: 12,
          sort: "score_asc",
          type: "MOVIE"
        },
        lockType: "MOVIE",
        extraHiddenFields: {
          _defaults: "1"
        }
      })
    );

    expect(container.querySelector('input[name="_defaults"][value="1"]')).not.toBeNull();
  });
});
