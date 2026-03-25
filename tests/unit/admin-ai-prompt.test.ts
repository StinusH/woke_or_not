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
    expect(prompt).toContain("Write the Score Summary in a punchier, more entertaining style");
    expect(prompt).toContain(
      "Use the same plain-language clarity rule as the social post: assume the reader knows nothing about the movie beyond the basic synopsis"
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
      "If there are no meaningful canon or legacy-character changes, set that factor to 0, explain that it is not relevant, and do not let that 0 drag down the overall Proposed Woke Score."
    );
    expect(prompt).toContain(
      "Canon or legacy-character changes can only add to the final evaluation when present. They should never subtract from the score or make a title seem less woke."
    );
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
      '<first line: "safe pick ✅" for scores 0-35, "proceed with caution ⚠️" for scores 36-50, or "woke warning 🚨" for scores 51-100>'
    );
    expect(prompt).toContain("<second line: title with year in parentheses if known>");
    expect(prompt).toContain("<third line: woke score: <0-100>/100 <emoji based on score range>>");
    expect(prompt).toContain("<fourth line: IMDb rating: <x.x>/10 ⭐ if known, otherwise IMDb rating: N/A>");
    expect(prompt).toContain("Write in the voice of a viral anti-woke account ranting about movies and TV.");
    expect(prompt).toContain(
      "New priority for clarity: Make every post extremely simple and easy for first-time readers."
    );
    expect(prompt).toContain(
      'Do NOT use cryptic references or assume they know specific lines/scenes.'
    );
    expect(prompt).toContain('Use phrases like: "woke garbage", "zero lectures", "FINALLY a movie that..."');
    expect(prompt).toContain(
      "For safe picks (0-35): start celebratory and relieved. For caution picks (36-50): sound skeptical and flag the issue without going full alarm bell. For high scores (51-100): pure warning and anger."
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
    expect(prompt).toContain("Bad high-woke example:");
    expect(prompt).toContain("Snow White (2025)");
    expect(prompt).toContain("woke score: 92/100 🤡");
    expect(prompt).toContain("IMDb rating: 1.8/10 ⭐");
    expect(prompt).toContain("IMDb rating: 7.2");
    expect(prompt).not.toContain("Trailer URL:");
    expect(prompt).not.toContain("Specific review questions:");
    expect(prompt).not.toContain("Open Questions For Human Review:");
  });
});
