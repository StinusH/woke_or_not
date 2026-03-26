// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TitleCardHeading } from "@/components/title-card-heading";

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

function createDomRect(height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    width: 0,
    height,
    top: 0,
    right: 0,
    bottom: height,
    left: 0,
    toJSON: () => ({})
  } as DOMRect;
}

describe("TitleCardHeading", () => {
  const originalGetComputedStyle = window.getComputedStyle;
  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    window.getComputedStyle = vi.fn(
      () =>
        ({
          lineHeight: "28px",
          fontSize: "16px"
        }) as CSSStyleDeclaration
    );

    HTMLElement.prototype.getBoundingClientRect = vi.fn(function getBoundingClientRect(this: HTMLElement) {
      return createDomRect(this.textContent === "One Battle After Another" ? 56 : 28);
    });
  });

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle;
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    vi.unstubAllGlobals();
  });

  it("keeps metadata on its own row for single-line titles", () => {
    const { container } = render(<TitleCardHeading title="Zootopia" metadata="Movie · 2016" />);

    expect(container.querySelector("p")).toHaveTextContent("Movie · 2016");
    expect(screen.queryByText("Movie · 2016", { selector: "span" })).not.toBeInTheDocument();
  });

  it("moves metadata inline when the title wraps", () => {
    const { container } = render(<TitleCardHeading title="One Battle After Another" metadata="Movie · 2025" />);

    expect(container.querySelector("p")).not.toBeInTheDocument();
    expect(screen.getByText("Movie · 2025", { selector: "span" })).toBeInTheDocument();
  });
});
