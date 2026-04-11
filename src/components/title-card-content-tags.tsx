import React from "react";
import { getTitleTagDefinitions, type TitleContentTag } from "@/lib/title-tags";

interface TitleCardContentTagsProps {
  tags: TitleContentTag[];
}

export function TitleCardContentTags({ tags }: TitleCardContentTagsProps) {
  const definitions = getTitleTagDefinitions(tags);

  if (definitions.length === 0) {
    return null;
  }

  return (
    <div className="absolute right-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap justify-end gap-1.5">
      {definitions.map((tag) => (
        <span
          key={tag.id}
          role="img"
          title={tag.tooltip}
          aria-label={`${tag.name}. ${tag.tooltip}`}
          className="group relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-black/70 text-white shadow-sm backdrop-blur-sm"
        >
          <TagIcon tag={tag.id} />
          <span
            role="tooltip"
            className="pointer-events-none absolute right-full top-1/2 mr-2 hidden w-max max-w-48 -translate-y-1/2 rounded-md border border-white/15 bg-black/90 px-2 py-1 text-[11px] font-medium leading-tight text-white shadow-lg group-hover:block"
          >
            {tag.tooltip}
          </span>
        </span>
      ))}
    </div>
  );
}

function TagIcon({ tag }: { tag: TitleContentTag }) {
  switch (tag) {
    case "RAINBOW":
      return <RainbowIcon />;
    case "CROSS":
      return <CrossIcon />;
    case "HAMMER_SIGIL":
      return <HammerSigilIcon />;
  }
}

function RainbowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d="M4 17a8 8 0 0 1 16 0" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 17a5 5 0 0 1 10 0" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 17a2 2 0 0 1 4 0" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 17a1 1 0 0 1 2 0" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[18px] w-[18px]" stroke="currentColor" strokeWidth="2">
      <path d="M12 4v16" strokeLinecap="round" />
      <path d="M8 9h8" strokeLinecap="round" />
    </svg>
  );
}

function HammerSigilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[18px] w-[18px]" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6h5l1 3H9l7 7-2 2-7-7v3l-3-1V8l2-2Z" strokeLinejoin="round" />
      <path d="M13.5 5.5c2.8 0 5 2.2 5 5 0 1.8-.9 3.4-2.4 4.3" strokeLinecap="round" />
    </svg>
  );
}
