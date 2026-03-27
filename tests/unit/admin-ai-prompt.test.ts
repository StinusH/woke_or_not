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

    const prompt = buildAdminAiResearchPrompt(draft);

    expect(prompt).toContain("Title: The Little Mermaid");
    expect(prompt).toContain("Year: 2023");
    expect(prompt).toContain("Director(s): Rob Marshall");
    expect(prompt).toContain("Producer(s): Marc Platt");
    expect(prompt).toContain("Writer(s): David Magee");
    expect(prompt).toContain("Main cast: Halle Bailey, Jonah Hauer-King, Melissa McCarthy");
    expect(prompt).toContain('Search specifically for "woke" complaints');
    expect(prompt).toContain("helps users avoid movies and TV shows with stronger woke themes");
    expect(prompt).toContain("maximum 740 characters total");
    expect(prompt).toContain("Narrative-only scoring rule:");
    expect(prompt).toContain(
      `When scoring ANY category, evaluate ONLY the core story, premise, character arcs, thematic messaging, and how the narrative is structured and told. Completely ignore genre packaging, action, jokes, horror/gore, comedy, flashy directing, effects, or "entertainment value." Subversions, dark twists, or "it's not pure sermon" elements do not lower the score if the identity/political/representation themes are still central to the story engine. Focus strictly on what the average viewer will experience in the narrative itself, not how stylishly or entertainingly it is wrapped.`
    );
    expect(prompt).toContain(
      `"Queer-centric projects are scored more aggressively in the 70–100 range when the identity element is front-and-center, even if other factors are moderate."`
    );
    expect(prompt).toContain(
      "<2-4 sentence factual summary explaining the proposed score, maximum 740 characters total. Write it in short sentences, slightly conversational, 100% factual, and clear enough for a reader who only knows the basic synopsis. Explain woke elements in simple everyday language with no cryptic references.>"
    );
    expect(prompt).toContain(
      'Search specifically for "woke" complaints, anti-woke criticism, backlash, "too woke", forced diversity, agenda, identity politics, and similar framing from audiences and critics who believe the content has excessive modern identity politics or social justice messaging.'
    );
    expect(prompt).toContain(
      'Only count and score controversy that criticizes the title for being too woke or pushing political/identity agendas. Do NOT count, weigh, or mention complaints that the title is "not diverse enough", "not woke enough", or "problematic for lacking representation."'
    );
    expect(prompt).toContain("If there is little to no anti-woke backlash, clearly state so.");
    expect(prompt).toContain('The "Legacy character or canon changes" factor is relevance-gated:');
    expect(prompt).toContain(
      `"Queer/LGBTQ+ representation and themes receive stronger weighting than standard gender or racial representation. When central to casting, character framing, creator statements, marketing, or story arcs, add +15–25 points to the relevant factor(s). Current industry patterns treat queer identity as a higher-priority activist signal than generic diversity, so visible emphasis here carries elevated 'woke' weight for scoring purposes."`
    );
    expect(prompt).toContain(
      "If there are no meaningful canon or legacy-character changes, set that factor to 0, explain that it is not relevant, and do not let that 0 drag down the overall Proposed Woke Score."
    );
    expect(prompt).toContain(
      "Canon or legacy-character changes can only add to the final evaluation when present. They should never subtract from the score or make a title seem less woke."
    );
    expect(prompt).toContain('Average every factor except "Legacy character or canon changes".');
    expect(prompt).toContain('Add a legacy/canon bonus equal to `round(legacy factor / 5)`, capped at +10.');
    expect(prompt).toContain("Example: if the non-legacy factor average is 44 and the legacy/canon factor is 25, the final Proposed Woke Score should be 49.");
    expect(prompt).toContain("- Representation / casting choices: <0-100> | <short explanation>");
    expect(prompt).toContain(
      '- Legacy character or canon changes: <0-100> | <short explanation; write "0 | Not relevant" when absent, and do not count that against the overall score>'
    );
    expect(prompt).toContain(
      "(Only measure backlash claiming the title is too woke / pushes forced identity politics. Ignore or give zero weight to \"not woke enough\" complaints from the progressive side.)"
    );
    expect(prompt).toContain('Do not repeat the "Title details for review" block in your output.');
    expect(prompt).toContain("Social Post Draft:");
    expect(prompt).toContain(
      '<The literal line "Social Post Draft:" is required and must appear exactly once immediately before the post. Do not omit it, rename it, or replace it with the post itself.>'
    );
    expect(prompt).toContain(
      '<first line: "safe pick ✅" for scores 0-35, "proceed with caution ⚠️" for scores 36-50, or "woke warning 🚨" for scores 51-100>'
    );
    expect(prompt).toContain("<second line: title with year in parentheses if known>");
    expect(prompt).toContain("<third line: woke score: <0-100>/100 <emoji based on score range>>");
    expect(prompt).toContain("<fourth line: IMDb rating: <x.x>/10 ⭐ if known, otherwise IMDb rating: N/A>");
    expect(prompt).toContain("Write in the voice of a viral anti-woke account ranting about movies and TV.");
    expect(prompt).toContain('Formatting rule: Keep the section label line "Social Post Draft:" on its own line, then begin the actual post on the very next line.');
    expect(prompt).toContain("Clarity rule: Assume the reader knows nothing beyond the basic synopsis.");
    expect(prompt).toContain('Use phrases like: "woke garbage", "zero lectures", "FINALLY a movie that..."');
    expect(prompt).toContain(
      'For safe picks (0-35): start celebratory and relieved. For caution picks (36-50): sound skeptical and flag the issue without going full alarm bell. For scores in the 40-50 range specifically, do NOT sound approving or write it like a recommendation. Do not use phrases like "solid pick", "FINALLY...", "about damn time", or "Hollywood needs more of this." Instead, frame it as Hollywood slipping woke elements in more subtly through dialogue, character framing, side plots, or tone. For high scores (51-100): pure warning and anger.'
    );
    expect(prompt).toContain("Release-Year-Aware Tone Adjustment (required for all titles):");
    expect(prompt).toContain(
      'Always check the release year provided in the "Title details for review" block. Adapt the tone of the Social Post Draft accordingly so it never sounds like a brand-new release for older films:'
    );
    expect(prompt).toContain(
      'For recent titles (2018 or newer): Keep the existing direct, frustrated/celebratory style ("FINALLY a movie...", "About damn time", "Hollywood needs more of this").'
    );
    expect(prompt).toContain(
      `For older/classic titles (pre-2018, especially pre-2000): Switch to a nostalgic "good old days" tone that celebrates pre-woke Hollywood. Use natural phrases such as:`
    );
    expect(prompt).toContain(`"Back in the good old days...",`);
    expect(prompt).toContain(`"Before the woke mob took over Hollywood...",`);
    expect(prompt).toContain(`"Before DEI and forced agendas ruined everything...",`);
    expect(prompt).toContain(`"This is what real movies looked like...",`);
    expect(prompt).toContain(`"They don't make 'em like this anymore...",`);
    expect(prompt).toContain(
      `"A classic from when Hollywood still knew how to tell a story without all the propaganda."`
    );
    expect(prompt).toContain(
      'The goal is to frame low-woke older movies as a reminder of what Hollywood used to deliver before identity politics took over. Keep the voice raw and conversational, make the nostalgia obvious, and do NOT use "FINALLY" or "About damn time" language that implies the movie is brand new.'
    );
    expect(prompt).toContain("Good safe-pick example:");
    expect(prompt).toContain("Project Hail Mary (2026)");
    expect(prompt).toContain("woke score: 12/100 🤩");
    expect(prompt).toContain("IMDb rating: 8.0/10 ⭐");
    expect(prompt).toContain("Middle-ground example:");
    expect(prompt).toContain("proceed with caution ⚠️");
    expect(prompt).toContain("The Last of Us Season 2 (2025)");
    expect(prompt).toContain("woke score: 44/100 🤢");
    expect(prompt).toContain("IMDb rating: 7.1/10 ⭐");
    expect(prompt).toContain("This is exactly how Hollywood sneaks it in now.");
    expect(prompt).toContain("Bad high-woke example:");
    expect(prompt).toContain("Snow White (2025)");
    expect(prompt).toContain("woke score: 92/100 🤡");
    expect(prompt).toContain("IMDb rating: 1.8/10 ⭐");
    expect(prompt).toContain(
      "Always apply the Release-Year-Aware Tone Adjustment above when writing the 2-3 short paragraphs."
    );
    expect(prompt).toContain("IMDb rating: 7.2");
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
});
