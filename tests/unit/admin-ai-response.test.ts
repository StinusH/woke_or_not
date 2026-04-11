import { describe, expect, it } from "vitest";
import { parseAdminAiResearchResponse } from "@/lib/admin-ai-response";

describe("parseAdminAiResearchResponse", () => {
  it("extracts the woke score, summary, and score factors", () => {
    const parsed = parseAdminAiResearchResponse(`Title: The Little Mermaid
Type: movie
Proposed Woke Score: 62

Score Summary:
Moderately strong identity and representation emphasis, with controversy tied to adaptation choices and public reaction.

Key Evidence:
- Example evidence

Public Reaction And Controversy:
- Example reaction

Creator Context:
- Director: Example

Score Factors:
- Representation / casting choices: 82 | Legacy casting changes were a major public discussion point.
- Political / ideological dialogue: 18 | The dialogue itself does not appear heavily political.
- Identity-driven story themes: 45 | Representation discussion appears stronger than the story themes themselves.
- Institutional / cultural critique: 20 | Only limited evidence of direct critique.
- Legacy character or canon changes: 76 | Remake/adaptation changes were highly visible to audiences.
- Public controversy / woke complaints: 80 | There was broad online discussion and criticism framed as "woke."
- Creator track record context: 35 | Prior work offers some supporting context but is not decisive.

Notable Context:
- Example context

Confidence:
medium

Social Post Draft:
woke warning 🚨
The Little Mermaid (2023)
woke score: 62/100 ⭐
IMDb rating: 7.2/10

This remake got flagged mainly because the casting change and legacy-character debate became the story around the movie before a lot of people even saw it.

The movie itself is not packed with overt political speeches, but the representation angle was front and center in the marketing and backlash.

Online criticism was loud and very easy to notice, so the politics around it landed harder than the dialogue on screen.

Open Questions For Human Review:
- Example question`);

    expect(parsed.wokeScore).toBe(62);
    expect(parsed.calculatedWokeScore).toBe(87);
    expect(parsed.scoreWarning).toBe("AI Proposed Woke Score is 62, but the factor-derived score is 87 (25-point difference).");
    expect(parsed.wokeSummary).toContain("Moderately strong identity");
    expect(parsed.wokeFactors).toHaveLength(7);
    expect(parsed.wokeFactors[0]).toMatchObject({
      label: "Representation / casting choices",
      weight: 82,
      notes: "Legacy casting changes were a major public discussion point."
    });
    expect(parsed.socialPostDraft).toBe(
      [
        "WARNING 🚨 - woke themes spotted",
        "The Little Mermaid (2023)",
        "woke score: 62/100 🤮",
        "IMDb rating: 7.2/10 ⭐",
        "",
        "This remake got flagged mainly because the casting change and legacy-character debate became the story around the movie before a lot of people even saw it.",
        "",
        "The movie itself is not packed with overt political speeches, but the representation angle was front and center in the marketing and backlash.",
        "",
        "Online criticism was loud and very easy to notice, so the politics around it landed harder than the dialogue on screen."
      ].join("\n")
    );
    expect(parsed.imdbRating).toBe("7.2");
    expect(parsed.watchProviders).toEqual([]);
    expect(parsed.watchProviderLinks).toEqual([]);
  });

  it("accepts markdown-bolded structured labels", () => {
    const parsed = parseAdminAiResearchResponse(`**Title:** Kiss the Ground
**Type:** Movie
**Proposed Woke Score:** 66

**Score Summary:**
Environmental activism is the entire sales pitch here and the messaging is impossible to miss.

**Key Evidence:**
- Example evidence

**Score Factors:**
- Representation / casting choices: 10 | Not a major factor.
- Political / ideological dialogue: 55 | Repeated activist framing about systems and solutions.
- Identity-driven story themes: 20 | Not centered on identity politics.
- Institutional / cultural critique: 82 | The documentary keeps pushing a strong moral critique of modern systems.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 35 | Some backlash exists but it is not huge.
- Creator track record context: 20 | Some supporting context.

**Social Post Draft:**
WARNING 🚨
Kiss the Ground (2020)
woke score: 66/100 🤮
IMDb rating: 8.2/10 ⭐

Environmental sermon from start to finish.`);

    expect(parsed.wokeScore).toBe(66);
    expect(parsed.wokeSummary).toContain("Environmental activism");
    expect(parsed.wokeFactors).toHaveLength(7);
    expect(parsed.socialPostDraft).toBe(
      [
        "WARNING 🚨 - woke themes spotted",
        "Kiss the Ground (2020)",
        "woke score: 66/100 🤮",
        "IMDb rating: 8.2/10 ⭐",
        "",
        "Environmental sermon from start to finish."
      ].join("\n")
    );
    expect(parsed.imdbRating).toBe("8.2");
  });

  it("accepts score factors without bullet prefixes and normalizes legacy social post formatting", () => {
    const parsed = parseAdminAiResearchResponse(`Title: The Little Mermaid
Type: Movie
Proposed Woke Score: 68

Score Summary:
Confirmed casting changes and public backlash made representation the dominant audience-visible element.

Key Evidence:
Confirmed live-action remake details.

Score Factors:
Representation / casting choices: 80 | Confirmed race swap of iconic Ariel to Halle Bailey.
Political / ideological dialogue: 30 | No explicit activist lines in the film itself.
Identity-driven story themes: 50 | Mildly updated female independence framing.
Institutional / cultural critique: 10 | No meaningful institutional critique.
Legacy character or canon changes: 70 | Publicly visible reinterpretations of legacy characters.
Public controversy / woke complaints: 85 | Heavy online backlash and review-bombing.
Creator track record context: 40 | Some support from Miranda's broader representation focus.

Confidence: high

Social Post Draft:
IMDb: 6.9/10

The Little Mermaid (2023) earns a proposed woke score of 68/100. Public backlash and adaptation changes are the main reasons.

Open Questions For Human Review:
Exact wording of any new independence-focused dialogue.`);

    expect(parsed.wokeScore).toBe(68);
    expect(parsed.calculatedWokeScore).toBe(88);
    expect(parsed.scoreWarning).toBe("AI Proposed Woke Score is 68, but the factor-derived score is 88 (20-point difference).");
    expect(parsed.wokeFactors).toHaveLength(7);
    expect(parsed.wokeFactors[5]).toMatchObject({
      label: "Public controversy / woke complaints",
      weight: 85
    });
    expect(parsed.socialPostDraft).toBe(
      [
        "WARNING 🚨 - woke themes spotted",
        "The Little Mermaid (2023)",
        "woke score: 68/100 🤮",
        "IMDb rating: 6.9/10 ⭐",
        "",
        "The Little Mermaid (2023) earns a proposed woke score of 68/100. Public backlash and adaptation changes are the main reasons."
      ].join("\n")
    );
    expect(parsed.imdbRating).toBe("6.9");
  });

  it("normalizes low scores into the pass social post structure", () => {
    const parsed = parseAdminAiResearchResponse(`Title: Example Movie
Type: Movie
Proposed Woke Score: 22

Score Summary:
Limited ideological content and little visible controversy.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 20 | Limited emphasis.
- Political / ideological dialogue: 10 | Little overt messaging.
- Identity-driven story themes: 15 | Mostly incidental.
- Institutional / cultural critique: 5 | Minimal critique.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 12 | Sparse reaction.
- Creator track record context: 8 | Little supporting context.

Confidence:
medium

Social Post Draft:
IMDb rating: N/A

Light ideological content with very little public backlash.

Open Questions For Human Review:
- Example question`);

    expect(parsed.socialPostDraft).toBe(
      ["safe pick ✅ - no propaganda spotted", "Example Movie", "woke score: 22/100 😀", "IMDb rating: N/A", "", "Light ideological content with very little public backlash."].join(
        "\n"
      )
    );
    expect(parsed.imdbRating).toBe("");
    expect(parsed.calculatedWokeScore).toBe(20);
    expect(parsed.scoreWarning).toBeNull();
  });

  it('treats "Legacy character or canon changes: Not relevant" as a zero-weight factor', () => {
    const parsed = parseAdminAiResearchResponse(`Title: Example Movie
Type: Movie
Proposed Woke Score: 22

Score Summary:
Limited ideological content and little visible controversy.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 20 | Limited emphasis.
- Political / ideological dialogue: 10 | Little overt messaging.
- Identity-driven story themes: 15 | Mostly incidental.
- Institutional / cultural critique: 5 | Minimal critique.
- Legacy character or canon changes: Not relevant.
- Public controversy / woke complaints: 12 | Sparse reaction.
- Creator track record context: 8 | Little supporting context.

Confidence:
medium

Social Post Draft:
IMDb rating: N/A

Light ideological content with very little public backlash.`);

    expect(parsed.wokeFactors[4]).toMatchObject({
      label: "Legacy character or canon changes",
      weight: 0,
      notes: "Not relevant."
    });
    expect(parsed.calculatedWokeScore).toBe(20);
    expect(parsed.scoreWarning).toBeNull();
  });

  it("normalizes mid-range scores into the caution social post structure", () => {
    const parsed = parseAdminAiResearchResponse(`Title: Example Show
Type: TV show
Proposed Woke Score: 44

Score Summary:
Moderate identity emphasis with noticeable but not overwhelming messaging.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 45 | Noticeable but not dominant.
- Political / ideological dialogue: 38 | Present in spots.
- Identity-driven story themes: 50 | Recurring but not overwhelming.
- Institutional / cultural critique: 35 | Some critique.
- Legacy character or canon changes: 25 | Not a major factor.
- Public controversy / woke complaints: 48 | Clear reaction, but not massive.
- Creator track record context: 30 | Some supporting context.

Confidence:
medium

Social Post Draft:
warning
Example Show (2026)
woke score: 44/100 ⭐
IMDb rating: 7.4/10

There are some noticeable modern politics here, but it is not full activist overload.`);

    expect(parsed.socialPostDraft).toBe(
      [
        "proceed with caution ⚠️ - woke themes spotted",
        "Example Show (2026)",
        "woke score: 44/100 🤢",
        "IMDb rating: 7.4/10 ⭐",
        "",
        "There are some noticeable modern politics here, but it is not full activist overload."
      ].join("\n")
    );
    expect(parsed.imdbRating).toBe("7.4");
    expect(parsed.calculatedWokeScore).toBe(66);
    expect(parsed.scoreWarning).toBe("AI Proposed Woke Score is 44, but the factor-derived score is 66 (22-point difference).");
  });

  it("preserves issue-specific warning headers on high-score social posts", () => {
    const parsed = parseAdminAiResearchResponse(`Title: Example Movie
Type: Movie
Proposed Woke Score: 72

Score Summary:
Strong DEI-heavy framing and visible backlash.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 85 | Forced diversity is the clearest audience-visible issue.
- Political / ideological dialogue: 35 | Some activist phrasing appears on screen.
- Identity-driven story themes: 65 | DEI framing is woven into the story beats.
- Institutional / cultural critique: 30 | Some critique is present.
- Legacy character or canon changes: 20 | Minor factor.
- Public controversy / woke complaints: 60 | Clear backlash.
- Creator track record context: 20 | Some support.

Social Post Draft:
WARNING 🚨 - DEI spotted
Example Movie (2026)
woke score: 72/100 🤮

Forced diversity is the main thing viewers will notice here.`);

    expect(parsed.socialPostDraft).toBe(
      [
        "WARNING 🚨 - DEI spotted",
        "Example Movie (2026)",
        "woke score: 72/100 🤮",
        "",
        "Forced diversity is the main thing viewers will notice here."
      ].join("\n")
    );
  });

  it("extracts the IMDb rating as a standalone value for form hydration", () => {
    const parsed = parseAdminAiResearchResponse(`Title: Roofman
Type: Movie
Proposed Woke Score: 40

Score Summary:
Mostly character-driven with some light progressive signaling.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 45 | Noticeable diversity in supporting roles.
- Political / ideological dialogue: 25 | Minimal.
- Identity-driven story themes: 30 | Incidental.
- Institutional / cultural critique: 40 | Mild.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 35 | Limited.
- Creator track record context: 35 | Mixed.

Social Post Draft:
proceed with caution ⚠️
Roofman (2025)
woke score: 40/100 🤢
IMDb rating: 6.9/10 ⭐

Watch for subtle agenda crumbs.`);

    expect(parsed.imdbRating).toBe("6.9");
    expect(parsed.calculatedWokeScore).toBe(54);
    expect(parsed.scoreWarning).toBe("AI Proposed Woke Score is 40, but the factor-derived score is 54 (14-point difference).");
  });

  it("recovers the social post draft when the section heading is missing", () => {
    const parsed = parseAdminAiResearchResponse(`Title: Oppenheimer
Type: Movie
Proposed Woke Score: 12

Score Summary:
Mostly focused on the historical story with little overt identity messaging.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 10 | Minimal ideological emphasis in casting discussion.
- Political / ideological dialogue: 8 | Not a major part of the script.
- Identity-driven story themes: 5 | The story is not structured around identity politics.
- Institutional / cultural critique: 18 | Some critique of institutions, but not in a modern activist frame.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 6 | Very little anti-woke backlash.
- Creator track record context: 10 | Limited supporting pattern.

Notable Context:
- Example context

safe pick ✅
Oppenheimer (2023)
woke score: 12/100 🤩
IMDb rating: 8.3/10 ⭐

Back in the good old days, movies could just tell the story without stuffing in identity lectures every five minutes.

This one mostly sticks to the history and lets the tension do the work. No forced agenda crap. They don't make many like this anymore.`);

    expect(parsed.socialPostDraft).toBe(
      [
        "safe pick ✅ - no propaganda spotted",
        "Oppenheimer (2023)",
        "woke score: 12/100 🤩",
        "IMDb rating: 8.3/10 ⭐",
        "",
        "Back in the good old days, movies could just tell the story without stuffing in identity lectures every five minutes.",
        "",
        "This one mostly sticks to the history and lets the tension do the work. No forced agenda crap. They don't make many like this anymore."
      ].join("\n")
    );
    expect(parsed.imdbRating).toBe("8.3");
    expect(parsed.calculatedWokeScore).toBe(16);
    expect(parsed.scoreWarning).toBe("AI Proposed Woke Score is 12, but the factor-derived score is 16 (4-point difference).");
  });

  it("infers the title when the response starts with a bare title line", () => {
    const parsed = parseAdminAiResearchResponse(`Venom: The Last Dance
Type: Movie
Proposed Woke Score: 22
Score Summary:
Venom: The Last Dance is a pure buddy-action road trip where Eddie Brock and Venom are fugitives dodging the US military and alien hunters sent by Knull. The entire story engine is their bickering friendship, chases, fights, and a final sacrifice.

Key Evidence:
Plot summaries and reviews confirm the core is Eddie/Venom's chaotic bromance and survival against military and Xenophages.

Public Reaction And Controversy:
Almost zero anti-woke backlash; talk centered on whether the movie was fun, not politics.

Creator Context:
Director: Kelly Marcel - no pattern of identity-driven or activist projects.

Score Factors:
Representation / casting choices: 25 | Incidental diversity in supporting cast; no framing around identity.
Political / ideological dialogue: 10 | None present.
Identity-driven story themes: 15 | Core narrative is friendship, survival, and sacrifice.
Institutional / cultural critique: 20 | Military shown as standard antagonists.
Legacy character or canon changes: 0 | Not relevant
Public controversy / woke complaints: 15 | Fringe only.
Creator track record context: 20 | Neutral commercial focus.

Notable Context:
Straight continuation of the Sony Venom series with the same tone and cast focus.

safe pick ✅
Venom: The Last Dance (2024)
woke score: 22/100 🤩
IMDb rating: 6.0/10 ⭐
Straight-up buddy-action chaos with Tom Hardy going full maniac as Eddie and Venom on the run from the army and space monsters. Zero lectures, zero identity swaps, zero forced agenda crap.
This is exactly what these movies should be: loud, stupid, and focused on the weird alien bromance. No sermons, no politics, just the good stuff. Hollywood could learn a thing or two. 🍿 Pass it around.`);

    expect(parsed.socialPostDraft).toBe(
      [
        "safe pick ✅ - no propaganda spotted",
        "Venom: The Last Dance (2024)",
        "woke score: 22/100 😀",
        "IMDb rating: 6.0/10 ⭐",
        "",
        "Straight-up buddy-action chaos with Tom Hardy going full maniac as Eddie and Venom on the run from the army and space monsters. Zero lectures, zero identity swaps, zero forced agenda crap.",
        "This is exactly what these movies should be: loud, stupid, and focused on the weird alien bromance. No sermons, no politics, just the good stuff. Hollywood could learn a thing or two. 🍿 Pass it around."
      ].join("\n")
    );
    expect(parsed.imdbRating).toBe("6.0");
    expect(parsed.calculatedWokeScore).toBe(28);
    expect(parsed.scoreWarning).toBe("AI Proposed Woke Score is 22, but the factor-derived score is 28 (6-point difference).");
  });

  it("returns an empty IMDb rating when the social post draft does not include one", () => {
    const parsed = parseAdminAiResearchResponse(`Title: Example Movie
Type: Movie
Proposed Woke Score: 33

Score Summary:
Mostly light entertainment with limited ideological signaling.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 30 | Mild.
- Political / ideological dialogue: 15 | Limited.
- Identity-driven story themes: 20 | Secondary.
- Institutional / cultural critique: 10 | Minimal.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 12 | Sparse.
- Creator track record context: 15 | Limited.

Social Post Draft:
safe pick ✅
Example Movie (2024)
woke score: 33/100 😀

Mostly harmless with only minor agenda traces.`);

    expect(parsed.imdbRating).toBe("");
    expect(parsed.calculatedWokeScore).toBe(28);
    expect(parsed.scoreWarning).toBe("AI Proposed Woke Score is 33, but the factor-derived score is 28 (5-point difference).");
  });

  it("extracts watch availability when the AI response includes provider research", () => {
    const parsed = parseAdminAiResearchResponse(`Title: Example Movie
Type: Movie
Proposed Woke Score: 40

Score Summary:
Mostly character-driven with some light progressive signaling.

Key Evidence:
- Example evidence

Score Factors:
- Representation / casting choices: 45 | Noticeable diversity in supporting roles.
- Political / ideological dialogue: 25 | Minimal.
- Identity-driven story themes: 30 | Incidental.
- Institutional / cultural critique: 40 | Mild.
- Legacy character or canon changes: 0 | Not relevant.
- Public controversy / woke complaints: 35 | Limited.
- Creator track record context: 35 | Mixed.

Watch Availability:
- Netflix | https://www.netflix.com/title/12345
- Amazon Prime | N/A
- No verified current watch providers found.

Social Post Draft:
proceed with caution ⚠️
Example Movie (2025)
woke score: 40/100 🤢
IMDb rating: 6.9/10 ⭐

Watch for subtle agenda crumbs.`);

    expect(parsed.watchProviders).toEqual(["Netflix", "Amazon Prime"]);
    expect(parsed.watchProviderLinks).toEqual([
      { name: "Netflix", url: "https://www.netflix.com/title/12345" },
      { name: "Amazon Prime", url: null }
    ]);
    expect(parsed.calculatedWokeScore).toBe(54);
    expect(parsed.scoreWarning).toBe("AI Proposed Woke Score is 40, but the factor-derived score is 54 (14-point difference).");
  });
});
