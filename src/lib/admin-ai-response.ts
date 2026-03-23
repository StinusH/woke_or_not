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
  const socialPostDraft = normalizeSocialPostDraft(parseSectionBody(input, "Social Post Draft"), wokeScore, input);

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

function normalizeSocialPostDraft(socialPostDraft: string, wokeScore: number, input: string): string {
  if (!socialPostDraft) {
    return socialPostDraft;
  }

  const status = getSocialStatusLine(wokeScore);
  const title = extractFieldValue(input, "Title");
  const year = extractYear(input, socialPostDraft);
  const imdbRating = extractImdbRating(socialPostDraft);
  const review = stripSocialPostStructure(socialPostDraft, title, year);
  const titleLine = year ? `${title} (${year})` : title;
  const header = [status, titleLine.trim(), `woke score: ${wokeScore}/100 ⭐`, imdbRating].filter(Boolean).join("\n");

  return review ? `${header}\n\n${review}`.replace(/\n{3,}/g, "\n\n") : header;
}

function getSocialStatusLine(wokeScore: number): string {
  if (wokeScore <= 35) {
    return "safe pick ✅";
  }

  if (wokeScore <= 50) {
    return "proceed with caution ⚠️";
  }

  return "woke warning 🚨";
}

function extractFieldValue(input: string, field: string): string {
  const match = input.match(new RegExp(`^${escapeRegex(field)}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function extractYear(input: string, socialPostDraft: string): string {
  const yearMatch = input.match(/^Year:\s*(\d{4})$/im) ?? socialPostDraft.match(/\b(19|20)\d{2}\b/);
  return yearMatch?.[0]?.replace(/^Year:\s*/i, "").trim() ?? "";
}

function extractImdbRating(socialPostDraft: string): string {
  const ratingMatch = socialPostDraft.match(/^(IMDb(?:\s+rating)?):\s*(.+)$/im);

  if (!ratingMatch) {
    return "";
  }

  return `IMDb rating: ${ratingMatch[2].trim()}`;
}

function stripSocialPostStructure(socialPostDraft: string, title: string, year: string): string {
  const lines = socialPostDraft.split("\n").map((line) => line.trim());
  let startIndex = 0;

  while (startIndex < lines.length && !lines[startIndex]) {
    startIndex += 1;
  }

  if (startIndex < lines.length && isSocialStatusLine(lines[startIndex])) {
    startIndex += 1;
  }

  while (startIndex < lines.length && !lines[startIndex]) {
    startIndex += 1;
  }

  if (startIndex < lines.length && isSocialTitleLine(lines[startIndex], title, year)) {
    startIndex += 1;
  }

  while (startIndex < lines.length && !lines[startIndex]) {
    startIndex += 1;
  }

  if (startIndex < lines.length && isSocialScoreLine(lines[startIndex])) {
    startIndex += 1;
  }

  while (startIndex < lines.length && !lines[startIndex]) {
    startIndex += 1;
  }

  if (startIndex < lines.length && isImdbRatingLine(lines[startIndex])) {
    startIndex += 1;
  }

  return lines
    .slice(startIndex)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isSocialStatusLine(line: string): boolean {
  return /^(?:woke\s+warning|warning|safe\s+pick|pass|proceed\s+with\s+caution|caution|failed)\b/i.test(line.trim());
}

function isSocialTitleLine(line: string, title: string, year: string): boolean {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return false;
  }

  if (/^title:\s*/i.test(trimmedLine)) {
    return true;
  }

  if (!title) {
    return false;
  }

  const normalizedLine = normalizeLooseText(trimmedLine);
  const normalizedTitle = normalizeLooseText(title);

  if (normalizedLine === normalizedTitle) {
    return true;
  }

  if (!year) {
    return false;
  }

  return (
    normalizedLine === normalizeLooseText(`${title} (${year})`) || normalizedLine === normalizeLooseText(`${title} ${year}`)
  );
}

function isSocialScoreLine(line: string): boolean {
  return /^(?:⭐\s*)?woke score:\s*\d{1,3}(?:\s*\/\s*100)?\s*⭐?\s*$/i.test(line.trim());
}

function isImdbRatingLine(line: string): boolean {
  return /^IMDb(?:\s+rating)?:\s*(?:\d+(?:\.\d+)?\/10|N\/A)\s*$/i.test(line.trim());
}

function normalizeLooseText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
