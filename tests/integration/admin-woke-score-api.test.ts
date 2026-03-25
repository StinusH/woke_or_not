import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedUpdateWokeScore = vi.fn();

vi.mock("@/lib/admin-mutations", () => ({
  updateWokeScore: mockedUpdateWokeScore
}));

describe("admin woke score api route", () => {
  beforeEach(() => {
    mockedUpdateWokeScore.mockReset();
    process.env.ADMIN_SECRET = "secret";
  });

  it("PATCH /api/admin/titles/[id]/woke-score rejects unauthorized requests", async () => {
    const { PATCH } = await import("@/app/api/admin/titles/[id]/woke-score/route");
    const response = await PATCH(new NextRequest("http://localhost:3000/api/admin/titles/abc/woke-score"), {
      params: Promise.resolve({ id: "abc" })
    });

    expect(response.status).toBe(401);
    expect(mockedUpdateWokeScore).not.toHaveBeenCalled();
  });

  it("PATCH /api/admin/titles/[id]/woke-score updates the score", async () => {
    mockedUpdateWokeScore.mockResolvedValue({
      id: "abc",
      name: "The Little Mermaid",
      wokeScore: 81,
      updatedAt: new Date("2026-03-17T10:00:00.000Z")
    });

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

    expect(response.status).toBe(200);
    expect(body.data.wokeScore).toBe(81);
    expect(body.data.updatedAt).toBe("2026-03-17T10:00:00.000Z");
    expect(mockedUpdateWokeScore).toHaveBeenCalledTimes(1);
  });
});
