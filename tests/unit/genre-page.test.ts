import { describe, expect, it, vi } from "vitest";
import GenrePage from "@/app/genres/[slug]/page";

const { mockedRedirect } = vi.hoisted(() => ({
  mockedRedirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  })
}));

vi.mock("next/navigation", () => ({
  redirect: mockedRedirect
}));

describe("GenrePage", () => {
  it("redirects legacy genre routes to search with the selected genre appended", async () => {
    await expect(
      GenrePage({
        params: Promise.resolve({ slug: "animation" }),
        searchParams: Promise.resolve({
          q: "robot",
          platform: ["Netflix", "Max"],
          genre: "comedy",
          sort: "recommended"
        })
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockedRedirect).toHaveBeenCalledWith(
      "/search?q=robot&platform=Netflix&platform=Max&sort=recommended&genre=comedy&genre=animation"
    );
  });
});
