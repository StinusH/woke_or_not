import { describe, expect, it } from "vitest";
import { getLanguageLabel, getOriginalLanguageLabel } from "@/lib/title-language";

describe("getLanguageLabel", () => {
  it("formats english and non-english language codes for filter display", () => {
    expect(getLanguageLabel("en")).toBe("English");
    expect(getLanguageLabel("hi")).toBe("Hindi");
    expect(getLanguageLabel("fr")).toBe("French");
  });

  it("falls back cleanly for empty values", () => {
    expect(getLanguageLabel(null)).toBeNull();
    expect(getLanguageLabel("")).toBeNull();
    expect(getLanguageLabel("   ")).toBeNull();
  });
});

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
