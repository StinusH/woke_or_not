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
});
