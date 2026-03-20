import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_UNAUTHORIZED_MESSAGE, isAdminAuthorized } from "@/lib/admin-auth";
import { refreshExternalScores } from "@/lib/admin-mutations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: ADMIN_UNAUTHORIZED_MESSAGE }, { status: 401 });
  }

  try {
    const { id } = await params;
    const updated = await refreshExternalScores(prisma, id);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to refresh external scores." }, { status: 400 });
  }
}
