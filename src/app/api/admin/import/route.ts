import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importTitles } from "@/lib/admin-mutations";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { adminImportPayloadSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = adminImportPayloadSchema.parse(await request.json());
    const results = await importTitles(prisma, body.titles);
    return NextResponse.json({ data: results }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid payload or import failed." }, { status: 400 });
  }
}
