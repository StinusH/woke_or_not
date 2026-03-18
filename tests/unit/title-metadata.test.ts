import { afterEach, describe, expect, it, vi } from "vitest";
import { getTitleMetadataAutofill, searchTitleMetadata } from "@/lib/title-metadata";

describe("title metadata helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.TMDB_API_KEY;
    delete process.env.TMDB_API_READ_ACCESS_TOKEN;
    delete process.env.TMDB_WATCH_PROVIDER_REGION;
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
      runtimeMinutes: 136,
      synopsis: "A hacker learns what reality is.",
      posterUrl: "https://image.tmdb.org/t/p/w780/matrix.jpg",
      trailerYoutubeUrl: "https://www.youtube.com/watch?v=abc123",
      imdbUrl: "https://www.imdb.com/title/tt0133093/",
      watchProviders: ["Netflix", "Disney Plus"],
      genreNames: ["Action", "Science Fiction"],
      cast: [{ name: "Keanu Reeves", roleName: "Neo", billingOrder: 1 }],
      crew: [{ name: "Lana Wachowski", jobType: "DIRECTOR" }]
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
});
