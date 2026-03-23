import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedGetGenresWithCount = vi.fn();

vi.mock("@/lib/catalog", () => ({
  getGenresWithCount: mockedGetGenresWithCount
}));

describe("genres api route", () => {
  beforeEach(() => {
    mockedGetGenresWithCount.mockReset();
  });

  it("GET /api/genres returns genres", async () => {
    mockedGetGenresWithCount.mockResolvedValue([{ id: "1", slug: "action", name: "Action", count: 4 }]);

    const { GET } = await import("@/app/api/genres/route");
    const response = await GET(new Request("http://localhost:3000/api/genres?type=MOVIE"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([{ id: "1", slug: "action", name: "Action", count: 4 }]);
    expect(mockedGetGenresWithCount).toHaveBeenCalledWith(expect.objectContaining({ type: "MOVIE" }));
  });
});
