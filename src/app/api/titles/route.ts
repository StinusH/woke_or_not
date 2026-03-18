import { NextRequest, NextResponse } from "next/server";
import { getTitleCards } from "@/lib/catalog";
import { parseListQuery } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const query = parseListQuery(request.nextUrl.searchParams);
    const result = await getTitleCards(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to fetch titles." }, { status: 500 });
  }
}
