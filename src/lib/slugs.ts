export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function getReleaseYear(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{4})/);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  return Number.isNaN(year) ? null : year;
}

export function buildYearQualifiedSlug(title: string, releaseDate: string | null | undefined): string {
  const baseSlug = slugify(title);
  const year = getReleaseYear(releaseDate);

  if (!baseSlug) {
    return "";
  }

  return year ? `${baseSlug}_${year}` : baseSlug;
}
