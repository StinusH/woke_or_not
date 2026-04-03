import { NextRequest, NextResponse } from "next/server";
import { ADMIN_UNAUTHORIZED_MESSAGE, isAdminAuthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
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
    const existingTitle = await prisma.title.findUnique({
      where: { slug: item.slug },
      select: { id: true, name: true, slug: true }
    });

    return NextResponse.json({ data: item, existingTitle, warnings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: getTitleMetadataProviderErrorMessage(error) }, { status: 400 });
  }
}
