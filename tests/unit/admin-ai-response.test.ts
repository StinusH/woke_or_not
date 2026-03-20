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
woke score: 62 ⭐

This remake got flagged mainly because the casting change and legacy-character debate became the story around the movie before a lot of people even saw it.

The movie itself is not packed with overt political speeches, but the representation angle was front and center in the marketing and backlash.

Online criticism was loud and very easy to notice, so the politics around it landed harder than the dialogue on screen.

Open Questions For Human Review:
- Example question`);

    expect(parsed.wokeScore).toBe(62);
    expect(parsed.wokeSummary).toContain("Moderately strong identity");
    expect(parsed.wokeFactors).toHaveLength(7);
    expect(parsed.wokeFactors[0]).toMatchObject({
      label: "Representation / casting choices",
      weight: 82,
      notes: "Legacy casting changes were a major public discussion point."
    });
    expect(parsed.socialPostDraft).toBe(
      [
        "woke warning 🚨",
        "The Little Mermaid (2023)",
        "woke score: 62 ⭐",
        "",
        "This remake got flagged mainly because the casting change and legacy-character debate became the story around the movie before a lot of people even saw it.",
        "",
        "The movie itself is not packed with overt political speeches, but the representation angle was front and center in the marketing and backlash.",
        "",
        "Online criticism was loud and very easy to notice, so the politics around it landed harder than the dialogue on screen."
      ].join("\n")
    );
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
The Little Mermaid (2023) earns a proposed woke score of 68/100. Public backlash and adaptation changes are the main reasons.

Open Questions For Human Review:
Exact wording of any new independence-focused dialogue.`);

    expect(parsed.wokeScore).toBe(68);
    expect(parsed.wokeFactors).toHaveLength(7);
    expect(parsed.wokeFactors[5]).toMatchObject({
      label: "Public controversy / woke complaints",
      weight: 85
    });
    expect(parsed.socialPostDraft).toBe(
      [
        "woke warning 🚨",
        "The Little Mermaid (2023)",
        "woke score: 68 ⭐",
        "",
        "The Little Mermaid (2023) earns a proposed woke score of 68/100. Public backlash and adaptation changes are the main reasons."
      ].join("\n")
    );
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
Light ideological content with very little public backlash.

Open Questions For Human Review:
- Example question`);

    expect(parsed.socialPostDraft).toBe(
      ["safe pick ✅", "Example Movie", "woke score: 22 ⭐", "", "Light ideological content with very little public backlash."].join(
        "\n"
      )
    );
  });
});
