"use client";

import React from "react";
import { useLayoutEffect, useRef, useState } from "react";

interface TitleCardHeadingProps {
  title: string;
  metadata: string;
}

type HeadingLayout = "stacked" | "inline";

function getLineHeight(element: HTMLElement) {
  const computedStyles = window.getComputedStyle(element);
  const parsedLineHeight = Number.parseFloat(computedStyles.lineHeight);

  if (Number.isFinite(parsedLineHeight)) {
    return parsedLineHeight;
  }

  const parsedFontSize = Number.parseFloat(computedStyles.fontSize);
  return Number.isFinite(parsedFontSize) ? parsedFontSize * 1.25 : 20;
}

export function TitleCardHeading({ title, metadata }: TitleCardHeadingProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const measureHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const measureTitleRef = useRef<HTMLSpanElement | null>(null);
  const measureMetadataRef = useRef<HTMLSpanElement | null>(null);
  const [layout, setLayout] = useState<HeadingLayout>("stacked");

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const heading = measureHeadingRef.current;
    const titleElement = measureTitleRef.current;
    const metadataElement = measureMetadataRef.current;

    if (!wrapper || !heading || !titleElement || !metadataElement) {
      return;
    }

    const measureLayout = () => {
      const lineHeight = getLineHeight(titleElement);
      const isWrapped = titleElement.getBoundingClientRect().height > lineHeight * 1.5;

      if (!isWrapped) {
        setLayout("stacked");
        return;
      }

      const range = document.createRange();
      range.selectNodeContents(titleElement);
      const lineRects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 || rect.height > 0);

      if (lineRects.length === 0) {
        setLayout("stacked");
        return;
      }

      const lastLineRect = lineRects.at(-1);

      if (!lastLineRect) {
        setLayout("stacked");
        return;
      }

      const headingRect = heading.getBoundingClientRect();
      const metadataRect = metadataElement.getBoundingClientRect();
      const metadataStyles = window.getComputedStyle(metadataElement);
      const metadataMarginLeft = Number.parseFloat(metadataStyles.marginLeft);
      const remainingWidth = headingRect.right - lastLineRect.right;
      const inlineWidthNeeded =
        metadataRect.width + (Number.isFinite(metadataMarginLeft) ? metadataMarginLeft : 0);

      setLayout(remainingWidth >= inlineWidthNeeded - 0.5 ? "inline" : "stacked");
    };

    measureLayout();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      measureLayout();
    });

    observer.observe(wrapper);

    return () => {
      observer.disconnect();
    };
  }, [metadata, title]);

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      <div aria-hidden className="pointer-events-none absolute left-0 top-0 w-full invisible">
        <h3 ref={measureHeadingRef} className="font-display text-base font-bold leading-snug text-fg">
          <span ref={measureTitleRef}>{title}</span>
        </h3>
        <span
          ref={measureMetadataRef}
          className="ml-1 whitespace-nowrap font-body text-xs font-medium text-fgMuted"
        >
          {metadata}
        </span>
      </div>

      <h3 className="font-display text-base font-bold leading-snug text-fg">
        <span>{title}</span>
        {layout === "inline" ? (
          <span className="ml-1 whitespace-nowrap font-body text-xs font-medium text-fgMuted">{metadata}</span>
        ) : null}
      </h3>
      {layout === "stacked" ? <p className="text-xs text-fgMuted">{metadata}</p> : null}
    </div>
  );
}
