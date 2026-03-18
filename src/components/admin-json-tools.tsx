"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOptionalAdminSecret } from "@/components/admin-shell";
import { buildAdminTitlePayload, createEmptyAdminTitleDraft } from "@/lib/admin-title-draft";

interface AdminJsonToolsProps {
  secret?: string;
  titleSummaries: Array<{ id: string; name: string; slug: string }>;
}

const emptyImportTemplate = JSON.stringify(
  { titles: [buildAdminTitlePayload(createEmptyAdminTitleDraft())] },
  null,
  2
);

const emptyUpdateTemplate = JSON.stringify(buildAdminTitlePayload(createEmptyAdminTitleDraft()), null, 2);

export function AdminJsonTools({ secret, titleSummaries }: AdminJsonToolsProps) {
  const router = useRouter();
  const adminSecret = useOptionalAdminSecret();
  const activeSecret = secret ?? adminSecret?.secret ?? "";
  const [selectedId, setSelectedId] = useState(titleSummaries[0]?.id ?? "");
  const [updatePayload, setUpdatePayload] = useState(emptyUpdateTemplate);
  const [importPayload, setImportPayload] = useState(emptyImportTemplate);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const titleOptions = useMemo(
    () => titleSummaries.map((title) => ({ label: `${title.name} (${title.slug})`, value: title.id })),
    [titleSummaries]
  );

  async function request(url: string, method: "PUT" | "DELETE" | "POST", body?: unknown) {
    if (!activeSecret) {
      setStatus("Set ADMIN_SECRET before using the raw JSON tools.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": activeSecret
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(`${response.status}: ${data.error ?? "Request failed."}`);
        return;
      }

      setStatus(`${method} success.`);
      router.refresh();
    } catch (error) {
      setStatus(`Request failed: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  function parseJsonPayload(raw: string): unknown | null {
    try {
      return JSON.parse(raw);
    } catch {
      setStatus("Invalid JSON payload.");
      return null;
    }
  }

  return (
    <section className="grid gap-5 rounded-2xl border border-line bg-card p-5">
      <div className="grid gap-2">
        <h2 className="font-display text-2xl">Raw JSON Tools</h2>
        <p className="text-sm text-fg/75">
          Keep these for manual updates, deletes, and bulk imports after the structured form handles most title
          creation.
        </p>
      </div>

      <div className="grid gap-3">
        <h3 className="font-semibold">Update title</h3>
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
        >
          {titleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <textarea
          value={updatePayload}
          onChange={(event) => setUpdatePayload(event.target.value)}
          rows={14}
          className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs"
        />
        <button
          type="button"
          disabled={loading || !selectedId}
          onClick={() => {
            const body = parseJsonPayload(updatePayload);
            if (!body) return;
            request(`/api/admin/titles/${selectedId}`, "PUT", body);
          }}
          className="w-fit rounded-full border border-fg bg-fg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Update
        </button>
      </div>

      <div className="grid gap-3">
        <h3 className="font-semibold">Delete title</h3>
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
        >
          {titleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={loading || !selectedId}
          onClick={() => request(`/api/admin/titles/${selectedId}`, "DELETE")}
          className="w-fit rounded-full border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <div className="grid gap-3">
        <h3 className="font-semibold">Bulk import</h3>
        <textarea
          value={importPayload}
          onChange={(event) => setImportPayload(event.target.value)}
          rows={14}
          className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            const body = parseJsonPayload(importPayload);
            if (!body) return;
            request("/api/admin/import", "POST", body);
          }}
          className="w-fit rounded-full border border-indigo-500 px-4 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50"
        >
          Import
        </button>
      </div>

      {status ? (
        <output className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-fg/80">{status}</output>
      ) : null}
    </section>
  );
}
