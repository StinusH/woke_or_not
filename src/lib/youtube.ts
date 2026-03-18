export function toYoutubeEmbedUrl(link?: string | null): string | null {
  if (!link) return null;

  try {
    const url = new URL(link);

    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.replace("/", "").trim();
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    return null;
  }

  return null;
}
