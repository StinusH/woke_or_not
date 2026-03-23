import { describe, expect, it } from "vitest";
import {
  applyMetadataAutofill,
  createEmptyAdminTitleDraft,
  guessRottenTomatoesUrl,
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
        runtimeMinutes: 129,
        synopsis: "A test synopsis.",
        posterUrl: null,
        trailerYoutubeUrl: null,
        imdbUrl: null,
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
        runtimeMinutes: 45,
        synopsis: "A test synopsis.",
        posterUrl: null,
        trailerYoutubeUrl: null,
        imdbUrl: null,
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
        runtimeMinutes: 129,
        synopsis: "A test synopsis.",
        posterUrl: null,
        trailerYoutubeUrl: null,
        imdbUrl: null,
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
});
