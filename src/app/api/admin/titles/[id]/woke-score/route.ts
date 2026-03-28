import { NextRequest, NextResponse } from "next/server";
import { ADMIN_UNAUTHORIZED_MESSAGE, isAdminAuthorized } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: ADMIN_UNAUTHORIZED_MESSAGE }, { status: 401 });
  }

  await params;

  return NextResponse.json(
    { error: "Direct woke score edits are not supported here. Update the title form instead." },
    { status: 400 }
  );
}
