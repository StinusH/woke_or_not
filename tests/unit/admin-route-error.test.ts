import { Prisma } from "@prisma/client";
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { getAdminRouteError } from "@/lib/admin-route-error";

describe("getAdminRouteError", () => {
  it("formats zod issues into a readable API error", () => {
    const schema = z.object({
      releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      genreSlugs: z.array(z.string()).min(1)
    });

    const result = schema.safeParse({
      releaseDate: "2023",
      genreSlugs: []
    });

    expect(result.success).toBe(false);
    const error = getAdminRouteError(result.error, "Fallback");

    expect(error.status).toBe(400);
    expect(error.error).toContain("releaseDate");
    expect(error.error).toContain("genreSlugs");
  });

  it("maps duplicate slug errors to a conflict response", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test"
    });

    const response = getAdminRouteError(error, "Fallback");

    expect(response).toEqual({
      error: "A title with this slug already exists.",
      status: 409
    });
  });
});
