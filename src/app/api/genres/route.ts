import { NextResponse } from "next/server";
import { getGenresWithCount } from "@/lib/catalog";
import { parseListQuery } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const result = await getGenresWithCount(parseListQuery(new URL(request.url).searchParams));
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to fetch genres." }, { status: 500 });
  }
}
