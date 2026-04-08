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
        imdbVotes: "81,234",
        tomatoMeter: "67",
        tomatoUserMeter: "94",
        tomatoURL: "https://www.rottentomatoes.com/m/the_little_mermaid_2023"
      })
    } as Response);

    const result = await fetchExternalScoresFromImdbUrl("https://www.imdb.com/title/tt5971474/");

    expect(result).toEqual({
      imdbRating: 7.2,
      imdbVotes: 81234,
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
          imdbVotes: "4,321",
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
      imdbVotes: 4321,
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

  it("derives the critics score from Rotten Tomatoes scorecard counts when no direct score value is present", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      text: async () => `
        <html>
          <head>
            <title>Chickenhare and the Secret of the Groundhog | Rotten Tomatoes</title>
            <link rel="canonical" href="https://www.rottentomatoes.com/m/chickenhare_and_the_secret_of_the_groundhog" />
          </head>
          <body>
            <script id="media-scorecard-json" data-json="mediaScorecard" type="application/json">
              {"audienceScore":{"likedCount":0,"notLikedCount":1,"reviewCount":0,"title":"Popcornmeter"},"criticsScore":{"likedCount":1,"notLikedCount":0,"ratingCount":1,"reviewCount":1,"title":"Tomatometer"}}
            </script>
          </body>
        </html>
      `
    } as Response);

    const result = await fetchRottenTomatoesPageScores(
      "https://www.rottentomatoes.com/m/chickenhare_and_the_secret_of_the_groundhog"
    );

    expect(result).toEqual({
      criticsScore: 100,
      audienceScore: null,
      canonicalUrl: "https://www.rottentomatoes.com/m/chickenhare_and_the_secret_of_the_groundhog",
      title: "Chickenhare and the Secret of the Groundhog",
      year: null
    });
  });

  it("does not invent an audience score when the Rotten Tomatoes scorecard has no audience score value", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      text: async () => `
        <html>
          <head>
            <title>Wasteman | Rotten Tomatoes</title>
            <link rel="canonical" href="https://www.rottentomatoes.com/m/wasteman" />
          </head>
          <body>
            <script type="application/ld+json">
              {"dateCreated":"2026-04-17"}
            </script>
            <script id="media-scorecard-json" data-json="mediaScorecard" type="application/json">
              {"audienceScore":{"bandedRatingCount":"0 Verified Ratings","likedCount":0,"notLikedCount":0,"reviewCount":0,"scoreType":"VERIFIED","title":"Popcornmeter"},"criticsScore":{"likedCount":23,"notLikedCount":0,"ratingCount":23,"reviewCount":23,"score":"100","title":"Tomatometer"}}
            </script>
          </body>
        </html>
      `
    } as Response);

    const result = await fetchRottenTomatoesPageScores("https://www.rottentomatoes.com/m/wasteman");

    expect(result).toEqual({
      criticsScore: 100,
      audienceScore: null,
      canonicalUrl: "https://www.rottentomatoes.com/m/wasteman",
      title: "Wasteman",
      year: 2026
    });
  });
});
