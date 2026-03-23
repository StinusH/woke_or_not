"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_SECRET_STORAGE_KEY = "woke-or-not-admin-secret";

interface AdminSecretContextValue {
  secret: string;
  setSecret: React.Dispatch<React.SetStateAction<string>>;
}

const AdminSecretContext = createContext<AdminSecretContextValue | null>(null);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_SECRET_STORAGE_KEY);
    if (stored) {
      setSecret(stored);
    }
  }, []);

  useEffect(() => {
    if (secret) {
      window.localStorage.setItem(ADMIN_SECRET_STORAGE_KEY, secret);
      return;
    }

    window.localStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
  }, [secret]);

  const contextValue = useMemo(() => ({ secret, setSecret }), [secret]);

  return (
    <AdminSecretContext.Provider value={contextValue}>
      <div className="grid gap-5">
        <section className="grid gap-4 rounded-xl border border-line bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-1">
              <h1 className="font-display text-3xl font-bold">Admin Console</h1>
              <p className="text-sm text-fgMuted">
                Internal-only title management tools. Requests are protected by `x-admin-secret`.
              </p>
            </div>

            <nav className="flex flex-wrap gap-2">
              <AdminNavLink href="/admin" active={pathname === "/admin"}>
                Manage Titles
              </AdminNavLink>
              <AdminNavLink href="/admin/add-title" active={pathname === "/admin/add-title"}>
                Add Title
              </AdminNavLink>
            </nav>
          </div>

          <form
            className="grid gap-1 text-sm font-medium"
            autoComplete="off"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <label htmlFor="admin-secret-input">Admin secret</label>
            <div className="flex items-stretch gap-2">
              <input
                id="admin-secret-input"
                name="admin-secret-phrase"
                type={showSecret ? "text" : "password"}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="text"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
                data-lpignore="true"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder="Matches ADMIN_SECRET env"
                className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={() => setSecret("")}
                className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-fg transition hover:border-accent hover:text-accent"
              >
                Clear
              </button>
              <button
                type="button"
                aria-label={showSecret ? "Hide admin secret" : "Show admin secret"}
                aria-pressed={showSecret}
                onClick={() => setShowSecret((current) => !current)}
                className="rounded-lg border border-line px-3 py-2 text-fg transition hover:border-accent hover:text-accent"
              >
                {showSecret ? <HiddenSecretIcon /> : <VisibleSecretIcon />}
              </button>
            </div>
            <p className="text-xs font-normal text-fgMuted">
              Must exactly match the current deployment&apos;s <code>ADMIN_SECRET</code>. The value is saved in this
              browser until you clear it.
            </p>
          </form>
        </section>

        {children}
      </div>
    </AdminSecretContext.Provider>
  );
}

export function useAdminSecret() {
  const context = useContext(AdminSecretContext);

  if (!context) {
    throw new Error("useAdminSecret must be used inside AdminShell.");
  }

  return context;
}

export function useOptionalAdminSecret() {
  return useContext(AdminSecretContext);
}

function VisibleSecretIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HiddenSecretIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3 21 21" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.58 5.15A10.79 10.79 0 0 1 12 5.25c6 0 9.75 6.75 9.75 6.75a18.8 18.8 0 0 1-4.13 4.96" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.42 6.42A18.38 18.38 0 0 0 2.25 12s3.75 6.75 9.75 6.75c1.73 0 3.25-.56 4.58-1.42" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 9.88A3 3 0 0 0 14.12 14.12" />
    </svg>
  );
}

function AdminNavLink({
  href,
  active,
  children
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-accent text-white" : "border border-line text-fg hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </Link>
  );
}
