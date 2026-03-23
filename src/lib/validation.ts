import { CrewJobType, TitleStatus, TitleType } from "@prisma/client";
import { z } from "zod";
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT, SORT_OPTIONS, TITLE_TYPES } from "@/lib/constants";

const scoreSchema = z.coerce.number().int().min(0).max(100);
const percentageScoreSchema = z.coerce.number().int().min(0).max(100);
const imdbRatingSchema = z.coerce.number().min(0).max(10);
const yearSchema = z.coerce.number().int().min(1888).max(2100);

export const listQuerySchema = z.object({
  type: z.enum(TITLE_TYPES).optional(),
  genre: z.string().min(1).optional(),
  year: yearSchema.optional(),
  year_min: yearSchema.optional(),
  year_max: yearSchema.optional(),
  score_min: scoreSchema.optional(),
  score_max: scoreSchema.optional(),
  imdb_min: imdbRatingSchema.optional(),
  tomatoes_min: percentageScoreSchema.optional(),
  sort: z.enum(SORT_OPTIONS).default("score_asc"),
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  q: z.string().trim().min(1).max(120).optional()
});

const castInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  roleName: z.string().trim().min(1).max(80),
  billingOrder: z.coerce.number().int().min(1).max(20)
});

const crewInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  jobType: z.nativeEnum(CrewJobType)
});

const factorInputSchema = z.object({
  label: z.string().trim().min(2).max(100),
  weight: z.coerce.number().int().min(0).max(100),
  displayOrder: z.coerce.number().int().min(1).max(20),
  notes: z.string().trim().min(2).max(320).optional().nullable()
});

const watchProviderLinkSchema = z.object({
  name: z.string().trim().min(1).max(80),
  url: z.string().url().optional().nullable()
});

export const adminTitlePayloadSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(160),
  type: z.nativeEnum(TitleType),
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  runtimeMinutes: z.coerce.number().int().min(1).max(600).optional().nullable(),
  synopsis: z.string().trim().min(10).max(1200),
  posterUrl: z.string().url().optional().nullable(),
  trailerYoutubeUrl: z.string().url().optional().nullable(),
  imdbUrl: z.string().url().optional().nullable(),
  imdbRating: imdbRatingSchema.optional().nullable(),
  rottenTomatoesUrl: z.string().url().optional().nullable(),
  rottenTomatoesCriticsScore: percentageScoreSchema.optional().nullable(),
  rottenTomatoesAudienceScore: percentageScoreSchema.optional().nullable(),
  amazonUrl: z.string().url().optional().nullable(),
  watchProviders: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  watchProviderLinks: z.array(watchProviderLinkSchema).max(12).default([]),
  wokeScore: scoreSchema,
  wokeSummary: z.string().trim().min(10).max(740),
  status: z.nativeEnum(TitleStatus).default("PUBLISHED"),
  genreSlugs: z.array(z.string().trim().min(1)).min(1).max(5),
  cast: z.array(castInputSchema).min(1).max(8),
  crew: z.array(crewInputSchema).min(1).max(6),
  wokeFactors: z.array(factorInputSchema).min(1).max(8)
});

export const adminImportPayloadSchema = z.object({
  titles: z.array(adminTitlePayloadSchema).min(1).max(200)
});

export const adminMetadataLookupQuerySchema = z.object({
  q: z.string().trim().min(1).max(160),
  year: z
    .string()
    .regex(/^\d{4}$/)
    .transform((value) => Number(value))
    .optional(),
  type: z.nativeEnum(TitleType).optional()
});

export const adminMetadataItemQuerySchema = z.object({
  providerId: z.coerce.number().int().positive(),
  type: z.nativeEnum(TitleType)
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type AdminTitlePayload = z.infer<typeof adminTitlePayloadSchema>;
export type AdminMetadataLookupQuery = z.infer<typeof adminMetadataLookupQuerySchema>;

export function normalizeSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): Record<string, string> {
  const assignIfPresent = (output: Record<string, string>, key: string, value: string) => {
    const normalizedValue = value.trim();
    if (normalizedValue.length === 0) return;
    output[key] = normalizedValue;
  };

  if (searchParams instanceof URLSearchParams) {
    const output: Record<string, string> = {};

    for (const [key, value] of searchParams.entries()) {
      assignIfPresent(output, key, value);
    }

    return output;
  }

  const output: Record<string, string> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      assignIfPresent(output, key, value);
      continue;
    }

    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      assignIfPresent(output, key, value[0]);
    }
  }

  return output;
}

export function parseListQuery(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): ListQuery {
  const normalized = normalizeSearchParams(searchParams);
  const parsed = listQuerySchema.safeParse(normalized);

  if (!parsed.success) {
    return listQuerySchema.parse({});
  }

  const yearMin = parsed.data.year_min ?? parsed.data.year;
  const yearMax = parsed.data.year_max ?? parsed.data.year;
  const [normalizedScoreMin, normalizedScoreMax] = normalizeBounds(parsed.data.score_min, parsed.data.score_max);
  const [normalizedYearMin, normalizedYearMax] = normalizeBounds(yearMin, yearMax);

  return {
    ...parsed.data,
    year: undefined,
    year_min: normalizedYearMin,
    year_max: normalizedYearMax,
    score_min: normalizedScoreMin,
    score_max: normalizedScoreMax
  };
}

function normalizeBounds(min?: number, max?: number): [number | undefined, number | undefined] {
  if (min === undefined || max === undefined || min <= max) {
    return [min, max];
  }

  return [max, min];
}
