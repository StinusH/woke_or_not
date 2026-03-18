import { buildTitleWhere } from "@/lib/catalog";

describe("buildTitleWhere", () => {
  it("builds query with type, genre, year and range", () => {
    const where = buildTitleWhere({
      page: 1,
      limit: 12,
      sort: "score_desc",
      type: "MOVIE",
      genre: "action",
      year: 2023,
      score_min: 25,
      score_max: 75,
      q: "harbor"
    });

    expect(where.status).toBe("PUBLISHED");
    expect(where.type).toBe("MOVIE");
    expect(where.wokeScore).toEqual({ gte: 25, lte: 75 });
    expect(where.titleGenres).toEqual({
      some: {
        genre: {
          slug: "action"
        }
      }
    });
    expect(where.releaseDate).toEqual({
      gte: new Date(Date.UTC(2023, 0, 1)),
      lt: new Date(Date.UTC(2024, 0, 1))
    });
    expect(where.OR).toHaveLength(2);
  });
});
