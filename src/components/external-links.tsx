interface ExternalLinksProps {
  imdbUrl?: string | null;
  rottenTomatoesUrl?: string | null;
  amazonUrl?: string | null;
}

export function ExternalLinks({ imdbUrl, rottenTomatoesUrl, amazonUrl }: ExternalLinksProps) {
  const links = [
    imdbUrl ? { href: imdbUrl, label: "IMDb" } : null,
    rottenTomatoesUrl ? { href: rottenTomatoesUrl, label: "Rotten Tomatoes" } : null,
    amazonUrl ? { href: amazonUrl, label: "Amazon" } : null
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  if (links.length === 0) {
    return <p className="text-sm text-fgMuted">No external links available.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-line bg-bg px-3 py-1.5 text-sm font-medium text-fgMuted transition hover:border-accent hover:text-accent"
        >
          {link.label} ↗
        </a>
      ))}
    </div>
  );
}
