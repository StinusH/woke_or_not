// @vitest-environment jsdom

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminTitleManager } from "@/components/admin-title-manager";

const mockedRefresh = vi.fn();
let mockedAdminSecret = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockedRefresh
  })
}));

vi.mock("@/components/admin-shell", async () => {
  const actual = await vi.importActual<typeof import("@/components/admin-shell")>("@/components/admin-shell");

  return {
    ...actual,
    useOptionalAdminSecret: () => (mockedAdminSecret ? { secret: mockedAdminSecret, setSecret: vi.fn() } : null)
  };
});

describe("AdminTitleManager", () => {
  beforeEach(() => {
    mockedRefresh.mockReset();
    mockedAdminSecret = "";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders titles with an edit link", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-17T00:00:00.000Z"));

    render(
      <AdminTitleManager
        scoreRefreshEnabled
        titles={[
          {
            id: "title-1",
            slug: "the-little-mermaid-2023",
            name: "The Little Mermaid",
            type: "MOVIE",
            status: "DRAFT",
            releaseDate: "2023-05-18T00:00:00.000Z",
            wokeScore: 72,
            imdbUrl: "https://www.imdb.com/title/tt5971474/",
            imdbRating: 7.2,
            rottenTomatoesCriticsScore: 67,
            rottenTomatoesAudienceScore: 94,
            externalScoresUpdatedAt: "2026-03-17T14:00:00.000Z",
            updatedAt: "2026-03-17T00:00:00.000Z"
          }
        ]}
      />
    );

    expect(screen.getByText("The Little Mermaid")).toBeInTheDocument();
    expect(screen.getByText("Woke score")).toBeInTheDocument();
    expect(screen.getByText("72 / 100")).toBeInTheDocument();
    expect(screen.getByText(/Scores refreshed/)).toBeInTheDocument();
    expect(screen.getByLabelText("External scores fresh")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/admin/titles/title-1");
  });

  it("shows orange and red indicators for aging and stale scores", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-17T00:00:00.000Z"));

    render(
      <AdminTitleManager
        scoreRefreshEnabled
        titles={[
          {
            id: "title-aging",
            slug: "aging-title",
            name: "Aging Title",
            type: "MOVIE",
            status: "DRAFT",
            releaseDate: "2023-05-18T00:00:00.000Z",
            wokeScore: 43,
            imdbUrl: "https://www.imdb.com/title/tt1234567/",
            imdbRating: 6.8,
            rottenTomatoesCriticsScore: 61,
            rottenTomatoesAudienceScore: 72,
            externalScoresUpdatedAt: "2025-08-01T00:00:00.000Z",
            updatedAt: "2026-03-17T00:00:00.000Z"
          },
          {
            id: "title-stale",
            slug: "stale-title",
            name: "Stale Title",
            type: "MOVIE",
            status: "PUBLISHED",
            releaseDate: "2022-05-18T00:00:00.000Z",
            wokeScore: 81,
            imdbUrl: "https://www.imdb.com/title/tt7654321/",
            imdbRating: 5.9,
            rottenTomatoesCriticsScore: 44,
            rottenTomatoesAudienceScore: 39,
            externalScoresUpdatedAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2026-03-17T00:00:00.000Z"
          }
        ]}
      />
    );

    expect(screen.getByLabelText("External scores aging")).toBeInTheDocument();
    expect(screen.getByLabelText("External scores stale")).toBeInTheDocument();
  });

  it("requires the admin secret before refreshing scores", async () => {
    const user = userEvent.setup();

    render(
      <AdminTitleManager
        scoreRefreshEnabled
        titles={[
          {
            id: "title-1",
            slug: "the-little-mermaid-2023",
            name: "The Little Mermaid",
            type: "MOVIE",
            status: "DRAFT",
            releaseDate: "2023-05-18T00:00:00.000Z",
            wokeScore: 72,
            imdbUrl: "https://www.imdb.com/title/tt5971474/",
            imdbRating: null,
            rottenTomatoesCriticsScore: null,
            rottenTomatoesAudienceScore: null,
            externalScoresUpdatedAt: null,
            updatedAt: "2026-03-17T00:00:00.000Z"
          }
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Refresh scores" }));

    expect(screen.getByText("Set ADMIN_SECRET before refreshing scores.")).toBeInTheDocument();
  });

  it("lets you click the score and update the woke rating inline", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    mockedAdminSecret = "secret";

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: "title-1",
          name: "The Little Mermaid",
          wokeScore: 81,
          updatedAt: "2026-03-17T10:00:00.000Z"
        }
      })
    } as Response);

    render(
      <AdminTitleManager
        scoreRefreshEnabled
        titles={[
          {
            id: "title-1",
            slug: "the-little-mermaid-2023",
            name: "The Little Mermaid",
            type: "MOVIE",
            status: "DRAFT",
            releaseDate: "2023-05-18T00:00:00.000Z",
            wokeScore: 72,
            imdbUrl: "https://www.imdb.com/title/tt5971474/",
            imdbRating: 7.2,
            rottenTomatoesCriticsScore: 67,
            rottenTomatoesAudienceScore: 94,
            externalScoresUpdatedAt: "2026-03-17T14:00:00.000Z",
            updatedAt: "2026-03-17T00:00:00.000Z"
          }
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Edit woke score for The Little Mermaid" }));
    const input = screen.getByLabelText("Woke score");
    await user.clear(input);
    await user.type(input, "81");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/titles/title-1/woke-score", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": "secret"
        },
        body: JSON.stringify({ wokeScore: 81 })
      });
    });
    expect(screen.getByText("81 / 100")).toBeInTheDocument();
    expect(screen.getByText("Updated woke score for The Little Mermaid.")).toBeInTheDocument();
    expect(mockedRefresh).toHaveBeenCalledTimes(1);
  });
});
