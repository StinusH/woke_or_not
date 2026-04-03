import { NextRequest, NextResponse } from "next/server";
import { ADMIN_UNAUTHORIZED_MESSAGE, isAdminAuthorized } from "@/lib/admin-auth";
import { getTitleMetadataProviderErrorMessage, searchTitleMetadata } from "@/lib/title-metadata";
import { adminMetadataLookupQuerySchema, normalizeSearchParams } from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: ADMIN_UNAUTHORIZED_MESSAGE }, { status: 401 });
  }

  try {
    const query = adminMetadataLookupQuerySchema.parse(normalizeSearchParams(request.nextUrl.searchParams));
    const results = await searchTitleMetadata({
      query: query.q,
      year: query.year,
      type: query.type
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: getTitleMetadataProviderErrorMessage(error) }, { status: 400 });
  }
}
