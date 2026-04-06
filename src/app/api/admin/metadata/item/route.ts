import { NextRequest, NextResponse } from "next/server";
import { ADMIN_UNAUTHORIZED_MESSAGE, isAdminAuthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { buildYearQualifiedSlug, getReleaseYear } from "@/lib/slugs";
import { getTitleMetadataAutofill, getTitleMetadataProviderErrorMessage } from "@/lib/title-metadata";
import { adminMetadataItemQuerySchema, normalizeSearchParams } from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: ADMIN_UNAUTHORIZED_MESSAGE }, { status: 401 });
  }

  try {
    const query = adminMetadataItemQuerySchema.parse(normalizeSearchParams(request.nextUrl.searchParams));
    const warnings: string[] = [];
    const item = await getTitleMetadataAutofill({
      providerId: query.providerId,
      type: query.type,
      warnings
    });
    let existingTitle = await prisma.title.findUnique({
      where: { slug: item.slug },
      select: { id: true, name: true, slug: true, imdbUrl: true, releaseDate: true }
    });

    if (existingTitle && isDistinctTitleRecord(existingTitle, item)) {
      const adjustedSlug = buildYearQualifiedSlug(item.name, item.releaseDate);

      if (adjustedSlug && adjustedSlug !== item.slug) {
        item.slug = adjustedSlug;
        existingTitle = await prisma.title.findUnique({
          where: { slug: adjustedSlug },
          select: { id: true, name: true, slug: true, imdbUrl: true, releaseDate: true }
        });
      }
    }

    return NextResponse.json({
      data: item,
      existingTitle: existingTitle ? { id: existingTitle.id, name: existingTitle.name, slug: existingTitle.slug } : null,
      warnings
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: getTitleMetadataProviderErrorMessage(error) }, { status: 400 });
  }
}

function isDistinctTitleRecord(
  existingTitle: { imdbUrl: string | null; releaseDate: Date | string },
  item: { imdbUrl: string | null; releaseDate: string }
): boolean {
  const existingImdbUrl = normalizeImdbUrl(existingTitle.imdbUrl);
  const incomingImdbUrl = normalizeImdbUrl(item.imdbUrl);

  if (existingImdbUrl && incomingImdbUrl && existingImdbUrl !== incomingImdbUrl) {
    return true;
  }

  const existingYear = getReleaseYear(
    existingTitle.releaseDate instanceof Date ? existingTitle.releaseDate.toISOString().slice(0, 10) : existingTitle.releaseDate
  );
  const incomingYear = getReleaseYear(item.releaseDate);

  return existingYear !== null && incomingYear !== null && existingYear !== incomingYear;
}

function normalizeImdbUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.trim().replace(/\/+$/, "").toLowerCase();
}
