import { adminTitleOrderBy, parseAdminTitleSort } from "@/lib/admin-title-sort";

describe("parseAdminTitleSort", () => {
  it("defaults to most recent when sort is missing or invalid", () => {
    expect(parseAdminTitleSort()).toBe("updated_desc");
    expect(parseAdminTitleSort("unknown")).toBe("updated_desc");
  });
});

describe("adminTitleOrderBy", () => {
  it("sorts by woke score descending when requested", () => {
    expect(adminTitleOrderBy("woke_desc")).toEqual([
      { wokeScore: "desc" },
      { updatedAt: "desc" },
      { name: "asc" }
    ]);
  });

  it("sorts by most recent updates by default", () => {
    expect(adminTitleOrderBy("updated_desc")).toEqual([{ updatedAt: "desc" }, { name: "asc" }]);
  });
});
