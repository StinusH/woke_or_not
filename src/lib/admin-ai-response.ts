import type { AdminTitleDraft } from "@/lib/admin-title-draft";
import { canonicalizeWokeFactors, normalizeWokeFactorLabel } from "@/lib/woke-factors";
import {
  normalizeWatchProviderLinks,
  normalizeWatchProviders,
  type WatchProviderLink
} from "@/lib/watch-providers";
import { calculateWokeScoreFromFactors, isLegacyCanonFactor } from "@/lib/woke-score";

export interface ParsedAiResearchResponse {
  wokeScore: number;
  calculatedWokeScore: number;
  scoreWarning: string | null;
  wokeSummary: string;
  wokeFactors: AdminTitleDraft["wokeFactors"];
  socialPostDraft: string;
  imdbRating: string;
  watchProviders: string[];
  watchProviderLinks: WatchProviderLink[];
}

const SCORE_WARNING_THRESHOLD = 3;
const STRUCTURED_FIELD_NAMES = [
  "Title",
  "Type",
  "Year",
  "Proposed Woke Score",
  "Score Summary",
  "Key Evidence",
  "Public Reaction And Controversy",
  "Creator Context",
  "Score Factors",
  "Notable Context",
  "Watch Availability",
  "Confidence",
  "Social Post Draft",
  "Open Questions For Human Review"
] as const;

export function parseAdminAiResearchResponse(input: string): ParsedAiResearchResponse {
  const proposedWokeScore = parseWokeScore(input);
  const wokeSummary = parseSectionBody(input, "Score Summary");
  const factorLines = parseSectionLines(input, "Score Factors");

  if (!wokeSummary) {
    throw new Error("Could not find a Score Summary section.");
  }

  if (factorLines.length === 0) {
    throw new Error("Could not find any Score Factors.");
  }

  const parsedFactors = factorLines.map((line, index) => parseFactorLine(line, index));
  const wokeFactors = canonicalizeWokeFactors(parsedFactors, { fillMissing: true, rejectUnknown: true }).factors;
  const calculatedWokeScore = calculateWokeScoreFromFactors(wokeFactors);
  const socialPostDraft = normalizeSocialPostDraft(
    extractSocialPostDraft(input, proposedWokeScore),
    proposedWokeScore,
    input
  );
  const imdbRating = extractImdbRatingValue(input) || extractImdbRatingValue(socialPostDraft);
  const watchAvailability = parseWatchAvailability(input);

  if (!socialPostDraft) {
    throw new Error("Could not find a Social Post Draft section.");
  }

  return {
    wokeScore: proposedWokeScore,
    calculatedWokeScore,
    scoreWarning: buildScoreWarning(proposedWokeScore, calculatedWokeScore),
    wokeSummary,
    wokeFactors,
    socialPostDraft,
    imdbRating,
    watchProviders: watchAvailability.watchProviders,
    watchProviderLinks: watchAvailability.watchProviderLinks
  };
}

function buildScoreWarning(proposedWokeScore: number, calculatedWokeScore: number): string | null {
  const difference = Math.abs(proposedWokeScore - calculatedWokeScore);

  if (difference <= SCORE_WARNING_THRESHOLD) {
    return null;
  }

  return `AI Proposed Woke Score is ${proposedWokeScore}, but the factor-derived score is ${calculatedWokeScore} (${difference}-point difference).`;
}

function parseWokeScore(input: string): number {
  const value = Number.parseInt(extractFieldValue(input, "Proposed Woke Score"), 10);

  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Could not find a valid Proposed Woke Score.");
  }

  return value;
}

function parseSectionBody(input: string, heading: string): string {
  const lines = input.split("\n");
  const startIndex = lines.findIndex((line) => matchStructuredFieldLine(line, heading) !== null);

  if (startIndex === -1) {
    return "";
  }

  const bodyLines: string[] = [];
  const inlineValue = matchStructuredFieldLine(lines[startIndex] ?? "", heading);

  if (inlineValue) {
    bodyLines.push(inlineValue);
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (isStructuredHeadingLine(lines[index] ?? "")) {
      break;
    }

    bodyLines.push(lines[index] ?? "");
  }

  return bodyLines.join("\n").trim();
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
  const { label: labelPart, value: restPart } = splitLabeledLine(line);
  const rawLabel = labelPart.trim();
  const label = normalizeWokeFactorLabel(rawLabel);

  if (!rawLabel) {
    throw new Error(`Score factor ${index + 1} is missing a label.`);
  }

  if (!label) {
    throw new Error(`Score factor "${rawLabel}" is not a recognized canonical factor.`);
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

function splitLabeledLine(line: string): { label: string; value: string } {
  const patterns = [
    /^\*\*(.+?):\s*(.*?)\*\*\s*$/u,
    /^\*\*(.+?):\*\*\s*(.*)$/u,
    /^\*\*(.+?)\*\*:\s*(.*)$/u,
    /^(.+?):\s*(.*)$/u
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);

    if (match) {
      return {
        label: match[1]?.trim() ?? "",
        value: match[2]?.trim() ?? ""
      };
    }
  }

  return {
    label: line.trim(),
    value: ""
  };
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

  const status = getSocialStatusLine(wokeScore, socialPostDraft);
  const title = extractTitle(input, socialPostDraft);
  const year = extractYear(input, socialPostDraft);
  const imdbRating = extractImdbRating(socialPostDraft);
  const review = stripSocialPostStructure(socialPostDraft, title, year);
  const titleLine = year ? `${title} (${year})` : title;
  const header = [status, titleLine.trim(), formatSocialPostDraftScoreLine(wokeScore), imdbRating]
    .filter(Boolean)
    .join("\n");

  return review ? `${header}\n\n${review}`.replace(/\n{3,}/g, "\n\n") : header;
}

export function syncSocialPostDraftWokeScore(socialPostDraft: string, wokeScore: number): string {
  if (!socialPostDraft.trim()) {
    return socialPostDraft;
  }

  const lines = socialPostDraft.split("\n");
  const scoreLineIndex = lines.findIndex((line) => isSocialScoreLine(line));

  if (scoreLineIndex === -1) {
    return socialPostDraft;
  }

  lines[scoreLineIndex] = formatSocialPostDraftScoreLine(wokeScore);
  return lines.join("\n");
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

function getSocialStatusLine(wokeScore: number, socialPostDraft = ""): string {
  const extractedStatus = extractExistingSocialStatusLine(socialPostDraft);
  if (extractedStatus) {
    return extractedStatus;
  }

  if (wokeScore <= 35) {
    return "safe pick ✅ - no propaganda spotted";
  }

  if (wokeScore <= 50) {
    return "proceed with caution ⚠️ - woke themes spotted";
  }

  return "WARNING 🚨 - woke themes spotted";
}

function extractExistingSocialStatusLine(socialPostDraft: string): string {
  const firstNonEmptyLine = socialPostDraft
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstNonEmptyLine && isSocialStatusLine(firstNonEmptyLine) && /\bspotted\b/i.test(firstNonEmptyLine) ? firstNonEmptyLine : "";
}

export function formatSocialPostDraftScoreLine(wokeScore: number): string {
  return `woke score: ${wokeScore}/100 ${getWokeScoreEmoji(wokeScore)}`;
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
  const lines = input.split("\n");

  for (const line of lines) {
    const value = matchStructuredFieldLine(line, field);

    if (value !== null) {
      return value;
    }
  }

  return "";
}

function extractTitle(input: string, socialPostDraft: string): string {
  const explicitTitle = extractFieldValue(input, "Title");
  if (explicitTitle) {
    return explicitTitle;
  }

  const inferredTitle = extractLeadingTitleLine(input);
  if (inferredTitle) {
    return inferredTitle;
  }

  return extractTitleFromSocialPostDraft(socialPostDraft);
}

function extractYear(input: string, socialPostDraft: string): string {
  const explicitYear = extractFieldValue(input, "Year");

  if (/^\d{4}$/.test(explicitYear)) {
    return explicitYear;
  }

  const yearMatch = socialPostDraft.match(/\b(?:19|20)\d{2}\b/);
  return yearMatch?.[0]?.trim() ?? "";
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
  const title = extractTitle(input, "");
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

  if (matchStructuredFieldLine(trimmedLine, "Title") !== null) {
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
  return (
    matchStructuredFieldLine(line, "Score Summary") !== null ||
    matchStructuredFieldLine(line, "Key Evidence") !== null ||
    matchStructuredFieldLine(line, "Public Reaction And Controversy") !== null ||
    matchStructuredFieldLine(line, "Creator Context") !== null ||
    matchStructuredFieldLine(line, "Score Factors") !== null ||
    matchStructuredFieldLine(line, "Notable Context") !== null ||
    matchStructuredFieldLine(line, "Watch Availability") !== null ||
    matchStructuredFieldLine(line, "Confidence") !== null
  );
}

function isLikelySocialPostStart(line: string, title: string, year: string): boolean {
  return isSocialStatusLine(line) || isSocialScoreLine(line) || isImdbRatingLine(line) || isSocialTitleLine(line, title, year);
}

function findSocialPostEnd(lines: string[], startIndex: number): number {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (matchStructuredFieldLine(lines[index] ?? "", "Open Questions For Human Review") !== null) {
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

  const expectedStatus = getSocialStatusLine(wokeScore, candidate);
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

function extractLeadingTitleLine(input: string): string {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return "";
  }

  const [firstLine, secondLine] = lines;

  if (!firstLine || !secondLine) {
    return "";
  }

  if (isStructuredHeadingLine(firstLine) || isStructuredHeadingLine(secondLine)) {
    return "";
  }

  if (
    matchStructuredFieldLine(secondLine, "Type") !== null ||
    matchStructuredFieldLine(secondLine, "Proposed Woke Score") !== null
  ) {
    return firstLine;
  }

  return "";
}

function extractTitleFromSocialPostDraft(socialPostDraft: string): string {
  const lines = socialPostDraft
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (isSocialStatusLine(line)) {
      continue;
    }

    if (isSocialScoreLine(line) || isImdbRatingLine(line)) {
      continue;
    }

    return line.replace(/\s+\((?:19|20)\d{2}\)\s*$/u, "").trim();
  }

  return "";
}

function isStructuredHeadingLine(line: string): boolean {
  return STRUCTURED_FIELD_NAMES.some((field) => matchStructuredFieldLine(line, field) !== null);
}

function matchStructuredFieldLine(line: string, field: string): string | null {
  const escapedField = escapeRegex(field);
  const patterns = [
    new RegExp(`^\\s*(?:[-*]\\s*)?\\*\\*${escapedField}:\\s*(.*?)\\*\\*\\s*$`, "i"),
    new RegExp(`^\\s*(?:[-*]\\s*)?\\*\\*${escapedField}:\\*\\*\\s*(.*)$`, "i"),
    new RegExp(`^\\s*(?:[-*]\\s*)?\\*\\*${escapedField}\\*\\*:\\s*(.*)$`, "i"),
    new RegExp(`^\\s*(?:[-*]\\s*)?${escapedField}:\\s*(.*)$`, "i")
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);

    if (match) {
      return match[1]?.trim() ?? "";
    }
  }

  return null;
}
