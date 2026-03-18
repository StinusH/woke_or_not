import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedGetTitleCards = vi.fn();
const mockedGetTitleDetail = vi.fn();

vi.mock("@/lib/catalog", () => ({
  getTitleCards: mockedGetTitleCards,
  getTitleDetail: mockedGetTitleDetail
}));

describe("titles api routes", () => {
  beforeEach(() => {
    mockedGetTitleCards.mockReset();
    mockedGetTitleDetail.mockReset();
  });

  it("GET /api/titles returns paginated data", async () => {
    mockedGetTitleCards.mockResolvedValue({
      data: [],
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 1
    });

    const { GET } = await import("@/app/api/titles/route");
    const response = await GET(new NextRequest("http://localhost:3000/api/titles?type=MOVIE"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ page: 1, total: 0 });
    expect(mockedGetTitleCards).toHaveBeenCalledTimes(1);
  });

  it("GET /api/titles/[slug] returns 404 for missing title", async () => {
    mockedGetTitleDetail.mockResolvedValue(null);

    const { GET } = await import("@/app/api/titles/[slug]/route");
    const response = await GET(new Request("http://localhost:3000/api/titles/unknown"), {
      params: Promise.resolve({ slug: "unknown" })
    });

    expect(response.status).toBe(404);
  });
});
