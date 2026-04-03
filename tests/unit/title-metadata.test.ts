import { afterEach, describe, expect, it, vi } from "vitest";
import { getTitleMetadataAutofill, searchTitleMetadata } from "@/lib/title-metadata";

describe("title metadata helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.TMDB_API_KEY;
    delete process.env.TMDB_API_READ_ACCESS_TOKEN;
    delete process.env.TMDB_WATCH_PROVIDER_REGION;
    delete process.env.OMDB_API_KEY;
  });

  it("normalizes movie details into the admin draft shape", async () => {
    process.env.TMDB_API_KEY = "demo-key";

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "The Matrix",
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
    } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 603, type: "MOVIE" });

    expect(result).toMatchObject({
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
      imdbRating: null,
      rottenTomatoesUrl: null,
      rottenTomatoesCriticsScore: null,
      rottenTomatoesAudienceScore: null,
      watchProviders: ["Netflix", "Disney Plus"],
      watchProviderLinks: [
        { name: "Netflix", url: "https://www.netflix.com/", offerTypes: ["subscription"] },
        { name: "Disney Plus", url: "https://www.disneyplus.com/", offerTypes: ["subscription"] }
      ],
      genreNames: ["Action", "Science Fiction"],
      cast: [{ name: "Keanu Reeves", roleName: "Neo", billingOrder: 1 }],
      crew: [{ name: "Lana Wachowski", jobType: "DIRECTOR" }]
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("best-effort enriches metadata with OMDb IMDb and Rotten Tomatoes data", async () => {
    process.env.TMDB_API_KEY = "demo-key";
    process.env.OMDB_API_KEY = "demo-omdb-key";

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "The Matrix",
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
          tomatoMeter: "83",
          tomatoUserMeter: "85",
          tomatoURL: "https://www.rottentomatoes.com/m/the_matrix"
        })
      } as Response);

    const result = await getTitleMetadataAutofill({ providerId: 603, type: "MOVIE" });

    expect(result.imdbRating).toBe(8.7);
    expect(result.rottenTomatoesUrl).toBe("https://www.rottentomatoes.com/m/the_matrix");
    expect(result.rottenTomatoesCriticsScore).toBe(83);
    expect(result.rottenTomatoesAudienceScore).toBe(85);
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
  });
});
