import { slugify } from "@/lib/slugs";

const OMDB_BASE_URL = "https://www.omdbapi.com/";

export class ExternalScoreProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "not_configured" | "invalid_api_key" | "not_found" | "request_failed"
  ) {
    super(message);
    this.name = "ExternalScoreProviderError";
  }
}

interface OmdbResponse {
  Response: "True" | "False";
  Error?: string;
  imdbRating?: string;
  imdbVotes?: string;
  tomatoMeter?: string;
  tomatoUserMeter?: string;
  tomatoURL?: string;
  Ratings?: Array<{ Source: string; Value: string }>;
}

export interface RefreshedExternalScores {
  imdbRating: number | null;
  imdbVotes: number | null;
  rottenTomatoesCriticsScore: number | null;
  rottenTomatoesAudienceScore: number | null;
  rottenTomatoesUrl: string | null;
}

interface ExternalScoreLookupOptions {
  expectedTitle?: string;
  expectedReleaseDate?: string;
}

export interface RottenTomatoesPageScores {
  criticsScore: number | null;
  audienceScore: number | null;
  canonicalUrl: string | null;
  title: string | null;
  year: number | null;
}

interface RottenTomatoesScorecardEntry {
  score?: string | number | null;
  likedCount?: number | null;
  notLikedCount?: number | null;
  ratingCount?: number | null;
}

interface RottenTomatoesScorecardPayload {
  criticsScore?: RottenTomatoesScorecardEntry | null;
  audienceScore?: RottenTomatoesScorecardEntry | null;
}

export function hasExternalScoreProviderConfig(): boolean {
  return Boolean(process.env.OMDB_API_KEY);
}

export async function fetchExternalScoresFromImdbUrl(
  imdbUrl: string,
  options: ExternalScoreLookupOptions = {}
): Promise<RefreshedExternalScores> {
  const imdbId = extractImdbId(imdbUrl);
  if (!imdbId) {
    throw new Error("IMDb URL does not contain a valid title ID.");
  }

  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    throw new ExternalScoreProviderError("OMDb credentials are not configured.", "not_configured");
  }

  const url = new URL(OMDB_BASE_URL);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("i", imdbId);
  url.searchParams.set("tomatoes", "true");

  const response = await fetch(url, {
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ExternalScoreProviderError("OMDb rejected the configured API key.", "invalid_api_key");
    }

    throw new ExternalScoreProviderError(`OMDb request failed with ${response.status}.`, "request_failed");
  }

  const data = (await response.json()) as OmdbResponse;

  if (data.Response !== "True") {
    const message = data.Error ?? "OMDb could not find this title.";
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("api key")) {
      throw new ExternalScoreProviderError(message, "invalid_api_key");
    }

    if (lowerMessage.includes("not found")) {
      throw new ExternalScoreProviderError(message, "not_found");
    }

    throw new ExternalScoreProviderError(message, "request_failed");
  }

  const criticScoreFromRatings = parsePercentage(
    data.Ratings?.find((entry) => entry.Source === "Rotten Tomatoes")?.Value
  );
  let rottenTomatoesCriticsScore = parsePercentage(data.tomatoMeter) ?? criticScoreFromRatings;
  let rottenTomatoesAudienceScore = parsePercentage(data.tomatoUserMeter);
  let rottenTomatoesUrl = normalizeUrl(data.tomatoURL);

  const shouldValidateRottenTomatoesMatch = Boolean(options.expectedTitle?.trim());

  if (rottenTomatoesUrl && (shouldValidateRottenTomatoesMatch || rottenTomatoesCriticsScore === null || rottenTomatoesAudienceScore === null)) {
    const rottenTomatoesScores = await fetchRottenTomatoesPageScores(rottenTomatoesUrl);
    const rottenTomatoesMatch = shouldValidateRottenTomatoesMatch
      ? matchesExpectedRottenTomatoesPage(
          rottenTomatoesScores,
          options.expectedTitle ?? "",
          options.expectedReleaseDate ?? ""
        )
      : null;

    if (
      rottenTomatoesMatch === false ||
      (rottenTomatoesMatch === null &&
        shouldValidateRottenTomatoesMatch &&
        !isPlausibleRottenTomatoesUrl(rottenTomatoesUrl, options.expectedTitle ?? "", options.expectedReleaseDate ?? ""))
    ) {
      rottenTomatoesUrl = null;
      rottenTomatoesCriticsScore = null;
      rottenTomatoesAudienceScore = null;
    } else {
      rottenTomatoesUrl = rottenTomatoesScores.canonicalUrl ?? rottenTomatoesUrl;
      rottenTomatoesCriticsScore = rottenTomatoesCriticsScore ?? rottenTomatoesScores.criticsScore;
      rottenTomatoesAudienceScore = rottenTomatoesAudienceScore ?? rottenTomatoesScores.audienceScore;
    }
  }

  return {
    imdbRating: parseDecimal(data.imdbRating),
    imdbVotes: parseCount(data.imdbVotes),
    rottenTomatoesCriticsScore,
    rottenTomatoesAudienceScore,
    rottenTomatoesUrl
  };
}

export function extractImdbId(imdbUrl: string): string | null {
  const match = imdbUrl.match(/title\/(tt\d+)/i);
  return match?.[1] ?? null;
}

function parseDecimal(value?: string): number | null {
  if (!value || value === "N/A") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePercentage(value?: string): number | null {
  if (!value || value === "N/A") {
    return null;
  }

  const parsed = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCount(value?: string): number | null {
  if (!value || value === "N/A") {
    return null;
  }

  const parsed = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUrl(value?: string): string | null {
  return value && value !== "N/A" ? value : null;
}

function extractRottenTomatoesSlug(value: string): string | null {
  try {
    const url = new URL(value);
    const match = url.pathname.match(/^\/m\/([^/]+)\/?$/i);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function buildExpectedRottenTomatoesSlugs(expectedTitle: string, expectedReleaseDate: string): string[] {
  const baseSlug = slugify(expectedTitle).replace(/-/g, "_");
  if (!baseSlug) {
    return [];
  }

  const expectedYear = expectedReleaseDate ? Number.parseInt(expectedReleaseDate.slice(0, 4), 10) : null;
  const yearSlug = expectedYear !== null && Number.isFinite(expectedYear) ? `${baseSlug}_${expectedYear}` : null;

  return [baseSlug, yearSlug].filter((value): value is string => Boolean(value));
}

function normalizeRottenTomatoesPageTitle(pageTitle: string): string {
  return pageTitle.replace(/\s*\(\d{4}\)\s*$/, "").trim();
}

function isMatchingRottenTomatoesTitle(
  pageTitle: string | null,
  pageYear: number | null,
  expectedTitle: string,
  expectedReleaseDate: string
): boolean | null {
  if (!pageTitle) {
    return null;
  }

  if (slugify(normalizeRottenTomatoesPageTitle(pageTitle)) !== slugify(expectedTitle)) {
    return false;
  }

  const expectedYear = expectedReleaseDate ? Number.parseInt(expectedReleaseDate.slice(0, 4), 10) : null;
  return expectedYear === null || pageYear === null || Math.abs(expectedYear - pageYear) <= 1;
}

function isPlausibleRottenTomatoesUrl(
  rottenTomatoesUrl: string,
  expectedTitle: string,
  expectedReleaseDate: string
): boolean {
  const slug = extractRottenTomatoesSlug(rottenTomatoesUrl);
  if (!slug) {
    return false;
  }

  return buildExpectedRottenTomatoesSlugs(expectedTitle, expectedReleaseDate).includes(slug);
}

function matchesExpectedRottenTomatoesPage(
  pageScores: RottenTomatoesPageScores,
  expectedTitle: string,
  expectedReleaseDate: string
): boolean | null {
  return isMatchingRottenTomatoesTitle(pageScores.title, pageScores.year, expectedTitle, expectedReleaseDate);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function parseScorecardJson(compactHtml: string): RottenTomatoesScorecardPayload | null {
  const scriptContent = compactHtml.match(/<script id="media-scorecard-json"[^>]*>(.*?)<\/script>/i)?.[1];

  if (!scriptContent) {
    return null;
  }

  try {
    return JSON.parse(decodeHtmlEntities(scriptContent)) as RottenTomatoesScorecardPayload;
  } catch {
    return null;
  }
}

function deriveScoreFromScorecardEntry(entry?: RottenTomatoesScorecardEntry | null): number | null {
  if (!entry) {
    return null;
  }

  const directScore = parsePercentage(String(entry.score ?? ""));
  if (directScore !== null) {
    return directScore;
  }

  const likedCount = Number.isFinite(entry.likedCount) ? Number(entry.likedCount) : null;
  const notLikedCount = Number.isFinite(entry.notLikedCount) ? Number(entry.notLikedCount) : null;
  const ratingCount = Number.isFinite(entry.ratingCount) ? Number(entry.ratingCount) : null;

  if (likedCount === null || notLikedCount === null || ratingCount === null || ratingCount <= 0) {
    return null;
  }

  return Math.round((likedCount / ratingCount) * 100);
}

export async function fetchRottenTomatoesPageScores(
  rottenTomatoesUrl: string
): Promise<RottenTomatoesPageScores> {
  try {
    const response = await fetch(rottenTomatoesUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml"
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return { criticsScore: null, audienceScore: null, canonicalUrl: null, title: null, year: null };
    }

    const html = await response.text();
    const compact = html.replace(/\s+/g, " ");
    const pairedScoreMatch = compact.match(/(\d{1,3})%\s+Tomatometer.*?(\d{1,3})%\s+Popcornmeter/i);
    const canonicalUrl = compact.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? null;
    const rawTitle = compact.match(/<title>(.*?)\s*\|\s*Rotten Tomatoes<\/title>/i)?.[1]?.trim() ?? null;
    const title = rawTitle ? decodeHtmlEntities(rawTitle) : null;
    const dateCreated = compact.match(/"dateCreated":"(\d{4})-\d{2}-\d{2}"/i)?.[1] ?? null;
    const year = dateCreated ? Number.parseInt(dateCreated, 10) : null;
    const scorecardJson = parseScorecardJson(compact);
    const criticsScoreFromJson = scorecardJson
      ? deriveScoreFromScorecardEntry(scorecardJson.criticsScore)
      : parsePercentage(compact.match(/"criticsScore":\{.*?"score":"(\d{1,3})"/i)?.[1]);
    const audienceScoreFromJson = scorecardJson
      ? deriveScoreFromScorecardEntry(scorecardJson.audienceScore)
      : parsePercentage(compact.match(/"audienceScore":\{.*?"score":"(\d{1,3})"/i)?.[1]);

    if (criticsScoreFromJson !== null || audienceScoreFromJson !== null) {
      return {
        criticsScore: criticsScoreFromJson,
        audienceScore: audienceScoreFromJson,
        canonicalUrl,
        title,
        year
      };
    }

    if (pairedScoreMatch) {
      return {
        criticsScore: parsePercentage(pairedScoreMatch[1]),
        audienceScore: parsePercentage(pairedScoreMatch[2]),
        canonicalUrl,
        title,
        year
      };
    }

    return {
      criticsScore: parsePercentage(compact.match(/(\d{1,3})%\s+Tomatometer/i)?.[1]),
      audienceScore: parsePercentage(compact.match(/(\d{1,3})%\s+Popcornmeter/i)?.[1]),
      canonicalUrl,
      title,
      year
    };
  } catch {
    return { criticsScore: null, audienceScore: null, canonicalUrl: null, title: null, year: null };
  }
}
