import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  createHref: (nextPage: number) => string;
}

export function Pagination({ page, totalPages, createHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:justify-center"
      aria-label="Pagination"
    >
      <Link
        href={createHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className="rounded-lg border border-line bg-card px-4 py-2 text-center text-sm font-medium text-fg shadow-card transition hover:bg-bgSoft data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-40"
        data-disabled={page <= 1}
      >
        ← Prev
      </Link>
      <span className="px-3 text-sm text-fgMuted">
        {page} / {totalPages}
      </span>
      <Link
        href={createHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className="rounded-lg border border-line bg-card px-4 py-2 text-center text-sm font-medium text-fg shadow-card transition hover:bg-bgSoft data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-40"
        data-disabled={page >= totalPages}
      >
        Next →
      </Link>
    </nav>
  );
}
