import { buildTitleWhere, filterGenresForDisplay, getRecommendedSortScore, listOrderBy } from "@/lib/catalog";

describe("buildTitleWhere", () => {
  it("builds query with type, genre, year interval, ratings, and score range", () => {
    const where = buildTitleWhere({
      page: 1,
      limit: 12,
      sort: "score_desc",
      type: "MOVIE",
      genre: "action",
      platform: ["Netflix", "Max"],
      year_min: 2020,
      year_max: 2023,
      score_min: 25,
      score_max: 75,
      imdb_min: 7.3,
      tomatoes_min: 80,
      q: "harbor"
    });

    expect(where.status).toBe("PUBLISHED");
    expect(where.type).toBe("MOVIE");
    expect(where.watchProviders).toEqual({ hasSome: ["Netflix", "Max"] });
    expect(where.wokeScore).toEqual({ gte: 25, lte: 75 });
    expect(where.imdbRating).toEqual({ gte: 7.3 });
    expect(where.rottenTomatoesCriticsScore).toEqual({ gte: 80 });
    expect(where.titleGenres).toEqual({
      some: {
        genre: {
          slug: "action"
        }
      }
    });
    expect(where.releaseDate).toEqual({
      gte: new Date(Date.UTC(2020, 0, 1)),
      lt: new Date(Date.UTC(2024, 0, 1))
    });
    expect(where.OR).toHaveLength(2);
  });

  it("treats a singular year filter as an exact release-year range", () => {
    const where = buildTitleWhere({
      page: 1,
      limit: 8,
      sort: "score_asc",
      type: "MOVIE",
      year: 2026
    });

    expect(where.releaseDate).toEqual({
      gte: new Date(Date.UTC(2026, 0, 1)),
      lt: new Date(Date.UTC(2027, 0, 1))
    });
  });
});

describe("listOrderBy", () => {
  it("offers a deterministic fallback for recommended sorting", () => {
    expect(listOrderBy("recommended")).toEqual([
      { recommendedScore: "desc" },
      { wokeScore: "asc" },
      { imdbRating: { sort: "desc", nulls: "last" } },
      { rottenTomatoesAudienceScore: { sort: "desc", nulls: "last" } },
      { name: "asc" }
    ]);
  });

  it("pushes unrated titles to the end when sorting by IMDb", () => {
    expect(listOrderBy("imdb_desc")).toEqual([
      { imdbRating: { sort: "desc", nulls: "last" } },
      { name: "asc" }
    ]);
  });

  it("sorts by Rotten Tomatoes score when requested", () => {
    expect(listOrderBy("tomatoes_asc")).toEqual([
      { rottenTomatoesCriticsScore: { sort: "asc", nulls: "last" } },
      { name: "asc" }
    ]);
  });
});

describe("getRecommendedSortScore", () => {
  it("prioritizes lower woke scores over rating gains", () => {
    const saferTitle = getRecommendedSortScore({
      wokeScore: 20,
      imdbRating: 7.1,
      rottenTomatoesAudienceScore: 72
    });
    const higherRatedButWokerTitle = getRecommendedSortScore({
      wokeScore: 35,
      imdbRating: 8.8,
      rottenTomatoesAudienceScore: 95
    });

    expect(saferTitle).toBeGreaterThan(higherRatedButWokerTitle);
  });

  it("treats missing IMDb and audience scores as neutral instead of zero", () => {
    expect(
      getRecommendedSortScore({
        wokeScore: 20,
        imdbRating: null,
        rottenTomatoesAudienceScore: null
      })
    ).toBe(68);
  });
});

describe("filterGenresForDisplay", () => {
  it("hides the kids genre on movies", () => {
    expect(
      filterGenresForDisplay("MOVIE", [
        { slug: "family", name: "Family" },
        { slug: "kids", name: "Kids" },
        { slug: "fantasy", name: "Fantasy" }
      ])
    ).toEqual([
      { slug: "family", name: "Family" },
      { slug: "fantasy", name: "Fantasy" }
    ]);
  });

  it("keeps the kids genre on tv shows", () => {
    expect(
      filterGenresForDisplay("TV_SHOW", [
        { slug: "family", name: "Family" },
        { slug: "kids", name: "Kids" }
      ])
    ).toEqual([
      { slug: "family", name: "Family" },
      { slug: "kids", name: "Kids" }
    ]);
  });
});
