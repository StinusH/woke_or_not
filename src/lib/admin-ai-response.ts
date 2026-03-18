import type { AdminTitleDraft } from "@/lib/admin-title-draft";

export interface ParsedAiResearchResponse {
  wokeScore: number;
  wokeSummary: string;
  wokeFactors: AdminTitleDraft["wokeFactors"];
  socialPostDraft: string;
}

export function parseAdminAiResearchResponse(input: string): ParsedAiResearchResponse {
  const wokeScore = parseWokeScore(input);
  const wokeSummary = parseSectionBody(input, "Score Summary");
  const factorLines = parseSectionLines(input, "Score Factors");
  const socialPostDraft = parseSectionBody(input, "Social Post Draft");

  if (!wokeSummary) {
    throw new Error("Could not find a Score Summary section.");
  }

  if (factorLines.length === 0) {
    throw new Error("Could not find any Score Factors.");
  }

  if (!socialPostDraft) {
    throw new Error("Could not find a Social Post Draft section.");
  }

  const wokeFactors = factorLines.map((line, index) => parseFactorLine(line, index));

  return {
    wokeScore,
    wokeSummary,
    wokeFactors,
    socialPostDraft
  };
}

function parseWokeScore(input: string): number {
  const match = input.match(/Proposed Woke Score:\s*(\d{1,3})/i);
  const value = match ? Number.parseInt(match[1], 10) : Number.NaN;

  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Could not find a valid Proposed Woke Score.");
  }

  return value;
}

function parseSectionBody(input: string, heading: string): string {
  const escapedHeading = escapeRegex(heading);
  const match = input.match(
    new RegExp(
      `${escapedHeading}:\\s*\\n([\\s\\S]*?)(?:\\n[A-Z][A-Za-z /&]+:\\s*\\n|\\nConfidence:|\\nSocial Post Draft:|\\nOpen Questions For Human Review:|$)`,
      "i"
    )
  );

  return match?.[1].trim() ?? "";
}

function parseSectionLines(input: string, heading: string): string[] {
  const body = parseSectionBody(input, heading);

  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

function parseFactorLine(line: string, index: number): AdminTitleDraft["wokeFactors"][number] {
  const [labelPart, restPart = ""] = line.split(":", 2);
  const label = labelPart.trim();

  if (!label) {
    throw new Error(`Score factor ${index + 1} is missing a label.`);
  }

  const impactMatch = restPart.match(/(\d{1,3})/);
  const weight = impactMatch ? Number.parseInt(impactMatch[1], 10) : Number.NaN;

  if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
    throw new Error(`Score factor "${label}" is missing a valid 0-100 impact estimate.`);
  }

  const notes = restPart
    .replace(/\bimpact estimate\b/i, "")
    .replace(/\bshort explanation\b/i, "")
    .replace(/^\s*\d{1,3}\s*(?:\||-|–|—)?\s*/u, "")
    .trim();

  return {
    label,
    weight,
    displayOrder: index + 1,
    notes
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
