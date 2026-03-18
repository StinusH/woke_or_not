interface TrailerEmbedProps {
  embedUrl: string | null;
}

export function TrailerEmbed({ embedUrl }: TrailerEmbedProps) {
  if (!embedUrl) {
    return <p className="text-sm text-fg/70">Trailer unavailable.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-black shadow-sm">
      <iframe
        title="Official trailer"
        src={embedUrl}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
