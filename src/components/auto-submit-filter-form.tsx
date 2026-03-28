"use client";

import React, { ReactNode, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface AutoSubmitFilterFormProps {
  action: string;
  children: ReactNode;
}

export function AutoSubmitFilterForm({ action, children }: AutoSubmitFilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function buildHref(form: HTMLFormElement): string {
    const next = new URLSearchParams();
    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
      if (typeof value !== "string") continue;

      const normalized = value.trim();
      if (!normalized || key === "page") continue;
      next.append(key, normalized);
    }

    const qs = next.toString();
    return qs ? `${action}?${qs}` : action;
  }

  function navigate(form: HTMLFormElement) {
    const href = buildHref(form);
    const currentQs = searchParams.toString();
    const currentHref = currentQs ? `${action}?${currentQs}` : action;

    if (href === currentHref) return;
    router.replace(href, { scroll: false });
  }

  function scheduleNavigation(form: HTMLFormElement) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      navigate(form);
    }, 300);
  }

  return (
    <form
      action={action}
      method="GET"
      className="mb-6 rounded-xl border border-line bg-card p-4 shadow-card"
      onSubmit={(event) => {
        event.preventDefault();
        navigate(event.currentTarget);
      }}
      onChange={(event) => scheduleNavigation(event.currentTarget)}
      onInput={(event) => scheduleNavigation(event.currentTarget)}
    >
      {children}
    </form>
  );
}
