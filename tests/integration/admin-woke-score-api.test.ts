import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("admin woke score api route", () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = "secret";
  });

  it("PATCH /api/admin/titles/[id]/woke-score rejects unauthorized requests", async () => {
    const { PATCH } = await import("@/app/api/admin/titles/[id]/woke-score/route");
    const response = await PATCH(new NextRequest("http://localhost:3000/api/admin/titles/abc/woke-score"), {
      params: Promise.resolve({ id: "abc" })
    });

    expect(response.status).toBe(401);
  });

  it("PATCH /api/admin/titles/[id]/woke-score rejects direct score edits", async () => {
    const { PATCH } = await import("@/app/api/admin/titles/[id]/woke-score/route");
    const response = await PATCH(
      new NextRequest("http://localhost:3000/api/admin/titles/abc/woke-score", {
        method: "PATCH",
        headers: { "x-admin-secret": "secret", "Content-Type": "application/json" },
        body: JSON.stringify({ wokeScore: 81 })
      }),
      {
        params: Promise.resolve({ id: "abc" })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Direct woke score edits are not supported here. Update the title form instead.");
  });
});
