// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WokeFactorPanel } from "@/components/woke-factor-panel";

describe("WokeFactorPanel", () => {
  it("renders all factors in display order with notes and rating text", () => {
    render(
      <WokeFactorPanel
        factors={[
          { label: "Institutional / cultural critique", weight: 16, displayOrder: 3, notes: null },
          { label: "Representation / casting choices", weight: 25, displayOrder: 1, notes: "Visible." },
          { label: "Political / ideological dialogue", weight: 15, displayOrder: 2, notes: "Still shown." }
        ]}
      />
    );

    const factorLabels = screen.getAllByText(
      /Representation \/ casting choices|Political \/ ideological dialogue|Institutional \/ cultural critique/
    );

    expect(factorLabels.map((node) => node.textContent)).toEqual([
      "Representation / casting choices",
      "Political / ideological dialogue",
      "Institutional / cultural critique"
    ]);
    expect(screen.getByText("Visible.")).toBeInTheDocument();
    expect(screen.getByText("Still shown.")).toBeInTheDocument();
    expect(screen.getByText("25 / 100")).toBeInTheDocument();
    expect(screen.getByText("15 / 100")).toBeInTheDocument();
    expect(screen.getByText("16 / 100")).toBeInTheDocument();
  });

  it("shows an empty state when no factors are available", () => {
    render(<WokeFactorPanel factors={[]} />);

    expect(screen.getByText("No factor breakdown available.")).toBeInTheDocument();
  });
});
