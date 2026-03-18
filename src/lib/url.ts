export function pageHref(
  pathname: string,
  searchParams: Record<string, string | number | undefined>,
  page: number
): string {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || value === "") continue;
    if (key === "page") continue;
    next.set(key, String(value));
  }

  next.set("page", String(page));
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
