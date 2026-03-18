import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteTitle, updateTitle } from "@/lib/admin-mutations";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getAdminRouteError } from "@/lib/admin-route-error";
import { adminTitlePayloadSchema } from "@/lib/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const payload = adminTitlePayloadSchema.parse(await request.json());
    const updated = await updateTitle(prisma, id, payload);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    const response = getAdminRouteError(error, "Invalid payload or unable to update title.");
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await deleteTitle(prisma, id);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to delete title." }, { status: 400 });
  }
}
