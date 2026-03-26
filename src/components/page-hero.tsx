interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="mb-2 py-4">
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
      ) : null}
      <h1 className="font-display text-2xl font-bold leading-tight text-fg sm:text-3xl md:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fgMuted sm:text-base">{description}</p>
    </section>
  );
}
