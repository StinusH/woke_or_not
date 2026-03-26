import Link from "next/link";

const nav = [
  { href: "/movies", label: "Movies" },
  { href: "/tv-shows", label: "TV Shows" },
  { href: "/search", label: "Search" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur-md">
      <div className="container flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3.5">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-fg">
          Woke<span className="text-accent">or</span>Not
        </Link>
        <nav className="grid w-full grid-cols-3 gap-1 sm:flex sm:w-auto sm:items-center">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-center text-sm font-medium text-fgMuted transition-colors hover:bg-bgSoft hover:text-fg sm:py-1.5"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
