import { pageHref } from "@/lib/url";

describe("pageHref", () => {
  it("preserves repeated platform params across pagination", () => {
    expect(
      pageHref(
        "/search",
        {
          q: "alien",
          platform: ["Netflix", "Max"],
          sort: "score_asc",
          page: 1
        },
        2
      )
    ).toBe("/search?q=alien&platform=Netflix&platform=Max&sort=score_asc&page=2");
  });

  it("preserves repeated genre params across pagination", () => {
    expect(
      pageHref(
        "/search",
        {
          q: "robot",
          genre: ["animation", "comedy"],
          sort: "recommended",
          page: 1
        },
        3
      )
    ).toBe("/search?q=robot&genre=animation&genre=comedy&sort=recommended&page=3");
  });
});
