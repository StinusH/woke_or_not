import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTitle } from "@/lib/admin-mutations";
import { ADMIN_UNAUTHORIZED_MESSAGE, isAdminAuthorized } from "@/lib/admin-auth";
import { getAdminRouteError } from "@/lib/admin-route-error";
import { adminTitlePayloadSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: ADMIN_UNAUTHORIZED_MESSAGE }, { status: 401 });
  }

  try {
    const payload = adminTitlePayloadSchema.parse(await request.json());
    const created = await createTitle(prisma, payload);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    const response = getAdminRouteError(error, "Invalid payload or unable to create title.");
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
