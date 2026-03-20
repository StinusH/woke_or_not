export const SOCIAL_IMAGE_WIDTH = 1600;
export const SOCIAL_IMAGE_HEIGHT = 900;
export const SOCIAL_IMAGE_ASPECT_LABEL = "16:9";
export const DEFAULT_SOCIAL_IMAGE_FOCUS_Y = 50;

const ALLOWED_IMAGE_HOSTS = new Set(["image.tmdb.org", "images.unsplash.com"]);
const SOCIAL_IMAGE_ASPECT_RATIO = SOCIAL_IMAGE_WIDTH / SOCIAL_IMAGE_HEIGHT;

export function buildSocialImageUrl(posterUrl: string, focusY = DEFAULT_SOCIAL_IMAGE_FOCUS_Y): string {
  const params = new URLSearchParams({
    posterUrl,
    focusY: String(focusY)
  });

  return `/api/admin/social-image?${params.toString()}`;
}

export function parseSocialImagePosterUrl(value: string): URL {
  const url = new URL(value);

  if (url.protocol !== "https:") {
    throw new Error("Only https poster URLs are supported for social image generation.");
  }

  if (!ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
    throw new Error("This poster host is not supported for social image generation.");
  }

  return url;
}

export function clampSocialImageFocusY(value: number): number {
  if (Number.isNaN(value)) {
    return DEFAULT_SOCIAL_IMAGE_FOCUS_Y;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function calculateSocialImageCrop(sourceWidth: number, sourceHeight: number, focusY: number) {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return {
      sourceX: 0,
      sourceY: 0,
      sourceWidth: 0,
      sourceHeight: 0
    };
  }

  const normalizedFocusY = clampSocialImageFocusY(focusY);
  const sourceAspectRatio = sourceWidth / sourceHeight;

  if (sourceAspectRatio > SOCIAL_IMAGE_ASPECT_RATIO) {
    const cropWidth = sourceHeight * SOCIAL_IMAGE_ASPECT_RATIO;
    return {
      sourceX: Math.max(0, (sourceWidth - cropWidth) / 2),
      sourceY: 0,
      sourceWidth: cropWidth,
      sourceHeight
    };
  }

  const cropHeight = sourceWidth / SOCIAL_IMAGE_ASPECT_RATIO;
  const maxSourceY = Math.max(0, sourceHeight - cropHeight);

  return {
    sourceX: 0,
    sourceY: maxSourceY * (normalizedFocusY / 100),
    sourceWidth,
    sourceHeight: cropHeight
  };
}
