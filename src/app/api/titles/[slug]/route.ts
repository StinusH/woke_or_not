import { NextResponse } from "next/server";
import { getTitleDetail } from "@/lib/catalog";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const title = await getTitleDetail(slug);

    if (!title) {
      return NextResponse.json({ error: "Title not found." }, { status: 404 });
    }

    return NextResponse.json(title);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to fetch title." }, { status: 500 });
  }
}
