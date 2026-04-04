const RECOMMENDED_SCORE_WEIGHTS = {
  wokeSafety: 0.6,
  imdb: 0.3,
  audience: 0.1
} as const;

const RECOMMENDED_MISSING_SCORE_FALLBACK = 50;

interface RecommendedScoreInput {
  wokeScore: number;
  imdbRating: number | null;
  rottenTomatoesAudienceScore: number | null;
}

export function calculateRecommendedScore(input: RecommendedScoreInput): number {
  const wokeSafetyScore = 100 - input.wokeScore;
  const imdbScore = input.imdbRating === null ? RECOMMENDED_MISSING_SCORE_FALLBACK : input.imdbRating * 10;
  const audienceScore = input.rottenTomatoesAudienceScore ?? RECOMMENDED_MISSING_SCORE_FALLBACK;

  return (
    wokeSafetyScore * RECOMMENDED_SCORE_WEIGHTS.wokeSafety +
    imdbScore * RECOMMENDED_SCORE_WEIGHTS.imdb +
    audienceScore * RECOMMENDED_SCORE_WEIGHTS.audience
  );
}
