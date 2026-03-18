import { NextResponse } from "next/server";
import { getGenresWithCount } from "@/lib/catalog";

export async function GET() {
  try {
    const result = await getGenresWithCount();
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to fetch genres." }, { status: 500 });
  }
}
