import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedGetTitleCards = vi.fn();
const mockedGetTitleDetail = vi.fn();

vi.mock("@/lib/catalog", () => ({
  getTitleCards: mockedGetTitleCards,
  getTitleDetail: mockedGetTitleDetail
}));

describe("titles api routes", () => {
  beforeEach(() => {
    mockedGetTitleCards.mockReset();
    mockedGetTitleDetail.mockReset();
  });

  it("GET /api/titles returns paginated data", async () => {
    mockedGetTitleCards.mockResolvedValue({
      data: [],
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 1
    });

    const { GET } = await import("@/app/api/titles/route");
    const response = await GET(new NextRequest("http://localhost:3000/api/titles?type=MOVIE"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ page: 1, total: 0 });
    expect(mockedGetTitleCards).toHaveBeenCalledTimes(1);
  });

  it("GET /api/titles/[slug] returns 404 for missing title", async () => {
    mockedGetTitleDetail.mockResolvedValue(null);

    const { GET } = await import("@/app/api/titles/[slug]/route");
    const response = await GET(new Request("http://localhost:3000/api/titles/unknown"), {
      params: Promise.resolve({ slug: "unknown" })
    });

    expect(response.status).toBe(404);
  });

  it("GET /api/titles/[slug] returns title detail including production metadata", async () => {
    mockedGetTitleDetail.mockResolvedValue({
      id: "title_123",
      slug: "the-matrix",
      name: "The Matrix",
      type: "MOVIE",
      releaseDate: "1999-03-31T00:00:00.000Z",
      posterUrl: null,
      wokeScore: 12,
      wokeSummary: "Manual summary.",
      imdbRating: 8.7,
      rottenTomatoesCriticsScore: 83,
      rottenTomatoesAudienceScore: 85,
      contentTags: [],
      genres: [],
      originalLanguage: "en",
      ageRating: "R",
      runtimeMinutes: 136,
      synopsis: "A hacker learns what reality is.",
      trailerYoutubeUrl: null,
      imdbUrl: "https://www.imdb.com/title/tt0133093/",
      rottenTomatoesUrl: "https://www.rottentomatoes.com/m/the_matrix",
      amazonUrl: null,
      productionCompanies: ["Warner Bros. Pictures"],
      productionNetworks: [],
      studioAttribution: { label: "Netflix", source: "EXCLUSIVE_STREAMING_PROVIDER" },
      watchProviders: ["Netflix"],
      watchProviderLinks: [{ name: "Netflix", url: "https://www.netflix.com/" }],
      cast: [],
      crew: [],
      wokeFactors: []
    });

    const { GET } = await import("@/app/api/titles/[slug]/route");
    const response = await GET(new Request("http://localhost:3000/api/titles/the-matrix"), {
      params: Promise.resolve({ slug: "the-matrix" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.productionCompanies).toEqual(["Warner Bros. Pictures"]);
    expect(body.studioAttribution).toEqual({
      label: "Netflix",
      source: "EXCLUSIVE_STREAMING_PROVIDER"
    });
  });
});
