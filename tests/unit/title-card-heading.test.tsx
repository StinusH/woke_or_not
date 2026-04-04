// @vitest-environment jsdom

import React from "react";
import { render } from "@testing-library/react";
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

function createClientRect(right: number, height = 28): DOMRect {
  return {
    x: right - 100,
    y: 0,
    width: 100,
    height,
    top: 0,
    right,
    bottom: height,
    left: right - 100,
    toJSON: () => ({})
  } as DOMRect;
}

describe("TitleCardHeading", () => {
  const originalGetComputedStyle = window.getComputedStyle;
  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  const originalCreateRange = document.createRange;

  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    window.getComputedStyle = vi.fn(
      (element: Element) =>
        ({
          lineHeight: "28px",
          fontSize: "16px",
          marginLeft: element instanceof HTMLElement && element.className.includes("ml-1") ? "4px" : "0px"
        }) as CSSStyleDeclaration
    );

    HTMLElement.prototype.getBoundingClientRect = vi.fn(function getBoundingClientRect(this: HTMLElement) {
      if (this.tagName === "H3") {
        return {
          ...createDomRect(56),
          width: 200,
          right: 200,
          left: 0
        } as DOMRect;
      }

      if (this.textContent === "One Battle After Another") {
        return createDomRect(56);
      }

      if (this.textContent === "The Super Mario Galaxy Movie") {
        return createDomRect(56);
      }

      if (this.textContent === "Movie · 2025") {
        return {
          ...createDomRect(28),
          width: 60,
          right: 60,
          left: 0
        } as DOMRect;
      }

      if (this.textContent === "Movie · 2026") {
        return {
          ...createDomRect(28),
          width: 60,
          right: 60,
          left: 0
        } as DOMRect;
      }

      return createDomRect(28);
    });

    document.createRange = vi.fn(() => {
      let target: Node | null = null;

      return {
        selectNodeContents(node: Node) {
          target = node;
        },
        getClientRects() {
          const text = target?.textContent ?? "";

          if (text === "One Battle After Another") {
            return [createClientRect(180), createClientRect(120)];
          }

          if (text === "The Super Mario Galaxy Movie") {
            return [createClientRect(180), createClientRect(150)];
          }

          return [createClientRect(180)];
        }
      } as unknown as Range;
    });
  });

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle;
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    document.createRange = originalCreateRange;
    vi.unstubAllGlobals();
  });

  it("keeps metadata on its own row for single-line titles", () => {
    const { container } = render(<TitleCardHeading title="Zootopia" metadata="Movie · 2016" />);
    const visibleHeading = container.querySelectorAll("h3")[1];

    expect(container.querySelector("p")).toHaveTextContent("Movie · 2016");
    expect(visibleHeading).toHaveTextContent("Zootopia");
    expect(visibleHeading).not.toHaveTextContent("Movie · 2016");
  });

  it("moves metadata inline when the title wraps", () => {
    const { container } = render(<TitleCardHeading title="One Battle After Another" metadata="Movie · 2025" />);
    const visibleHeading = container.querySelectorAll("h3")[1];

    expect(container.querySelector("p")).not.toBeInTheDocument();
    expect(visibleHeading).toHaveTextContent("One Battle After AnotherMovie · 2025");
  });

  it("keeps metadata on its own row when a wrapped title does not have enough room", () => {
    const { container } = render(<TitleCardHeading title="The Super Mario Galaxy Movie" metadata="Movie · 2026" />);
    const visibleHeading = container.querySelectorAll("h3")[1];

    expect(container.querySelector("p")).toHaveTextContent("Movie · 2026");
    expect(visibleHeading).toHaveTextContent("The Super Mario Galaxy Movie");
    expect(visibleHeading).not.toHaveTextContent("Movie · 2026");
  });
});
