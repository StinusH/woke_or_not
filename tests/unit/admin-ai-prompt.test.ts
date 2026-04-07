import { describe, expect, it } from "vitest";
import { buildAdminAiResearchPrompt } from "@/lib/admin-ai-prompt";
import { createEmptyAdminTitleDraft } from "@/lib/admin-title-draft";

describe("buildAdminAiResearchPrompt", () => {
  it("includes key metadata from the current title draft", () => {
    const draft = createEmptyAdminTitleDraft();
    draft.name = "The Little Mermaid";
    draft.type = "MOVIE";
    draft.releaseDate = "2023-05-18";
    draft.genreSlugs = ["family", "fantasy"];
    draft.synopsis = "A mermaid princess makes a dangerous bargain to live on land.";
    draft.imdbUrl = "https://www.imdb.com/title/tt5971474/";
    draft.imdbRating = "7.2";
    draft.rottenTomatoesUrl = "https://www.rottentomatoes.com/m/the_little_mermaid_2023";
    draft.trailerYoutubeUrl = "https://www.youtube.com/watch?v=kpGo2_d3oYE";
    draft.cast = [
      { name: "Halle Bailey", roleName: "Ariel", billingOrder: 1 },
      { name: "Jonah Hauer-King", roleName: "Eric", billingOrder: 2 },
      { name: "Melissa McCarthy", roleName: "Ursula", billingOrder: 3 }
    ];
    draft.crew = [
      { name: "Rob Marshall", jobType: "DIRECTOR" },
      { name: "Marc Platt", jobType: "PRODUCER" },
      { name: "David Magee", jobType: "WRITER" }
    ];
    draft.productionCompanies = ["Disney", "Marc Platt Productions"];
    draft.productionNetworks = [];
    draft.studioAttribution = { label: "Netflix", source: "PRODUCTION_COMPANY" };

    const prompt = buildAdminAiResearchPrompt(draft);

    expect(prompt).toContain("Title: The Little Mermaid");
    expect(prompt).toContain("Year: 2023");
    expect(prompt).toContain("Director(s): Rob Marshall");
    expect(prompt).toContain("Producer(s): Marc Platt");
    expect(prompt).toContain("Writer(s): David Magee");
    expect(prompt).toContain("Main cast: Halle Bailey, Jonah Hauer-King, Melissa McCarthy");
    expect(prompt).toContain("Production companies: Disney, Marc Platt Productions");
    expect(prompt).not.toContain("Networks:");
    expect(prompt).toContain("Platform/studio attribution: Netflix");
    expect(prompt).toContain("helps users avoid movies and TV shows with stronger woke themes");
    expect(prompt).toContain("maximum 1000 characters total");
    expect(prompt).toContain("Narrative-only scoring rule:");
    expect(prompt).toContain(
      'Do not assume a title is "woke" or "not woke" based only on race, sex, or identity of cast members. Only score casting when it appears to be audience-visible forced diversity, identity signaling, or a clear mismatch with the story world, source material, setting, or character logic. If the casting naturally fits the location, period, premise, or characters, give little or no weight.'
    );
    expect(prompt).toContain(
      "- forced or audience-visible representation emphasis in casting or character framing, not casting that naturally fits the setting or story world"
    );
    expect(prompt).toContain(
      `When scoring ANY category, evaluate ONLY the core story, premise, character arcs, thematic messaging, and how the narrative is structured and told. Completely ignore genre packaging, action, jokes, horror/gore, comedy, flashy directing, effects, or "entertainment value." Subversions, dark twists, or "it's not pure sermon" elements do not lower the score if the identity/political/representation themes are still central to the story engine. Focus strictly on what the average viewer will experience in the narrative itself, not how stylishly or entertainingly it is wrapped.`
    );
    expect(prompt).toContain(
      "Historical, setting-appropriate, or story-logical conflict with tyranny, fascism, slavery, dictatorship, or abuse of power is not woke by itself. Only score this higher when the title clearly reframes it into modern activist messaging about current identity politics, capitalism, whiteness, patriarchy, colonial guilt, or similar present-day ideological framing. Real oppression in non-Western countries (e.g. Iranian village patriarchy) does not count as woke by itself."
    );
    expect(prompt).toContain(
      'Score Summary:\n<2-4 sentence factual summary explaining the proposed score, maximum 1000 characters total. Write it in short, blunt, direct sentences. Be unflinching when pointing out woke content. Clearly state where girl power, environmental sermons, anti-colonial messaging, identity themes or other social-justice elements appear and how visible they are. Never soften, balance, excuse, or downplay with phrases like "wrapped in fun fantasy", "not nonstop lectures", "no major... shoved in your face", "but it\'s still...", or any similar qualifiers. Match the raw, direct style of the Social Post Draft. Prefer concrete lines like "the movie keeps pushing girlboss rebellion the whole way through" or "the story constantly lectures about colonizers being evil and nature worship being good.">'
    );
    expect(prompt).toContain(
      'Look for mainstream and broader web coverage of controversy or public debate, especially "woke" complaints, anti-woke criticism, backlash, "too woke", forced diversity, agenda, or identity-politics framing.'
    );
    expect(prompt).toContain(
      'Only count and score backlash claiming the title is too woke or pushes political/identity agendas. Do NOT count, weigh, or mention complaints that it is "not diverse enough", "not woke enough", or lacks representation.'
    );
    expect(prompt).toContain("Clearly note when anti-woke backlash is absent, fringe, exaggerated, weakly sourced, or mostly social-media-driven.");
    expect(prompt).toContain(
      "If they have a clear history of strong political, social-justice, activist, or identity-driven work, or if they publicly frame the current title using activist, diversity, or social-justice language, treat it as supporting context only when it aligns with the title's actual content, marketing, or reception."
    );
    expect(prompt).toContain(
"Queer/LGBTQ+ representation and themes receive much stronger weighting than standard gender or racial representation. Any confirmed visible LGBTQ+ elements — whether central or background/incidental, add +20–35 points to the relevant factor(s). Current industry patterns treat queer identity as a higher-priority activist signal than generic diversity, so visible emphasis here carries elevated 'woke' weight for scoring purposes."
    );
    expect(prompt).toContain("Use these buckets exactly when calculating the final Proposed Woke Score:");
    expect(prompt).toContain('Core bucket: "Representation / casting choices", "Political / ideological dialogue", "Identity-driven story themes", "Institutional / cultural critique"');
    expect(prompt).toContain('Context bucket: "Legacy character or canon changes", "Public controversy / woke complaints", "Creator track record context"');
    expect(prompt).toContain(
      "Context factors add support around the core score, but the total context bonus is still capped."
    );
    expect(prompt).toContain(
      "If there are no meaningful canon or legacy-character changes, set that factor to 0 and explain that it is not relevant."
    );
    expect(prompt).toContain("Sort the 4 core-factor scores from highest to lowest.");
    expect(prompt).toContain("Compute the core score as `highest * 0.50 + second * 0.25 + third * 0.15 + fourth * 0.10`.");
    expect(prompt).toContain(
      "Compute the context bonus as `round((public controversy + legacy/canon + creator track record) / 5)`, capped at +30."
    );
    expect(prompt).toContain(
      "High-end taper (90s and above): let `raw = core score + context bonus`. If `raw > 90`, then `final score = 90 + round((raw - 90) * 0.5)`. Otherwise, `final score = raw`."
    );
    expect(prompt).toContain(
      "Exact-calculation rule: Always output the precise mathematical result from this formula. Never apply upward rounding, clean-number adjustments, readability smoothing, or band-level editorial tweaks."
    );
    expect(prompt).toContain("Example: if the core scores are 80, 0, 0, 0 and every context factor is 0, the final Proposed Woke Score should be 40.");
    expect(prompt).toContain(
      "After writing every Score Factor, re-read its short explanation and make sure the 0-100 score directly matches the strength (or lack of strength) described in that explanation alone. Fix any mismatch before outputting."
    );
    expect(prompt).toContain("- Representation / casting choices: <0-100> | <short explanation>");
    expect(prompt).toContain(
      "- Institutional / cultural critique: <0-100> | <short explanation focused on modern activist critique including portrayals of toxic masculinity, male entitlement, traditional gender roles as flawed, or ridicule/undermining of Christianity or core Western cultural institutions; do not score ordinary historical conflict, anti-tyranny plots, or setting-appropriate resistance by itself>"
    );
    expect(prompt).toContain(
      '- Legacy character or canon changes: <0-100> | <short explanation; write "0 | Not relevant" when absent>'
    );
    expect(prompt).toContain(
      "- modern activist-style institutional or cultural critique, especially when applied to current identity politics, capitalism, whiteness, patriarchy, colonialism, or systemic oppression framing"
    );
    expect(prompt).toContain(
      "(Only measure backlash claiming the title is too woke / pushes forced identity politics. Ignore or give zero weight to \"not woke enough\" complaints from the progressive side.)"
    );
    expect(prompt).toContain(
      "- Creator track record context: <0-100> | <short explanation> — must be 0 if no relevant prior work is cited."
    );
    expect(prompt).toContain('Do not repeat the "Title details for review" block in your output.');
    expect(prompt).toContain("Social Post Draft:");
    expect(prompt).toContain(
      '<first line: "safe pick ✅" for scores 0-35, "proceed with caution ⚠️" for scores 36-50, or "woke warning 🚨" for scores 51-100>'
    );
    expect(prompt).toContain("<second line: title with year in parentheses if known>");
    expect(prompt).toContain("<third line: woke score: <0-100>/100 <emoji based on score range>>");
    expect(prompt).toContain("Voice: viral anti-woke account.");
    expect(prompt).toContain(
      "Clarity: assume the reader knows only the basic synopsis. Use very plain language. Say exactly what feels woke in simple terms, like race swaps, girlboss rewriting, anti-male messaging, LGBT focus, activist dialogue, or forced diversity. Avoid academic, abstract, or review-style wording."
    );
    expect(prompt).toContain(
      'Treat any platform/studio attribution line in the title details as a usable context hint. If it is labeled "Likely", treat it as an inference from exclusive availability rather than a confirmed production-company or network credit.'
    );
    expect(prompt).toContain(
      'If the title details include a platform/studio attribution line, use that platform name naturally when assigning blame or praise in the caption instead of defaulting to generic "Hollywood" when the platform-specific framing is more accurate.'
    );
    expect(prompt).toContain(
      "<2-3 short paragraphs written like a clear social media caption focused on woke factors, not a review of the title overall. Keep sentences short. Prefer direct claims over layered explanation.>"
    );
    expect(prompt).toContain('Use phrases naturally, like "woke garbage", "zero lectures", "FINALLY a movie that..."');
    expect(prompt).toContain(
      'Do not use phrases like "identity-driven framing", "institutional critique", "representation emphasis", or "sociopolitical messaging" when a simpler phrase would work.'
    );
    expect(prompt).toContain(
      "Tone by score: safe picks are celebratory and relieved; caution picks are skeptical and warning-focused; scores in the 40-50 range must not sound approving or recommended; high scores are pure warning and anger."
    );
    expect(prompt).toContain(
      `Release-year adjustment: for 2018 or newer, use the direct frustrated/celebratory style; for older titles, use an obvious nostalgic pre-woke-Hollywood tone such as "Back in the good old days..." or "They don't make 'em like this anymore..."`
    );
    expect(prompt).toContain("Short example:");
    expect(prompt).toContain("proceed with caution ⚠️");
    expect(prompt).toContain("The Last of Us Season 2 (2025)");
    expect(prompt).toContain("woke score: 44/100 🤢");
    expect(prompt).toContain("This is exactly how Hollywood sneaks it in now.");
    expect(prompt).toContain(
      "Always apply the release-year adjustment above when writing the 2-3 short paragraphs."
    );
    expect(prompt).not.toContain("<fourth line: IMDb rating:");
    expect(prompt).not.toContain("IMDb rating: 7.1/10 ⭐");
    expect(prompt).not.toContain("IMDb rating: 7.2");
    expect(prompt).toContain("Watch-availability fallback (required for this title):");
    expect(prompt).toContain("The initial metadata lookup did not return any watch providers.");
    expect(prompt).toContain("Watch Availability:");
    expect(prompt).toContain("<provider name> | <direct URL if known, otherwise N/A>");
    expect(prompt).not.toContain("Trailer URL:");
    expect(prompt).not.toContain("Specific review questions:");
    expect(prompt).not.toContain("Open Questions For Human Review:");
  });

  it("omits the watch-availability fallback block when watch providers already exist", () => {
    const draft = createEmptyAdminTitleDraft();
    draft.name = "The Matrix";
    draft.watchProviders = ["Netflix"];

    const prompt = buildAdminAiResearchPrompt(draft);

    expect(prompt).not.toContain("Watch-availability fallback (required for this title):");
    expect(prompt).not.toContain("Watch Availability:");
    expect(prompt).not.toContain("The initial metadata lookup did not return any watch providers.");
  });

  it("includes a likely platform attribution when the stored attribution is provider-inferred", () => {
    const draft = createEmptyAdminTitleDraft();
    draft.name = "Exclusive Streamer Movie";
    draft.studioAttribution = {
      label: "Netflix",
      source: "EXCLUSIVE_STREAMING_PROVIDER"
    };

    const prompt = buildAdminAiResearchPrompt(draft);

    expect(prompt).toContain("Likely platform/studio attribution: Netflix");
  });

  it("omits the platform attribution line when no stored attribution exists", () => {
    const draft = createEmptyAdminTitleDraft();
    draft.name = "Widely Licensed Movie";

    const prompt = buildAdminAiResearchPrompt(draft);

    expect(prompt).not.toContain("Production companies:");
    expect(prompt).not.toContain("Networks:");
    expect(prompt).not.toContain("Platform/studio attribution:");
    expect(prompt).not.toContain("Likely platform/studio attribution:");
  });

  it("asks the AI to find the IMDb rating only when the current draft is missing one", () => {
    const draft = createEmptyAdminTitleDraft();
    draft.name = "Little Amélie or the Character of Rain";
    draft.type = "MOVIE";
    draft.releaseDate = "2025-06-25";
    draft.imdbUrl = "https://www.imdb.com/title/tt29313285/";

    const prompt = buildAdminAiResearchPrompt(draft);

    expect(prompt).toContain("- Find the current IMDb rating if it is available.");
    expect(prompt).toContain("<fourth line: IMDb rating: <x.x>/10 ⭐ if known, otherwise IMDb rating: N/A>");
    expect(prompt).toContain("IMDb rating: <IMDb rating not entered yet>");
    expect(prompt).toContain("IMDb rating: 7.1/10 ⭐");
  });
});
