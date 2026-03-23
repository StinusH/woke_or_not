export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 48;

export const SORT_OPTIONS = [
  "score_desc",
  "score_asc",
  "imdb_desc",
  "imdb_asc",
  "tomatoes_desc",
  "tomatoes_asc",
  "newest",
  "oldest",
  "title_asc",
  "title_desc"
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export const TITLE_TYPES = ["MOVIE", "TV_SHOW"] as const;
export type TitleTypeFilter = (typeof TITLE_TYPES)[number];
