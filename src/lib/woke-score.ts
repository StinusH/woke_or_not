interface WokeFactorLike {
  label: string;
  weight: number;
}

const LEGACY_CANON_FACTOR_LABEL = /^legacy character or canon changes$/i;
const MAX_WOKE_SCORE = 100;
const MAX_LEGACY_CANON_BONUS = 10;

export function isLegacyCanonFactor(label: string): boolean {
  return LEGACY_CANON_FACTOR_LABEL.test(label.trim());
}

export function calculateLegacyCanonBonus(weight: number): number {
  const normalizedWeight = clampScore(weight);
  return Math.min(MAX_LEGACY_CANON_BONUS, Math.round(normalizedWeight / 5));
}

export function calculateWokeScoreFromFactors(factors: ReadonlyArray<WokeFactorLike>): number {
  if (factors.length === 0) {
    return 0;
  }

  const nonLegacyFactors = factors.filter((factor) => !isLegacyCanonFactor(factor.label));
  const legacyCanonFactor = factors.find((factor) => isLegacyCanonFactor(factor.label));
  const baseScore =
    nonLegacyFactors.length > 0
      ? nonLegacyFactors.reduce((sum, factor) => sum + clampScore(factor.weight), 0) / nonLegacyFactors.length
      : 0;
  const legacyBonus = legacyCanonFactor ? calculateLegacyCanonBonus(legacyCanonFactor.weight) : 0;

  return clampScore(Math.round(baseScore + legacyBonus));
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(MAX_WOKE_SCORE, value));
}
