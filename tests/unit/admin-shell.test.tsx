// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminShell } from "@/components/admin-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin"
}));

describe("AdminShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("toggles the admin secret visibility", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <div>Child content</div>
      </AdminShell>
    );

    const input = screen.getByLabelText("Admin secret");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show admin secret" }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide admin secret" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("marks the admin secret input to discourage browser autofill", () => {
    render(
      <AdminShell>
        <div>Child content</div>
      </AdminShell>
    );

    const input = screen.getByLabelText("Admin secret");
    expect(input).toHaveAttribute("name", "admin-secret-phrase");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(input).toHaveAttribute("data-1p-ignore", "true");
    expect(input).toHaveAttribute("data-bwignore", "true");
    expect(input).toHaveAttribute("data-form-type", "other");
    expect(input).toHaveAttribute("data-lpignore", "true");
    expect(input).toHaveAttribute("spellcheck", "false");
  });

  it("clears a persisted admin secret", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("woke-or-not-admin-secret", "stale-secret");

    render(
      <AdminShell>
        <div>Child content</div>
      </AdminShell>
    );

    const input = screen.getByLabelText("Admin secret");
    expect(input).toHaveValue("stale-secret");

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(input).toHaveValue("");
    expect(window.localStorage.getItem("woke-or-not-admin-secret")).toBeNull();
  });
});
