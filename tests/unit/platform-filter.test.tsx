// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformFilter } from "@/components/platform-filter";

describe("PlatformFilter", () => {
  it("renders a muted disabled control when no platform data is available", () => {
    render(<PlatformFilter options={[]} selected={[]} />);

    expect(screen.getByRole("button", { name: "No platform data" })).toBeDisabled();
  });

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

  it("filters the platform list with a case-insensitive substring match", () => {
    render(<PlatformFilter options={["Max", "Netflix", "Paramount+", "The Network"]} selected={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "ALL" }));
    fireEvent.change(screen.getByLabelText("Filter platforms..."), { target: { value: "net" } });

    expect(screen.getByLabelText("Netflix")).toBeInTheDocument();
    expect(screen.getByLabelText("The Network")).toBeInTheDocument();
    expect(screen.queryByLabelText("Max")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Paramount+")).not.toBeInTheDocument();
  });

  it("shows an empty state when no platforms match the filter", () => {
    render(<PlatformFilter options={["Max", "Netflix", "Peacock"]} selected={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "ALL" }));
    fireEvent.change(screen.getByLabelText("Filter platforms..."), { target: { value: "zzz" } });

    expect(screen.getByText("No platforms match that filter.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Netflix")).not.toBeInTheDocument();
  });

  it("stays interactive when selected platforms exist", () => {
    render(<PlatformFilter options={[]} selected={["Netflix"]} />);

    fireEvent.click(screen.getByRole("button", { name: "Netflix" }));

    expect(screen.getByText("No platforms match that filter.")).toBeInTheDocument();
  });
});
