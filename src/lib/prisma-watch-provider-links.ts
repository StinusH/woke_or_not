import { Prisma } from "@prisma/client";

const MISSING_WATCH_PROVIDER_LINKS_COLUMN = "Title.watchProviderLinks";

export function isMissingWatchProviderLinksColumn(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2022") {
    return false;
  }

  const meta = error.meta as Record<string, unknown> | undefined;
  const column = typeof meta?.column === "string" ? meta.column : "";

  return column.includes(MISSING_WATCH_PROVIDER_LINKS_COLUMN) || error.message.includes(MISSING_WATCH_PROVIDER_LINKS_COLUMN);
}
