import { describe, expect, it } from "vitest";
import {
  MAX_WATCH_PROVIDERS,
  groupWatchProviderLinksByOfferType,
  getWatchProviderFallbackUrl,
  normalizeWatchProviderLinks,
  normalizeWatchProviders
} from "@/lib/watch-providers";

describe("watch provider normalization", () => {
  it("collapses provider variants into cleaner brand labels", () => {
    expect(
      normalizeWatchProviders([
        "Apple TV",
        "Apple TV Amazon Channel",
        "Amazon Prime Video",
        "Amazon Prime Video Free with Ads",
        "Fandango At Home",
        "Fandango at Home Free",
        "fuboTV",
        "HBO Max",
        "HBO Max Amazon Channel",
        "Lifetime Movie Club",
        "Lifetime Movie Club Apple TV Channel",
        "Lifetime Movie Club Amazon Channel",
        "MGM+ Amazon Channel",
        "Peacock Premium",
        "Peacock Premium Plus",
        "Paramount Plus Premium",
        "Paramount Plus Essential",
        "Paramount+ Amazon Channel",
        "MGM Plus",
        "Plex",
        "Plex Channel",
        "Philo",
        "Paramount+ Roku Premium Channel",
        "Amazon Prime Video with Ads"
      ])
    ).toEqual([
      "Apple TV",
      "Amazon Prime",
      "Fandango At Home",
      "fuboTV",
      "HBO Max",
      "Lifetime Movie Club",
      "MGM+",
      "Peacock",
      "Paramount+",
      "Plex",
      "Philo"
    ]);
  });

  it("dedupes aliased provider links under the canonical label", () => {
    expect(
      normalizeWatchProviderLinks([
        { name: "Apple TV", url: "https://tv.apple.com/" },
        { name: "Apple TV Amazon Channel", url: null },
        { name: "Amazon Prime Video", url: "https://www.primevideo.com/" },
        { name: "Amazon Prime Video with Ads", url: null },
        { name: "Fandango At Home", url: "https://www.fandangoathome.com/" },
        { name: "Fandango at Home Free", url: null },
        { name: "HBO Max", url: "https://www.max.com/" },
        { name: "HBO Max Amazon Channel", url: null },
        { name: "Lifetime Movie Club", url: "https://www.lifetimemovieclub.com/" },
        { name: "Lifetime Movie Club Apple TV Channel", url: null },
        { name: "Lifetime Movie Club Amazon Channel", url: null },
        { name: "Peacock Premium", url: "https://www.peacocktv.com/" },
        { name: "Peacock Premium Plus", url: null },
        { name: "Paramount Plus Premium", url: "https://www.paramountplus.com/" },
        { name: "Paramount+ Amazon Channel", url: null },
        { name: "MGM+ Amazon Channel", url: "https://www.mgmplus.com/" },
        { name: "MGM Plus", url: null },
        { name: "Plex", url: "https://www.plex.tv/" },
        { name: "Plex Channel", url: null }
      ])
    ).toEqual([
      { name: "Apple TV", url: "https://tv.apple.com/" },
      { name: "Amazon Prime", url: "https://www.primevideo.com/" },
      { name: "Fandango At Home", url: "https://www.fandangoathome.com/" },
      { name: "HBO Max", url: "https://www.max.com/" },
      { name: "Lifetime Movie Club", url: "https://www.lifetimemovieclub.com/" },
      { name: "Peacock", url: "https://www.peacocktv.com/" },
      { name: "Paramount+", url: "https://www.paramountplus.com/" },
      { name: "MGM+", url: "https://www.mgmplus.com/" },
      { name: "Plex", url: "https://www.plex.tv/" }
    ]);
  });

  it("merges offer types when the same provider appears in multiple offer buckets", () => {
    expect(
      normalizeWatchProviderLinks([
        { name: "Netflix", url: "https://www.netflix.com/", offerTypes: ["subscription"] },
        { name: "Netflix Standard with Ads", url: null, offerTypes: ["ads"] },
        { name: "Apple TV Store", url: "https://tv.apple.com/", offerTypes: ["rent"] },
        { name: "Apple TV Store", url: null, offerTypes: ["buy"] }
      ])
    ).toEqual([
      { name: "Netflix", url: "https://www.netflix.com/", offerTypes: ["subscription", "ads"] },
      { name: "Apple TV Store", url: "https://tv.apple.com/", offerTypes: ["rent", "buy"] }
    ]);
  });

  it("returns fallback URLs for canonical provider labels", () => {
    expect(getWatchProviderFallbackUrl("Amazon Prime")).toBe("https://www.primevideo.com/");
    expect(getWatchProviderFallbackUrl("Paramount+")).toBe("https://www.paramountplus.com/");
    expect(getWatchProviderFallbackUrl("MGM+")).toBe("https://www.mgmplus.com/");
  });

  it("supports common TMDb storefront labels used in rent and buy results", () => {
    expect(
      normalizeWatchProviders([
        "Amazon Video",
        "Apple TV Store",
        "Google Play Movies",
        "Fandango At Home",
        "Rakuten TV",
        "SF Anytime",
        "Viaplay"
      ])
    ).toEqual([
      "Amazon Video",
      "Apple TV Store",
      "Google Play Movies",
      "Fandango At Home",
      "Rakuten TV",
      "SF Anytime",
      "Viaplay"
    ]);

    expect(getWatchProviderFallbackUrl("Amazon Video")).toBe("https://www.primevideo.com/");
    expect(getWatchProviderFallbackUrl("Apple TV Store")).toBe("https://tv.apple.com/");
    expect(getWatchProviderFallbackUrl("Google Play Movies")).toBe("https://play.google.com/store/movies");
    expect(getWatchProviderFallbackUrl("Fandango At Home")).toBe("https://www.vudu.com/");
    expect(getWatchProviderFallbackUrl("Rakuten TV")).toBe("https://www.rakuten.tv/");
    expect(getWatchProviderFallbackUrl("SF Anytime")).toBe("https://www.sfanytime.com/");
    expect(getWatchProviderFallbackUrl("Viaplay")).toBe("https://viaplay.com/");
  });

  it("groups providers by offer type for display", () => {
    expect(
      groupWatchProviderLinksByOfferType([
        { name: "Netflix", url: "https://www.netflix.com/", offerTypes: ["subscription", "ads"] },
        { name: "Apple TV Store", url: "https://tv.apple.com/", offerTypes: ["rent", "buy"] },
        { name: "Plex", url: "https://www.plex.tv/", offerTypes: ["rent"] },
        { name: "Unknown Provider", url: null }
      ])
    ).toEqual([
      {
        offerType: "subscription",
        label: "Stream",
        providers: [{ name: "Netflix", url: "https://www.netflix.com/", offerTypes: ["subscription", "ads"] }]
      },
      {
        offerType: "ads",
        label: "Ads",
        providers: [{ name: "Netflix", url: "https://www.netflix.com/", offerTypes: ["subscription", "ads"] }]
      },
      {
        offerType: "rent",
        label: "Rent",
        providers: [
          { name: "Apple TV Store", url: "https://tv.apple.com/", offerTypes: ["rent", "buy"] },
          { name: "Plex", url: "https://www.plex.tv/", offerTypes: ["rent"] }
        ]
      },
      {
        offerType: "buy",
        label: "Buy",
        providers: [{ name: "Apple TV Store", url: "https://tv.apple.com/", offerTypes: ["rent", "buy"] }]
      },
      {
        offerType: "other",
        label: "Available",
        providers: [{ name: "Unknown Provider", url: null }]
      }
    ]);
  });

  it("caps normalized providers and links at the supported maximum", () => {
    const rawProviders = Array.from({ length: MAX_WATCH_PROVIDERS + 3 }, (_, index) => `Provider ${index + 1}`);

    expect(normalizeWatchProviders(rawProviders)).toEqual(rawProviders.slice(0, MAX_WATCH_PROVIDERS));
    expect(
      normalizeWatchProviderLinks(
        rawProviders.map((name, index) => ({
          name,
          url: `https://example.com/${index + 1}`
        }))
      )
    ).toEqual(
      rawProviders.slice(0, MAX_WATCH_PROVIDERS).map((name, index) => ({
        name,
        url: `https://example.com/${index + 1}`
      }))
    );
  });
});
