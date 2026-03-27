import type { AdminTitleDraft } from "@/lib/admin-title-draft";
import {
  normalizeWatchProviderLinks,
  normalizeWatchProviders,
  type WatchProviderLink
} from "@/lib/watch-providers";

export interface ParsedAiResearchResponse {
  wokeScore: number;
  wokeSummary: string;
  wokeFactors: AdminTitleDraft["wokeFactors"];
  socialPostDraft: string;
  imdbRating: string;
  watchProviders: string[];
  watchProviderLinks: WatchProviderLink[];
}

export function parseAdminAiResearchResponse(input: string): ParsedAiResearchResponse {
  const wokeScore = parseWokeScore(input);
  const wokeSummary = parseSectionBody(input, "Score Summary");
  const factorLines = parseSectionLines(input, "Score Factors");
  const socialPostDraft = normalizeSocialPostDraft(extractSocialPostDraft(input, wokeScore), wokeScore, input);
  const imdbRating = extractImdbRatingValue(input) || extractImdbRatingValue(socialPostDraft);
  const watchAvailability = parseWatchAvailability(input);

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
    socialPostDraft,
    imdbRating,
    watchProviders: watchAvailability.watchProviders,
    watchProviderLinks: watchAvailability.watchProviderLinks
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
  const weight = impactMatch
    ? Number.parseInt(impactMatch[1], 10)
    : isLegacyCanonFactor(label) && isExplicitlyNotRelevant(restPart)
      ? 0
      : Number.NaN;

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

function isLegacyCanonFactor(label: string): boolean {
  return /^legacy character or canon changes$/i.test(label.trim());
}

function isExplicitlyNotRelevant(value: string): boolean {
  return /\b(?:not relevant|n\/a|not applicable)\b/i.test(value);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSocialPostDraft(input: string, wokeScore: number): string {
  const sectionBody = parseSectionBody(input, "Social Post Draft");
  if (sectionBody) {
    return sectionBody;
  }

  return extractUnlabeledSocialPostDraft(input, wokeScore);
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
  const header = [status, titleLine.trim(), `woke score: ${wokeScore}/100 ${getWokeScoreEmoji(wokeScore)}`, imdbRating]
    .filter(Boolean)
    .join("\n");

  return review ? `${header}\n\n${review}`.replace(/\n{3,}/g, "\n\n") : header;
}

function parseWatchAvailability(input: string): {
  watchProviders: string[];
  watchProviderLinks: WatchProviderLink[];
} {
  const lines = parseSectionLines(input, "Watch Availability");

  if (lines.length === 0) {
    return {
      watchProviders: [],
      watchProviderLinks: []
    };
  }

  const watchProviderLinks = normalizeWatchProviderLinks(lines.flatMap((line) => parseWatchAvailabilityLine(line)));
  const watchProviders = normalizeWatchProviders(
    lines.flatMap((line) => {
      const provider = extractWatchProviderName(line);
      return provider ? [provider] : [];
    })
  );

  return {
    watchProviders,
    watchProviderLinks
  };
}

function parseWatchAvailabilityLine(line: string): WatchProviderLink[] {
  const providerName = extractWatchProviderName(line);

  if (!providerName) {
    return [];
  }

  return [
    {
      name: providerName,
      url: extractWatchProviderUrl(line)
    }
  ];
}

function extractWatchProviderName(line: string): string {
  const normalizedLine = line.trim();

  if (!normalizedLine || /^(?:no\b|none\b|n\/a\b|unknown\b)/i.test(normalizedLine)) {
    return "";
  }

  const markdownMatch = normalizedLine.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/i);
  if (markdownMatch) {
    return markdownMatch[1].trim();
  }

  const urlMatch = normalizedLine.match(/https?:\/\/\S+/i);
  if (urlMatch) {
    return normalizedLine
      .slice(0, urlMatch.index ?? 0)
      .replace(/\s*(?:\||-|–|—|:)\s*$/u, "")
      .trim();
  }

  const [namePart = ""] = normalizedLine.split(/\s+\|\s+/, 1);
  return namePart.trim();
}

function extractWatchProviderUrl(line: string): string | null {
  const normalizedLine = line.trim();

  if (!normalizedLine) {
    return null;
  }

  const markdownMatch = normalizedLine.match(/^\[[^\]]+\]\((https?:\/\/[^\s)]+)\)$/i);
  if (markdownMatch) {
    return markdownMatch[1].trim();
  }

  const urlMatch = normalizedLine.match(/https?:\/\/\S+/i);
  if (!urlMatch) {
    return null;
  }

  const url = urlMatch[0].replace(/[),.;]+$/u, "").trim();
  return /^https?:\/\//i.test(url) ? url : null;
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

function getWokeScoreEmoji(wokeScore: number): string {
  if (wokeScore <= 15) {
    return "🤩";
  }

  if (wokeScore <= 30) {
    return "😀";
  }

  if (wokeScore <= 40) {
    return "🤔";
  }

  if (wokeScore <= 60) {
    return "🤢";
  }

  if (wokeScore <= 80) {
    return "🤮";
  }

  return "🤡";
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

  const ratingValue = ratingMatch[2].trim().replace(/\s*⭐\s*$/u, "");

  if (!/^\d+(?:\.\d+)?\/10$/i.test(ratingValue)) {
    return `IMDb rating: ${ratingValue}`;
  }

  return `IMDb rating: ${ratingValue} ⭐`;
}

function extractImdbRatingValue(value: string): string {
  const ratingMatch = value.match(/^(?:[-*]\s*)?(?:\*\*)?IMDb(?:\s+rating)?(?:\*\*)?:\s*(\d+(?:\.\d+)?)\s*\/\s*10(?:\s*⭐)?\s*$/im);
  return ratingMatch?.[1]?.trim() ?? "";
}

function extractUnlabeledSocialPostDraft(input: string, wokeScore: number): string {
  const title = extractFieldValue(input, "Title");
  const year = extractYear(input, "");
  const lines = input.split("\n");
  const searchStartIndex = findPostSectionSearchStart(lines);

  for (let index = searchStartIndex; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";
    if (!line || !isLikelySocialPostStart(line, title, year)) {
      continue;
    }

    const candidate = lines
      .slice(index, findSocialPostEnd(lines, index))
      .join("\n")
      .trim();

    if (looksLikeSocialPostDraft(candidate, title, year, wokeScore)) {
      return candidate;
    }
  }

  return "";
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
  return /^(?:\p{Extended_Pictographic}\s*)?woke score:\s*\d{1,3}(?:\s*\/\s*100)?(?:\s+\p{Extended_Pictographic})?\s*$/iu.test(
    line.trim()
  );
}

function isImdbRatingLine(line: string): boolean {
  return /^IMDb(?:\s+rating)?:\s*(?:\d+(?:\.\d+)?\/10(?:\s*⭐)?|N\/A)\s*$/iu.test(line.trim());
}

function findPostSectionSearchStart(lines: string[]): number {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (isPreSocialSectionHeading(lines[index])) {
      return index + 1;
    }
  }

  return 0;
}

function isPreSocialSectionHeading(line: string): boolean {
  return /^(?:Score Summary|Key Evidence|Public Reaction And Controversy|Creator Context|Score Factors|Notable Context|Watch Availability|Confidence):\s*$/i.test(
    line.trim()
  );
}

function isLikelySocialPostStart(line: string, title: string, year: string): boolean {
  return isSocialStatusLine(line) || isSocialScoreLine(line) || isImdbRatingLine(line) || isSocialTitleLine(line, title, year);
}

function findSocialPostEnd(lines: string[], startIndex: number): number {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^(?:Open Questions For Human Review):\s*$/i.test(lines[index]?.trim() ?? "")) {
      return index;
    }
  }

  return lines.length;
}

function looksLikeSocialPostDraft(candidate: string, title: string, year: string, wokeScore: number): boolean {
  const nonEmptyLines = candidate
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (nonEmptyLines.length === 0) {
    return false;
  }

  const matchingSignals = nonEmptyLines.reduce((count, line) => {
    if (isSocialStatusLine(line) || isSocialScoreLine(line) || isImdbRatingLine(line) || isSocialTitleLine(line, title, year)) {
      return count + 1;
    }

    return count;
  }, 0);

  const expectedStatus = getSocialStatusLine(wokeScore);
  const hasExpectedStatus = nonEmptyLines.some((line) => normalizeLooseText(line) === normalizeLooseText(expectedStatus));
  const hasTitleSignal = nonEmptyLines.some((line) => isSocialTitleLine(line, title, year));
  const hasBodyCopy = stripSocialPostStructure(candidate, title, year).length > 0;

  if (matchingSignals >= 2 && hasBodyCopy) {
    return true;
  }

  return hasExpectedStatus && hasTitleSignal && hasBodyCopy;
}

function normalizeLooseText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
