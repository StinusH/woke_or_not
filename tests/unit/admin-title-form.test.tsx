// @vitest-environment jsdom

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminTitleForm } from "@/components/admin-title-form";

const mockedRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockedRefresh
  })
}));

describe("AdminTitleForm", () => {
  beforeEach(() => {
    mockedRefresh.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("autofills the form from a selected metadata match", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              provider: "TMDB",
              providerId: 603,
              type: "MOVIE",
              name: "The Matrix",
              releaseDate: "1999-03-31",
              overview: "A hacker learns what reality is.",
              posterUrl: "https://image.tmdb.org/t/p/w780/matrix.jpg"
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            slug: "the-matrix",
            name: "The Matrix",
            type: "MOVIE",
            releaseDate: "1999-03-31",
            runtimeMinutes: 136,
            synopsis: "A hacker learns what reality is.",
            posterUrl: "https://image.tmdb.org/t/p/w780/matrix.jpg",
            trailerYoutubeUrl: "https://www.youtube.com/watch?v=abc123",
            imdbUrl: "https://www.imdb.com/title/tt0133093/",
            watchProviders: ["Netflix", "Max"],
            genreNames: ["Action", "Science Fiction"],
            cast: [{ name: "Keanu Reeves", roleName: "Neo", billingOrder: 1 }],
            crew: [{ name: "Lana Wachowski", jobType: "DIRECTOR" }]
          }
        })
      } as Response);

    render(
      <AdminTitleForm
        secret="secret"
        metadataEnabled
        genres={[
          { slug: "action", name: "Action" },
          { slug: "sci-fi", name: "Sci-Fi" }
        ]}
      />
    );

    await user.type(screen.getByLabelText("Title lookup"), "The Matrix");
    await user.type(screen.getByLabelText("Year"), "1999");
    await user.click(screen.getByRole("button", { name: "Search metadata" }));
    await user.click(await screen.findByRole("button", { name: /The Matrix/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveValue("The Matrix");
      expect(screen.getByLabelText("Slug")).toHaveValue("the-matrix");
      expect(screen.getByLabelText("Runtime minutes")).toHaveValue("136");
      expect(screen.getByLabelText("IMDb URL")).toHaveValue("https://www.imdb.com/title/tt0133093/");
      expect(screen.getByLabelText("IMDb rating")).toHaveValue("");
      expect(screen.getByLabelText("Watch providers")).toHaveValue("Netflix\nMax");
      expect(screen.getByLabelText("Synopsis")).toHaveValue("A hacker learns what reality is.");
      expect(screen.getByDisplayValue("Keanu Reeves")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Lana Wachowski")).toBeInTheDocument();
      expect(screen.getByLabelText("Action")).toBeChecked();
      expect(screen.getByLabelText("Sci-Fi")).toBeChecked();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/admin/metadata/search?");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/api/admin/metadata/item?");
  });

  it("allows decimal typing in the IMDb rating field", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    const imdbRatingInput = screen.getByLabelText("IMDb rating");
    await user.type(imdbRatingInput, "7.2");

    expect(imdbRatingInput).toHaveValue("7.2");
  });

  it("requires the admin secret before metadata search can be triggered", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm metadataEnabled genres={[]} />);

    await user.type(screen.getByLabelText("Title lookup"), "The Matrix");

    expect(screen.getByRole("button", { name: "Search metadata" })).toBeDisabled();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("shows a live woke summary counter and turns it red over 750 characters", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    const summaryInput = screen.getByRole("textbox", { name: "Woke summary" });
    await user.type(summaryInput, "a".repeat(751));

    const counter = screen.getByText("751/750");
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveClass("text-red-600");
  });

  it("shows counters for capped text inputs like the title name", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    const nameInput = screen.getByRole("textbox", { name: "Name" });
    await user.type(nameInput, "a".repeat(161));

    const counter = screen.getByText("161/160");
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveClass("text-red-600");
  });
});
