"use client";

import React from "react";
import { useLayoutEffect, useRef, useState } from "react";

interface TitleCardHeadingProps {
  title: string;
  metadata: string;
}

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
  const titleRef = useRef<HTMLSpanElement | null>(null);
  const [isWrapped, setIsWrapped] = useState(false);

  useLayoutEffect(() => {
    const element = titleRef.current;

    if (!element) {
      return;
    }

    const measureWrap = () => {
      const lineHeight = getLineHeight(element);
      setIsWrapped(element.getBoundingClientRect().height > lineHeight * 1.5);
    };

    measureWrap();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      measureWrap();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [title]);

  if (isWrapped) {
    return (
      <h3 className="font-display text-base font-bold leading-snug text-fg">
        <span ref={titleRef}>{title}</span>
        <span className="ml-1 whitespace-nowrap font-body text-xs font-medium text-fgMuted">{metadata}</span>
      </h3>
    );
  }

  return (
    <>
      <h3 className="font-display text-base font-bold leading-snug text-fg">
        <span ref={titleRef}>{title}</span>
      </h3>
      <p className="text-xs text-fgMuted">{metadata}</p>
    </>
  );
}
