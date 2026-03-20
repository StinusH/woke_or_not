import React from "react";
import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import {
  clampSocialImageFocusY,
  parseSocialImagePosterUrl,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_WIDTH
} from "@/lib/social-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const posterUrlParam = request.nextUrl.searchParams.get("posterUrl");

  if (!posterUrlParam) {
    return NextResponse.json({ error: "posterUrl is required." }, { status: 400 });
  }

  const focusY = clampSocialImageFocusY(Number(request.nextUrl.searchParams.get("focusY") ?? "50"));

  let posterUrl: URL;
  try {
    posterUrl = parseSocialImagePosterUrl(posterUrlParam);
  } catch (error) {
    return NextResponse.json({ error: String(error instanceof Error ? error.message : error) }, { status: 400 });
  }

  try {
    const posterResponse = await fetch(posterUrl, {
      cache: "no-store",
      headers: {
        accept: "image/avif,image/webp,image/apng,image/jpeg,image/png,image/*;q=0.8,*/*;q=0.5"
      }
    });

    if (!posterResponse.ok) {
      return NextResponse.json({ error: "Unable to load poster image." }, { status: 502 });
    }

    const contentType = posterResponse.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Poster URL did not return an image." }, { status: 415 });
    }

    const bytes = await posterResponse.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            overflow: "hidden",
            background: "#111827"
          }}
        >
          <img
            src={dataUrl}
            alt=""
            width={SOCIAL_IMAGE_WIDTH}
            height={SOCIAL_IMAGE_HEIGHT}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `50% ${focusY}%`
            }}
          />
        </div>
      ),
      {
        width: SOCIAL_IMAGE_WIDTH,
        height: SOCIAL_IMAGE_HEIGHT,
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Unable to generate social image: ${String(error instanceof Error ? error.message : error)}` },
      { status: 500 }
    );
  }
}
