import { describe, expect, it } from "vitest";
import { deriveContentTagsFromText } from "@/lib/title-tags";

describe("deriveContentTagsFromText", () => {
  it("matches clear LGBT elements", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "The story centers a lesbian romance and queer identity conflict.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual(["RAINBOW"]);
  });

  it("matches bisexual portrayal phrasing", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "Catwoman gets bisexual portrayal with the roommate line.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual(["RAINBOW"]);
  });

  it("matches character portrayal confirmed as bisexual", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: null,
        socialPostDraft: null,
        wokeFactors: [{ notes: "Zoë Kravitz confirmed she interpreted and played Catwoman as bisexual." }]
      })
    ).toEqual(["RAINBOW"]);
  });

  it("matches explicit gender transition phrasing", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "The story centers a teenager's gender transition and identity conflict.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual(["RAINBOW"]);
  });

  it("matches explicit Christian focus", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "This is a faith-based movie retelling the story of Jesus.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual(["CROSS"]);
  });

  it("matches bible adaptation phrasing", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "This is a Bible adaptation with a modern framing.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual(["CROSS"]);
  });

  it("matches biblical nativity framing", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "The musical adds modern feminist updates to the Nativity.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual(["CROSS"]);
  });

  it("matches explicit anti-capitalist themes", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "The movie keeps pushing anti-capitalist lectures about corporate greed and the rigged system.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual(["HAMMER_SIGIL"]);
  });

  it("ignores negated LGBT mentions", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "No visible queer elements in this title.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual([]);
  });

  it("ignores negated socialist language", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "This is not an anti-capitalist story.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual([]);
  });

  it("ignores incidental Christian references", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "There is a church scene, but this is not a Christian movie.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual([]);
  });

  it("ignores light eat-the-rich satire", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "There is light eat-the-rich satire in the background, but the movie stays focused on action.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual([]);
  });

  it("ignores performer trivia that does not describe title content", () => {
    expect(
      deriveContentTagsFromText({
        wokeSummary: "One minor contestant is played by an openly queer actress, but the story has no queer arcs.",
        socialPostDraft: null,
        wokeFactors: []
      })
    ).toEqual([]);
  });
});
