// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutoSubmitFilterForm } from "@/components/auto-submit-filter-form";

const mockedReplace = vi.fn();
const mockedSearchParams = new URLSearchParams("sort=score_asc&limit=12");

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockedReplace
  }),
  useSearchParams: () => mockedSearchParams
}));

describe("AutoSubmitFilterForm", () => {
  beforeEach(() => {
    mockedReplace.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces filter changes and updates the URL", () => {
    render(
      <AutoSubmitFilterForm action="/search">
        <input name="q" defaultValue="" aria-label="Search" />
        <input type="hidden" name="sort" value="score_asc" readOnly />
        <input type="hidden" name="limit" value="12" readOnly />
      </AutoSubmitFilterForm>
    );

    const input = screen.getByLabelText("Search");
    fireEvent.input(input, { target: { value: "mermaid" } });

    vi.advanceTimersByTime(299);
    expect(mockedReplace).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mockedReplace).toHaveBeenCalledWith("/search?q=mermaid&sort=score_asc&limit=12", { scroll: false });
  });

  it("submits immediately when the button is pressed", () => {
    render(
      <AutoSubmitFilterForm action="/search">
        <input name="q" defaultValue="mermaid" aria-label="Search" />
        <button type="submit">Apply</button>
      </AutoSubmitFilterForm>
    );

    fireEvent.submit(screen.getByRole("button", { name: "Apply" }).closest("form") as HTMLFormElement);

    expect(mockedReplace).toHaveBeenCalledWith("/search?q=mermaid", { scroll: false });
  });

  it("preserves repeated platform params when filters change", () => {
    render(
      <AutoSubmitFilterForm action="/search">
        <input type="checkbox" name="platform" value="Netflix" defaultChecked aria-label="Netflix" />
        <input type="checkbox" name="platform" value="Max" defaultChecked aria-label="Max" />
        <input name="q" defaultValue="alien" aria-label="Search" />
      </AutoSubmitFilterForm>
    );

    fireEvent.input(screen.getByLabelText("Search"), { target: { value: "alien" } });
    vi.advanceTimersByTime(300);

    expect(mockedReplace).toHaveBeenCalledWith("/search?platform=Netflix&platform=Max&q=alien", {
      scroll: false
    });
  });
});
