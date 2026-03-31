"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type InputHTMLAttributes,
  type ReactNode,
  type SetStateAction
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptionalAdminSecret } from "@/components/admin-shell";
import {
  applyMetadataAutofill,
  buildAdminTitlePayload,
  createEmptyAdminTitleDraft,
  guessRottenTomatoesUrl,
  normalizeAdminDraftWokeFactors,
  syncSlugFromName,
  type AdminTitleDraft,
  type GenreOption
} from "@/lib/admin-title-draft";
import { buildAdminAiResearchPrompt } from "@/lib/admin-ai-prompt";
import { parseAdminAiResearchResponse } from "@/lib/admin-ai-response";
import {
  buildSocialImageUrl,
  calculateSocialImageCrop,
  DEFAULT_SOCIAL_IMAGE_FOCUS_Y,
  SOCIAL_IMAGE_ASPECT_LABEL,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_WIDTH
} from "@/lib/social-image";
import type { TitleMetadataSearchResult } from "@/lib/title-metadata";
import { syncWatchProviderLinks } from "@/lib/watch-providers";
import { calculateWokeScoreFromFactors } from "@/lib/woke-score";

interface AdminTitleFormProps {
  secret?: string;
  genres: GenreOption[];
  metadataEnabled: boolean;
  initialDraft?: AdminTitleDraft;
  wokeFactorWarning?: string;
  titleId?: string;
  mode?: "create" | "update";
  titleHeading?: string;
  titleDescription?: string;
  showAiPromptSection?: boolean;
}

interface FormStatus {
  message: string;
  href?: string;
}

interface ExistingTitleConflict {
  id: string;
  name: string;
  slug: string;
}

const titleTypes = [
  { value: "MOVIE", label: "Movie" },
  { value: "TV_SHOW", label: "TV show" }
] as const;

const NAME_MAX_LENGTH = 160;
const SLUG_MAX_LENGTH = 120;
const SYNOPSIS_MAX_LENGTH = 1200;
const CAST_NAME_MAX_LENGTH = 80;
const CAST_ROLE_MAX_LENGTH = 80;
const CREW_NAME_MAX_LENGTH = 80;
const WOKE_FACTOR_NOTES_MAX_LENGTH = 320;
const WOKE_SUMMARY_MAX_LENGTH = 740;

const crewJobTypes = ["DIRECTOR", "WRITER", "PRODUCER"] as const;

export function AdminTitleForm({
  secret: providedSecret,
  genres,
  metadataEnabled,
  initialDraft,
  wokeFactorWarning,
  titleId,
  mode = "create",
  titleHeading,
  titleDescription,
  showAiPromptSection = false
}: AdminTitleFormProps) {
  const router = useRouter();
  const adminSecret = useOptionalAdminSecret();
  const secret = providedSecret ?? adminSecret?.secret ?? "";
  const resetDraft = useMemo(() => {
    if (!initialDraft) {
      return createEmptyAdminTitleDraft();
    }

    return {
      ...initialDraft,
      wokeFactors: normalizeAdminDraftWokeFactors(
        initialDraft.wokeFactors.map((factor) => ({
          ...factor,
          notes: factor.notes
        }))
      ).factors
    };
  }, [initialDraft]);
  const [draft, setDraft] = useState<AdminTitleDraft>(resetDraft);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [lookupYear, setLookupYear] = useState("");
  const [lookupType, setLookupType] = useState<"" | "MOVIE" | "TV_SHOW">("");
  const [candidates, setCandidates] = useState<TitleMetadataSearchResult[]>([]);
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [metadataAutofillWarning, setMetadataAutofillWarning] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [hydrating, setHydrating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [promptDirty, setPromptDirty] = useState(false);
  const [promptStatus, setPromptStatus] = useState<string | null>(null);
  const [aiResponseText, setAiResponseText] = useState("");
  const [aiResponseStatus, setAiResponseStatus] = useState<string | null>(null);
  const [aiResponseWarning, setAiResponseWarning] = useState<string | null>(null);
  const [aiCalculatedWokeScore, setAiCalculatedWokeScore] = useState<number | null>(null);
  const [socialPostDraft, setSocialPostDraft] = useState("");
  const generatedPrompt = useMemo(() => buildAdminAiResearchPrompt(draft), [draft]);
  const initialDocumentTitleRef = useRef<string>("");

  useEffect(() => {
    initialDocumentTitleRef.current = document.title;

    return () => {
      document.title = initialDocumentTitleRef.current;
    };
  }, []);

  useEffect(() => {
    if (!showAiPromptSection) {
      return;
    }

    if (!promptDirty) {
      setPromptText(generatedPrompt);
    }
  }, [generatedPrompt, promptDirty, showAiPromptSection]);

  useEffect(() => {
    document.title = lastSearchedQuery || initialDocumentTitleRef.current;
  }, [lastSearchedQuery]);

  async function searchMetadata() {
    if (!secret) {
      setStatus({ message: "Set ADMIN_SECRET before searching metadata." });
      return;
    }

    if (!metadataEnabled) {
      setStatus({ message: "TMDb credentials are not configured on the server." });
      return;
    }

    setLastSearchedQuery(lookupQuery.trim());
    setSearching(true);
    setStatus(null);
    setMetadataAutofillWarning(null);

    try {
      const params = new URLSearchParams({ q: lookupQuery.trim() });
      if (lookupYear.trim()) params.set("year", lookupYear.trim());
      if (lookupType) params.set("type", lookupType);

      const response = await fetch(`/api/admin/metadata/search?${params.toString()}`, {
        headers: { "x-admin-secret": secret }
      });
      const body = await response.json();

      if (!response.ok) {
        setStatus({ message: `${response.status}: ${body.error ?? "Lookup failed."}` });
        return;
      }

      setCandidates(body.data ?? []);
      setStatus({ message: body.data?.length ? "Choose a result to autofill the form." : "No metadata matches found." });
    } catch (error) {
      setStatus({ message: `Lookup failed: ${String(error)}` });
    } finally {
      setSearching(false);
    }
  }

  async function hydrateCandidate(candidate: TitleMetadataSearchResult) {
    if (!secret) {
      setStatus({ message: "Set ADMIN_SECRET before loading metadata." });
      return;
    }

    setHydrating(candidate.providerId);
    setStatus(null);
    setMetadataAutofillWarning(null);

    try {
      const params = new URLSearchParams({
        providerId: String(candidate.providerId),
        type: candidate.type
      });

      const response = await fetch(`/api/admin/metadata/item?${params.toString()}`, {
        headers: { "x-admin-secret": secret }
      });
      const body = await response.json();

      if (!response.ok) {
        setStatus({ message: `${response.status}: ${body.error ?? "Unable to load metadata."}` });
        return;
      }

      setDraft((current) => applyMetadataAutofill(current, body.data, genres));
      if (showAiPromptSection) {
        setPromptDirty(false);
        setPromptStatus(null);
      }

      const existingTitle = body.existingTitle as ExistingTitleConflict | null | undefined;
      const conflictMessage =
        mode === "create" && existingTitle && existingTitle.slug === body.data?.slug
          ? `Autofilled ${candidate.name}. Warning: this title may already be in the database as ${existingTitle.name} (${existingTitle.slug}). Double-check before saving.`
          : null;

      setMetadataAutofillWarning(conflictMessage);
      setStatus({
        message: `Autofilled ${candidate.name}. Review the values and add the editorial fields before saving.`
      });
    } catch (error) {
      setStatus({ message: `Unable to load metadata: ${String(error)}` });
    } finally {
      setHydrating(null);
    }
  }

  async function submitDraft() {
    if (!secret) {
      setStatus({ message: "Set ADMIN_SECRET before creating a title." });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setMetadataAutofillWarning(null);

    try {
      const isUpdate = mode === "update" && titleId;
      const response = await fetch(isUpdate ? `/api/admin/titles/${titleId}` : "/api/admin/titles", {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret
        },
        body: JSON.stringify(buildAdminTitlePayload(draft))
      });
      const body = await response.json();

      if (!response.ok) {
        setStatus({ message: `${response.status}: ${body.error ?? `Unable to ${mode} title.`}` });
        return;
      }

      if (mode === "create") {
        setDraft(createEmptyAdminTitleDraft());
        setCandidates([]);
        setLookupQuery("");
        setLastSearchedQuery("");
        setLookupYear("");
        setLookupType("");
        setMetadataAutofillWarning(null);
        setAiResponseText("");
        setAiResponseStatus(null);
        setAiResponseWarning(null);
        setAiCalculatedWokeScore(null);
        setSocialPostDraft("");
        setPromptDirty(false);
        setPromptStatus(null);
      }

      setStatus(
        mode === "create"
          ? {
              message: "Title created successfully.",
              href: typeof body.data?.slug === "string" ? `/title/${body.data.slug}` : undefined
            }
          : { message: "Title updated successfully." }
      );
      router.refresh();
    } catch (error) {
      setStatus({ message: `Unable to ${mode} title: ${String(error)}` });
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(promptText);
      setPromptStatus("Prompt copied.");
    } catch (error) {
      setPromptStatus(`Unable to copy prompt: ${String(error)}`);
    }
  }

  async function copySocialPostDraft() {
    try {
      await navigator.clipboard.writeText(socialPostDraft);
      setAiResponseStatus("Social post draft copied.");
    } catch (error) {
      setAiResponseStatus(`Unable to copy social post draft: ${String(error)}`);
    }
  }

  function refreshPrompt() {
    setPromptText(generatedPrompt);
    setPromptDirty(false);
    setPromptStatus("Prompt refreshed from current title data.");
  }

  function applyAiResponseToForm() {
    try {
      const parsed = parseAdminAiResearchResponse(aiResponseText);
      setDraft((current) => ({
        ...current,
        imdbRating: parsed.imdbRating || current.imdbRating,
        watchProviders: parsed.watchProviders.length > 0 ? parsed.watchProviders : current.watchProviders,
        watchProviderLinks:
          parsed.watchProviders.length > 0
            ? syncWatchProviderLinks(
                parsed.watchProviders,
                parsed.watchProviderLinks.length > 0 ? parsed.watchProviderLinks : current.watchProviderLinks
              )
            : current.watchProviderLinks,
        wokeScore: parsed.wokeScore,
        wokeSummary: parsed.wokeSummary.slice(0, WOKE_SUMMARY_MAX_LENGTH),
        wokeFactors: parsed.wokeFactors
      }));
      setSocialPostDraft(parsed.socialPostDraft);
      setAiResponseWarning(parsed.scoreWarning);
      setAiCalculatedWokeScore(parsed.scoreWarning ? parsed.calculatedWokeScore : null);
      setAiResponseStatus(
        parsed.scoreWarning ? "AI response applied with a score mismatch warning." : "AI response applied to editorial fields."
      );
    } catch (error) {
      setAiResponseStatus(`Unable to apply AI response: ${String(error)}`);
      setAiResponseWarning(null);
      setAiCalculatedWokeScore(null);
    }
  }

  function applyCalculatedAiScore() {
    if (aiCalculatedWokeScore === null) {
      return;
    }

    setDraft((current) => ({
      ...current,
      wokeScore: aiCalculatedWokeScore
    }));
    setAiResponseWarning(null);
    setAiCalculatedWokeScore(null);
    setAiResponseStatus("Woke score updated to the factor-derived score.");
  }

  return (
    <section className="grid gap-5 rounded-xl border border-line bg-card p-5 shadow-card">
      <div className="grid gap-2">
        <h2 className="font-display text-xl font-bold text-fg">{titleHeading ?? (mode === "create" ? "Create Title" : "Edit Title")}</h2>
        <p className="text-sm text-fgMuted">
          {titleDescription ??
            (mode === "create"
              ? "Search TMDb by title, select the right match, then finish the manual editorial fields before saving."
              : "Update title metadata, editorial notes, and external links. You can still use TMDb lookup to refresh base metadata." )}
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-line bg-bgSoft/60 p-4">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();

            if (searching || !lookupQuery.trim()) {
              return;
            }

            void searchMetadata();
          }}
        >
          <div className="grid gap-3 md:grid-cols-4">
            <label className="grid gap-1 text-sm font-medium md:col-span-2">
              Title lookup
              <input
                value={lookupQuery}
                onChange={(event) => setLookupQuery(event.target.value)}
                placeholder="Enter a movie or TV title"
                className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Year
              <input
                value={lookupYear}
                onChange={(event) => setLookupYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                placeholder="Optional"
                className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Type
              <select
                value={lookupType}
                onChange={(event) => setLookupType(event.target.value as "" | "MOVIE" | "TV_SHOW")}
                className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Any</option>
                {titleTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={searching || !lookupQuery.trim()}
              className="w-fit rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentHover disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search metadata"}
            </button>
            {!metadataEnabled ? (
              <p className="text-sm text-amber-700">Set `TMDB_API_READ_ACCESS_TOKEN` or `TMDB_API_KEY` to enable lookup.</p>
            ) : null}
            {metadataAutofillWarning ? (
              <output
                role="alert"
                className="min-w-0 flex-1 rounded-lg border border-red-500 bg-red-50 px-3 py-2 font-mono text-xs text-red-700"
              >
                {metadataAutofillWarning}
              </output>
            ) : null}
          </div>
        </form>

        {candidates.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {candidates.map((candidate) => (
              <button
                key={`${candidate.type}-${candidate.providerId}`}
                type="button"
                onClick={() => hydrateCandidate(candidate)}
                disabled={hydrating === candidate.providerId}
                className="grid gap-2 rounded-xl border border-line bg-bg p-3 text-left transition hover:border-accent disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{candidate.name}</p>
                    <p className="text-xs uppercase tracking-wide text-fgMuted">
                      {candidate.type === "MOVIE" ? "Movie" : "TV show"}
                      {candidate.releaseDate ? ` · ${candidate.releaseDate.slice(0, 4)}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-fgMuted">{hydrating === candidate.providerId ? "Loading..." : "Use"}</span>
                </div>
                {candidate.overview ? <p className="text-sm text-fgMuted">{candidate.overview}</p> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {showAiPromptSection ? (
        <section className="grid gap-4 rounded-xl border border-line bg-card p-5 shadow-card">
          <div className="grid gap-2">
            <h3 className="font-display text-xl font-bold text-fg">AI Research Prompt</h3>
            <p className="text-sm text-fgMuted">
              This prompt is generated from the title metadata above. Edit it if needed, then copy it into your AI tool.
            </p>
          </div>

          <div className="grid gap-1">
            <div className="flex items-center justify-between gap-3 text-sm font-medium">
              <label htmlFor="ai-prompt-text">Prompt text</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshPrompt}
                  className="rounded-lg border border-line px-3 py-2 text-sm font-semibold transition hover:bg-bgSoft"
                >
                  Refresh prompt
                </button>
                <IconButton label="Copy prompt" onClick={copyPrompt} disabled={!promptText.trim()} />
              </div>
            </div>
            <textarea
              id="ai-prompt-text"
              value={promptText}
              onChange={(event) => {
                setPromptText(event.target.value);
                setPromptDirty(true);
                setPromptStatus(null);
              }}
              rows={24}
              className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {promptStatus ? (
            <output className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-fgMuted">
              {promptStatus}
            </output>
          ) : null}

          <label className="grid gap-1 text-sm font-medium">
            AI response
            <textarea
              value={aiResponseText}
              onChange={(event) => {
                setAiResponseText(event.target.value);
                setAiResponseStatus(null);
                setAiResponseWarning(null);
                setAiCalculatedWokeScore(null);
              }}
              rows={22}
              className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Paste the AI output here, then apply it to the editorial fields."
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!aiResponseText.trim()}
              onClick={applyAiResponseToForm}
              className="rounded-lg border border-fg bg-fg px-4 py-2 text-sm font-semibold text-white transition hover:bg-fg/90 disabled:opacity-50"
            >
              Apply response to form
            </button>
            <button
              type="button"
              onClick={() => {
                setAiResponseText("");
                setAiResponseStatus(null);
                setAiResponseWarning(null);
                setSocialPostDraft("");
              }}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold transition hover:bg-bgSoft"
            >
              Clear response
            </button>
          </div>

          {aiResponseStatus ? (
            <output className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-fgMuted">
              {aiResponseStatus}
            </output>
          ) : null}

          {aiResponseWarning ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
              <output className="font-mono text-xs text-amber-900">{aiResponseWarning}</output>
              {mode === "create" && aiCalculatedWokeScore !== null ? (
                <button
                  type="button"
                  onClick={applyCalculatedAiScore}
                  className="rounded-lg border border-amber-500 px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
                >
                  Update to correct score
                </button>
              ) : null}
            </div>
          ) : null}

          {socialPostDraft ? (
            <div className="grid gap-3 rounded-xl border border-line bg-bgSoft/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <h4 className="font-semibold">Social Post Draft</h4>
                  <p className="text-sm text-fgMuted">Extracted from the AI response for quick copying.</p>
                </div>
                <IconButton label="Copy social post" onClick={copySocialPostDraft} disabled={!socialPostDraft.trim()} />
              </div>

              <div className="rounded-lg border border-line bg-bg px-3 py-3 text-sm whitespace-pre-wrap">
                {socialPostDraft}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <LabeledInput
          label="Name"
          value={draft.name}
          maxLength={NAME_MAX_LENGTH}
          onChange={(value) =>
            setDraft((current) => {
              const currentRottenTomatoesGuess = guessRottenTomatoesUrl(current.name);
              const nextRottenTomatoesGuess = guessRottenTomatoesUrl(value);
              const shouldUpdateRottenTomatoesUrl =
                !current.rottenTomatoesUrl.trim() || current.rottenTomatoesUrl === currentRottenTomatoesGuess;

              return {
                ...current,
                name: value,
                rottenTomatoesUrl: shouldUpdateRottenTomatoesUrl ? nextRottenTomatoesGuess : current.rottenTomatoesUrl
              };
            })
          }
        />
        <label className="grid gap-1 text-sm font-medium">
          <span className="flex items-center justify-between gap-3">
            <span>Slug</span>
            <CharacterCounter value={draft.slug} maxLength={SLUG_MAX_LENGTH} />
          </span>
          <div className="flex gap-2">
            <input
              aria-label="Slug"
              value={draft.slug}
              onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={() => setDraft((current) => ({ ...current, slug: syncSlugFromName(current.name) }))}
              className="rounded-lg border border-line px-3 py-2 text-xs font-semibold transition hover:bg-bgSoft"
            >
              Regenerate
            </button>
          </div>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Type
          <select
            value={draft.type}
            onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as "MOVIE" | "TV_SHOW" }))}
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {titleTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <LabeledInput
          label="Release date"
          value={draft.releaseDate}
          placeholder="YYYY-MM-DD"
          onChange={(value) => setDraft((current) => ({ ...current, releaseDate: value }))}
        />
        <LabeledInput
          label="Age rating"
          placeholder="PG, TV-Y7, PG-13..."
          value={draft.ageRating}
          onChange={(value) => setDraft((current) => ({ ...current, ageRating: value }))}
        />
        <LabeledInput
          label="Runtime minutes"
          inputMode="numeric"
          value={draft.runtimeMinutes === null ? "" : String(draft.runtimeMinutes)}
          onChange={(value) =>
            setDraft((current) => ({ ...current, runtimeMinutes: value.trim() ? Number(value) : null }))
          }
        />
        <label className="grid gap-1 text-sm font-medium">
          Status
          <select
            value={draft.status}
            onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as "DRAFT" | "PUBLISHED" }))}
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </label>
      </div>

      <TextArea
        label="Synopsis"
        value={draft.synopsis}
        rows={5}
        maxLength={SYNOPSIS_MAX_LENGTH}
        onChange={(value) => setDraft((current) => ({ ...current, synopsis: value }))}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <LabeledInput
          label="Poster URL"
          value={draft.posterUrl}
          onChange={(value) => setDraft((current) => ({ ...current, posterUrl: value }))}
        />
        <LabeledInput
          label="Trailer URL"
          value={draft.trailerYoutubeUrl}
          onChange={(value) => setDraft((current) => ({ ...current, trailerYoutubeUrl: value }))}
        />
        <LabeledInput
          label="IMDb URL"
          value={draft.imdbUrl}
          onChange={(value) => setDraft((current) => ({ ...current, imdbUrl: value }))}
        />
        <LabeledInput
          label="IMDb rating"
          inputMode="decimal"
          placeholder="0.0 - 10.0"
          value={draft.imdbRating}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              imdbRating: value
            }))
          }
        />
        <LabeledInput
          label="Rotten Tomatoes URL"
          value={draft.rottenTomatoesUrl}
          onChange={(value) => setDraft((current) => ({ ...current, rottenTomatoesUrl: value }))}
        />
        <LabeledInput
          label="Rotten Tomatoes critics score"
          inputMode="numeric"
          placeholder="0 - 100"
          value={draft.rottenTomatoesCriticsScore}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              rottenTomatoesCriticsScore: value.replace(/[^\d]/g, "")
            }))
          }
        />
        <LabeledInput
          label="Rotten Tomatoes audience score"
          inputMode="numeric"
          placeholder="0 - 100"
          value={draft.rottenTomatoesAudienceScore}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              rottenTomatoesAudienceScore: value.replace(/[^\d]/g, "")
            }))
          }
        />
        <LabeledInput
          label="Amazon URL"
          value={draft.amazonUrl}
          onChange={(value) => setDraft((current) => ({ ...current, amazonUrl: value }))}
        />
        <label className="grid gap-1 text-sm font-medium md:col-span-2">
          <span>Watch providers</span>
          <textarea
            aria-label="Watch providers"
            value={draft.watchProviders.join("\n")}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                watchProviders: parseWatchProviders(event.target.value),
                watchProviderLinks: syncWatchProviderLinks(
                  parseWatchProviders(event.target.value),
                  current.watchProviderLinks
                )
              }))
            }
            rows={4}
            placeholder={"One provider per line\nNetflix\nDisney Plus"}
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <span className="text-xs text-fgMuted">
            Metadata autofill will populate these when TMDb has streaming data for the configured region.
          </span>
        </label>
      </div>

      <SocialImagePreview posterUrl={draft.posterUrl} slug={draft.slug} />

      <div className="grid gap-3">
        <div>
          <h3 className="font-semibold">Genres</h3>
          <p className="text-sm text-fgMuted">Pick at least one genre. Metadata lookup will preselect matches when it can.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {genres.map((genre) => (
            <label key={genre.slug} className="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={draft.genreSlugs.includes(genre.slug)}
                onChange={() =>
                  setDraft((current) => ({
                    ...current,
                    genreSlugs: current.genreSlugs.includes(genre.slug)
                      ? current.genreSlugs.filter((slug) => slug !== genre.slug)
                      : [...current.genreSlugs, genre.slug]
                  }))
                }
              />
              <span>{genre.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-line bg-bgSoft/60 p-4">
        <div>
          <h3 className="font-semibold">Editorial Fields</h3>
          <p className="text-sm text-fgMuted">The summary stays manual. AI imports keep the proposed score; editing factors recalculates it locally.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledInput
            label="Woke score"
            inputMode="numeric"
            value={String(draft.wokeScore)}
            onChange={() => {}}
            readOnly
            helperText="Read-only. AI imports preserve the proposed score unless you edit the factors."
          />
          <TextArea
            label="Woke summary"
            value={draft.wokeSummary}
            rows={4}
            maxLength={WOKE_SUMMARY_MAX_LENGTH}
            onChange={(value) => setDraft((current) => ({ ...current, wokeSummary: value }))}
          />
        </div>
        <div className="grid gap-3 rounded-xl border border-line bg-bgSoft/60 p-4">
          <div>
            <h3 className="font-semibold">Woke factors</h3>
            <p className="text-sm text-fgMuted">These fixed canonical factors drive the calculated score.</p>
          </div>
          {wokeFactorWarning ? (
            <output className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 font-mono text-xs text-amber-900">
              {wokeFactorWarning}
            </output>
          ) : null}
          <div className="grid gap-2">
          {draft.wokeFactors.map((entry, index) => (
            <div key={entry.label} className="grid gap-2 md:grid-cols-[1.4fr_120px_1.8fr]">
              <label className="grid gap-1 text-sm font-medium">
                <span>{entry.label}</span>
                <input
                  value={entry.label}
                  readOnly
                  className="rounded-lg border border-line bg-bgSoft px-3 py-2 text-sm text-fgMuted"
                />
              </label>
              <input
                aria-label={`${entry.label} weight`}
                value={String(entry.weight)}
                onChange={(event) => updateWokeFactorEntry(setDraft, index, "weight", Number(event.target.value.replace(/[^\d]/g, "") || "0"))}
                className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <div className="grid gap-1">
                <input
                  value={entry.notes}
                  onChange={(event) => updateWokeFactorEntry(setDraft, index, "notes", event.target.value)}
                  placeholder="Notes"
                  className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <CharacterCounter value={entry.notes} maxLength={WOKE_FACTOR_NOTES_MAX_LENGTH} />
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      <RowEditor
        title="Cast"
        description="Add the main credited cast when relevant. Leave blank for titles without credited cast."
        onAdd={() =>
          setDraft((current) => ({
            ...current,
            cast: [...current.cast, { name: "", roleName: "", billingOrder: current.cast.length + 1 }]
          }))
        }
        collapsible
        defaultOpen={false}
      >
        {draft.cast.map((entry, index) => (
          <div key={`cast-${index}`} className="grid gap-2 md:grid-cols-[1.2fr_1.2fr_120px_auto]">
            <div className="grid gap-1">
              <input
                value={entry.name}
                onChange={(event) => updateListEntry(setDraft, "cast", index, "name", event.target.value)}
                placeholder="Actor"
                className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <CharacterCounter value={entry.name} maxLength={CAST_NAME_MAX_LENGTH} />
            </div>
            <div className="grid gap-1">
              <input
                value={entry.roleName}
                onChange={(event) => updateListEntry(setDraft, "cast", index, "roleName", event.target.value)}
                placeholder="Role"
                className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <CharacterCounter value={entry.roleName} maxLength={CAST_ROLE_MAX_LENGTH} />
            </div>
            <input
              value={String(entry.billingOrder)}
              onChange={(event) =>
                updateListEntry(setDraft, "cast", index, "billingOrder", Number(event.target.value.replace(/[^\d]/g, "") || "1"))
              }
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <RemoveButton onClick={() => removeListEntry(setDraft, "cast", index)} />
          </div>
        ))}
      </RowEditor>

      <RowEditor
        title="Crew"
        description="Directors, writers, and producers shown on the detail page."
        onAdd={() =>
          setDraft((current) => ({
            ...current,
            crew: [...current.crew, { name: "", jobType: "WRITER" }]
          }))
        }
      >
        {draft.crew.map((entry, index) => (
          <div key={`crew-${index}`} className="grid gap-2 md:grid-cols-[1.5fr_180px_auto]">
            <div className="grid gap-1">
              <input
                value={entry.name}
                onChange={(event) => updateListEntry(setDraft, "crew", index, "name", event.target.value)}
                placeholder="Crew member"
                className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <CharacterCounter value={entry.name} maxLength={CREW_NAME_MAX_LENGTH} />
            </div>
            <select
              value={entry.jobType}
              onChange={(event) => updateListEntry(setDraft, "crew", index, "jobType", event.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {crewJobTypes.map((jobType) => (
                <option key={jobType} value={jobType}>
                  {jobType}
                </option>
              ))}
            </select>
            <RemoveButton onClick={() => removeListEntry(setDraft, "crew", index)} />
          </div>
        ))}
      </RowEditor>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={submitDraft}
          className="w-fit rounded-lg border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accentHover disabled:opacity-50"
        >
          {submitting ? (mode === "create" ? "Creating..." : "Saving...") : mode === "create" ? "Create title" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(resetDraft);
            setCandidates([]);
            setLookupQuery("");
            setLookupYear("");
            setLookupType("");
            setStatus(null);
            setMetadataAutofillWarning(null);
            setPromptDirty(false);
            setPromptStatus(null);
            setAiResponseText("");
            setAiResponseStatus(null);
            setAiResponseWarning(null);
            setSocialPostDraft("");
          }}
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold transition hover:bg-bgSoft"
        >
          Reset form
        </button>
      </div>

      {status ? (
        <output className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-fgMuted">
          <span>{status.message}</span>
          {status.href ? (
            <Link
              href={status.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              View created page
            </Link>
          ) : null}
        </output>
      ) : null}
    </section>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
  readOnly = false,
  helperText
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  readOnly?: boolean;
  helperText?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {typeof maxLength === "number" ? <CharacterCounter value={value} maxLength={maxLength} /> : null}
      </span>
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        readOnly={readOnly}
        className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 read-only:bg-bgSoft read-only:text-fgMuted"
      />
      {helperText ? <span className="text-xs text-fgMuted">{helperText}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  maxLength
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  maxLength?: number;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {typeof maxLength === "number" ? <CharacterCounter value={value} maxLength={maxLength} /> : null}
      </span>
      <textarea
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={maxLength}
        className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

function CharacterCounter({ value, maxLength }: { value: string; maxLength: number }) {
  const isOverLimit = value.length > maxLength;

  return <span className={`text-xs font-medium ${isOverLimit ? "text-red-600" : "text-fgMuted"}`}>{value.length}/{maxLength}</span>;
}

function RowEditor({
  title,
  description,
  onAdd,
  children,
  collapsible = false,
  defaultOpen = true
}: {
  title: string;
  description: string;
  onAdd: () => void;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const body = (
    <>
      <div className="flex flex-wrap items-start justify-end gap-3">
        <button type="button" onClick={onAdd} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold transition hover:bg-bgSoft">
          Add row
        </button>
      </div>
      <div className="grid gap-2">{children}</div>
    </>
  );

  if (collapsible) {
    return (
      <details open={defaultOpen} className="rounded-xl border border-line bg-bgSoft/60 p-4">
        <summary className="cursor-pointer list-none">
          <div className="pr-8">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-fgMuted">{description}</p>
          </div>
        </summary>
        <div className="mt-3 grid gap-3">{body}</div>
      </details>
    );
  }

  return (
    <div className="grid gap-3 rounded-xl border border-line bg-bgSoft/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-fgMuted">{description}</p>
        </div>
        <button type="button" onClick={onAdd} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold transition hover:bg-bgSoft">
          Add row
        </button>
      </div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold transition hover:border-red-400 hover:text-red-600">
      Remove
    </button>
  );
}

function updateListEntry(
  setDraft: Dispatch<SetStateAction<AdminTitleDraft>>,
  key: "cast" | "crew",
  index: number,
  field: string,
  value: string | number
) {
  setDraft((current) => ({
    ...current,
    [key]: current[key].map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry
    )
  }));
}

function removeListEntry(
  setDraft: Dispatch<SetStateAction<AdminTitleDraft>>,
  key: "cast" | "crew",
  index: number
) {
  setDraft((current) => ({
    ...current,
    [key]: current[key].filter((_, entryIndex) => entryIndex !== index)
  }));
}

function updateWokeFactorEntry(
  setDraft: Dispatch<SetStateAction<AdminTitleDraft>>,
  index: number,
  field: "weight" | "notes",
  value: string | number
) {
  updateWokeFactors(setDraft, (currentFactors) =>
    currentFactors.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [field]: value } : entry))
  );
}

function updateWokeFactors(
  setDraft: Dispatch<SetStateAction<AdminTitleDraft>>,
  update: (factors: AdminTitleDraft["wokeFactors"]) => AdminTitleDraft["wokeFactors"]
) {
  setDraft((current) => {
    const wokeFactors = update(current.wokeFactors).map((factor, index) => ({
      ...factor,
      displayOrder: index + 1
    }));

    return {
      ...current,
      wokeFactors,
      wokeScore: calculateWokeScoreFromFactors(wokeFactors)
    };
  });
}

function parseWatchProviders(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  );
}

function SocialImagePreview({ posterUrl, slug }: { posterUrl: string; slug: string }) {
  const [focusY, setFocusY] = useState(DEFAULT_SOCIAL_IMAGE_FOCUS_Y);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const trimmedPosterUrl = posterUrl.trim();
  const browserSafePosterUrl = useMemo(
    () => (trimmedPosterUrl ? buildNextImageProxyUrl(trimmedPosterUrl) : ""),
    [trimmedPosterUrl]
  );

  useEffect(() => {
    setPreviewError(null);
    setActionStatus(null);
  }, [focusY, trimmedPosterUrl]);

  if (!trimmedPosterUrl) {
    return null;
  }

  async function renderSocialImageBlob(): Promise<Blob> {
    try {
      return await renderSocialImageBlobInBrowser(browserSafePosterUrl || trimmedPosterUrl, focusY);
    } catch (browserError) {
      try {
        return await fetchSocialImageBlobFromRoute(buildSocialImageUrl(trimmedPosterUrl, focusY));
      } catch (routeError) {
        if (routeError instanceof Error) {
          throw routeError;
        }

        throw browserError instanceof Error ? browserError : new Error("Unable to export the social image.");
      }
    }
  }

  async function renderSocialImageBlobInBrowser(posterSrc: string, cropFocusY: number): Promise<Blob> {
    const image = await loadCanvasImage(posterSrc);
    const canvas = document.createElement("canvas");
    canvas.width = SOCIAL_IMAGE_WIDTH;
    canvas.height = SOCIAL_IMAGE_HEIGHT;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("This browser does not support canvas image export.");
    }

    context.fillStyle = "#111827";
    context.fillRect(0, 0, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT);

    const crop = calculateSocialImageCrop(image.naturalWidth, image.naturalHeight, cropFocusY);
    context.drawImage(
      image,
      crop.sourceX,
      crop.sourceY,
      crop.sourceWidth,
      crop.sourceHeight,
      0,
      0,
      SOCIAL_IMAGE_WIDTH,
      SOCIAL_IMAGE_HEIGHT
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Unable to export the social image."));
          return;
        }

        resolve(blob);
      }, "image/png");
    });
  }

  async function fetchSocialImageBlobFromRoute(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      let message = "Unable to load social image.";

      try {
        const body = (await response.json()) as { error?: string };
        if (body.error) {
          message = body.error;
        }
      } catch {
        // Ignore JSON parsing issues and keep the fallback message.
      }

      throw new Error(message);
    }

    return response.blob();
  }

  async function copySocialImage() {
    setActionStatus(null);

    try {
      const blob = await renderSocialImageBlob();
      if (!("ClipboardItem" in window) || !navigator.clipboard?.write) {
        throw new Error("This browser does not support copying images to the clipboard.");
      }

      await navigator.clipboard.write([new window.ClipboardItem({ [blob.type || "image/png"]: blob })]);
      setActionStatus("Social image copied.");
    } catch (error) {
      setActionStatus(`Unable to copy social image: ${String(error instanceof Error ? error.message : error)}`);
    }
  }

  async function downloadSocialImage() {
    setActionStatus(null);

    try {
      const blob = await renderSocialImageBlob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${slug || "title"}-x-social.png`;
      link.click();
      URL.revokeObjectURL(objectUrl);
      setActionStatus("Social image downloaded.");
    } catch (error) {
      setActionStatus(`Unable to download social image: ${String(error instanceof Error ? error.message : error)}`);
    }
  }

  return (
    <section className="grid gap-4 rounded-xl border border-line bg-bgSoft/60 p-4">
      <div className="grid gap-1">
        <h3 className="font-semibold">Social Image</h3>
        <p className="text-sm text-fgMuted">
          Generated from the poster as a {SOCIAL_IMAGE_ASPECT_LABEL} crop for X at {SOCIAL_IMAGE_WIDTH}x{SOCIAL_IMAGE_HEIGHT}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl border border-line bg-bg shadow-sm">
          {previewError ? (
            <div className="flex min-h-44 items-center justify-center px-4 py-8 text-center text-sm text-red-700">
              {previewError}
            </div>
          ) : (
            <img
              src={trimmedPosterUrl}
              alt="Social crop preview"
              className="block aspect-video h-auto w-full bg-bgSoft object-cover"
              style={{ objectPosition: `50% ${focusY}%` }}
              onError={() => setPreviewError("Unable to load the poster image for social preview.")}
              onLoad={() => setPreviewError(null)}
            />
          )}
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            <span className="flex items-center justify-between gap-3">
              <span>Vertical crop position</span>
              <span className="text-xs text-fgMuted">{focusY}%</span>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={focusY}
              onChange={(event) => setFocusY(Number(event.target.value))}
            />
            <span className="text-xs text-fgMuted">
              50% matches the current centered card crop. Move upward for posters where faces sit high in frame.
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copySocialImage}
              className="rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentHover"
            >
              Copy image
            </button>
            <button
              type="button"
              onClick={downloadSocialImage}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold transition hover:bg-bgSoft"
            >
              Download PNG
            </button>
            <a
              href={trimmedPosterUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold transition hover:bg-bgSoft"
            >
              Open poster
            </a>
            <button
              type="button"
              onClick={() => setFocusY(DEFAULT_SOCIAL_IMAGE_FOCUS_Y)}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold transition hover:bg-bgSoft"
            >
              Reset crop
            </button>
          </div>

          {actionStatus ? (
            <output className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-fgMuted">
              {actionStatus}
            </output>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function IconButton({
  label,
  onClick,
  disabled = false
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg text-fg transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
    >
      <CopyIcon className="h-4 w-4" />
    </button>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={className}>
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function loadCanvasImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the poster image for export."));
    image.src = src;
  });
}

function buildNextImageProxyUrl(posterUrl: string): string {
  const params = new URLSearchParams({
    url: posterUrl,
    w: "2048",
    q: "100"
  });

  return `/_next/image?${params.toString()}`;
}
