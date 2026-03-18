import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { searchTitleMetadata } from "@/lib/title-metadata";
import { adminMetadataLookupQuerySchema, normalizeSearchParams } from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
    return NextResponse.json({ error: "Unable to search title metadata." }, { status: 400 });
  }
}
