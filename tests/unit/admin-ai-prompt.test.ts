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
    expect(prompt).toContain("- Representation / casting choices: <0-100> | <short explanation>");
    expect(prompt).toContain('Do not repeat the "Title details for review" block in your output.');
    expect(prompt).toContain("Social Post Draft:");
    expect(prompt).toContain('<first line: "woke warning 🚨" if the proposed woke score is greater than 50, otherwise "safe pick ✅">');
    expect(prompt).toContain("<second line: title with year in parentheses if known>");
    expect(prompt).toContain("<third line: woke score: <0-100>/100 ⭐>");
    expect(prompt).toContain("Write in the voice of a viral anti-woke account ranting about movies and TV.");
    expect(prompt).toContain('Use phrases like: "woke garbage", "zero lectures", "FINALLY a movie that..."');
    expect(prompt).toContain("For safe picks (score under 50): start celebratory and relieved.");
    expect(prompt).toContain("Good safe-pick example:");
    expect(prompt).toContain("Project Hail Mary (2026)");
    expect(prompt).toContain("woke score: 12/100 ⭐");
    expect(prompt).toContain("Bad high-woke example:");
    expect(prompt).toContain("Snow White (2025)");
    expect(prompt).toContain("woke score: 92/100 ⭐");
  });
});
