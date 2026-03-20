import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("admin social image api route", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("GET /api/admin/social-image rejects missing posterUrl", async () => {
    const { GET } = await import("@/app/api/admin/social-image/route");
    const response = await GET(new NextRequest("http://localhost:3000/api/admin/social-image"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("posterUrl is required.");
  });

  it("GET /api/admin/social-image rejects unsupported hosts", async () => {
    const { GET } = await import("@/app/api/admin/social-image/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/admin/social-image?posterUrl=https://example.com/poster.jpg")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("not supported");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("GET /api/admin/social-image returns a generated png for supported poster hosts", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(new Uint8Array([255, 216, 255]), {
        status: 200,
        headers: { "content-type": "image/jpeg" }
      })
    );

    const { GET } = await import("@/app/api/admin/social-image/route");
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/api/admin/social-image?posterUrl=https://image.tmdb.org/t/p/w780/matrix.jpg&focusY=42"
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
    expect(global.fetch).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ cache: "no-store" }));
  });
});
