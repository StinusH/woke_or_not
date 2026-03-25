import { TitleCard as Card } from "@/components/title-card";
import { TitleCard } from "@/lib/types";

interface TitleGridProps {
  titles: TitleCard[];
  emptyLabel?: string;
  showTomatoRatings?: boolean;
}

export function TitleGrid({
  titles,
  emptyLabel = "No matching titles found.",
  showTomatoRatings = false
}: TitleGridProps) {
  if (titles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-card p-12 text-center text-sm text-fgMuted">
        {emptyLabel}
      </div>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {titles.map((title) => (
        <Card key={title.id} title={title} showTomatoRatings={showTomatoRatings} />
      ))}
    </section>
  );
}
