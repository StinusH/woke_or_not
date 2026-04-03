import { afterEach, describe, expect, it, vi } from "vitest";
import { extractImdbId, fetchExternalScoresFromImdbUrl, fetchRottenTomatoesPageScores } from "@/lib/external-scores";

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

  it("falls back to the Rotten Tomatoes page when OMDb omits the audience score", async () => {
    process.env.OMDB_API_KEY = "demo-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Response: "True",
          imdbRating: "7.2",
          tomatoMeter: "61",
          tomatoUserMeter: "N/A",
          tomatoURL: "https://www.rottentomatoes.com/m/unsung_hero"
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <body>
              Watchlist Tomatometer Popcornmeter
              61% Tomatometer 36 Reviews 99% Popcornmeter 1,000+ Verified Ratings
            </body>
          </html>
        `
      } as Response);

    const result = await fetchExternalScoresFromImdbUrl("https://www.imdb.com/title/tt23638614/");

    expect(result).toEqual({
      imdbRating: 7.2,
      rottenTomatoesCriticsScore: 61,
      rottenTomatoesAudienceScore: 99,
      rottenTomatoesUrl: "https://www.rottentomatoes.com/m/unsung_hero"
    });
  });

  it("extracts Rotten Tomatoes page metadata and both scores from the page HTML", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      text: async () => `
        <html>
          <head>
            <title>Unsung Hero | Rotten Tomatoes</title>
            <link rel="canonical" href="https://www.rottentomatoes.com/m/unsung_hero" />
          </head>
          <body>
            <script type="application/ld+json">
              {"dateCreated":"2024-04-26"}
            </script>
            Watchlist Tomatometer Popcornmeter
            61% Tomatometer 36 Reviews 99% Popcornmeter 1,000+ Verified Ratings
          </body>
        </html>
      `
    } as Response);

    const result = await fetchRottenTomatoesPageScores("https://www.rottentomatoes.com/m/unsung_hero");

    expect(result).toEqual({
      criticsScore: 61,
      audienceScore: 99,
      canonicalUrl: "https://www.rottentomatoes.com/m/unsung_hero",
      title: "Unsung Hero",
      year: 2024
    });
  });
});
