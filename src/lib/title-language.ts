export function getLanguageLabel(language: string | null | undefined): string | null {
  if (typeof language !== "string") {
    return null;
  }

  const normalizedLanguage = language.trim().toLowerCase();

  if (!normalizedLanguage) {
    return null;
  }

  const baseLanguage = normalizedLanguage.split("-")[0];

  try {
    const displayName = new Intl.DisplayNames(["en"], { type: "language" }).of(baseLanguage);

    if (displayName) {
      return displayName;
    }
  } catch {
    // Fall back to the raw language code when Intl language display names are unavailable.
  }

  return baseLanguage.toUpperCase();
}

export function getOriginalLanguageLabel(originalLanguage: string | null | undefined): string | null {
  if (typeof originalLanguage !== "string") {
    return null;
  }

  const normalizedLanguage = originalLanguage.trim().toLowerCase();

  if (!normalizedLanguage || normalizedLanguage === "en" || normalizedLanguage.startsWith("en-")) {
    return null;
  }

  return getLanguageLabel(normalizedLanguage);
}
