// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TitleDetailPage from "@/app/title/[slug]/page";

const { mockedGetTitleDetail } = vi.hoisted(() => ({
  mockedGetTitleDetail: vi.fn()
}));

vi.mock("@/lib/catalog", () => ({
  getTitleDetail: mockedGetTitleDetail
}));

vi.mock("@/lib/title-seo", () => ({
  buildTitleSeoMetadata: () => ({
    title: "The Matrix",
    description: "SEO description",
    keywords: [],
    canonicalPath: "/title/the-matrix"
  }),
  buildTitleStructuredData: () => ({}),
  getTitlePosterAltText: () => "Poster alt",
  getTitleReleaseYear: () => 1999,
  getTitleWokeVerdict: () => "not woke"
}));

vi.mock("@/lib/youtube", () => ({
  toYoutubeEmbedUrl: () => null
}));

vi.mock("@/components/watch-availability", async () => {
  const React = await import("react");

  return {
    WatchAvailability: ({ providers }: { providers: Array<{ name: string }> }) =>
      React.createElement("div", { "data-testid": "watch-availability" }, providers.map((provider) => provider.name).join(", "))
  };
});

vi.mock("@/components/score-badge", async () => {
  const React = await import("react");

  return {
    ScoreBadge: ({ score }: { score: number }) => React.createElement("div", null, `Score ${score}`)
  };
});

vi.mock("@/components/trailer-embed", async () => {
  const React = await import("react");

  return {
    TrailerEmbed: () => React.createElement("div", null, "trailer")
  };
});

vi.mock("@/components/woke-factor-panel", async () => {
  const React = await import("react");

  return {
    WokeFactorPanel: () => React.createElement("div", null, "factors")
  };
});

describe("TitleDetailPage", () => {
  it("renders production metadata and likely attribution labels", async () => {
    mockedGetTitleDetail.mockResolvedValue({
      id: "title_123",
      slug: "the-matrix",
      name: "The Matrix",
      type: "MOVIE",
      releaseDate: "1999-03-31T00:00:00.000Z",
      posterUrl: null,
      wokeScore: 12,
      wokeSummary: "Manual summary.",
      imdbRating: 8.7,
      rottenTomatoesCriticsScore: 83,
      rottenTomatoesAudienceScore: 85,
      genres: [],
      originalLanguage: "en",
      ageRating: "R",
      runtimeMinutes: 136,
      synopsis: "A hacker learns what reality is.",
      trailerYoutubeUrl: null,
      imdbUrl: "https://www.imdb.com/title/tt0133093/",
      rottenTomatoesUrl: "https://www.rottentomatoes.com/m/the_matrix",
      amazonUrl: null,
      productionCompanies: ["Warner Bros. Pictures"],
      productionNetworks: [],
      studioAttribution: { label: "Netflix", source: "EXCLUSIVE_STREAMING_PROVIDER" },
      watchProviders: ["Netflix"],
      watchProviderLinks: [{ name: "Netflix", url: "https://www.netflix.com/" }],
      cast: [],
      crew: [],
      wokeFactors: []
    });

    render(await TitleDetailPage({ params: Promise.resolve({ slug: "the-matrix" }) }));

    expect(screen.getByText("Production")).toBeInTheDocument();
    expect(screen.getByText("Warner Bros. Pictures")).toBeInTheDocument();
    expect(screen.getByText("Likely platform/studio")).toBeInTheDocument();
    expect(screen.getAllByText("Netflix").length).toBeGreaterThan(0);
  });
});
