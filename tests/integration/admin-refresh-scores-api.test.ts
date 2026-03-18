import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedRefreshExternalScores = vi.fn();

vi.mock("@/lib/admin-mutations", () => ({
  refreshExternalScores: mockedRefreshExternalScores
}));

describe("admin refresh scores api route", () => {
  beforeEach(() => {
    mockedRefreshExternalScores.mockReset();
    process.env.ADMIN_SECRET = "secret";
  });

  it("POST /api/admin/titles/[id]/refresh-external-scores rejects unauthorized requests", async () => {
    const { POST } = await import("@/app/api/admin/titles/[id]/refresh-external-scores/route");
    const response = await POST(new NextRequest("http://localhost:3000/api/admin/titles/abc/refresh-external-scores"), {
      params: Promise.resolve({ id: "abc" })
    });

    expect(response.status).toBe(401);
    expect(mockedRefreshExternalScores).not.toHaveBeenCalled();
  });

  it("POST /api/admin/titles/[id]/refresh-external-scores refreshes external scores", async () => {
    mockedRefreshExternalScores.mockResolvedValue({
      id: "abc",
      name: "The Little Mermaid",
      imdbRating: 7.2,
      rottenTomatoesCriticsScore: 67,
      rottenTomatoesAudienceScore: 94,
      rottenTomatoesUrl: "https://www.rottentomatoes.com/m/the_little_mermaid_2023",
      externalScoresUpdatedAt: new Date("2026-03-17T14:00:00.000Z")
    });

    const { POST } = await import("@/app/api/admin/titles/[id]/refresh-external-scores/route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/titles/abc/refresh-external-scores", {
        headers: { "x-admin-secret": "secret" }
      }),
      {
        params: Promise.resolve({ id: "abc" })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.imdbRating).toBe(7.2);
    expect(body.data.externalScoresUpdatedAt).toBe("2026-03-17T14:00:00.000Z");
    expect(mockedRefreshExternalScores).toHaveBeenCalledTimes(1);
  });
});
