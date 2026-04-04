import { describe, expect, it } from "vitest";
import { getOriginalLanguageLabel } from "@/lib/title-language";

describe("getOriginalLanguageLabel", () => {
  it("hides english titles", () => {
    expect(getOriginalLanguageLabel("en")).toBeNull();
    expect(getOriginalLanguageLabel("en-US")).toBeNull();
  });

  it("formats non-english language codes for display", () => {
    expect(getOriginalLanguageLabel("hi")).toBe("Hindi");
    expect(getOriginalLanguageLabel("fr")).toBe("French");
  });

  it("falls back cleanly for empty values", () => {
    expect(getOriginalLanguageLabel(null)).toBeNull();
    expect(getOriginalLanguageLabel("")).toBeNull();
    expect(getOriginalLanguageLabel("   ")).toBeNull();
  });
});
