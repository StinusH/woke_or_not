import { describe, expect, it } from "vitest";
import {
  getWatchProviderFallbackUrl,
  normalizeWatchProviderLinks,
  normalizeWatchProviders
} from "@/lib/watch-providers";

describe("watch provider normalization", () => {
  it("collapses provider variants into cleaner brand labels", () => {
    expect(
      normalizeWatchProviders([
        "Amazon Prime Video",
        "Amazon Prime Video Free with Ads",
        "fuboTV",
        "HBO Max",
        "HBO Max Amazon Channel",
        "MGM+ Amazon Channel",
        "Peacock Premium",
        "Peacock Premium Plus",
        "Paramount Plus Premium",
        "Paramount Plus Essential",
        "Paramount+ Amazon Channel",
        "MGM Plus",
        "Philo",
        "Paramount+ Roku Premium Channel",
        "Amazon Prime Video with Ads"
      ])
    ).toEqual(["Amazon Prime", "fuboTV", "HBO Max", "MGM+", "Peacock", "Paramount+", "Philo"]);
  });

  it("dedupes aliased provider links under the canonical label", () => {
    expect(
      normalizeWatchProviderLinks([
        { name: "Amazon Prime Video", url: "https://www.primevideo.com/" },
        { name: "Amazon Prime Video with Ads", url: null },
        { name: "HBO Max", url: "https://www.max.com/" },
        { name: "HBO Max Amazon Channel", url: null },
        { name: "Peacock Premium", url: "https://www.peacocktv.com/" },
        { name: "Peacock Premium Plus", url: null },
        { name: "Paramount Plus Premium", url: "https://www.paramountplus.com/" },
        { name: "Paramount+ Amazon Channel", url: null },
        { name: "MGM+ Amazon Channel", url: "https://www.mgmplus.com/" },
        { name: "MGM Plus", url: null }
      ])
    ).toEqual([
      { name: "Amazon Prime", url: "https://www.primevideo.com/" },
      { name: "HBO Max", url: "https://www.max.com/" },
      { name: "Peacock", url: "https://www.peacocktv.com/" },
      { name: "Paramount+", url: "https://www.paramountplus.com/" },
      { name: "MGM+", url: "https://www.mgmplus.com/" }
    ]);
  });

  it("returns fallback URLs for canonical provider labels", () => {
    expect(getWatchProviderFallbackUrl("Amazon Prime")).toBe("https://www.primevideo.com/");
    expect(getWatchProviderFallbackUrl("Paramount+")).toBe("https://www.paramountplus.com/");
    expect(getWatchProviderFallbackUrl("MGM+")).toBe("https://www.mgmplus.com/");
  });
});
