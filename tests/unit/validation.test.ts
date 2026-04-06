import { adminTitlePayloadSchema, parseListQuery } from "@/lib/validation";

const canonicalWokeFactors = [
  { label: "Representation / casting choices", weight: 15, displayOrder: 1, notes: "Editorial note." },
  { label: "Political / ideological dialogue", weight: 10, displayOrder: 2, notes: "Editorial note." },
  { label: "Identity-driven story themes", weight: 20, displayOrder: 3, notes: "Editorial note." },
  { label: "Institutional / cultural critique", weight: 12, displayOrder: 4, notes: "Editorial note." },
  { label: "Legacy character or canon changes", weight: 0, displayOrder: 5, notes: "Not relevant." },
  { label: "Public controversy / woke complaints", weight: 8, displayOrder: 6, notes: "Editorial note." },
  { label: "Creator track record context", weight: 6, displayOrder: 7, notes: "Editorial note." }
];

describe("parseListQuery", () => {
  it("returns defaults when query is empty", () => {
    const parsed = parseListQuery({});

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(12);
    expect(parsed.sort).toBe("recommended");
  });

  it("normalizes score bounds when min > max", () => {
    const parsed = parseListQuery({ score_min: "90", score_max: "20" });

    expect(parsed.score_min).toBe(20);
    expect(parsed.score_max).toBe(90);
  });

  it("normalizes year bounds when the interval is reversed", () => {
    const parsed = parseListQuery({ year_min: "2025", year_max: "1999" });

    expect(parsed.year_min).toBe(1999);
    expect(parsed.year_max).toBe(2025);
  });

  it("treats the legacy exact year filter as a one-year interval", () => {
    const parsed = parseListQuery({ year: "2023" });

    expect(parsed.year).toBeUndefined();
    expect(parsed.year_min).toBe(2023);
    expect(parsed.year_max).toBe(2023);
  });

  it("falls back to defaults for invalid params", () => {
    const parsed = parseListQuery({ page: "-4", limit: "999", sort: "invalid" });

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(12);
    expect(parsed.sort).toBe("recommended");
  });

  it("ignores blank optional fields without dropping valid filters", () => {
    const parsed = parseListQuery({
      type: "MOVIE",
      genre: "action",
      age_rating: "PG-13",
      platform: ["Netflix", "  ", "Max"],
      year_min: "2020",
      year_max: "2023",
      score_min: "",
      score_max: "",
      imdb_min: "",
      tomatoes_min: "",
      q: "",
      sort: "imdb_desc",
      limit: "12"
    });

    expect(parsed.type).toBe("MOVIE");
    expect(parsed.genre).toBe("action");
    expect(parsed.age_rating).toBe("PG-13");
    expect(parsed.platform).toEqual(["Netflix", "Max"]);
    expect(parsed.year_min).toBe(2020);
    expect(parsed.year_max).toBe(2023);
    expect(parsed.score_min).toBeUndefined();
    expect(parsed.score_max).toBeUndefined();
    expect(parsed.imdb_min).toBeUndefined();
    expect(parsed.tomatoes_min).toBeUndefined();
    expect(parsed.q).toBeUndefined();
    expect(parsed.sort).toBe("imdb_desc");
    expect(parsed.limit).toBe(12);
  });

  it("accepts repeated platform params", () => {
    const parsed = parseListQuery({
      q: "alien",
      platform: ["Netflix", "Max"],
      sort: "recommended"
    });

    expect(parsed.q).toBe("alien");
    expect(parsed.platform).toEqual(["Netflix", "Max"]);
    expect(parsed.sort).toBe("recommended");
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
      productionCompanies: ["Disney", "Marc Platt Productions"],
      productionNetworks: [],
      studioAttribution: { label: "Disney", source: "PRODUCTION_COMPANY" },
      watchProviders: ["Disney Plus"],
      watchProviderLinks: [{ name: "Disney Plus", url: "https://www.disneyplus.com/", offerTypes: ["subscription"] }],
      wokeScore: 55,
      wokeSummary: "Manual score summary for editorial review.",
      status: "DRAFT",
      genreSlugs: ["family"],
      cast: [{ name: "Halle Bailey", roleName: "Ariel", billingOrder: 1 }],
      crew: [{ name: "Rob Marshall", jobType: "DIRECTOR" }],
      wokeFactors: canonicalWokeFactors
    });

    expect(parsed.imdbRating).toBe(7.2);
    expect(parsed.rottenTomatoesCriticsScore).toBe(67);
    expect(parsed.rottenTomatoesAudienceScore).toBe(94);
    expect(parsed.productionCompanies).toEqual(["Disney", "Marc Platt Productions"]);
    expect(parsed.studioAttribution).toEqual({ label: "Disney", source: "PRODUCTION_COMPANY" });
    expect(parsed.watchProviders).toEqual(["Disney Plus"]);
    expect(parsed.watchProviderLinks).toEqual([
      { name: "Disney Plus", url: "https://www.disneyplus.com/", offerTypes: ["subscription"] }
    ]);
  });

  it("accepts underscores in admin slugs", () => {
    const parsed = adminTitlePayloadSchema.parse({
      slug: "the-matrix_2021",
      name: "The Matrix",
      type: "MOVIE",
      releaseDate: "2021-12-22",
      runtimeMinutes: 148,
      synopsis: "Another trip back into the Matrix.",
      wokeScore: 55,
      wokeSummary: "Manual score summary for editorial review.",
      status: "DRAFT",
      genreSlugs: ["sci-fi"],
      cast: [],
      crew: [{ name: "Lana Wachowski", jobType: "DIRECTOR" }],
      wokeFactors: canonicalWokeFactors
    });

    expect(parsed.slug).toBe("the-matrix_2021");
  });

  it("accepts woke summaries up to 1000 characters", () => {
    const parsed = adminTitlePayloadSchema.parse({
      slug: "the-little-mermaid-2023",
      name: "The Little Mermaid",
      type: "MOVIE",
      releaseDate: "2023-05-18",
      runtimeMinutes: 135,
      synopsis: "A mermaid princess makes a dangerous bargain to follow her dreams on land.",
      wokeScore: 55,
      wokeSummary: "a".repeat(1000),
      status: "DRAFT",
      genreSlugs: ["family"],
      cast: [{ name: "Halle Bailey", roleName: "Ariel", billingOrder: 1 }],
      crew: [{ name: "Rob Marshall", jobType: "DIRECTOR" }],
      wokeFactors: canonicalWokeFactors
    });

    expect(parsed.wokeSummary).toHaveLength(1000);
  });

  it("accepts more than five genres on admin payloads", () => {
    const parsed = adminTitlePayloadSchema.parse({
      slug: "the-little-mermaid-2023",
      name: "The Little Mermaid",
      type: "MOVIE",
      releaseDate: "2023-05-18",
      runtimeMinutes: 135,
      synopsis: "A mermaid princess makes a dangerous bargain to follow her dreams on land.",
      wokeScore: 55,
      wokeSummary: "Manual score summary for editorial review.",
      status: "DRAFT",
      genreSlugs: ["family", "fantasy", "musical", "romance", "adventure", "drama"],
      cast: [{ name: "Halle Bailey", roleName: "Ariel", billingOrder: 1 }],
      crew: [{ name: "Rob Marshall", jobType: "DIRECTOR" }],
      wokeFactors: canonicalWokeFactors
    });

    expect(parsed.genreSlugs).toEqual(["family", "fantasy", "musical", "romance", "adventure", "drama"]);
  });

  it("accepts single-character cast role names", () => {
    const parsed = adminTitlePayloadSchema.parse({
      slug: "star-trek-first-contact",
      name: "Star Trek: First Contact",
      type: "MOVIE",
      releaseDate: "1996-11-22",
      runtimeMinutes: 111,
      synopsis: "The Enterprise crew races to stop the Borg from rewriting human history.",
      wokeScore: 44,
      wokeSummary: "Manual score summary for editorial review.",
      status: "DRAFT",
      genreSlugs: ["sci-fi"],
      cast: [{ name: "Jeri Ryan", roleName: "7", billingOrder: 1 }],
      crew: [{ name: "Jonathan Frakes", jobType: "DIRECTOR" }],
      wokeFactors: canonicalWokeFactors
    });

    expect(parsed.cast[0]?.roleName).toBe("7");
  });

  it("accepts titles without cast entries", () => {
    const parsed = adminTitlePayloadSchema.parse({
      slug: "spirited-away",
      name: "Spirited Away",
      type: "MOVIE",
      releaseDate: "2001-07-20",
      runtimeMinutes: 125,
      synopsis: "A girl enters a spirit world and works to free herself and her parents.",
      wokeScore: 12,
      wokeSummary: "Manual score summary for editorial review.",
      status: "DRAFT",
      genreSlugs: ["fantasy"],
      cast: [],
      crew: [{ name: "Hayao Miyazaki", jobType: "DIRECTOR" }],
      wokeFactors: canonicalWokeFactors
    });

    expect(parsed.cast).toEqual([]);
  });
});
