// @vitest-environment jsdom

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminTitleForm } from "@/components/admin-title-form";
import { createEmptyAdminTitleDraft } from "@/lib/admin-title-draft";

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
            watchProviderLinks: [
              { name: "Netflix", url: "https://www.netflix.com/" },
              { name: "Max", url: "https://www.max.com/" }
            ],
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

  it("submits metadata search when Enter is pressed in the lookup fields", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce({
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
    } as Response);

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    await user.type(screen.getByLabelText("Title lookup"), "The Matrix");
    await user.type(screen.getByLabelText("Year"), "1999{enter}");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/admin/metadata/search?");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("q=The+Matrix");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("year=1999");
  });

  it("renders the social preview directly from the poster after metadata autofill", async () => {
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
            watchProviders: [],
            watchProviderLinks: [],
            genreNames: [],
            cast: [],
            crew: []
          }
        })
      } as Response);

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    await user.type(screen.getByLabelText("Title lookup"), "The Matrix");
    await user.click(screen.getByRole("button", { name: "Search metadata" }));
    await user.click(await screen.findByRole("button", { name: /The Matrix/i }));

    await waitFor(() => {
      expect(screen.getByAltText("Social crop preview")).toHaveAttribute(
        "src",
        "https://image.tmdb.org/t/p/w780/matrix.jpg"
      );
    });
  });

  it("places the AI research prompt above the rest of the form after selecting a metadata match", async () => {
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
            watchProviders: [],
            watchProviderLinks: [],
            genreNames: [],
            cast: [],
            crew: []
          }
        })
      } as Response);

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} showAiPromptSection />);

    await user.type(screen.getByLabelText("Title lookup"), "The Matrix");
    await user.click(screen.getByRole("button", { name: "Search metadata" }));
    await user.click(await screen.findByRole("button", { name: /The Matrix/i }));

    const promptInput = screen.getByLabelText("Prompt text");

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveValue("The Matrix");
      expect((promptInput as HTMLTextAreaElement).value).toContain("The Matrix");
    });

    const promptHeading = screen.getByRole("heading", { name: "AI Research Prompt" });
    const nameInput = screen.getByLabelText("Name");

    expect(promptHeading.compareDocumentPosition(nameInput) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });

  it("allows decimal typing in the IMDb rating field", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    const imdbRatingInput = screen.getByLabelText("IMDb rating");
    await user.type(imdbRatingInput, "7.2");

    expect(imdbRatingInput).toHaveValue("7.2");
  });

  it("defaults new titles to published status", () => {
    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    expect(screen.getByLabelText("Status")).toHaveValue("PUBLISHED");
  });

  it("requires the admin secret before metadata search can be triggered", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm metadataEnabled genres={[]} />);

    await user.type(screen.getByLabelText("Title lookup"), "The Matrix");

    await user.click(screen.getByRole("button", { name: "Search metadata" }));

    expect(screen.getByText("Set ADMIN_SECRET before searching metadata.")).toBeInTheDocument();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("shows the unauthorized error when the admin secret is incorrect", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: "Admin secret missing or incorrect."
      })
    } as Response);

    render(<AdminTitleForm secret="wrong-secret" metadataEnabled genres={[]} />);

    await user.type(screen.getByLabelText("Title lookup"), "The Matrix");
    await user.click(screen.getByRole("button", { name: "Search metadata" }));

    expect(await screen.findByText("401: Admin secret missing or incorrect.")).toBeInTheDocument();
  });

  it("shows a link to the created page after a successful create", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: "title_123",
          slug: "the-matrix"
        }
      })
    } as Response);

    render(
      <AdminTitleForm
        secret="secret"
        metadataEnabled
        genres={[{ slug: "action", name: "Action" }]}
        initialDraft={{
          ...createEmptyAdminTitleDraft(),
          slug: "the-matrix",
          name: "The Matrix",
          releaseDate: "1999-03-31",
          synopsis: "A hacker learns what reality is and how to bend it.",
          wokeSummary: "A valid editorial summary that clears the minimum length.",
          genreSlugs: ["action"],
          cast: [{ name: "Keanu Reeves", roleName: "Neo", billingOrder: 1 }],
          crew: [{ name: "Lana Wachowski", jobType: "DIRECTOR" }],
          wokeFactors: [{ label: "Representation breadth", weight: 15, displayOrder: 1, notes: "Balanced ensemble." }]
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: "Create title" }));

    expect(await screen.findByText("Title created successfully.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "View created page" });
    expect(link).toHaveAttribute("href", "/title/the-matrix");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(mockedRefresh).toHaveBeenCalledTimes(1);
  });

  it("caps the woke summary input at 740 characters", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    const summaryInput = screen.getByRole("textbox", { name: "Woke summary" });
    await user.type(summaryInput, "a".repeat(741));

    const counter = screen.getByText("740/740");
    expect(summaryInput).toHaveValue("a".repeat(740));
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveClass("text-fg/60");
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
