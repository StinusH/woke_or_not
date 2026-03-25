import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateWokeScore } from "@/lib/admin-mutations";
import { ADMIN_UNAUTHORIZED_MESSAGE, isAdminAuthorized } from "@/lib/admin-auth";
import { getAdminRouteError } from "@/lib/admin-route-error";
import { prisma } from "@/lib/prisma";

const wokeScorePatchSchema = z.object({
  wokeScore: z.coerce.number().int().min(0).max(100)
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: ADMIN_UNAUTHORIZED_MESSAGE }, { status: 401 });
  }

  try {
    const { id } = await params;
    const payload = wokeScorePatchSchema.parse(await request.json());
    const updated = await updateWokeScore(prisma, id, payload.wokeScore);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    const response = getAdminRouteError(error, "Invalid payload or unable to update woke score.");
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
