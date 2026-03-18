import Link from "next/link";

const nav = [
  { href: "/movies", label: "Movies" },
  { href: "/tv-shows", label: "TV Shows" },
  { href: "/search", label: "Search" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur-md">
      <div className="container flex items-center justify-between gap-4 py-3.5">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-fg">
          Woke<span className="text-accent">or</span>Not
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-fgMuted transition-colors hover:bg-bgSoft hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
