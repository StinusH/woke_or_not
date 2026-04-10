export const TITLE_CONTENT_TAGS = ["RAINBOW", "CROSS", "HAMMER_SIGIL"] as const;

export type TitleContentTag = (typeof TITLE_CONTENT_TAGS)[number];

export interface TitleTagDefinition {
  id: TitleContentTag;
  name: string;
  shortName: string;
  tooltip: string;
  displayOrder: number;
}

export interface ContentTagTextInput {
  wokeSummary?: string | null;
  socialPostDraft?: string | null;
  wokeFactors?: Array<{ notes?: string | null }>;
}

export const TITLE_TAG_DEFINITIONS: TitleTagDefinition[] = [
  {
    id: "RAINBOW",
    name: "Rainbow",
    shortName: "LGBT",
    tooltip: "Contains LGBT or queer elements.",
    displayOrder: 1
  },
  {
    id: "CROSS",
    name: "Cross",
    shortName: "Christian",
    tooltip: "Focused on Christian or faith-based themes.",
    displayOrder: 2
  },
  {
    id: "HAMMER_SIGIL",
    name: "Hammer and sigil",
    shortName: "Socialist",
    tooltip: "Contains anti-capitalist, socialist, or communist themes.",
    displayOrder: 3
  }
] as const;

type TagRule = {
  id: TitleContentTag;
  positivePatterns: RegExp[];
  negativePatterns: RegExp[];
};

const TAG_RULES: TagRule[] = [
  {
    id: "RAINBOW",
    positivePatterns: [
      /\b(?:lgbt|lgbtq|lgbtq\+|queer|gay|lesbian|bisexual|trans|transgender|non-binary|nonbinary|sapphic|same-sex|closeted)\b[^.!?\n]{0,35}\b(?:romance|relationship|story|storyline|themes?|subtext|character|characters|couple|couples|family|identity|community|elements?|arcs?)\b/i,
      /\b(?:romance|relationship|story|storyline|themes?|subtext|character|characters|couple|couples|family|identity|community|elements?|arcs?)\b[^.!?\n]{0,35}\b(?:lgbt|lgbtq|lgbtq\+|queer|gay|lesbian|bisexual|trans|transgender|non-binary|nonbinary|sapphic|same-sex|closeted)\b/i,
      /\b(?:pronoun|pronouns)\b[^.!?\n]{0,20}\b(?:talk|discussion|dialogue|identity|themes?)\b/i
    ],
    negativePatterns: [
      /\b(?:no|not|zero|without|lacks?|lacking|absence of)\b[^.!?\n]{0,80}\b(?:lgbt|lgbtq|queer|gay|lesbian|bisexual|trans|transgender|non-binary|nonbinary|sapphic|same-sex|closeted|pronoun|pronouns)\b/i,
      /\b(?:nothing|none)\b[^.!?\n]{0,40}\b(?:identity-focused|identity focused|queer|gay|lesbian|trans|non-binary|nonbinary)\b/i
    ]
  },
  {
    id: "CROSS",
    positivePatterns: [
      /\b(?:christian movie|christian film|christian drama|christian story|faith-based|faith based|christ-centered|christ centered|jesus-centered|jesus centered|gospel-centered|gospel centered|biblical retelling|bible story)\b/i,
      /\b(?:nativity|biblical tale|biblical story)\b/i,
      /\b(?:story|film|movie|drama|retelling|plot)\b[^.!?\n]{0,30}\b(?:jesus christ|jesus|christian faith|christianity|the gospel|the bible|biblical)\b/i,
      /\b(?:jesus christ|jesus)\b[^.!?\n]{0,30}\b(?:story|retelling|movie|film|drama)\b/i,
      /\b(?:nativity|biblical|scripture|scriptural)\b[^.!?\n]{0,30}\b(?:story|retelling|tale|musical|drama|movie|film)\b/i,
      /\b(?:story|retelling|tale|musical|drama|movie|film)\b[^.!?\n]{0,30}\b(?:nativity|biblical|scripture|scriptural)\b/i
    ],
    negativePatterns: [
      /\b(?:no|not|zero|without|lacks?|lacking|absence of)\b[^.!?\n]{0,40}\b(?:christian|faith-based|faith based|christ-centered|christ centered|jesus|gospel|bible|biblical)\b/i,
      /\b(?:not|isn't|is not)\b[^.!?\n]{0,20}\b(?:a )?(?:christian movie|christian film|faith-based film|faith-based movie|biblical retelling)\b/i
    ]
  },
  {
    id: "HAMMER_SIGIL",
    positivePatterns: [
      /\b(?:anti-capitalist|anticapitalist|anti capitalist|anti-corporate|anti corporate|pro communist|pro-communist|pro socialist|pro-socialist|socialist|socialism|communist|communism|marxist)\b/i,
      /\b(?:eat the rich|capitalism bad|corporate greed|rigged system|class warfare|class struggle|workers'? revolt)\b/i
    ],
    negativePatterns: [
      /\b(?:no|not|zero|without|lacks?|lacking|absence of)\b[^.!?\n]{0,40}\b(?:anti-capitalist|anticapitalist|anti capitalist|anti-corporate|anti corporate|socialist|socialism|communist|communism|marxist)\b/i,
      /\b(?:not|isn't|is not)\b[^.!?\n]{0,20}\b(?:anti-capitalist|anticapitalist|anti capitalist|socialist|communist|marxist)\b/i,
      /\b(?:light|mild|minor|background|incidental|generic)\b[^.!?\n]{0,40}\b(?:anti-capitalist|anticapitalist|anti capitalist|anti-corporate|anti corporate|socialist|socialism|communist|communism|marxist|eat the rich|corporate greed|rigged system|class warfare|class struggle)\b/i,
      /\b(?:eat the rich|corporate greed|rigged system|class warfare|class struggle)\b[^.!?\n]{0,40}\b(?:light|mild|minor|background|incidental|generic|satire)\b/i
    ]
  }
];

const tagDefinitionMap = new Map(TITLE_TAG_DEFINITIONS.map((definition) => [definition.id, definition]));

export function getTitleTagDefinition(tag: TitleContentTag): TitleTagDefinition {
  return tagDefinitionMap.get(tag) ?? tagDefinitionMap.get("RAINBOW")!;
}

export function getTitleTagDefinitions(tags: TitleContentTag[]): TitleTagDefinition[] {
  return normalizeContentTags(tags).map(getTitleTagDefinition);
}

export function normalizeContentTags(tags: readonly string[] | null | undefined): TitleContentTag[] {
  const normalized = new Set<TitleContentTag>();

  for (const tag of tags ?? []) {
    if (isTitleContentTag(tag)) {
      normalized.add(tag);
    }
  }

  return Array.from(normalized).sort(
    (left, right) => getTitleTagDefinition(left).displayOrder - getTitleTagDefinition(right).displayOrder
  );
}

export function isTitleContentTag(value: string): value is TitleContentTag {
  return TITLE_CONTENT_TAGS.includes(value as TitleContentTag);
}

export function buildContentTagSourceText(input: ContentTagTextInput): string {
  return [
    input.wokeSummary ?? "",
    input.socialPostDraft ?? "",
    ...(input.wokeFactors ?? []).map((factor) => factor.notes ?? "")
  ]
    .join("\n")
    .trim();
}

export function deriveContentTagsFromText(input: ContentTagTextInput): TitleContentTag[] {
  const text = buildContentTagSourceText(input);

  if (!text) {
    return [];
  }

  const sentences = splitIntoSentences(text);
  const matches = new Set<TitleContentTag>();

  for (const rule of TAG_RULES) {
    const matched = sentences.some((sentence) => sentenceMatchesRule(sentence, rule));

    if (matched) {
      matches.add(rule.id);
    }
  }

  return normalizeContentTags(Array.from(matches));
}

function splitIntoSentences(input: string): string[] {
  return input
    .split(/[\n\r]+|(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function sentenceMatchesRule(sentence: string, rule: TagRule): boolean {
  const normalizedSentence = sentence.trim();

  if (!normalizedSentence) {
    return false;
  }

  if (rule.negativePatterns.some((pattern) => pattern.test(normalizedSentence))) {
    return false;
  }

  return rule.positivePatterns.some((pattern) => pattern.test(normalizedSentence));
}
