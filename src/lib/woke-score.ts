import {
  canonicalizeWokeFactors,
  CREATOR_TRACK_RECORD_FACTOR_LABEL,
  getWokeFactorBucket,
  isLegacyCanonFactor,
  LEGACY_CANON_FACTOR_LABEL,
  PUBLIC_CONTROVERSY_FACTOR_LABEL,
  type WokeFactorLike
} from "@/lib/woke-factors";

const MAX_WOKE_SCORE = 100;
const MAX_CONTEXT_BONUS = 35;
const CORE_FACTOR_WEIGHTS = [0.7, 0.2, 0.07, 0.03] as const;

export { isLegacyCanonFactor };

export function calculateContextBonus(factors: ReadonlyArray<WokeFactorLike>): number {
  const { factors: canonicalFactors } = canonicalizeWokeFactors(factors, { fillMissing: true });
  const factorByLabel = new Map(canonicalFactors.map((factor) => [factor.label, clampScore(factor.weight)]));
  const rawBonus =
    (factorByLabel.get(PUBLIC_CONTROVERSY_FACTOR_LABEL) ?? 0) +
    (factorByLabel.get(LEGACY_CANON_FACTOR_LABEL) ?? 0) +
    (factorByLabel.get(CREATOR_TRACK_RECORD_FACTOR_LABEL) ?? 0);

  return Math.min(MAX_CONTEXT_BONUS, Math.round(rawBonus / 5));
}

export function calculateWokeScoreFromFactors(factors: ReadonlyArray<WokeFactorLike>): number {
  if (factors.length === 0) {
    return 0;
  }

  const { factors: canonicalFactors } = canonicalizeWokeFactors(factors, { fillMissing: true });
  const coreWeights = canonicalFactors
    .filter((factor) => getWokeFactorBucket(factor.label) === "core")
    .map((factor) => clampScore(factor.weight))
    .sort((left, right) => right - left);
  const coreScore = CORE_FACTOR_WEIGHTS.reduce((sum, weight, index) => sum + (coreWeights[index] ?? 0) * weight, 0);
  const contextBonus = calculateContextBonus(canonicalFactors);

  return clampScore(Math.round(coreScore + contextBonus));
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(MAX_WOKE_SCORE, value));
}
