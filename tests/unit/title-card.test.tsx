// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TitleCard } from "@/components/title-card";

vi.mock("@/components/title-card-heading", async () => {
  const React = await import("react");

  return {
    TitleCardHeading: ({ title, metadata }: { title: string; metadata: string }) =>
      React.createElement(
        "div",
        null,
        React.createElement("div", null, title),
        React.createElement("div", null, metadata)
      )
  };
});

vi.mock("@/components/score-badge", async () => {
  const React = await import("react");

  return {
    ScoreBadge: ({ score }: { score: number }) => React.createElement("div", null, score)
  };
});

describe("TitleCard", () => {
  it("renders tag icons with tooltip text in the poster corner", () => {
    const { container } = render(
      <TitleCard
        title={{
          id: "title_1",
          slug: "example",
          name: "Example Movie",
          type: "MOVIE",
          releaseDate: "2026-01-01T00:00:00.000Z",
          posterUrl: "https://example.com/poster.jpg",
          wokeScore: 44,
          wokeSummary: "Example summary",
          imdbRating: 7.2,
          rottenTomatoesCriticsScore: 88,
          rottenTomatoesAudienceScore: 91,
          contentTags: ["RAINBOW", "HAMMER_SIGIL"],
          genres: []
        }}
      />
    );

    const rainbow = screen.getByLabelText("Rainbow. Contains LGBT or queer elements.");
    const hammer = screen.getByLabelText("Hammer and sigil. Contains anti-capitalist, socialist, or communist themes.");

    expect(rainbow).toHaveAttribute("title", "Contains LGBT or queer elements.");
    expect(hammer).toHaveAttribute("title", "Contains anti-capitalist, socialist, or communist themes.");
    expect(rainbow.parentElement).toHaveClass("absolute", "right-3", "top-3");
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });
});
