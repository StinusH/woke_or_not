import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">404</p>
      <h1 className="font-display text-3xl font-bold text-fg">Page not found</h1>
      <p className="max-w-sm text-sm text-fgMuted">
        The requested page or title could not be found.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accentHover"
      >
        Back to home
      </Link>
    </section>
  );
}
