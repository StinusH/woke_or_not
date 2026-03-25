import type { TitleCard, TitleDetail } from "@/lib/types";

type TitleSeoSource = Pick<
  TitleDetail,
  "slug" | "name" | "type" | "releaseDate" | "posterUrl" | "wokeScore" | "wokeSummary" | "synopsis" | "genres" | "wokeFactors"
>;

type TitlePosterSource = Pick<TitleCard, "name" | "type" | "releaseDate">;

interface TitleFaqEntry {
  question: string;
  answer: string;
}

interface TitleSeoMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalPath: string;
}

function getTitleKind(type: TitlePosterSource["type"]) {
  return type === "MOVIE" ? "movie" : "TV show";
}

function getSchemaType(type: TitlePosterSource["type"]) {
  return type === "MOVIE" ? "Movie" : "TVSeries";
}

export function getTitleWokeVerdict(score: number) {
  if (score >= 70) {
    return "heavily driven by woke themes";
  }

  if (score >= 40) {
    return "mixed, with noticeable woke elements";
  }

  return "not especially woke compared with higher-scoring titles";
}

function normalizeText(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function trimDescription(value: string, maxLength = 160) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");

  return `${(lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

export function getTitleReleaseYear(releaseDate: string) {
  return new Date(releaseDate).getUTCFullYear();
}

export function getTitlePosterAltText(title: TitlePosterSource) {
  const year = getTitleReleaseYear(title.releaseDate);
  return `${title.name} ${getTitleKind(title.type).toLowerCase()} poster (${year})`;
}

export function buildTitleSeoMetadata(title: TitleSeoSource): TitleSeoMetadata {
  const year = getTitleReleaseYear(title.releaseDate);
  const titleKind = getTitleKind(title.type);
  const description = trimDescription(
    `Is ${title.name} woke? See the ${title.wokeScore}/100 woke score, DEI themes, score breakdown, cast, reviews, and streaming info for the ${year} ${titleKind.toLowerCase()}.`
  );

  return {
    title: `Is ${title.name} Woke? ${title.wokeScore}/100 Score & DEI Breakdown`,
    description,
    keywords: [
      title.name,
      `${title.name} woke`,
      `is ${title.name} woke`,
      `${title.name} woke score`,
      `${title.name} woke or not`,
      `dei in ${title.name}`,
      `${title.name} dei`,
      `${title.name} propaganda`,
      `${title.name} parents guide`,
      `${year} ${title.name} ${titleKind.toLowerCase()}`
    ],
    canonicalPath: `/title/${title.slug}`
  };
}

export function buildTitleFaqEntries(title: TitleSeoSource): TitleFaqEntry[] {
  const strongestFactors = title.wokeFactors
    .filter((factor) => factor.weight > 0)
    .sort((left, right) => right.weight - left.weight || left.displayOrder - right.displayOrder)
    .slice(0, 3)
    .map((factor) => factor.label);

  const factorSummary = strongestFactors.length > 0
    ? `The biggest factors in our score are ${strongestFactors.join(", ")}.`
    : "The current page does not have a detailed factor breakout yet.";

  const summary = normalizeText(
    title.wokeSummary,
    `${title.name} is ${getTitleWokeVerdict(title.wokeScore)} on our scale.`
  );
  const synopsis = normalizeText(title.synopsis, `See the page for the latest editorial summary on ${title.name}.`);

  return [
    {
      question: `Is ${title.name} woke?`,
      answer: `${title.name} has a woke score of ${title.wokeScore}/100, which means it is ${getTitleWokeVerdict(title.wokeScore)}. ${summary}`
    },
    {
      question: `Is there DEI in ${title.name}?`,
      answer: `${factorSummary} ${synopsis}`
    }
  ];
}

export function buildTitleStructuredData(title: TitleSeoSource) {
  const metadata = buildTitleSeoMetadata(title);
  const faqEntries = buildTitleFaqEntries(title);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const canonicalUrl = siteUrl ? `${siteUrl}${metadata.canonicalPath}` : undefined;
  const breadcrumbParentPath = title.type === "MOVIE" ? "/movies" : "/tv-shows";
  const breadcrumbParentName = title.type === "MOVIE" ? "Movies" : "TV Shows";

  const titleEntity = {
    "@type": getSchemaType(title.type),
    name: title.name,
    description: metadata.description,
    datePublished: title.releaseDate,
    image: title.posterUrl ?? undefined,
    genre: title.genres.map((genre) => genre.name),
    url: canonicalUrl
  };

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl ? `${siteUrl}/` : undefined
        },
        {
          "@type": "ListItem",
          position: 2,
          name: breadcrumbParentName,
          item: siteUrl ? `${siteUrl}${breadcrumbParentPath}` : undefined
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title.name,
          item: canonicalUrl
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Review",
      name: `Is ${title.name} woke?`,
      reviewBody: faqEntries[0].answer,
      reviewRating: {
        "@type": "Rating",
        ratingValue: title.wokeScore,
        bestRating: 100,
        worstRating: 0
      },
      author: {
        "@type": "Organization",
        name: "Woke or Not"
      },
      itemReviewed: titleEntity,
      url: canonicalUrl
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntries.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: entry.answer
        }
      }))
    }
  ];
}
