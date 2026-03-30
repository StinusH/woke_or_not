import { describe, expect, it } from "vitest";
import { canonicalizeWokeFactors, getDefaultWokeFactors } from "@/lib/woke-factors";
import { calculateContextBonus, calculateWokeScoreFromFactors } from "@/lib/woke-score";

describe("calculateWokeScoreFromFactors", () => {
  it("uses ordered core weights and the capped context bonus", () => {
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
    ).toBe(57);
  });

  it("lands a single dominant core factor in the high-50s even with zero support elsewhere", () => {
    expect(
      calculateWokeScoreFromFactors([
        { label: "Representation / casting choices", weight: 80 },
        { label: "Political / ideological dialogue", weight: 0 },
        { label: "Identity-driven story themes", weight: 0 },
        { label: "Institutional / cultural critique", weight: 0 },
        { label: "Legacy character or canon changes", weight: 0 },
        { label: "Public controversy / woke complaints", weight: 0 },
        { label: "Creator track record context", weight: 0 }
      ])
    ).toBe(56);
  });

  it("treats creator track record as half strength inside the context bonus", () => {
    expect(
      calculateWokeScoreFromFactors([
        { label: "Representation / casting choices", weight: 80 },
        { label: "Political / ideological dialogue", weight: 0 },
        { label: "Identity-driven story themes", weight: 0 },
        { label: "Institutional / cultural critique", weight: 0 },
        { label: "Legacy character or canon changes", weight: 0 },
        { label: "Public controversy / woke complaints", weight: 0 },
        { label: "Creator track record context", weight: 80 }
      ])
    ).toBe(60);
  });

  it("does not let creator context alone define the score", () => {
    expect(
      calculateWokeScoreFromFactors([
        { label: "Representation / casting choices", weight: 5 },
        { label: "Political / ideological dialogue", weight: 5 },
        { label: "Identity-driven story themes", weight: 5 },
        { label: "Institutional / cultural critique", weight: 5 },
        { label: "Legacy character or canon changes", weight: 0 },
        { label: "Public controversy / woke complaints", weight: 0 },
        { label: "Creator track record context", weight: 100 }
      ])
    ).toBe(10);
  });
});

describe("calculateContextBonus", () => {
  it("caps the context bonus at 25", () => {
    expect(
      calculateContextBonus([
        { label: "Legacy character or canon changes", weight: 100 },
        { label: "Public controversy / woke complaints", weight: 100 },
        { label: "Creator track record context", weight: 100 }
      ])
    ).toBe(25);
  });
});

describe("canonicalizeWokeFactors", () => {
  it("maps legacy aliases into canonical labels and fills missing factors with zeros", () => {
    const normalized = canonicalizeWokeFactors([
      { label: "Representation breadth", weight: 15, displayOrder: 1, notes: "Legacy alias." }
    ]);

    expect(normalized.unknownLabels).toEqual([]);
    expect(normalized.factors).toHaveLength(7);
    expect(normalized.factors[0]).toMatchObject({
      label: "Representation / casting choices",
      weight: 15,
      notes: "Legacy alias."
    });
    expect(normalized.factors[1]).toMatchObject({
      label: "Political / ideological dialogue",
      weight: 0
    });
  });

  it("rejects unknown labels when strict normalization is requested", () => {
    expect(() =>
      canonicalizeWokeFactors([{ label: "Unknown factor", weight: 40 }], { rejectUnknown: true })
    ).toThrow("Unknown woke factor label(s): Unknown factor.");
  });

  it("returns the fixed canonical defaults for empty drafts", () => {
    expect(getDefaultWokeFactors().map((factor) => factor.label)).toEqual([
      "Representation / casting choices",
      "Political / ideological dialogue",
      "Identity-driven story themes",
      "Institutional / cultural critique",
      "Legacy character or canon changes",
      "Public controversy / woke complaints",
      "Creator track record context"
    ]);
  });
});
