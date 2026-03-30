export const REPRESENTATION_FACTOR_LABEL = "Representation / casting choices";
export const POLITICAL_DIALOGUE_FACTOR_LABEL = "Political / ideological dialogue";
export const IDENTITY_THEMES_FACTOR_LABEL = "Identity-driven story themes";
export const INSTITUTIONAL_CRITIQUE_FACTOR_LABEL = "Institutional / cultural critique";
export const LEGACY_CANON_FACTOR_LABEL = "Legacy character or canon changes";
export const PUBLIC_CONTROVERSY_FACTOR_LABEL = "Public controversy / woke complaints";
export const CREATOR_TRACK_RECORD_FACTOR_LABEL = "Creator track record context";

export const CANONICAL_WOKE_FACTOR_LABELS = [
  REPRESENTATION_FACTOR_LABEL,
  POLITICAL_DIALOGUE_FACTOR_LABEL,
  IDENTITY_THEMES_FACTOR_LABEL,
  INSTITUTIONAL_CRITIQUE_FACTOR_LABEL,
  LEGACY_CANON_FACTOR_LABEL,
  PUBLIC_CONTROVERSY_FACTOR_LABEL,
  CREATOR_TRACK_RECORD_FACTOR_LABEL
] as const;

export type CanonicalWokeFactorLabel = (typeof CANONICAL_WOKE_FACTOR_LABELS)[number];
export type WokeFactorBucket = "core" | "context";

export interface WokeFactorLike {
  label: string;
  weight: number;
  displayOrder?: number;
  notes?: string | null;
}

export interface CanonicalWokeFactorLike {
  label: CanonicalWokeFactorLabel;
  weight: number;
  displayOrder: number;
  notes: string;
}

const factorMetadata: ReadonlyArray<{ label: CanonicalWokeFactorLabel; bucket: WokeFactorBucket; displayOrder: number }> = [
  { label: REPRESENTATION_FACTOR_LABEL, bucket: "core", displayOrder: 1 },
  { label: POLITICAL_DIALOGUE_FACTOR_LABEL, bucket: "core", displayOrder: 2 },
  { label: IDENTITY_THEMES_FACTOR_LABEL, bucket: "core", displayOrder: 3 },
  { label: INSTITUTIONAL_CRITIQUE_FACTOR_LABEL, bucket: "core", displayOrder: 4 },
  { label: LEGACY_CANON_FACTOR_LABEL, bucket: "context", displayOrder: 5 },
  { label: PUBLIC_CONTROVERSY_FACTOR_LABEL, bucket: "context", displayOrder: 6 },
  { label: CREATOR_TRACK_RECORD_FACTOR_LABEL, bucket: "context", displayOrder: 7 }
] as const;

const aliasEntries: ReadonlyArray<readonly [string, CanonicalWokeFactorLabel]> = [
  [REPRESENTATION_FACTOR_LABEL, REPRESENTATION_FACTOR_LABEL],
  ["Representation breadth", REPRESENTATION_FACTOR_LABEL],
  [POLITICAL_DIALOGUE_FACTOR_LABEL, POLITICAL_DIALOGUE_FACTOR_LABEL],
  ["Political dialogue density", POLITICAL_DIALOGUE_FACTOR_LABEL],
  [IDENTITY_THEMES_FACTOR_LABEL, IDENTITY_THEMES_FACTOR_LABEL],
  ["Identity-driven storyline weight", IDENTITY_THEMES_FACTOR_LABEL],
  ["Social justice thematic focus", IDENTITY_THEMES_FACTOR_LABEL],
  [INSTITUTIONAL_CRITIQUE_FACTOR_LABEL, INSTITUTIONAL_CRITIQUE_FACTOR_LABEL],
  ["Institutional critique intensity", INSTITUTIONAL_CRITIQUE_FACTOR_LABEL],
  ["Traditional values challenge level", INSTITUTIONAL_CRITIQUE_FACTOR_LABEL],
  [LEGACY_CANON_FACTOR_LABEL, LEGACY_CANON_FACTOR_LABEL],
  [PUBLIC_CONTROVERSY_FACTOR_LABEL, PUBLIC_CONTROVERSY_FACTOR_LABEL],
  [CREATOR_TRACK_RECORD_FACTOR_LABEL, CREATOR_TRACK_RECORD_FACTOR_LABEL]
];

const factorMetadataByLabel = new Map(factorMetadata.map((entry) => [entry.label, entry]));
const factorAliasMap = new Map(aliasEntries.map(([alias, label]) => [normalizeLabelKey(alias), label]));

export function getDefaultWokeFactors(): CanonicalWokeFactorLike[] {
  return factorMetadata.map((entry) => ({
    label: entry.label,
    weight: 0,
    displayOrder: entry.displayOrder,
    notes: ""
  }));
}

export function getCoreFactorLabels(): CanonicalWokeFactorLabel[] {
  return factorMetadata.filter((entry) => entry.bucket === "core").map((entry) => entry.label);
}

export function getContextFactorLabels(): CanonicalWokeFactorLabel[] {
  return factorMetadata.filter((entry) => entry.bucket === "context").map((entry) => entry.label);
}

export function getWokeFactorBucket(label: string): WokeFactorBucket | null {
  const normalized = normalizeWokeFactorLabel(label);
  if (!normalized) {
    return null;
  }

  return factorMetadataByLabel.get(normalized)?.bucket ?? null;
}

export function getCanonicalDisplayOrder(label: CanonicalWokeFactorLabel): number {
  return factorMetadataByLabel.get(label)?.displayOrder ?? factorMetadata.length;
}

export function normalizeWokeFactorLabel(label: string): CanonicalWokeFactorLabel | null {
  return factorAliasMap.get(normalizeLabelKey(label)) ?? null;
}

export function isLegacyCanonFactor(label: string): boolean {
  return normalizeWokeFactorLabel(label) === LEGACY_CANON_FACTOR_LABEL;
}

export function normalizeWokeFactorsForDisplay<T extends WokeFactorLike>(factors: ReadonlyArray<T>): T[] {
  return factors.map((factor) => {
    const normalizedLabel = normalizeWokeFactorLabel(factor.label);
    return normalizedLabel ? { ...factor, label: normalizedLabel } : factor;
  });
}

export function canonicalizeWokeFactors(
  factors: ReadonlyArray<WokeFactorLike>,
  options: {
    fillMissing?: boolean;
    rejectUnknown?: boolean;
  } = {}
): {
  factors: CanonicalWokeFactorLike[];
  unknownLabels: string[];
} {
  const { fillMissing = true, rejectUnknown = false } = options;
  const canonicalFactors = new Map<CanonicalWokeFactorLabel, CanonicalWokeFactorLike>();
  const unknownLabels: string[] = [];

  for (const factor of factors) {
    const normalizedLabel = normalizeWokeFactorLabel(factor.label);

    if (!normalizedLabel) {
      const trimmedLabel = factor.label.trim();
      if (trimmedLabel && !unknownLabels.includes(trimmedLabel)) {
        unknownLabels.push(trimmedLabel);
      }
      continue;
    }

    const metadata = factorMetadataByLabel.get(normalizedLabel);
    if (!metadata) {
      continue;
    }

    const normalizedFactor: CanonicalWokeFactorLike = {
      label: normalizedLabel,
      weight: factor.weight,
      displayOrder: metadata.displayOrder,
      notes: factor.notes?.trim() ?? ""
    };

    const existing = canonicalFactors.get(normalizedLabel);
    if (!existing) {
      canonicalFactors.set(normalizedLabel, normalizedFactor);
      continue;
    }

    canonicalFactors.set(normalizedLabel, {
      ...existing,
      weight: Math.max(existing.weight, normalizedFactor.weight),
      notes: mergeNotes(existing.notes, normalizedFactor.notes)
    });
  }

  if (rejectUnknown && unknownLabels.length > 0) {
    throw new Error(`Unknown woke factor label(s): ${unknownLabels.join(", ")}.`);
  }

  const orderedFactors = factorMetadata.flatMap((entry) => {
    const existing = canonicalFactors.get(entry.label);
    if (existing) {
      return [existing];
    }

    if (!fillMissing) {
      return [];
    }

    return [
      {
        label: entry.label,
        weight: 0,
        displayOrder: entry.displayOrder,
        notes: ""
      }
    ];
  });

  return {
    factors: orderedFactors,
    unknownLabels
  };
}

function normalizeLabelKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function mergeNotes(existing: string, incoming: string): string {
  if (!existing) {
    return incoming;
  }

  if (!incoming || incoming === existing) {
    return existing;
  }

  return `${existing} ${incoming}`.trim();
}
