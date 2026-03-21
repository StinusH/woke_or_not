// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WokeFactorPanel } from "@/components/woke-factor-panel";

describe("WokeFactorPanel", () => {
  it("hides factors at 15 or below when a title-page threshold is provided", () => {
    render(
      <WokeFactorPanel
        minimumWeight={16}
        factors={[
          { label: "Representation / casting choices", weight: 25, displayOrder: 1, notes: "Visible." },
          { label: "Political / ideological dialogue", weight: 15, displayOrder: 2, notes: "Should be hidden." },
          { label: "Institutional / cultural critique", weight: 16, displayOrder: 3, notes: "Visible." }
        ]}
      />
    );

    expect(screen.getByText("Representation / casting choices")).toBeInTheDocument();
    expect(screen.getByText("Institutional / cultural critique")).toBeInTheDocument();
    expect(screen.queryByText("Political / ideological dialogue")).not.toBeInTheDocument();
  });
});
