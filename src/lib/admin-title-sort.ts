import { Prisma } from "@prisma/client";

export const ADMIN_TITLE_SORT_OPTIONS = ["updated_desc", "woke_desc", "woke_asc"] as const;

export type AdminTitleSortOption = (typeof ADMIN_TITLE_SORT_OPTIONS)[number];

export function parseAdminTitleSort(value?: string): AdminTitleSortOption {
  if (value && ADMIN_TITLE_SORT_OPTIONS.includes(value as AdminTitleSortOption)) {
    return value as AdminTitleSortOption;
  }

  return "updated_desc";
}

export function adminTitleOrderBy(sort: AdminTitleSortOption): Prisma.TitleOrderByWithRelationInput[] {
  switch (sort) {
    case "woke_desc":
      return [{ wokeScore: "desc" }, { updatedAt: "desc" }, { name: "asc" }];
    case "woke_asc":
      return [{ wokeScore: "asc" }, { updatedAt: "desc" }, { name: "asc" }];
    case "updated_desc":
    default:
      return [{ updatedAt: "desc" }, { name: "asc" }];
  }
}
