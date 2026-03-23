import { buildTitleWhere, listOrderBy } from "@/lib/catalog";

describe("buildTitleWhere", () => {
  it("builds query with type, genre, year interval, ratings, and score range", () => {
    const where = buildTitleWhere({
      page: 1,
      limit: 12,
      sort: "score_desc",
      type: "MOVIE",
      genre: "action",
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
});

describe("listOrderBy", () => {
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
