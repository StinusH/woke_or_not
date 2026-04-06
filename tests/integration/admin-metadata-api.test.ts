import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedSearchTitleMetadata = vi.fn();
const mockedGetTitleMetadataAutofill = vi.fn();
const mockedFindUniqueTitle = vi.fn();

vi.mock("@/lib/title-metadata", () => ({
  searchTitleMetadata: mockedSearchTitleMetadata,
  getTitleMetadataAutofill: mockedGetTitleMetadataAutofill
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    title: {
      findUnique: mockedFindUniqueTitle
    }
  }
}));

describe("admin metadata api routes", () => {
  beforeEach(() => {
    mockedSearchTitleMetadata.mockReset();
    mockedGetTitleMetadataAutofill.mockReset();
    mockedFindUniqueTitle.mockReset();
    process.env.ADMIN_SECRET = "secret";
  });

  it("GET /api/admin/metadata/search rejects unauthorized requests", async () => {
    const { GET } = await import("@/app/api/admin/metadata/search/route");
    const response = await GET(new NextRequest("http://localhost:3000/api/admin/metadata/search?q=matrix"));

    expect(response.status).toBe(401);
    expect(mockedSearchTitleMetadata).not.toHaveBeenCalled();
  });

  it("GET /api/admin/metadata/search returns provider matches", async () => {
    mockedSearchTitleMetadata.mockResolvedValue([
      {
        provider: "TMDB",
        providerId: 603,
        type: "MOVIE",
        name: "The Matrix",
        releaseDate: "1999-03-31",
        overview: "A hacker learns what reality is.",
        posterUrl: "https://image.tmdb.org/t/p/w780/matrix.jpg"
      }
    ]);

    const { GET } = await import("@/app/api/admin/metadata/search/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/admin/metadata/search?q=matrix&year=1999&type=MOVIE", {
        headers: { "x-admin-secret": "secret" }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(mockedSearchTitleMetadata).toHaveBeenCalledWith({
      query: "matrix",
      year: 1999,
      type: "MOVIE"
    });
  });

  it("GET /api/admin/metadata/item returns normalized metadata", async () => {
    mockedGetTitleMetadataAutofill.mockResolvedValue({
      slug: "the-matrix",
      name: "The Matrix",
      type: "MOVIE",
      releaseDate: "1999-03-31",
      ageRating: "R",
      runtimeMinutes: 136,
      synopsis: "A hacker learns what reality is.",
      posterUrl: "https://image.tmdb.org/t/p/w780/matrix.jpg",
      trailerYoutubeUrl: "https://www.youtube.com/watch?v=vKQi3bBA1y8",
      imdbUrl: "https://www.imdb.com/title/tt0133093/",
      imdbRating: 8.7,
      rottenTomatoesUrl: "https://www.rottentomatoes.com/m/the_matrix",
      rottenTomatoesCriticsScore: 83,
      rottenTomatoesAudienceScore: 85,
      productionCompanies: ["Warner Bros. Pictures"],
      productionNetworks: [],
      studioAttribution: null,
      watchProviders: ["Netflix", "Disney Plus"],
      watchProviderLinks: [
        { name: "Netflix", url: "https://www.netflix.com/" },
        { name: "Disney Plus", url: "https://www.disneyplus.com/" }
      ],
      genreNames: ["Action", "Science Fiction"],
      cast: [{ name: "Keanu Reeves", roleName: "Neo", billingOrder: 1 }],
      crew: [{ name: "Lana Wachowski", jobType: "DIRECTOR" }]
    });
    mockedFindUniqueTitle.mockResolvedValue({
      id: "title_123",
      name: "The Matrix",
      slug: "the-matrix",
      imdbUrl: "https://www.imdb.com/title/tt0133093/",
      releaseDate: new Date("1999-03-31T00:00:00.000Z")
    });

    const { GET } = await import("@/app/api/admin/metadata/item/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/admin/metadata/item?providerId=603&type=MOVIE", {
        headers: { "x-admin-secret": "secret" }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.slug).toBe("the-matrix");
    expect(body.data.ageRating).toBe("R");
    expect(body.data.productionCompanies).toEqual(["Warner Bros. Pictures"]);
    expect(body.data.productionNetworks).toEqual([]);
    expect(body.data.studioAttribution).toBeNull();
    expect(body.warnings).toEqual([]);
    expect(body.existingTitle).toEqual({
      id: "title_123",
      name: "The Matrix",
      slug: "the-matrix"
    });
    expect(mockedGetTitleMetadataAutofill).toHaveBeenCalledWith({
      providerId: 603,
      type: "MOVIE",
      warnings: []
    });
    expect(mockedFindUniqueTitle).toHaveBeenCalledWith({
      where: { slug: "the-matrix" },
      select: { id: true, name: true, slug: true, imdbUrl: true, releaseDate: true }
    });
  });

  it("GET /api/admin/metadata/item adjusts the slug when the existing title is a different movie", async () => {
    mockedGetTitleMetadataAutofill.mockResolvedValue({
      slug: "the-matrix",
      name: "The Matrix",
      type: "MOVIE",
      releaseDate: "2021-12-22",
      ageRating: "R",
      runtimeMinutes: 148,
      synopsis: "Another trip back into the Matrix.",
      posterUrl: "https://image.tmdb.org/t/p/w780/matrix-resurrections.jpg",
      trailerYoutubeUrl: "https://www.youtube.com/watch?v=9ix7TUGVYIo",
      imdbUrl: "https://www.imdb.com/title/tt10838180/",
      imdbRating: 5.7,
      rottenTomatoesUrl: "https://www.rottentomatoes.com/m/the_matrix_resurrections",
      rottenTomatoesCriticsScore: 63,
      rottenTomatoesAudienceScore: 63,
      productionCompanies: [],
      productionNetworks: [],
      studioAttribution: null,
      watchProviders: [],
      watchProviderLinks: [],
      genreNames: ["Action", "Science Fiction"],
      cast: [],
      crew: []
    });
    mockedFindUniqueTitle.mockResolvedValueOnce({
      id: "title_123",
      name: "The Matrix",
      slug: "the-matrix",
      imdbUrl: "https://www.imdb.com/title/tt0133093/",
      releaseDate: new Date("1999-03-31T00:00:00.000Z")
    });
    mockedFindUniqueTitle.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/admin/metadata/item/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/admin/metadata/item?providerId=624860&type=MOVIE", {
        headers: { "x-admin-secret": "secret" }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.slug).toBe("the-matrix_2021");
    expect(body.existingTitle).toBeNull();
    expect(mockedFindUniqueTitle).toHaveBeenNthCalledWith(1, {
      where: { slug: "the-matrix" },
      select: { id: true, name: true, slug: true, imdbUrl: true, releaseDate: true }
    });
    expect(mockedFindUniqueTitle).toHaveBeenNthCalledWith(2, {
      where: { slug: "the-matrix_2021" },
      select: { id: true, name: true, slug: true, imdbUrl: true, releaseDate: true }
    });
  });
});
