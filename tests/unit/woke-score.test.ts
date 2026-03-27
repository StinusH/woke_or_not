import { describe, expect, it } from "vitest";
import { calculateLegacyCanonBonus, calculateWokeScoreFromFactors } from "@/lib/woke-score";

describe("calculateWokeScoreFromFactors", () => {
  it("averages non-legacy factors and adds the capped legacy bonus", () => {
    expect(
      calculateWokeScoreFromFactors([
        { label: "Representation / casting choices", weight: 45 },
        { label: "Political / ideological dialogue", weight: 38 },
        { label: "Identity-driven story themes", weight: 50 },
        { label: "Institutional / cultural critique", weight: 35 },
        { label: "Legacy character or canon changes", weight: 25 },
        { label: "Public controversy / woke complaints", weight: 48 },
        { label: "Creator track record context", weight: 30 }
      ])
    ).toBe(46);
  });

  it("does not let a zero legacy factor drag down the score", () => {
    expect(
      calculateWokeScoreFromFactors([
        { label: "Representation / casting choices", weight: 20 },
        { label: "Political / ideological dialogue", weight: 10 },
        { label: "Identity-driven story themes", weight: 15 },
        { label: "Institutional / cultural critique", weight: 5 },
        { label: "Legacy character or canon changes", weight: 0 },
        { label: "Public controversy / woke complaints", weight: 12 },
        { label: "Creator track record context", weight: 8 }
      ])
    ).toBe(12);
  });
});

describe("calculateLegacyCanonBonus", () => {
  it("adds five points for a legacy factor of 25", () => {
    expect(calculateLegacyCanonBonus(25)).toBe(5);
  });

  it("caps the legacy bonus at ten points", () => {
    expect(calculateLegacyCanonBonus(90)).toBe(10);
  });
});
