import { describe, expect, it } from "vitest";
import { inferStudioAttribution, normalizeProductionEntityNames } from "@/lib/studio-attribution";

describe("studio attribution helpers", () => {
  it("normalizes production entity names by trimming, deduping, and preserving order", () => {
    expect(
      normalizeProductionEntityNames([" Netflix ", "Netflix", "  ", "Apple Studios", "Netflix"])
    ).toEqual(["Netflix", "Apple Studios"]);
  });

  it("falls back to an exclusive supported streaming provider when raw production metadata has no supported brand", () => {
    const attribution = inferStudioAttribution({
      type: "MOVIE",
      productionCompanies: ["Example Studio"],
      productionNetworks: [],
      watchProviderLinks: [
        { name: "Netflix", url: "https://www.netflix.com/title/123", offerTypes: ["subscription"] },
        { name: "Apple TV Store", url: "https://tv.apple.com/us/movie/456", offerTypes: ["rent", "buy"] }
      ]
    });

    expect(attribution).toEqual({
      label: "Netflix",
      source: "EXCLUSIVE_STREAMING_PROVIDER"
    });
  });

  it("returns null when multiple supported brands are present in production metadata", () => {
    const attribution = inferStudioAttribution({
      type: "MOVIE",
      productionCompanies: ["Netflix", "Apple Studios"],
      productionNetworks: [],
      watchProviderLinks: [{ name: "Netflix", url: "https://www.netflix.com/title/123", offerTypes: ["subscription"] }]
    });

    expect(attribution).toBeNull();
  });
});
