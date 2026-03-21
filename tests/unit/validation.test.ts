import { adminTitlePayloadSchema, parseListQuery } from "@/lib/validation";

describe("parseListQuery", () => {
  it("returns defaults when query is empty", () => {
    const parsed = parseListQuery({});

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(12);
    expect(parsed.sort).toBe("score_asc");
  });

  it("normalizes score bounds when min > max", () => {
    const parsed = parseListQuery({ score_min: "90", score_max: "20" });

    expect(parsed.score_min).toBe(20);
    expect(parsed.score_max).toBe(90);
  });

  it("falls back to defaults for invalid params", () => {
    const parsed = parseListQuery({ page: "-4", limit: "999", sort: "invalid" });

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(12);
    expect(parsed.sort).toBe("score_asc");
  });

  it("ignores blank optional fields without dropping valid filters", () => {
    const parsed = parseListQuery({
      type: "MOVIE",
      genre: "action",
      year: "2023",
      score_min: "",
      score_max: "",
      q: "",
      sort: "score_asc",
      limit: "12"
    });

    expect(parsed.type).toBe("MOVIE");
    expect(parsed.genre).toBe("action");
    expect(parsed.year).toBe(2023);
    expect(parsed.score_min).toBeUndefined();
    expect(parsed.score_max).toBeUndefined();
    expect(parsed.q).toBeUndefined();
    expect(parsed.sort).toBe("score_asc");
    expect(parsed.limit).toBe(12);
  });

  it("accepts optional external score fields on admin payloads", () => {
    const parsed = adminTitlePayloadSchema.parse({
      slug: "the-little-mermaid-2023",
      name: "The Little Mermaid",
      type: "MOVIE",
      releaseDate: "2023-05-18",
      runtimeMinutes: 135,
      synopsis: "A mermaid princess makes a dangerous bargain to follow her dreams on land.",
      posterUrl: "https://example.com/poster.jpg",
      trailerYoutubeUrl: "https://www.youtube.com/watch?v=kpGo2_d3oYE",
      imdbUrl: "https://www.imdb.com/title/tt5971474/",
      imdbRating: 7.2,
      rottenTomatoesUrl: "https://www.rottentomatoes.com/m/the_little_mermaid_2023",
      rottenTomatoesCriticsScore: 67,
      rottenTomatoesAudienceScore: 94,
      amazonUrl: "https://www.amazon.com/s?k=The+Little+Mermaid+2023",
      watchProviders: ["Disney Plus"],
      watchProviderLinks: [{ name: "Disney Plus", url: "https://www.disneyplus.com/" }],
      wokeScore: 55,
      wokeSummary: "Manual score summary for editorial review.",
      status: "DRAFT",
      genreSlugs: ["family"],
      cast: [{ name: "Halle Bailey", roleName: "Ariel", billingOrder: 1 }],
      crew: [{ name: "Rob Marshall", jobType: "DIRECTOR" }],
      wokeFactors: [{ label: "Representation breadth", weight: 15, displayOrder: 1, notes: "Editorial note." }]
    });

    expect(parsed.imdbRating).toBe(7.2);
    expect(parsed.rottenTomatoesCriticsScore).toBe(67);
    expect(parsed.rottenTomatoesAudienceScore).toBe(94);
    expect(parsed.watchProviders).toEqual(["Disney Plus"]);
    expect(parsed.watchProviderLinks).toEqual([
      { name: "Disney Plus", url: "https://www.disneyplus.com/" }
    ]);
  });

  it("accepts woke summaries up to 740 characters", () => {
    const parsed = adminTitlePayloadSchema.parse({
      slug: "the-little-mermaid-2023",
      name: "The Little Mermaid",
      type: "MOVIE",
      releaseDate: "2023-05-18",
      runtimeMinutes: 135,
      synopsis: "A mermaid princess makes a dangerous bargain to follow her dreams on land.",
      wokeScore: 55,
      wokeSummary: "a".repeat(740),
      status: "DRAFT",
      genreSlugs: ["family"],
      cast: [{ name: "Halle Bailey", roleName: "Ariel", billingOrder: 1 }],
      crew: [{ name: "Rob Marshall", jobType: "DIRECTOR" }],
      wokeFactors: [{ label: "Representation breadth", weight: 15, displayOrder: 1, notes: "Editorial note." }]
    });

    expect(parsed.wokeSummary).toHaveLength(740);
  });
});
