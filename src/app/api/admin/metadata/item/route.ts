import { NextRequest, NextResponse } from "next/server";
import { ADMIN_UNAUTHORIZED_MESSAGE, isAdminAuthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getTitleMetadataAutofill } from "@/lib/title-metadata";
import { adminMetadataItemQuerySchema, normalizeSearchParams } from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: ADMIN_UNAUTHORIZED_MESSAGE }, { status: 401 });
  }

  try {
    const query = adminMetadataItemQuerySchema.parse(normalizeSearchParams(request.nextUrl.searchParams));
    const item = await getTitleMetadataAutofill({
      providerId: query.providerId,
      type: query.type
    });
    const existingTitle = await prisma.title.findUnique({
      where: { slug: item.slug },
      select: { id: true, name: true, slug: true }
    });

    return NextResponse.json({ data: item, existingTitle });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load title metadata." }, { status: 400 });
  }
}
