import { redirect } from "next/navigation";
import { normalizeSearchParams } from "@/lib/validation";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GenrePage({ params, searchParams }: PageProps) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const normalized = normalizeSearchParams(rawSearch);
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(normalized)) {
    if (key === "genre") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        next.append(key, entry);
      }
      continue;
    }

    next.append(key, value);
  }

  const existingGenres = normalized.genre;

  if (Array.isArray(existingGenres)) {
    for (const genre of existingGenres) {
      next.append("genre", genre);
    }
  } else if (existingGenres) {
    next.append("genre", existingGenres);
  }

  next.append("genre", slug);

  const queryString = next.toString();
  redirect(queryString ? `/search?${queryString}` : "/search");
}
