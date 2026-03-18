import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getTitleMetadataAutofill } from "@/lib/title-metadata";
import { adminMetadataItemQuerySchema, normalizeSearchParams } from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const query = adminMetadataItemQuerySchema.parse(normalizeSearchParams(request.nextUrl.searchParams));
    const item = await getTitleMetadataAutofill({
      providerId: query.providerId,
      type: query.type
    });

    return NextResponse.json({ data: item });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load title metadata." }, { status: 400 });
  }
}
