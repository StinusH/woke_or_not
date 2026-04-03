import { describe, expect, it } from "vitest";
import {
  applyMetadataAutofill,
  buildAdminTitlePayload,
  createEmptyAdminTitleDraft,
  guessRottenTomatoesUrl,
  normalizeAdminDraftWokeFactors,
  type GenreOption
} from "@/lib/admin-title-draft";

const genres: GenreOption[] = [
  { slug: "action", name: "Action" },
  { slug: "adventure", name: "Adventure" },
  { slug: "crime", name: "Crime" },
  { slug: "fantasy", name: "Fantasy" },
  { slug: "horror", name: "Horror" },
  { slug: "kids", name: "Kids" },
  { slug: "mystery", name: "Mystery" },
  { slug: "sci-fi", name: "Sci-Fi" }
];

describe("admin title draft genre mapping", () => {
  it("guesses Rotten Tomatoes movie URLs with underscores", () => {
    expect(guessRottenTomatoesUrl("Weapons")).toBe("https://www.rottentomatoes.com/m/weapons");
    expect(guessRottenTomatoesUrl("Scream 7")).toBe("https://www.rottentomatoes.com/m/scream_7");
  });

  it("keeps direct TMDb genres when local genres exist", () => {
    const result = applyMetadataAutofill(
      createEmptyAdminTitleDraft(),
      {
        slug: "weapons",
        name: "Weapons",
        type: "MOVIE",
        releaseDate: "2025-08-04",
        ageRating: "R",
        runtimeMinutes: 129,
        synopsis: "A test synopsis.",
        posterUrl: null,
        trailerYoutubeUrl: null,
        imdbUrl: null,
        imdbRating: null,
        rottenTomatoesUrl: null,
        rottenTomatoesCriticsScore: null,
        rottenTomatoesAudienceScore: null,
        watchProviders: [],
        watchProviderLinks: [],
        genreNames: ["Horror", "Mystery"],
        cast: [],
        crew: []
      },
      genres
    );

    expect(result.genreSlugs).toEqual(["horror", "mystery"]);
    expect(result.rottenTomatoesUrl).toBe("https://www.rottentomatoes.com/m/weapons");
  });

  it("splits compound TMDb TV genres and remaps kids labels", () => {
    const result = applyMetadataAutofill(
      createEmptyAdminTitleDraft(),
      {
        slug: "example-show",
        name: "Example Show",
        type: "TV_SHOW",
        releaseDate: "2025-01-01",
        ageRating: "TV-Y7",
        runtimeMinutes: 45,
        synopsis: "A test synopsis.",
        posterUrl: null,
        trailerYoutubeUrl: null,
        imdbUrl: null,
        imdbRating: null,
        rottenTomatoesUrl: null,
        rottenTomatoesCriticsScore: null,
        rottenTomatoesAudienceScore: null,
        watchProviders: [],
        watchProviderLinks: [],
        genreNames: ["Action & Adventure", "Sci-Fi & Fantasy", "Kids"],
        cast: [],
        crew: []
      },
      genres
    );

    expect(result.genreSlugs).toEqual(["action", "adventure", "sci-fi", "fantasy", "kids"]);
  });

  it("keeps a manually entered Rotten Tomatoes URL during metadata autofill", () => {
    const result = applyMetadataAutofill(
      {
        ...createEmptyAdminTitleDraft(),
        name: "Draft Name",
        rottenTomatoesUrl: "https://example.com/custom-url"
      },
      {
        slug: "weapons",
        name: "Weapons",
        type: "MOVIE",
        releaseDate: "2025-08-04",
        ageRating: null,
        runtimeMinutes: 129,
        synopsis: "A test synopsis.",
        posterUrl: null,
        trailerYoutubeUrl: null,
        imdbUrl: null,
        imdbRating: null,
        rottenTomatoesUrl: "https://www.rottentomatoes.com/m/weapons",
        rottenTomatoesCriticsScore: 78,
        rottenTomatoesAudienceScore: 91,
        watchProviders: [],
        watchProviderLinks: [],
        genreNames: ["Horror"],
        cast: [],
        crew: []
      },
      genres
    );

    expect(result.rottenTomatoesUrl).toBe("https://example.com/custom-url");
  });

  it("hydrates external ratings and the precise Rotten Tomatoes URL during metadata autofill", () => {
    const result = applyMetadataAutofill(
      createEmptyAdminTitleDraft(),
      {
        slug: "unsung-hero",
        name: "Unsung Hero",
        type: "MOVIE",
        releaseDate: "2024-04-26",
        ageRating: "PG",
        runtimeMinutes: 113,
        synopsis: "A test synopsis.",
        posterUrl: null,
        trailerYoutubeUrl: null,
        imdbUrl: "https://www.imdb.com/title/tt23638614/",
        imdbRating: 7.1,
        rottenTomatoesUrl: "https://www.rottentomatoes.com/m/unsung_hero",
        rottenTomatoesCriticsScore: 61,
        rottenTomatoesAudienceScore: 99,
        watchProviders: [],
        watchProviderLinks: [],
        genreNames: ["Horror"],
        cast: [],
        crew: []
      },
      genres
    );

    expect(result.imdbRating).toBe("7.1");
    expect(result.rottenTomatoesUrl).toBe("https://www.rottentomatoes.com/m/unsung_hero");
    expect(result.rottenTomatoesCriticsScore).toBe("61");
    expect(result.rottenTomatoesAudienceScore).toBe("99");
  });

  it("preserves the draft woke score in the admin payload", () => {
    const draft = createEmptyAdminTitleDraft();
    draft.wokeScore = 62;
    draft.wokeFactors = [
      { label: "Representation / casting choices", weight: 82, displayOrder: 1, notes: "" },
      { label: "Political / ideological dialogue", weight: 18, displayOrder: 2, notes: "" },
      { label: "Identity-driven story themes", weight: 45, displayOrder: 3, notes: "" },
      { label: "Institutional / cultural critique", weight: 20, displayOrder: 4, notes: "" },
      { label: "Legacy character or canon changes", weight: 76, displayOrder: 5, notes: "" },
      { label: "Public controversy / woke complaints", weight: 80, displayOrder: 6, notes: "" },
      { label: "Creator track record context", weight: 35, displayOrder: 7, notes: "" }
    ];

    const payload = buildAdminTitlePayload(draft);

    expect(payload.wokeScore).toBe(62);
  });

  it("normalizes legacy factor aliases into the canonical seven-factor set", () => {
    const normalized = normalizeAdminDraftWokeFactors([
      { label: "Representation breadth", weight: 15, displayOrder: 1, notes: "Legacy alias." }
    ]);

    expect(normalized.unknownLabels).toEqual([]);
    expect(normalized.factors).toHaveLength(7);
    expect(normalized.factors[0]).toMatchObject({
      label: "Representation / casting choices",
      weight: 15,
      notes: "Legacy alias."
    });
    expect(normalized.factors[6]).toMatchObject({
      label: "Creator track record context",
      weight: 0
    });
  });
});
