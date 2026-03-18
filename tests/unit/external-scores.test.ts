import { afterEach, describe, expect, it, vi } from "vitest";
import { extractImdbId, fetchExternalScoresFromImdbUrl } from "@/lib/external-scores";

describe("external score helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OMDB_API_KEY;
  });

  it("extracts an IMDb ID from the stored URL", () => {
    expect(extractImdbId("https://www.imdb.com/title/tt5971474/")).toBe("tt5971474");
  });

  it("fetches IMDb and Rotten Tomatoes scores from OMDb", async () => {
    process.env.OMDB_API_KEY = "demo-key";

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        Response: "True",
        imdbRating: "7.2",
        tomatoMeter: "67",
        tomatoUserMeter: "94",
        tomatoURL: "https://www.rottentomatoes.com/m/the_little_mermaid_2023"
      })
    } as Response);

    const result = await fetchExternalScoresFromImdbUrl("https://www.imdb.com/title/tt5971474/");

    expect(result).toEqual({
      imdbRating: 7.2,
      rottenTomatoesCriticsScore: 67,
      rottenTomatoesAudienceScore: 94,
      rottenTomatoesUrl: "https://www.rottentomatoes.com/m/the_little_mermaid_2023"
    });
  });
});
