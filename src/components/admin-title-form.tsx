"use client";

import React, { useEffect, useMemo, useState, type Dispatch, type InputHTMLAttributes, type ReactNode, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useOptionalAdminSecret } from "@/components/admin-shell";
import {
  applyMetadataAutofill,
  buildAdminTitlePayload,
  createEmptyAdminTitleDraft,
  syncSlugFromName,
  type AdminTitleDraft,
  type GenreOption
} from "@/lib/admin-title-draft";
import { buildAdminAiResearchPrompt } from "@/lib/admin-ai-prompt";
import { parseAdminAiResearchResponse } from "@/lib/admin-ai-response";
import type { TitleMetadataSearchResult } from "@/lib/title-metadata";

interface AdminTitleFormProps {
  secret?: string;
  genres: GenreOption[];
  metadataEnabled: boolean;
  initialDraft?: AdminTitleDraft;
  titleId?: string;
  mode?: "create" | "update";
  titleHeading?: string;
  titleDescription?: string;
  showAiPromptSection?: boolean;
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
const WOKE_FACTOR_LABEL_MAX_LENGTH = 100;
const WOKE_FACTOR_NOTES_MAX_LENGTH = 320;
const WOKE_SUMMARY_MAX_LENGTH = 750;

const crewJobTypes = ["DIRECTOR", "WRITER", "PRODUCER"] as const;

export function AdminTitleForm({
  secret: providedSecret,
  genres,
  metadataEnabled,
  initialDraft,
  titleId,
  mode = "create",
  titleHeading,
  titleDescription,
  showAiPromptSection = false
}: AdminTitleFormProps) {
  const router = useRouter();
  const adminSecret = useOptionalAdminSecret();
  const secret = providedSecret ?? adminSecret?.secret ?? "";
  const resetDraft = initialDraft ?? createEmptyAdminTitleDraft();
  const [draft, setDraft] = useState<AdminTitleDraft>(() => resetDraft);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupYear, setLookupYear] = useState("");
  const [lookupType, setLookupType] = useState<"" | "MOVIE" | "TV_SHOW">("");
  const [candidates, setCandidates] = useState<TitleMetadataSearchResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [hydrating, setHydrating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [promptDirty, setPromptDirty] = useState(false);
  const [promptStatus, setPromptStatus] = useState<string | null>(null);
  const [aiResponseText, setAiResponseText] = useState("");
  const [aiResponseStatus, setAiResponseStatus] = useState<string | null>(null);
  const [socialPostDraft, setSocialPostDraft] = useState("");
  const generatedPrompt = useMemo(() => buildAdminAiResearchPrompt(draft), [draft]);

  useEffect(() => {
    if (!showAiPromptSection) {
      return;
    }

    if (!promptDirty) {
      setPromptText(generatedPrompt);
    }
  }, [generatedPrompt, promptDirty, showAiPromptSection]);

  async function searchMetadata() {
    if (!secret) {
      setStatus("Set ADMIN_SECRET before searching metadata.");
      return;
    }

    if (!metadataEnabled) {
      setStatus("TMDb credentials are not configured on the server.");
      return;
    }

    setSearching(true);
    setStatus(null);

    try {
      const params = new URLSearchParams({ q: lookupQuery.trim() });
      if (lookupYear.trim()) params.set("year", lookupYear.trim());
      if (lookupType) params.set("type", lookupType);

      const response = await fetch(`/api/admin/metadata/search?${params.toString()}`, {
        headers: { "x-admin-secret": secret }
      });
      const body = await response.json();

      if (!response.ok) {
        setStatus(`${response.status}: ${body.error ?? "Lookup failed."}`);
        return;
      }

      setCandidates(body.data ?? []);
      setStatus(body.data?.length ? "Choose a result to autofill the form." : "No metadata matches found.");
    } catch (error) {
      setStatus(`Lookup failed: ${String(error)}`);
    } finally {
      setSearching(false);
    }
  }

  async function hydrateCandidate(candidate: TitleMetadataSearchResult) {
    if (!secret) {
      setStatus("Set ADMIN_SECRET before loading metadata.");
      return;
    }

    setHydrating(candidate.providerId);
    setStatus(null);

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
        setStatus(`${response.status}: ${body.error ?? "Unable to load metadata."}`);
        return;
      }

      setDraft((current) => applyMetadataAutofill(current, body.data, genres));
      setStatus(`Autofilled ${candidate.name}. Review the values and add the editorial fields before saving.`);
    } catch (error) {
      setStatus(`Unable to load metadata: ${String(error)}`);
    } finally {
      setHydrating(null);
    }
  }

  async function submitDraft() {
    if (!secret) {
      setStatus("Set ADMIN_SECRET before creating a title.");
      return;
    }

    setSubmitting(true);
    setStatus(null);

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
        setStatus(`${response.status}: ${body.error ?? `Unable to ${mode} title.`}`);
        return;
      }

      if (mode === "create") {
        setDraft(createEmptyAdminTitleDraft());
        setCandidates([]);
        setLookupQuery("");
        setLookupYear("");
        setLookupType("");
        setAiResponseText("");
        setAiResponseStatus(null);
        setSocialPostDraft("");
        setPromptDirty(false);
        setPromptStatus(null);
      }

      setStatus(mode === "create" ? "Title created successfully." : "Title updated successfully.");
      router.refresh();
    } catch (error) {
      setStatus(`Unable to ${mode} title: ${String(error)}`);
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

  function applyAiResponseToForm() {
    try {
      const parsed = parseAdminAiResearchResponse(aiResponseText);
      setDraft((current) => ({
        ...current,
        wokeScore: parsed.wokeScore,
        wokeSummary: parsed.wokeSummary,
        wokeFactors: parsed.wokeFactors
      }));
      setSocialPostDraft(parsed.socialPostDraft);
      setAiResponseStatus("AI response applied to editorial fields.");
    } catch (error) {
      setAiResponseStatus(`Unable to apply AI response: ${String(error)}`);
    }
  }

  return (
    <section className="grid gap-5 rounded-2xl border border-line bg-card p-5">
      <div className="grid gap-2">
        <h2 className="font-display text-2xl">{titleHeading ?? (mode === "create" ? "Create Title" : "Edit Title")}</h2>
        <p className="text-sm text-fg/75">
          {titleDescription ??
            (mode === "create"
              ? "Search TMDb by title, select the right match, then finish the manual editorial fields before saving."
              : "Update title metadata, editorial notes, and external links. You can still use TMDb lookup to refresh base metadata." )}
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-line bg-bgSoft/60 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm font-medium md:col-span-2">
            Title lookup
            <input
              value={lookupQuery}
              onChange={(event) => setLookupQuery(event.target.value)}
              placeholder="Enter a movie or TV title"
              className="rounded-lg border border-line bg-bg px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Year
            <input
              value={lookupYear}
              onChange={(event) => setLookupYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))}
              placeholder="Optional"
              className="rounded-lg border border-line bg-bg px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Type
            <select
              value={lookupType}
              onChange={(event) => setLookupType(event.target.value as "" | "MOVIE" | "TV_SHOW")}
              className="rounded-lg border border-line bg-bg px-3 py-2"
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
            type="button"
            disabled={searching || !lookupQuery.trim() || !secret}
            onClick={searchMetadata}
            className="w-fit rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {searching ? "Searching..." : "Search metadata"}
          </button>
          {!metadataEnabled ? (
            <p className="text-sm text-amber-700">Set `TMDB_API_READ_ACCESS_TOKEN` or `TMDB_API_KEY` to enable lookup.</p>
          ) : null}
        </div>

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
                    <p className="text-xs uppercase tracking-wide text-fg/60">
                      {candidate.type === "MOVIE" ? "Movie" : "TV show"}
                      {candidate.releaseDate ? ` · ${candidate.releaseDate.slice(0, 4)}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-fg/60">{hydrating === candidate.providerId ? "Loading..." : "Use"}</span>
                </div>
                {candidate.overview ? <p className="text-sm text-fg/75">{candidate.overview}</p> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LabeledInput
          label="Name"
          value={draft.name}
          maxLength={NAME_MAX_LENGTH}
          onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
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
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2"
            />
            <button
              type="button"
              onClick={() => setDraft((current) => ({ ...current, slug: syncSlugFromName(current.name) }))}
              className="rounded-full border border-line px-3 py-2 text-xs font-semibold"
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
            className="rounded-lg border border-line bg-bg px-3 py-2"
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
            className="rounded-lg border border-line bg-bg px-3 py-2"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
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
                watchProviders: parseWatchProviders(event.target.value)
              }))
            }
            rows={4}
            placeholder={"One provider per line\nNetflix\nDisney Plus"}
            className="rounded-lg border border-line bg-bg px-3 py-2"
          />
          <span className="text-xs text-fg/60">
            Metadata autofill will populate these when TMDb has streaming data for the configured region.
          </span>
        </label>
      </div>

      <div className="grid gap-3">
        <div>
          <h3 className="font-semibold">Genres</h3>
          <p className="text-sm text-fg/75">Pick at least one genre. Metadata lookup will preselect matches when it can.</p>
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

      <RowEditor
        title="Cast"
        description="Add the main credited cast."
        onAdd={() =>
          setDraft((current) => ({
            ...current,
            cast: [...current.cast, { name: "", roleName: "", billingOrder: current.cast.length + 1 }]
          }))
        }
      >
        {draft.cast.map((entry, index) => (
          <div key={`cast-${index}`} className="grid gap-2 md:grid-cols-[1.2fr_1.2fr_120px_auto]">
            <div className="grid gap-1">
              <input
                value={entry.name}
                onChange={(event) => updateListEntry(setDraft, "cast", index, "name", event.target.value)}
                placeholder="Actor"
                className="rounded-lg border border-line bg-bg px-3 py-2"
              />
              <CharacterCounter value={entry.name} maxLength={CAST_NAME_MAX_LENGTH} />
            </div>
            <div className="grid gap-1">
              <input
                value={entry.roleName}
                onChange={(event) => updateListEntry(setDraft, "cast", index, "roleName", event.target.value)}
                placeholder="Role"
                className="rounded-lg border border-line bg-bg px-3 py-2"
              />
              <CharacterCounter value={entry.roleName} maxLength={CAST_ROLE_MAX_LENGTH} />
            </div>
            <input
              value={String(entry.billingOrder)}
              onChange={(event) =>
                updateListEntry(setDraft, "cast", index, "billingOrder", Number(event.target.value.replace(/[^\d]/g, "") || "1"))
              }
              className="rounded-lg border border-line bg-bg px-3 py-2"
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
                className="rounded-lg border border-line bg-bg px-3 py-2"
              />
              <CharacterCounter value={entry.name} maxLength={CREW_NAME_MAX_LENGTH} />
            </div>
            <select
              value={entry.jobType}
              onChange={(event) => updateListEntry(setDraft, "crew", index, "jobType", event.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2"
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

      <div className="grid gap-4 rounded-xl border border-line bg-bgSoft/60 p-4">
        <div>
          <h3 className="font-semibold">Editorial Fields</h3>
          <p className="text-sm text-fg/75">These remain manual even when metadata is auto-filled.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledInput
            label="Woke score"
            inputMode="numeric"
            value={String(draft.wokeScore)}
            onChange={(value) => setDraft((current) => ({ ...current, wokeScore: Number(value.replace(/[^\d]/g, "") || "0") }))}
          />
          <TextArea
            label="Woke summary"
            value={draft.wokeSummary}
            rows={4}
            maxLength={WOKE_SUMMARY_MAX_LENGTH}
            onChange={(value) => setDraft((current) => ({ ...current, wokeSummary: value }))}
          />
        </div>
        <RowEditor
          title="Woke factors"
          description="Use these to explain how the score was derived."
          onAdd={() =>
            setDraft((current) => ({
              ...current,
              wokeFactors: [
                ...current.wokeFactors,
                { label: "", weight: 0, displayOrder: current.wokeFactors.length + 1, notes: "" }
              ]
            }))
          }
        >
          {draft.wokeFactors.map((entry, index) => (
            <div key={`factor-${index}`} className="grid gap-2 md:grid-cols-[1.4fr_120px_1.8fr_auto]">
              <div className="grid gap-1">
                <input
                  value={entry.label}
                  onChange={(event) => updateListEntry(setDraft, "wokeFactors", index, "label", event.target.value)}
                  placeholder="Factor label"
                  className="rounded-lg border border-line bg-bg px-3 py-2"
                />
                <CharacterCounter value={entry.label} maxLength={WOKE_FACTOR_LABEL_MAX_LENGTH} />
              </div>
              <input
                value={String(entry.weight)}
                onChange={(event) =>
                  updateListEntry(
                    setDraft,
                    "wokeFactors",
                    index,
                    "weight",
                    Number(event.target.value.replace(/[^\d]/g, "") || "0")
                  )
                }
                className="rounded-lg border border-line bg-bg px-3 py-2"
              />
              <div className="grid gap-1">
                <input
                  value={entry.notes}
                  onChange={(event) => updateListEntry(setDraft, "wokeFactors", index, "notes", event.target.value)}
                  placeholder="Notes"
                  className="rounded-lg border border-line bg-bg px-3 py-2"
                />
                <CharacterCounter value={entry.notes} maxLength={WOKE_FACTOR_NOTES_MAX_LENGTH} />
              </div>
              <RemoveButton onClick={() => removeListEntry(setDraft, "wokeFactors", index)} />
            </div>
          ))}
        </RowEditor>
      </div>

      {showAiPromptSection ? (
        <section className="grid gap-4 rounded-2xl border border-line bg-card p-5">
          <div className="grid gap-2">
            <h3 className="font-display text-xl">AI Research Prompt</h3>
            <p className="text-sm text-fg/75">
              This prompt is generated from the title metadata above. Edit it if needed, then copy it into your AI tool.
            </p>
          </div>

          <label className="grid gap-1 text-sm font-medium">
            Prompt text
            <textarea
              value={promptText}
              onChange={(event) => {
                setPromptText(event.target.value);
                setPromptDirty(true);
                setPromptStatus(null);
              }}
              rows={24}
              className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyPrompt}
              className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Copy prompt
            </button>
            <button
              type="button"
              onClick={() => {
                setPromptText(generatedPrompt);
                setPromptDirty(false);
                setPromptStatus("Prompt reset to generated text.");
              }}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
            >
              Reset to generated
            </button>
          </div>

          {promptStatus ? (
            <output className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-fg/80">
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
              }}
              rows={22}
              className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs"
              placeholder="Paste the AI output here, then apply it to the editorial fields."
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!aiResponseText.trim()}
              onClick={applyAiResponseToForm}
              className="rounded-full border border-fg bg-fg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Apply response to form
            </button>
            <button
              type="button"
              onClick={() => {
                setAiResponseText("");
                setAiResponseStatus(null);
                setSocialPostDraft("");
              }}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
            >
              Clear response
            </button>
          </div>

          {aiResponseStatus ? (
            <output className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-fg/80">
              {aiResponseStatus}
            </output>
          ) : null}

          {socialPostDraft ? (
            <div className="grid gap-3 rounded-xl border border-line bg-bgSoft/50 p-4">
              <div className="grid gap-1">
                <h4 className="font-semibold">Social Post Draft</h4>
                <p className="text-sm text-fg/75">Extracted from the AI response for quick copying.</p>
              </div>

              <div className="rounded-lg border border-line bg-bg px-3 py-3 text-sm whitespace-pre-wrap">
                {socialPostDraft}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copySocialPostDraft}
                  className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white"
                >
                  Copy social post
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={submitDraft}
          className="w-fit rounded-full border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
            setPromptDirty(false);
            setPromptStatus(null);
            setAiResponseText("");
            setAiResponseStatus(null);
            setSocialPostDraft("");
          }}
          className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
        >
          Reset form
        </button>
      </div>

      {status ? (
        <output className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-fg/80">{status}</output>
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
  maxLength
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
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
        className="rounded-lg border border-line bg-bg px-3 py-2"
      />
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
        className="rounded-lg border border-line bg-bg px-3 py-2"
      />
    </label>
  );
}

function CharacterCounter({ value, maxLength }: { value: string; maxLength: number }) {
  const isOverLimit = value.length > maxLength;

  return <span className={`text-xs font-medium ${isOverLimit ? "text-red-600" : "text-fg/60"}`}>{value.length}/{maxLength}</span>;
}

function RowEditor({
  title,
  description,
  onAdd,
  children
}: {
  title: string;
  description: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-line bg-bgSoft/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-fg/75">{description}</p>
        </div>
        <button type="button" onClick={onAdd} className="rounded-full border border-line px-3 py-2 text-xs font-semibold">
          Add row
        </button>
      </div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full border border-line px-3 py-2 text-xs font-semibold">
      Remove
    </button>
  );
}

function updateListEntry(
  setDraft: Dispatch<SetStateAction<AdminTitleDraft>>,
  key: "cast" | "crew" | "wokeFactors",
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
  key: "cast" | "crew" | "wokeFactors",
  index: number
) {
  setDraft((current) => ({
    ...current,
    [key]: current[key].filter((_, entryIndex) => entryIndex !== index)
  }));
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
