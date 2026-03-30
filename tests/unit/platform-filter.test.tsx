// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformFilter } from "@/components/platform-filter";

describe("PlatformFilter", () => {
  it("keeps selected platform values in hidden inputs while collapsed", () => {
    const { container } = render(
      <PlatformFilter options={["Max", "Netflix", "Peacock"]} selected={["Netflix", "Peacock"]} />
    );

    const hiddenInputs = Array.from(container.querySelectorAll('input[type="hidden"][name="platform"]'));

    expect(hiddenInputs).toHaveLength(2);
    expect(hiddenInputs.map((input) => input.getAttribute("value"))).toEqual(["Netflix", "Peacock"]);
  });

  it("opens the option list with checkboxes that reflect the selected state", () => {
    render(<PlatformFilter options={["Max", "Netflix", "Peacock"]} selected={["Netflix", "Peacock"]} />);

    fireEvent.click(screen.getByRole("button", { name: "Netflix +1" }));

    expect(screen.getByLabelText("Netflix")).toBeChecked();
    expect(screen.getByLabelText("Peacock")).toBeChecked();
    expect(screen.getByLabelText("Max")).not.toBeChecked();
  });
});
