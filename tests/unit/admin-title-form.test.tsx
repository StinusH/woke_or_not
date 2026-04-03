// @vitest-environment jsdom

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
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
  let writeTextMock: ReturnType<typeof vi.fn>;
  let clipboardWriteMock: ReturnType<typeof vi.fn>;
  let windowOpenMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockedRefresh.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    clipboardWriteMock = vi.fn().mockResolvedValue(undefined);
    windowOpenMock = vi.fn();
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: window.navigator.clipboard ?? {}
    });
    Object.defineProperty(window.navigator.clipboard, "writeText", {
      configurable: true,
      value: writeTextMock
    });
    Object.defineProperty(window.navigator.clipboard, "write", {
      configurable: true,
      value: clipboardWriteMock
    });
    Object.defineProperty(window, "ClipboardItem", {
      configurable: true,
      value: class ClipboardItem {
        items: Record<string, Blob>;

        constructor(items: Record<string, Blob>) {
          this.items = items;
        }
      }
    });
    Object.defineProperty(window, "open", {
      configurable: true,
      value: windowOpenMock
    });
    document.title = "Woke or Not";
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
            ageRating: "R",
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
          },
          existingTitle: null
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
    const matrixCandidate = await screen.findByRole("button", { name: /The Matrix/i });
    await user.click(matrixCandidate);

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveValue("The Matrix");
      expect(screen.getByLabelText("Slug")).toHaveValue("the-matrix");
      expect(screen.getByLabelText("Age rating")).toHaveValue("R");
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

    expect(within(matrixCandidate).getByText("Used")).toBeInTheDocument();
    expect(within(matrixCandidate).getByText("Used to autofill the form.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/admin/metadata/search?");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/api/admin/metadata/item?");
  });

  it("warns when the selected metadata slug already exists in the database", async () => {
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
          },
          existingTitle: {
            id: "title_123",
            name: "The Matrix",
            slug: "the-matrix"
          }
        })
      } as Response);

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    await user.type(screen.getByLabelText("Title lookup"), "The Matrix");
    await user.click(screen.getByRole("button", { name: "Search metadata" }));
    await user.click(await screen.findByRole("button", { name: /The Matrix/i }));

    const warning = await screen.findByRole("alert");

    expect(warning).toHaveTextContent(
      "Autofilled The Matrix. Warning: this title may already be in the database as The Matrix (the-matrix). Double-check before saving."
    );
    expect(warning).toHaveClass("border-red-500", "bg-red-50", "text-red-700");
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

  it("updates the browser tab title to the searched metadata query", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    } as Response);

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    await user.type(screen.getByLabelText("Title lookup"), "The Matrix");
    await user.click(screen.getByRole("button", { name: "Search metadata" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(document.title).toBe("The Matrix");
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

  it("rebuilds the AI prompt from metadata autofill even after manual prompt edits", async () => {
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
              name: "Oppenheimer",
              releaseDate: "2023-07-21",
              overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
              posterUrl: "https://image.tmdb.org/t/p/w780/oppenheimer.jpg"
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            slug: "oppenheimer",
            name: "Oppenheimer",
            type: "MOVIE",
            releaseDate: "2023-07-21",
            runtimeMinutes: 180,
            synopsis: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
            posterUrl: "https://image.tmdb.org/t/p/w780/oppenheimer.jpg",
            trailerYoutubeUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
            imdbUrl: "https://www.imdb.com/title/tt15398776/",
            watchProviders: [],
            watchProviderLinks: [],
            genreNames: ["Drama"],
            cast: [{ name: "Cillian Murphy", roleName: "J. Robert Oppenheimer", billingOrder: 1 }],
            crew: [{ name: "Christopher Nolan", jobType: "DIRECTOR" }]
          },
          existingTitle: null
        })
      } as Response);

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} showAiPromptSection />);

    const promptInput = screen.getByLabelText("Prompt text");
    await user.clear(promptInput);
    await user.type(promptInput, "temporary custom prompt");

    await user.type(screen.getByLabelText("Title lookup"), "Oppenheimer");
    await user.click(screen.getByRole("button", { name: "Search metadata" }));
    await user.click(await screen.findByRole("button", { name: /Oppenheimer/i }));

    await waitFor(() => {
      expect((promptInput as HTMLTextAreaElement).value).toContain("Watch-availability fallback (required for this title):");
      expect((promptInput as HTMLTextAreaElement).value).toContain("Watch Availability:");
      expect((promptInput as HTMLTextAreaElement).value).toContain("Title: Oppenheimer");
    });

    expect((promptInput as HTMLTextAreaElement).value).not.toBe("temporary custom prompt");
  });

  it("refreshes the AI prompt from the latest form state after manual edits", async () => {
    const user = userEvent.setup();

    render(
      <AdminTitleForm
        secret="secret"
        metadataEnabled
        genres={[]}
        showAiPromptSection
        initialDraft={{
          ...createEmptyAdminTitleDraft(),
          name: "Original Title"
        }}
      />
    );

    const promptInput = screen.getByLabelText("Prompt text");
    const nameInput = screen.getByLabelText("Name");

    expect((promptInput as HTMLTextAreaElement).value).toContain("Original Title");

    await user.clear(promptInput);
    await user.type(promptInput, "temporary custom prompt");
    await user.clear(nameInput);
    await user.type(nameInput, "Refreshed Title");
    await user.click(screen.getByRole("button", { name: "Refresh prompt" }));

    await waitFor(() => {
      expect((promptInput as HTMLTextAreaElement).value).toContain("Refreshed Title");
    });

    expect((promptInput as HTMLTextAreaElement).value).not.toBe("temporary custom prompt");
    expect(screen.getByText("Prompt refreshed from current title data.")).toBeInTheDocument();
  });

  it("shows a success state on the prompt copy button after copying", async () => {
    const user = userEvent.setup();

    render(
      <AdminTitleForm
        secret="secret"
        metadataEnabled
        genres={[]}
        showAiPromptSection
        initialDraft={{
          ...createEmptyAdminTitleDraft(),
          name: "Copied Title"
        }}
      />
    );

    const promptInput = screen.getByLabelText("Prompt text") as HTMLTextAreaElement;
    const copyButton = screen.getByRole("button", { name: "Copy prompt" });

    await waitFor(() => {
      expect(promptInput.value).toContain("Copied Title");
      expect(copyButton).toBeEnabled();
    });

    await user.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith(promptInput.value);
    expect(await screen.findByRole("button", { name: "Prompt copied" })).toBeInTheDocument();
    expect(screen.getByText("Prompt copied.")).toBeInTheDocument();
  });

  it("shows a processing state while copying the social image", async () => {
    const user = userEvent.setup();
    let resolveClipboardWrite: (() => void) | null = null;
    const originalImage = window.Image;
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ fillRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    const toBlobSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((callback) => callback(new Blob(["image"], { type: "image/png" })));

    class MockImage {
      crossOrigin = "";
      referrerPolicy = "";
      naturalWidth = 1200;
      naturalHeight = 630;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }

    window.Image = MockImage as unknown as typeof window.Image;
    clipboardWriteMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveClipboardWrite = resolve;
        })
    );

    try {
      render(
        <AdminTitleForm
          secret="secret"
          metadataEnabled
          genres={[]}
          initialDraft={{
            ...createEmptyAdminTitleDraft(),
            slug: "copied-title",
            posterUrl: "https://image.tmdb.org/t/p/w780/copied-title.jpg"
          }}
        />
      );

      const copyImageButton = screen.getByRole("button", { name: "Copy image" });
      await user.click(copyImageButton);

      const processingButton = await screen.findByRole("button", { name: "Copying image..." });
      expect(processingButton).toBeDisabled();
      expect(processingButton).toHaveAttribute("aria-busy", "true");

      resolveClipboardWrite?.();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Copy image" })).toBeEnabled();
      });
      expect(screen.getByText("Social image copied.")).toBeInTheDocument();
    } finally {
      window.Image = originalImage;
      getContextSpy.mockRestore();
      toBlobSpy.mockRestore();
    }
  });

  it("allows decimal typing in the IMDb rating field", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    const imdbRatingInput = screen.getByLabelText("IMDb rating");
    await user.type(imdbRatingInput, "7.2");

    expect(imdbRatingInput).toHaveValue("7.2");
  });

  it("applies a parsed IMDb rating from the AI response into the form", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} showAiPromptSection />);

    await user.type(
      screen.getByLabelText("AI response"),
      `Title: Roofman
Type: Movie
Proposed Woke Score: 40

Score Summary:
Mostly character-driven with some light progressive signaling.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 45 | Noticeable diversity in supporting roles.
- Political / ideological dialogue: 25 | Minimal.
- Identity-driven story themes: 30 | Incidental.
- Institutional / cultural critique: 40 | Mild.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 35 | Limited.
- Creator track record context: 35 | Mixed.

Social Post Draft:
proceed with caution ⚠️
Roofman (2025)
woke score: 40/100 🤢
IMDb rating: 6.9/10 ⭐

Watch for subtle agenda crumbs.`
    );

    await user.click(screen.getByRole("button", { name: "Apply response to form" }));

    expect(screen.getByLabelText("IMDb rating")).toHaveValue("6.9");
    expect(screen.getByLabelText("Woke score")).toHaveValue("40");
    expect(screen.getByText("AI response applied with a score mismatch warning.")).toBeInTheDocument();
    expect(
      screen.getByText("AI Proposed Woke Score is 40, but the factor-derived score is 56 (16-point difference).")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Update to correct score" }));

    expect(screen.getByLabelText("Woke score")).toHaveValue("56");
    expect(screen.getByText("Woke score updated to the factor-derived score.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update to correct score" })).not.toBeInTheDocument();
  });

  it("keeps the current IMDb rating when the AI response only says N/A", async () => {
    const user = userEvent.setup();

    render(
      <AdminTitleForm
        secret="secret"
        metadataEnabled
        genres={[]}
        showAiPromptSection
        initialDraft={{
          ...createEmptyAdminTitleDraft(),
          imdbRating: "7.2"
        }}
      />
    );

    await user.type(
      screen.getByLabelText("AI response"),
      `Title: Example Movie
Type: Movie
Proposed Woke Score: 22

Score Summary:
Limited ideological content and little visible controversy.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 20 | Limited emphasis.
- Political / ideological dialogue: 10 | Little overt messaging.
- Identity-driven story themes: 15 | Mostly incidental.
- Institutional / cultural critique: 5 | Minimal critique.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 12 | Sparse reaction.
- Creator track record context: 8 | Little supporting context.

Social Post Draft:
IMDb rating: N/A

Light ideological content with very little public backlash.`
    );

    await user.click(screen.getByRole("button", { name: "Apply response to form" }));

    expect(screen.getByLabelText("IMDb rating")).toHaveValue("7.2");
  });

  it("hydrates watch providers from the AI response when the metadata lookup had none", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} showAiPromptSection />);

    await user.type(
      screen.getByLabelText("AI response"),
      `Title: Example Movie
Type: Movie
Proposed Woke Score: 22

Score Summary:
Limited ideological content and little visible controversy.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 20 | Limited emphasis.
- Political / ideological dialogue: 10 | Little overt messaging.
- Identity-driven story themes: 15 | Mostly incidental.
- Institutional / cultural critique: 5 | Minimal critique.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 12 | Sparse reaction.
- Creator track record context: 8 | Little supporting context.

Watch Availability:
- Netflix | https://www.netflix.com/title/12345
- Max | N/A

Social Post Draft:
safe pick ✅
Example Movie (2024)
woke score: 22/100 😀
IMDb rating: N/A

Light ideological content with very little public backlash.`
    );

    await user.click(screen.getByRole("button", { name: "Apply response to form" }));

    expect(screen.getByLabelText("Watch providers")).toHaveValue("Netflix\nMax");
  });

  it("allows adding watch providers after AI response hydration", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} showAiPromptSection />);

    await user.type(
      screen.getByLabelText("AI response"),
      `Title: Example Movie
Type: Movie
Proposed Woke Score: 22

Score Summary:
Limited ideological content and little visible controversy.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 20 | Limited emphasis.
- Political / ideological dialogue: 10 | Little overt messaging.
- Identity-driven story themes: 15 | Mostly incidental.
- Institutional / cultural critique: 5 | Minimal critique.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 12 | Sparse reaction.
- Creator track record context: 8 | Little supporting context.

Watch Availability:
- Netflix | https://www.netflix.com/title/12345
- Max | N/A

Social Post Draft:
safe pick ✅
Example Movie (2024)
woke score: 22/100 😀
IMDb rating: N/A

Light ideological content with very little public backlash.`
    );

    await user.click(screen.getByRole("button", { name: "Apply response to form" }));

    const watchProviders = screen.getByLabelText("Watch providers");
    await user.click(watchProviders);
    await user.type(watchProviders, "{end}{enter}Hulu");

    expect(watchProviders).toHaveValue("Netflix\nMax\nHulu");
  });

  it("lets the extracted social post draft be edited manually", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} showAiPromptSection />);

    await user.type(
      screen.getByLabelText("AI response"),
      `Title: Example Movie
Type: Movie
Proposed Woke Score: 22

Score Summary:
Limited ideological content and little visible controversy.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 20 | Limited emphasis.
- Political / ideological dialogue: 10 | Little overt messaging.
- Identity-driven story themes: 15 | Mostly incidental.
- Institutional / cultural critique: 5 | Minimal critique.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 12 | Sparse reaction.
- Creator track record context: 8 | Little supporting context.

Social Post Draft:
safe pick ✅
Example Movie (2024)
woke score: 22/100 😀

Light ideological content with very little public backlash.`
    );

    await user.click(screen.getByRole("button", { name: "Apply response to form" }));

    const socialPostInput = screen.getByLabelText("Social Post Draft");
    await user.type(socialPostInput, "\nEdited ending.");

    expect(socialPostInput).toHaveValue(`safe pick ✅
Example Movie (2024)
woke score: 22/100 😀

Light ideological content with very little public backlash.
Edited ending.`);
  });

  it("shows a success-state copy button for the social post draft after clicking", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} showAiPromptSection />);

    await user.type(
      screen.getByLabelText("AI response"),
      `Title: Example Movie
Type: Movie
Proposed Woke Score: 22

Score Summary:
Limited ideological content and little visible controversy.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 20 | Limited emphasis.
- Political / ideological dialogue: 10 | Little overt messaging.
- Identity-driven story themes: 15 | Mostly incidental.
- Institutional / cultural critique: 5 | Minimal critique.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 12 | Sparse reaction.
- Creator track record context: 8 | Little supporting context.

Social Post Draft:
safe pick ✅
Example Movie (2024)
woke score: 22/100 😀

Light ideological content with very little public backlash.`
    );

    await user.click(screen.getByRole("button", { name: "Apply response to form" }));
    await user.click(screen.getByRole("button", { name: "Copy social post" }));

    expect(writeTextMock).toHaveBeenCalledWith(`safe pick ✅
Example Movie (2024)
woke score: 22/100 😀

Light ideological content with very little public backlash.`);
    expect(await screen.findByRole("button", { name: "Social post copied" })).toBeInTheDocument();
  });

  it("autocompletes a watch provider with Tab while editing the current line", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    const watchProviders = screen.getByLabelText("Watch providers");
    await user.click(watchProviders);
    await user.type(watchProviders, "Hu");

    await user.keyboard("{Tab}");

    expect(watchProviders).toHaveValue("Hulu");
  });

  it("keeps the current IMDb rating when the AI response does not include an IMDb line", async () => {
    const user = userEvent.setup();

    render(
      <AdminTitleForm
        secret="secret"
        metadataEnabled
        genres={[]}
        showAiPromptSection
        initialDraft={{
          ...createEmptyAdminTitleDraft(),
          imdbRating: "7.2"
        }}
      />
    );

    await user.type(
      screen.getByLabelText("AI response"),
      `Title: Example Movie
Type: Movie
Proposed Woke Score: 22

Score Summary:
Limited ideological content and little visible controversy.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 20 | Limited emphasis.
- Political / ideological dialogue: 10 | Little overt messaging.
- Identity-driven story themes: 15 | Mostly incidental.
- Institutional / cultural critique: 5 | Minimal critique.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 12 | Sparse reaction.
- Creator track record context: 8 | Little supporting context.

Social Post Draft:
safe pick ✅
Example Movie (2024)
woke score: 22/100 😀

Light ideological content with very little public backlash.`
    );

    await user.click(screen.getByRole("button", { name: "Apply response to form" }));

    expect(screen.getByLabelText("IMDb rating")).toHaveValue("7.2");
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

  it("caps the woke summary input at 1000 characters", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    const summaryInput = screen.getByRole("textbox", { name: "Woke summary" });
    await user.type(summaryInput, "a".repeat(1001));

    const counter = screen.getByText("1000/1000");
    expect(summaryInput).toHaveValue("a".repeat(1000));
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveClass("text-fgMuted");
  });

  it("renders Editorial Fields above Cast and keeps Cast collapsed by default", () => {
    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    const editorialHeading = screen.getByRole("heading", { name: "Editorial Fields" });
    const castHeading = screen.getByRole("heading", { name: "Cast" });
    const castDetails = castHeading.closest("details");

    expect(editorialHeading.compareDocumentPosition(castHeading) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(castDetails).not.toBeNull();
    expect(castDetails).not.toHaveAttribute("open");
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

  it("guesses the Rotten Tomatoes URL from the title name", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Scream 7");

    expect(screen.getByLabelText("Rotten Tomatoes URL")).toHaveValue("https://www.rottentomatoes.com/m/scream_7");
  });

  it("stops overwriting the Rotten Tomatoes URL after a manual edit", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    const nameInput = screen.getByRole("textbox", { name: "Name" });
    const rottenTomatoesInput = screen.getByLabelText("Rotten Tomatoes URL");

    await user.type(nameInput, "Weapons");
    await user.clear(rottenTomatoesInput);
    await user.type(rottenTomatoesInput, "https://example.com/custom-url");
    await user.clear(nameInput);
    await user.type(nameInput, "Scream 7");

    expect(rottenTomatoesInput).toHaveValue("https://example.com/custom-url");
  });

  it("opens the Rotten Tomatoes URL in a new tab from the field action", async () => {
    const user = userEvent.setup();

    render(<AdminTitleForm secret="secret" metadataEnabled genres={[]} />);

    const rottenTomatoesInput = screen.getByLabelText("Rotten Tomatoes URL");
    await user.type(rottenTomatoesInput, "https://www.rottentomatoes.com/m/scream_7");
    await user.click(screen.getByRole("button", { name: "Open link" }));

    expect(windowOpenMock).toHaveBeenCalledWith(
      "https://www.rottentomatoes.com/m/scream_7",
      "_blank",
      "noopener,noreferrer"
    );
  });
});
