import { afterEach, describe, expect, it, vi } from "vitest";
import { getTitleMetadataAutofill, searchTitleMetadata } from "@/lib/title-metadata";

describe("title metadata helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete process.env.TMDB_API_KEY;
    delete process.env.TMDB_API_READ_ACCESS_TOKEN;
    delete process.env.TMDB_WATCH_PROVIDER_REGION;
    delete process.env.OMDB_API_KEY;
  });

  it("normalizes movie details into the admin draft shape", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    delete process.env.OMDB_API_KEY;

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "The Matrix",
          original_language: "en",
          release_date: "1999-03-31",
          release_dates: {
            results: [
              {
                iso_3166_1: "US",
                release_dates: [{ certification: "R", type: 3 }]
              }
            ]
          },
          runtime: 136,
          overview: "A hacker learns what reality is.",
          poster_path: "/matrix.jpg",
          genres: [{ name: "Action" }, { name: "Science Fiction" }],
          production_companies: [{ name: "Netflix" }],
          credits: {
            cast: [{ name: "Keanu Reeves", character: "Neo", order: 0 }],
            crew: [{ name: "Lana Wachowski", job: "Director", department: "Directing" }]
          },
          videos: {
            results: [{ site: "YouTube", type: "Trailer", official: true, key: "abc123" }]
          },
          external_ids: {
            imdb_id: "tt0133093"
          }
        })
      } as Response)
      .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: {
          US: {
            flatrate: [
              { provider_id: 8, provider_name: "Netflix", display_priority: 1 },
              { provider_id: 337, provider_name: "Disney Plus", display_priority: 2 }
            ]
          }
        }
      })
    } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<html><head><title>Missing Match | Rotten Tomatoes</title></head><body></body></html>"
    } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<html><head><title>Missing Match | Rotten Tomatoes</title></head><body></body></html>"
    } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 603, type: "MOVIE" });

    expect(result).toMatchObject({
      slug: "the-matrix",
      name: "The Matrix",
      type: "MOVIE",
      originalLanguage: "en",
      releaseDate: "1999-03-31",
      ageRating: "R",
      runtimeMinutes: 136,
      synopsis: "A hacker learns what reality is.",
      posterUrl: "https://image.tmdb.org/t/p/w780/matrix.jpg",
      trailerYoutubeUrl: "https://www.youtube.com/watch?v=abc123",
      imdbUrl: "https://www.imdb.com/title/tt0133093/",
      imdbRating: null,
      rottenTomatoesUrl: null,
      rottenTomatoesCriticsScore: null,
      rottenTomatoesAudienceScore: null,
      productionCompanies: ["Netflix"],
      productionNetworks: [],
      studioAttribution: {
        label: "Netflix",
        source: "PRODUCTION_COMPANY"
      },
      watchProviders: ["Netflix", "Disney Plus"],
      watchProviderLinks: [
        { name: "Netflix", url: "https://www.netflix.com/", offerTypes: ["subscription"] },
        { name: "Disney Plus", url: "https://www.disneyplus.com/", offerTypes: ["subscription"] }
      ],
      genreNames: ["Action", "Science Fiction"],
      cast: [{ name: "Keanu Reeves", roleName: "Neo", billingOrder: 1 }],
      crew: [{ name: "Lana Wachowski", jobType: "DIRECTOR" }]
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("maps origin-country movie certifications into the US rating system when the configured region is blank", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    process.env.TMDB_WATCH_PROVIDER_REGION = "US";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "SAS: Red Notice",
          origin_country: ["US", "GB", "CH"],
          original_language: "en",
          release_date: "2021-08-11",
          release_dates: {
            results: [
              {
                iso_3166_1: "AU",
                release_dates: [{ certification: "MA15+", type: 4 }]
              },
              {
                iso_3166_1: "GB",
                release_dates: [{ certification: "15", type: 4 }]
              },
              {
                iso_3166_1: "US",
                release_dates: [{ certification: "", type: 4 }]
              }
            ]
          },
          runtime: 120,
          overview: "A regression fixture for regional age-rating fallback.",
          poster_path: null,
          genres: [],
          credits: {
            cast: [],
            crew: []
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: null
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {}
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<html><head><title>Missing Match | Rotten Tomatoes</title></head><body></body></html>"
      } as Response);

    const warnings: string[] = [];
    const result = await getTitleMetadataAutofill({ providerId: 595743, type: "MOVIE", warnings });

    expect(result.ageRating).toBe("R");
    expect(warnings).toEqual([
      "TMDb returned non-US age rating 15 from GB, which was normalized to the US-style value R. Review before saving."
    ]);
  });

  it("best-effort enriches metadata with OMDb IMDb and Rotten Tomatoes data", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    process.env.OMDB_API_KEY = "demo-omdb-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "The Matrix",
          original_language: "en",
          release_date: "1999-03-31",
          release_dates: {
            results: []
          },
          runtime: 136,
          overview: "A hacker learns what reality is.",
          poster_path: "/matrix.jpg",
          genres: [{ name: "Action" }],
          credits: {
            cast: [],
            crew: []
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: "tt0133093"
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            US: {
              flatrate: [{ provider_id: 8, provider_name: "Netflix", display_priority: 1 }]
            }
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Response: "True",
          imdbRating: "8.7",
          imdbVotes: "1,234,567",
          tomatoMeter: "83",
          tomatoUserMeter: "85",
          tomatoURL: "https://www.rottentomatoes.com/m/the_matrix"
        })
      } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 603, type: "MOVIE" });

    expect(result.imdbRating).toBe(8.7);
    expect(result.evaluationWarning).toBeNull();
    expect(result.rottenTomatoesUrl).toBe("https://www.rottentomatoes.com/m/the_matrix");
    expect(result.rottenTomatoesCriticsScore).toBe(83);
    expect(result.rottenTomatoesAudienceScore).toBe(85);
  });

  it("adds a red evaluation warning when a title is less than 7 days old", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00.000Z"));
    process.env.TMDB_API_KEY = "demo-key";
    process.env.OMDB_API_KEY = "demo-omdb-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Fresh Release",
          original_language: "en",
          release_date: "2026-04-05",
          release_dates: { results: [] },
          runtime: 101,
          overview: "A synthetic freshness guardrail fixture.",
          poster_path: null,
          genres: [],
          credits: { cast: [], crew: [] },
          videos: { results: [] },
          external_ids: { imdb_id: "tt1234567" }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: {} })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Response: "True",
          imdbRating: "6.4",
          imdbVotes: "1,234",
          tomatoMeter: "N/A",
          tomatoUserMeter: "N/A",
          tomatoURL: "N/A"
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<html><head><title>Missing Match | Rotten Tomatoes</title></head><body></body></html>"
      } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 1, type: "MOVIE" });

    expect(result.evaluationWarning).toEqual({
      message:
        "Strong warning: this title is 3 days past release and has only 1,234 IMDb votes, below the 7,000-vote confidence threshold. It is both very fresh and thinly discussed online, so there likely is not enough stable review/discourse volume yet.",
      tone: "error",
      requiresAcknowledgement: true
    });
  });

  it("adds a yellow evaluation warning when a title is less than 21 days old", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00.000Z"));
    process.env.TMDB_API_KEY = "demo-key";
    process.env.OMDB_API_KEY = "demo-omdb-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Settling Release",
          original_language: "en",
          release_date: "2026-03-25",
          release_dates: { results: [] },
          runtime: 110,
          overview: "A synthetic early-discourse guardrail fixture.",
          poster_path: null,
          genres: [],
          credits: { cast: [], crew: [] },
          videos: { results: [] },
          external_ids: { imdb_id: "tt7654321" }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: {} })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Response: "True",
          imdbRating: "7.1",
          imdbVotes: "15,000",
          tomatoMeter: "74",
          tomatoUserMeter: "88",
          tomatoURL: "https://www.rottentomatoes.com/m/settling_release"
        })
      } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 2, type: "MOVIE" });

    expect(result.evaluationWarning).toEqual({
      message:
        "Warning: this title is 14 days past release and has 15,000 IMDb votes. It may still be too early for the online discourse to settle.",
      tone: "warning",
      requiresAcknowledgement: true
    });
  });

  it("falls back to the guessed Rotten Tomatoes movie page when OMDb does not return Rotten Tomatoes data", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    process.env.OMDB_API_KEY = "demo-omdb-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Unsung Hero",
          original_language: "en",
          release_date: "2024-04-26",
          release_dates: {
            results: []
          },
          runtime: 113,
          overview: "A synthetic fallback test response.",
          poster_path: null,
          genres: [],
          credits: {
            cast: [],
            crew: []
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: "tt23638614"
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            US: {
              rent: [{ provider_id: 10, provider_name: "Amazon Video", display_priority: 1 }]
            }
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Response: "True",
          imdbRating: "7.0",
          tomatoMeter: "N/A",
          tomatoUserMeter: "N/A",
          tomatoURL: "N/A",
          Ratings: []
        })
      } as Response)
      .mockResolvedValueOnce({
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

    const warnings: string[] = [];
    const result = await getTitleMetadataAutofill({ providerId: 1115009, type: "MOVIE", warnings });

    expect(result.imdbRating).toBe(7);
    expect(result.rottenTomatoesUrl).toBe("https://www.rottentomatoes.com/m/unsung_hero");
    expect(result.rottenTomatoesCriticsScore).toBe(61);
    expect(result.rottenTomatoesAudienceScore).toBe(99);
    expect(warnings).toContain(
      "Rotten Tomatoes scores were filled from the Rotten Tomatoes page because OMDb did not return them."
    );
  });

  it("accepts a Rotten Tomatoes movie page when the year differs by one but the title matches exactly", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    process.env.OMDB_API_KEY = "demo-omdb-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Charlie the Wonderdog",
          original_language: "en",
          release_date: "2025-10-24",
          release_dates: {
            results: []
          },
          runtime: 90,
          overview: "A synthetic regression case for one-year RT mismatch tolerance.",
          poster_path: null,
          genres: [],
          credits: {
            cast: [],
            crew: []
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: "tt29612071"
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {}
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Response: "True",
          imdbRating: "N/A",
          tomatoMeter: "N/A",
          tomatoUserMeter: "N/A",
          tomatoURL: "N/A",
          Ratings: []
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <head>
              <title>Charlie the Wonderdog | Rotten Tomatoes</title>
              <link rel="canonical" href="https://www.rottentomatoes.com/m/charlie_the_wonderdog" />
            </head>
            <body>
              <script type="application/ld+json">
                {"dateCreated":"2026-01-01"}
              </script>
              <script id="media-scorecard-json" data-json="mediaScorecard" type="application/json">
                {"audienceScore":{"score":"76"},"criticsScore":{"score":"46"}}
              </script>
            </body>
          </html>
        `
      } as Response);

    const warnings: string[] = [];
    const result = await getTitleMetadataAutofill({ providerId: 1276521, type: "MOVIE", warnings });

    expect(result.rottenTomatoesUrl).toBe("https://www.rottentomatoes.com/m/charlie_the_wonderdog");
    expect(result.rottenTomatoesCriticsScore).toBe(46);
    expect(result.rottenTomatoesAudienceScore).toBe(76);
    expect(warnings).toContain(
      "Rotten Tomatoes scores were filled from the Rotten Tomatoes page because OMDb did not return them."
    );
  });

  it("prefers the canonical Rotten Tomatoes URL from the fallback page over a stale OMDb URL alias", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    process.env.OMDB_API_KEY = "demo-omdb-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Attack on Titan: THE LAST ATTACK",
          original_language: "ja",
          release_date: "2024-03-20",
          release_dates: {
            results: []
          },
          runtime: 145,
          overview: "A synthetic canonical-URL regression case.",
          poster_path: null,
          genres: [],
          credits: {
            cast: [],
            crew: []
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: "tt33175825"
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {}
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Response: "True",
          imdbRating: "9.2",
          tomatoMeter: "N/A",
          tomatoUserMeter: "N/A",
          tomatoURL: "https://www.rottentomatoes.com/m/attack_on_titan_the_movie_the_last_attack",
          Ratings: []
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<html><head><title>Missing Match | Rotten Tomatoes</title></head><body></body></html>"
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <head>
              <title>Attack on Titan: The Last Attack | Rotten Tomatoes</title>
              <link rel="canonical" href="https://www.rottentomatoes.com/m/attack_on_titan_the_last_attack" />
            </head>
            <body>
              <script type="application/ld+json">
                {"dateCreated":"2025-01-01"}
              </script>
              <script id="media-scorecard-json" data-json="mediaScorecard" type="application/json">
                {"audienceScore":{"score":"99"},"criticsScore":{"score":"100"}}
              </script>
            </body>
          </html>
        `
      } as Response);

    const warnings: string[] = [];
    const result = await getTitleMetadataAutofill({ providerId: 1333100, type: "MOVIE", warnings });

    expect(result.imdbRating).toBe(9.2);
    expect(result.rottenTomatoesUrl).toBe("https://www.rottentomatoes.com/m/attack_on_titan_the_last_attack");
    expect(result.rottenTomatoesCriticsScore).toBe(100);
    expect(result.rottenTomatoesAudienceScore).toBe(99);
  });

  it("tries a year-suffixed Rotten Tomatoes slug before the base title slug", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    process.env.OMDB_API_KEY = "demo-omdb-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "How to Make a Killing",
          original_language: "en",
          release_date: "2026-02-19",
          release_dates: {
            results: []
          },
          runtime: 102,
          overview: "A synthetic year-suffixed RT slug regression case.",
          poster_path: null,
          genres: [],
          credits: {
            cast: [],
            crew: []
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: "tt4357198"
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {}
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Response: "True",
          imdbRating: "6.7",
          tomatoMeter: "N/A",
          tomatoUserMeter: "N/A",
          tomatoURL: "N/A",
          Ratings: []
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <head>
              <title>How to Make a Killing (2026) | Rotten Tomatoes</title>
              <link rel="canonical" href="https://www.rottentomatoes.com/m/how_to_make_a_killing_2026" />
            </head>
            <body>
              <script type="application/ld+json">
                {"dateCreated":"2026-01-01"}
              </script>
              <script id="media-scorecard-json" data-json="mediaScorecard" type="application/json">
                {"audienceScore":{"score":"77"},"criticsScore":{"score":"44"}}
              </script>
            </body>
          </html>
        `
      } as Response);

    const warnings: string[] = [];
    const result = await getTitleMetadataAutofill({ providerId: 467905, type: "MOVIE", warnings });

    expect(result.imdbRating).toBe(6.7);
    expect(result.rottenTomatoesUrl).toBe("https://www.rottentomatoes.com/m/how_to_make_a_killing_2026");
    expect(result.rottenTomatoesCriticsScore).toBe(44);
    expect(result.rottenTomatoesAudienceScore).toBe(77);
    expect(warnings).toContain(
      "Rotten Tomatoes scores were filled from the Rotten Tomatoes page because OMDb did not return them."
    );
  });

  it("searches both movies and TV when type is omitted", async () => {
    process.env.TMDB_API_KEY = "demo-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 603,
              popularity: 90,
              title: "The Matrix",
              overview: "Movie result",
              poster_path: "/movie.jpg",
              release_date: "1999-03-31"
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 100,
              popularity: 75,
              name: "The Matrix",
              overview: "TV result",
              poster_path: "/tv.jpg",
              first_air_date: "2003-01-01"
            }
          ]
        })
      } as Response);

    const results = await searchTitleMetadata({ query: "The Matrix" });

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ providerId: 603, type: "MOVIE" });
    expect(results[1]).toMatchObject({ providerId: 100, type: "TV_SHOW" });
  });

  it("preserves single-character cast role names from TMDb metadata", async () => {
    process.env.TMDB_API_KEY = "demo-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Example Title",
          release_date: "2001-01-01",
          release_dates: {
            results: []
          },
          runtime: 100,
          overview: "A synthetic response for metadata regression coverage.",
          poster_path: null,
          genres: [{ name: "Science Fiction" }],
          credits: {
            cast: [{ name: "Jeri Ryan", character: "7", order: 0 }],
            crew: [{ name: "Example Director", job: "Director", department: "Directing" }]
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: null
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {}
        })
      } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 1, type: "MOVIE" });

    expect(result.cast).toEqual([{ name: "Jeri Ryan", roleName: "7", billingOrder: 1 }]);
  });

  it("collapses Netflix ad-tier aliases into a single Netflix provider", async () => {
    process.env.TMDB_API_KEY = "demo-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Example Title",
          release_date: "2001-01-01",
          release_dates: {
            results: []
          },
          runtime: 100,
          overview: "A synthetic response for provider alias coverage.",
          poster_path: null,
          genres: [],
          credits: {
            cast: [],
            crew: []
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: null
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            US: {
              flatrate: [{ provider_id: 8, provider_name: "Netflix", display_priority: 1 }],
              ads: [{ provider_id: 1796, provider_name: "Netflix Standard with Ads", display_priority: 2 }]
            }
          }
        })
      } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 1, type: "MOVIE" });

    expect(result.watchProviders).toEqual(["Netflix"]);
    expect(result.watchProviderLinks).toEqual([
      { name: "Netflix", url: "https://www.netflix.com/", offerTypes: ["subscription", "ads"] }
    ]);
  });

  it("includes TMDb rent and buy providers when subscription providers are absent", async () => {
    process.env.TMDB_API_KEY = "demo-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Unsung Hero",
          release_date: "2024-04-26",
          release_dates: {
            results: []
          },
          runtime: 113,
          overview: "A synthetic transactional-provider response.",
          poster_path: null,
          genres: [],
          credits: {
            cast: [],
            crew: []
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: "tt23638614"
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            US: {
              buy: [
                { provider_id: 10, provider_name: "Amazon Video", display_priority: 7 },
                { provider_id: 2, provider_name: "Apple TV Store", display_priority: 8 },
                { provider_id: 3, provider_name: "Google Play Movies", display_priority: 18 },
                { provider_id: 192, provider_name: "YouTube", display_priority: 19 },
                { provider_id: 7, provider_name: "Fandango At Home", display_priority: 36 }
              ],
              rent: [
                { provider_id: 10, provider_name: "Amazon Video", display_priority: 7 },
                { provider_id: 2, provider_name: "Apple TV Store", display_priority: 8 },
                { provider_id: 3, provider_name: "Google Play Movies", display_priority: 18 },
                { provider_id: 192, provider_name: "YouTube", display_priority: 19 },
                { provider_id: 7, provider_name: "Fandango At Home", display_priority: 36 },
                { provider_id: 538, provider_name: "Plex", display_priority: 127 }
              ]
            }
          }
        })
      } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 1115009, type: "MOVIE" });

    expect(result.watchProviders).toEqual([
      "Amazon Video",
      "Apple TV Store",
      "Google Play Movies",
      "YouTube",
      "Fandango At Home",
      "Plex"
    ]);
    expect(result.watchProviderLinks).toEqual([
      { name: "Amazon Video", url: "https://www.primevideo.com/", offerTypes: ["rent", "buy"] },
      { name: "Apple TV Store", url: "https://tv.apple.com/", offerTypes: ["rent", "buy"] },
      { name: "Google Play Movies", url: "https://play.google.com/store/movies", offerTypes: ["rent", "buy"] },
      { name: "YouTube", url: "https://www.youtube.com/", offerTypes: ["rent", "buy"] },
      { name: "Fandango At Home", url: "https://www.vudu.com/", offerTypes: ["rent", "buy"] },
      { name: "Plex", url: "https://www.plex.tv/", offerTypes: ["rent"] }
    ]);
  });

  it("falls back to origin-country watch providers when the configured region has none", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    process.env.TMDB_WATCH_PROVIDER_REGION = "US";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Wasteman",
          origin_country: ["GB"],
          original_language: "en",
          release_date: "2026-02-20",
          release_dates: {
            results: []
          },
          runtime: 100,
          overview: "A synthetic watch-provider region fallback response.",
          poster_path: null,
          genres: [],
          credits: {
            cast: [],
            crew: []
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: null
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            GB: {
              rent: [{ provider_id: 10, provider_name: "Amazon Video", display_priority: 7 }]
            }
          }
        })
      } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 1307373, type: "MOVIE" });

    expect(result.watchProviders).toEqual(["Amazon Video"]);
    expect(result.watchProviderLinks).toEqual([
      { name: "Amazon Video", url: "https://www.primevideo.com/", offerTypes: ["rent"] }
    ]);
  });

  it("extracts TV content ratings into the admin draft", async () => {
    process.env.TMDB_API_KEY = "demo-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: "Example Show",
          first_air_date: "2025-01-01",
          content_ratings: {
            results: [{ iso_3166_1: "US", rating: "TV-Y7" }]
          },
          episode_run_time: [22],
          overview: "A synthetic TV metadata response.",
          poster_path: null,
          genres: [{ name: "Kids" }],
          production_companies: [{ name: "Example Studio" }],
          networks: [{ name: "HBO" }],
          aggregate_credits: {
            cast: [],
            crew: []
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: null
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {}
        })
      } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 101, type: "TV_SHOW" });

    expect(result.ageRating).toBe("TV-Y7");
    expect(result.productionCompanies).toEqual(["Example Studio"]);
    expect(result.productionNetworks).toEqual(["HBO"]);
    expect(result.studioAttribution).toEqual({
      label: "HBO",
      source: "NETWORK"
    });
  });

  it("maps origin-country TV content ratings into the US rating system when the configured region is blank", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    process.env.TMDB_WATCH_PROVIDER_REGION = "US";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: "Example Show",
          origin_country: ["US", "GB"],
          first_air_date: "2025-01-01",
          content_ratings: {
            results: [
              { iso_3166_1: "AU", rating: "MA15+" },
              { iso_3166_1: "GB", rating: "15" },
              { iso_3166_1: "US", rating: "" }
            ]
          },
          episode_run_time: [22],
          overview: "A synthetic TV fallback response.",
          poster_path: null,
          genres: [],
          aggregate_credits: {
            cast: [],
            crew: []
          },
          videos: {
            results: []
          },
          external_ids: {
            imdb_id: null
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {}
        })
      } as Response);

    const warnings: string[] = [];
    const result = await getTitleMetadataAutofill({ providerId: 101, type: "TV_SHOW", warnings });

    expect(result.ageRating).toBe("TV-14");
    expect(warnings).toEqual([
      "TMDb returned non-US age rating 15 from GB, which was normalized to the US-style value TV-14. Review before saving."
    ]);
  });

  it("maps common non-US movie certifications into US equivalents", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    process.env.TMDB_WATCH_PROVIDER_REGION = "US";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Example Title",
          origin_country: ["GB"],
          original_language: "en",
          release_date: "2021-01-01",
          release_dates: {
            results: [{ iso_3166_1: "GB", release_dates: [{ certification: "12A", type: 4 }] }]
          },
          runtime: 100,
          overview: "A synthetic movie certification mapping response.",
          poster_path: null,
          genres: [],
          credits: { cast: [], crew: [] },
          videos: { results: [] },
          external_ids: { imdb_id: null }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: {} })
      } as Response);

    const warnings: string[] = [];
    const result = await getTitleMetadataAutofill({ providerId: 1, type: "MOVIE", warnings });

    expect(result.ageRating).toBe("PG-13");
    expect(warnings).toEqual([
      "TMDb returned non-US age rating 12A from GB, which was normalized to the US-style value PG-13. Review before saving."
    ]);
  });

  it("maps common non-US TV certifications into US equivalents", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    process.env.TMDB_WATCH_PROVIDER_REGION = "US";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: "Example Show",
          origin_country: ["AU"],
          first_air_date: "2025-01-01",
          content_ratings: {
            results: [{ iso_3166_1: "AU", rating: "MA15+" }]
          },
          episode_run_time: [22],
          overview: "A synthetic TV certification mapping response.",
          poster_path: null,
          genres: [],
          aggregate_credits: { cast: [], crew: [] },
          videos: { results: [] },
          external_ids: { imdb_id: null }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: {} })
      } as Response);

    const warnings: string[] = [];
    const result = await getTitleMetadataAutofill({ providerId: 101, type: "TV_SHOW", warnings });

    expect(result.ageRating).toBe("TV-14");
    expect(warnings).toEqual([
      "TMDb returned non-US age rating MA15+ from AU, which was normalized to the US-style value TV-14. Review before saving."
    ]);
  });

  it("limits metadata watch providers to the admin payload maximum", async () => {
    process.env.TMDB_API_KEY = "demo-key";

    const watchProviders = Array.from({ length: 14 }, (_, index) => ({
      provider_id: index + 1,
      provider_name: `Provider ${index + 1}`,
      display_priority: index + 1
    }));

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Overflow Test",
          original_language: "en",
          release_date: "2024-01-01",
          release_dates: { results: [] },
          runtime: 120,
          overview: "Provider overflow test.",
          poster_path: null,
          genres: [],
          credits: { cast: [], crew: [] },
          videos: { results: [] },
          external_ids: { imdb_id: "tt1234567" }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            US: {
              flatrate: watchProviders
            }
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<html><head><title>Missing Match | Rotten Tomatoes</title></head><body></body></html>"
      } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 1, type: "MOVIE" });

    expect(result.watchProviders).toHaveLength(12);
    expect(result.watchProviderLinks).toHaveLength(12);
    expect(result.watchProviders[0]).toBe("Provider 1");
    expect(result.watchProviders[11]).toBe("Provider 12");
  });
});
