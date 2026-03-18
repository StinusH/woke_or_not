import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "woke-or-not", timestamp: new Date().toISOString() });
}
