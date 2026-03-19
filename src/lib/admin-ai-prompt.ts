import type { AdminTitleDraft } from "@/lib/admin-title-draft";

export function buildAdminAiResearchPrompt(draft: AdminTitleDraft): string {
  const directors = joinNamesByJobType(draft, "DIRECTOR");
  const producers = joinNamesByJobType(draft, "PRODUCER");
  const writers = joinNamesByJobType(draft, "WRITER");
  const mainCast = draft.cast
    .filter((member) => member.name.trim())
    .slice(0, 3)
    .map((member) => member.name.trim())
    .join(", ");
  const releaseYear = draft.releaseDate ? draft.releaseDate.slice(0, 4) : "";
  const genres = draft.genreSlugs.join(", ");

  return `You are helping prepare an editorial draft for Woke or Not, a catalog that helps users avoid movies and TV shows with stronger woke themes by assigning a manual "woke score".

Your job is to research the title, its cast/crew, production context, marketing, social media reaction, news coverage, controversy reporting, and major story/themes, then produce a proposed woke score from 0-100 for human review.

Important rules:
- Be factual, concise, and useful for viewers trying to avoid woke media.
- Do not moralize or advocate for or against the title.
- Treat this as an editorial classification task, not a political argument.
- Base conclusions on specific evidence when possible.
- Distinguish clearly between:
  1. confirmed facts
  2. widely reported claims
  3. social media reactions or public sentiment
  4. speculation or weak evidence
- If evidence is weak or mixed, say so.
- Do not invent controversies or motivations.
- Do not assume a title is "woke" or "not woke" based only on race, sex, or identity of cast members. Explain why a detail matters in context.
- Focus on actual content, production choices, marketing, creator statements, public reaction, and reported controversy.
- The score is a recommendation for human review, not an automatic final score.

Research requirements:
- Look for plot and theme summaries from reliable sources.
- Look for social media posts and public reaction about the title.
- Look for broader news/web coverage about controversy around the title.
- Search specifically for "woke" complaints, anti-woke criticism, backlash, and similar framing.
- Look for interviews or comments from cast, director, producer, and writers.
- Check whether the director, producer, or writer has a known track record of making identity-driven, activist, politically themed, or otherwise publicly described "woke" projects.

Creator-history guidance:
- Look at the director, producer, and writer first.
- If they have a clear history of making films or shows with strong political, social-justice, activist, or identity-driven themes, treat that as supporting evidence.
- Do not treat prior work alone as decisive proof. It should increase or decrease confidence only when it aligns with the title's actual content, marketing, or public reception.

Public-reaction guidance:
- Search for mainstream news coverage and broader web coverage about controversy or public debate around the title.
- Search specifically for "woke" complaints, anti-woke criticism, backlash, and similar framing.
- Also note when controversy is exaggerated, weakly sourced, or mostly social-media-driven.
- If there is little controversy, say so.

Scoring goal:
Estimate how strongly the title appears to emphasize modern social, political, identity-driven, activist, institutional-critique, or representation-focused themes in a way that an average viewer would likely notice.

General score guide:
- 0-15: little to no noticeable identity/political/social-justice emphasis
- 16-35: mild or occasional presence
- 36-55: moderate, recurring presence
- 56-75: strong and clearly noticeable presence
- 76-100: dominant or central emphasis

When evaluating, consider factors such as:
- representation emphasis in casting or character framing
- race/gender/identity swaps or reinterpretations of known characters, if relevant
- explicit political or activist dialogue
- institutional or traditional-values critique
- identity-driven plotlines or messaging
- marketing or creator statements framing the title around representation/social themes
- audience-visible changes to legacy material that were publicly discussed as ideological or identity-driven
- social-media and news controversy around the title
- whether the director/producer/writer has a pattern of similar work
- whether these elements are central, recurring, or only incidental

Do not overweight any single factor automatically. Context matters.

Return output in exactly this format:
- Do not repeat the "Title details for review" block in your output.
- Do not restate metadata like title, cast, URLs, or synopsis unless needed for explanation.

Title: <title>
Type: <movie or tv show>
Proposed Woke Score: <0-100>

Score Summary:
<2-4 sentence factual summary explaining the proposed score>

Key Evidence:
- <fact or widely reported point>
- <fact or widely reported point>
- <fact or widely reported point>

Public Reaction And Controversy:
- <major social media reaction or absence of reaction>
- <major news coverage or controversy coverage>
- <woke complaints, backlash, or praise if relevant>
- <note if evidence is weak, fringe, or mixed>

Creator Context:
- Director: <name + whether prior work suggests a pattern>
- Producer(s): <name + whether prior work suggests a pattern>
- Writer(s): <name + whether prior work suggests a pattern>

Score Factors:
- Representation / casting choices: <0-100> | <short explanation>
- Political / ideological dialogue: <0-100> | <short explanation>
- Identity-driven story themes: <0-100> | <short explanation>
- Institutional / cultural critique: <0-100> | <short explanation>
- Legacy character or canon changes: <0-100> | <short explanation>
- Public controversy / woke complaints: <0-100> | <short explanation>
- Creator track record context: <0-100> | <short explanation>

Notable Context:
- <important production, casting, remake, adaptation, or controversy context>
- <important audience-visible context>
- <any ambiguity or counterpoint>

Confidence:
<low / medium / high>

Social Post Draft:
<2-4 sentence social-media-ready summary that includes the title, year if known, the proposed woke score, and the main reasons for the score>
- If the proposed woke score is greater than 50, start the social post with "Warning:" and clearly frame the title as one viewers trying to avoid woke media may want to skip.
- If the proposed woke score is 50 or below, do not use a warning label.

Open Questions For Human Review:
- <question or missing info>
- <question or missing info>

If the evidence is insufficient, still provide a tentative score but clearly label low confidence and explain what is missing.

Title details for review:

Title: ${draft.name || "<title not entered yet>"}
Year: ${releaseYear || "<year not entered yet>"}
Type: ${draft.type === "MOVIE" ? "Movie" : "TV show"}
Director(s): ${directors || "<director not entered yet>"}
Producer(s): ${producers || "<producer not entered yet>"}
Writer(s): ${writers || "<writer not entered yet>"}
Main cast: ${mainCast || "<cast not entered yet>"}
Genres: ${genres || "<genres not selected yet>"}
Synopsis: ${draft.synopsis || "<synopsis not entered yet>"}
IMDb URL: ${draft.imdbUrl || "<IMDb URL not entered yet>"}
Rotten Tomatoes URL: ${draft.rottenTomatoesUrl || "<Rotten Tomatoes URL not entered yet>"}
Trailer URL: ${draft.trailerYoutubeUrl || "<trailer URL not entered yet>"}

Specific review questions:
- Is this a legacy adaptation or remake, and were any casting or canon changes a major part of public discussion?
- Were there notable woke complaints or anti-woke criticisms from audiences, commentators, or media coverage?
- Do the director/producer/writer have a track record of similar identity-driven or activist-themed work?
- Are the relevant themes central to the story, or mostly incidental?
`;
}

function joinNamesByJobType(draft: AdminTitleDraft, jobType: "DIRECTOR" | "PRODUCER" | "WRITER"): string {
  return draft.crew
    .filter((member) => member.jobType === jobType && member.name.trim())
    .map((member) => member.name.trim())
    .join(", ");
}
