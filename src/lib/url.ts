export function pageHref(
  pathname: string,
  searchParams: Record<string, string | number | string[] | undefined>,
  page: number
): string {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page") continue;

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry === "") continue;
        next.append(key, entry);
      }
      continue;
    }

    if (value === undefined || value === "") continue;
    next.set(key, String(value));
  }

  next.set("page", String(page));
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
