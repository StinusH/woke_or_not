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
      runtimeMinutes: 136,
      synopsis: "A hacker learns what reality is.",
      posterUrl: "https://image.tmdb.org/t/p/w780/matrix.jpg",
      trailerYoutubeUrl: "https://www.youtube.com/watch?v=vKQi3bBA1y8",
      imdbUrl: "https://www.imdb.com/title/tt0133093/",
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
      slug: "the-matrix"
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
    expect(body.existingTitle).toEqual({
      id: "title_123",
      name: "The Matrix",
      slug: "the-matrix"
    });
    expect(mockedGetTitleMetadataAutofill).toHaveBeenCalledWith({
      providerId: 603,
      type: "MOVIE"
    });
    expect(mockedFindUniqueTitle).toHaveBeenCalledWith({
      where: { slug: "the-matrix" },
      select: { id: true, name: true, slug: true }
    });
  });
});
