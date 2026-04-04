// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { WatchAvailability } from "@/components/watch-availability";

describe("WatchAvailability", () => {
  it("shows all providers when the list fits within the default limit", () => {
    render(
      <WatchAvailability
        providers={[
          { name: "Netflix", url: "https://www.netflix.com/", offerTypes: ["subscription"] },
          { name: "Max", url: "https://www.max.com/", offerTypes: ["subscription"] },
          { name: "Apple TV Store", url: "https://tv.apple.com/", offerTypes: ["rent"] }
        ]}
      />
    );

    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
    expect(screen.getByText("Apple TV Store")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show all/i })).not.toBeInTheDocument();
  });

  it("collapses long provider lists until expanded", async () => {
    const user = userEvent.setup();

    render(
      <WatchAvailability
        providers={[
          { name: "Netflix", url: "https://www.netflix.com/", offerTypes: ["subscription"] },
          { name: "Max", url: "https://www.max.com/", offerTypes: ["subscription"] },
          { name: "Disney Plus", url: "https://www.disneyplus.com/", offerTypes: ["subscription"] },
          { name: "Hulu", url: "https://www.hulu.com/", offerTypes: ["subscription"] },
          { name: "Peacock", url: "https://www.peacocktv.com/", offerTypes: ["subscription"] },
          { name: "Paramount+", url: "https://www.paramountplus.com/", offerTypes: ["subscription"] },
          { name: "Apple TV Store", url: "https://tv.apple.com/", offerTypes: ["rent"] },
          { name: "Amazon Video", url: "https://www.primevideo.com/", offerTypes: ["buy"] }
        ]}
      />
    );

    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("Paramount+")).toBeInTheDocument();
    expect(screen.queryByText("Apple TV Store")).not.toBeInTheDocument();
    expect(screen.queryByText("Amazon Video")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show all 8 watch options" }));

    expect(screen.getByText("Apple TV Store")).toBeInTheDocument();
    expect(screen.getByText("Amazon Video")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show fewer watch options" })).toBeInTheDocument();
  });
});
