// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "@/components/filter-bar";

const { mockedGetGenresWithCount, mockedGetPlatformOptions } = vi.hoisted(() => ({
  mockedGetGenresWithCount: vi.fn(),
  mockedGetPlatformOptions: vi.fn()
}));

vi.mock("@/lib/catalog", () => ({
  getGenresWithCount: mockedGetGenresWithCount,
  getPlatformOptions: mockedGetPlatformOptions
}));

vi.mock("@/components/auto-submit-filter-form", async () => {
  const React = await import("react");

  return {
    AutoSubmitFilterForm: ({ action, children }: { action: string; children: React.ReactNode }) =>
      React.createElement("form", { action }, children)
  };
});

describe("FilterBar", () => {
  it("renders platform checkboxes and keeps selected platforms checked", async () => {
    mockedGetGenresWithCount.mockResolvedValue([
      { id: "genre-1", slug: "action", name: "Action", count: 12 }
    ]);
    mockedGetPlatformOptions.mockResolvedValue(["Max", "Netflix", "Peacock"]);

    render(
      await FilterBar({
        basePath: "/search",
        current: {
          page: 1,
          limit: 12,
          sort: "score_asc",
          platform: ["Netflix", "Peacock"]
        }
      })
    );

    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByLabelText("Netflix")).toBeChecked();
    expect(screen.getByLabelText("Peacock")).toBeChecked();
    expect(screen.getByLabelText("Max")).not.toBeChecked();
  });
});
