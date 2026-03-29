import { afterEach, describe, expect, it } from "vitest";
import {
  buildTitleFaqEntries,
  buildTitleSeoMetadata,
  buildTitleStructuredData,
  getTitlePosterAltText
} from "@/lib/title-seo";

const title = {
  slug: "the-example",
  name: "The Example",
  type: "MOVIE" as const,
  releaseDate: "1999-03-31T00:00:00.000Z",
  posterUrl: "https://image.tmdb.org/t/p/w780/example.jpg",
  wokeScore: 61,
  wokeSummary: "This title mixes action spectacle with several overt ideological beats.",
  synopsis: "A veteran cop investigates a conspiracy that keeps circling back to identity politics.",
  genres: [{ slug: "action", name: "Action" }],
  wokeFactors: [
    { label: "Identity politics", weight: 28, displayOrder: 2, notes: null },
    { label: "DEI casting emphasis", weight: 22, displayOrder: 1, notes: null },
    { label: "Political messaging", weight: 16, displayOrder: 3, notes: null }
  ]
};

describe("title SEO helpers", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("builds metadata that targets woke and DEI queries", () => {
    const metadata = buildTitleSeoMetadata(title);

    expect(metadata).toMatchObject({
      title: "The Example",
      canonicalPath: "/title/the-example"
    });
    expect(metadata.description).toContain("Is The Example woke?");
    expect(metadata.keywords).toEqual(
      expect.arrayContaining([
        "is The Example woke",
        "The Example woke score",
        "dei in The Example"
      ])
    );
  });

  it("builds descriptive poster alt text with title type and year", () => {
    expect(getTitlePosterAltText(title)).toBe("The Example movie poster (1999)");
  });

  it("builds FAQ copy and structured data for title pages", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://wokeornot.example";

    const faqEntries = buildTitleFaqEntries(title);
    const structuredData = buildTitleStructuredData(title);

    expect(faqEntries[0]?.question).toBe("Is The Example woke?");
    expect(faqEntries[1]?.question).toBe("Is there DEI in The Example?");
    expect(faqEntries[1]?.answer).toContain("DEI casting emphasis");
    expect(faqEntries[1]?.answer).toContain("Identity politics");

    expect(structuredData).toHaveLength(3);
    expect(structuredData[1]).toMatchObject({
      "@type": "Review",
      name: "Is The Example woke?",
      url: "https://wokeornot.example/title/the-example"
    });
    expect(structuredData[2]).toMatchObject({
      "@type": "FAQPage"
    });
  });
});
