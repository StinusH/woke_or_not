function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-bgSoft ${className}`} />;
}

export function PageHeroSkeleton() {
  return (
    <section className="mb-2 py-4">
      <Bone className="mb-2 h-3 w-20" />
      <Bone className="h-9 w-52 rounded-lg" />
      <Bone className="mt-2 h-4 w-80" />
    </section>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid gap-1.5">
            <Bone className="h-3 w-16" />
            <Bone className="h-[38px] rounded-lg" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-line bg-bgSoft p-4">
        <Bone className="h-3 w-20" />
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} className="h-10 rounded-lg bg-card" />
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr),200px,auto]">
        <div className="grid gap-1.5">
          <Bone className="h-3 w-14" />
          <Bone className="h-[38px] rounded-lg" />
        </div>
        <div className="grid gap-1.5">
          <Bone className="h-3 w-10" />
          <Bone className="h-[38px] rounded-lg" />
        </div>
        <div className="flex items-end">
          <Bone className="h-[38px] w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function TitleCardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-card shadow-card">
      <Bone className="h-48 rounded-b-none rounded-t-xl" />
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <Bone className="h-4 w-3/4" />
          <Bone className="h-6 w-14 shrink-0" />
        </div>
        <Bone className="h-3 w-1/3" />
        <div className="flex gap-1">
          <Bone className="h-5 w-14" />
          <Bone className="h-5 w-16" />
        </div>
        <Bone className="h-8 w-full" />
      </div>
    </div>
  );
}

export function TitleGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <TitleCardSkeleton key={i} />
      ))}
    </section>
  );
}

export function ListPageSkeleton() {
  return (
    <div className="grid gap-4">
      <PageHeroSkeleton />
      <FilterBarSkeleton />
      <TitleGridSkeleton />
    </div>
  );
}

export function TitleDetailSkeleton() {
  return (
    <div className="grid gap-6">
      {/* Hero */}
      <section className="grid gap-6 md:grid-cols-[280px,1fr] md:gap-8">
        <Bone className="h-[380px] rounded-xl" />
        <div className="grid auto-rows-min gap-4">
          <div>
            <Bone className="mb-2 h-3 w-16" />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Bone className="h-10 w-64 rounded-lg" />
              <Bone className="h-8 w-20 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <Bone className="h-6 w-16" />
            <Bone className="h-6 w-20" />
            <Bone className="h-6 w-14" />
          </div>
          <div className="space-y-1.5">
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-3/4" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Bone className="h-16 rounded-lg" />
            <Bone className="h-16 rounded-lg" />
            <Bone className="h-16 rounded-lg sm:col-span-2" />
          </div>
          <div className="flex gap-2">
            <Bone className="h-9 w-24 rounded-lg" />
            <Bone className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Summaries */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-card p-5 shadow-card">
          <Bone className="mb-3 h-5 w-32 rounded-lg" />
          <div className="space-y-2">
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-4/5" />
          </div>
        </div>
        <div className="rounded-xl border border-line bg-card p-5 shadow-card">
          <Bone className="mb-3 h-5 w-32 rounded-lg" />
          <div className="space-y-2">
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-3/4" />
          </div>
        </div>
      </section>

      {/* Score Factors */}
      <div className="rounded-xl border border-line bg-card p-5 shadow-card">
        <Bone className="mb-4 h-5 w-32 rounded-lg" />
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Trailer */}
      <div className="rounded-xl border border-line bg-card p-5 shadow-card">
        <Bone className="mb-4 h-5 w-20 rounded-lg" />
        <Bone className="h-64 rounded-lg" />
      </div>

      {/* Cast & Crew */}
      <section className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line bg-card p-5 shadow-card">
            <Bone className="mb-3 h-5 w-28 rounded-lg" />
            <div className="grid gap-1.5">
              {Array.from({ length: 4 }).map((_, j) => (
                <Bone key={j} className="h-9 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="grid gap-10">
      {/* Hero */}
      <section className="py-4">
        <div className="rounded-xl border border-line bg-card px-4 py-8 shadow-card sm:px-8 sm:py-10">
          <Bone className="mx-auto mb-3 h-3 w-28" />
          <Bone className="mx-auto h-12 w-72 rounded-lg" />
          <Bone className="mx-auto mt-1 h-12 w-48 rounded-lg" />
          <div className="mt-4 space-y-1.5">
            <Bone className="mx-auto h-4 w-96 max-w-full" />
            <Bone className="mx-auto h-4 w-72 max-w-full" />
          </div>
          <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-3 sm:flex-row">
            <Bone className="h-14 flex-1 rounded-lg" />
            <Bone className="h-14 w-32 rounded-lg" />
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Bone className="h-10 w-36 rounded-lg" />
            <Bone className="h-10 w-36 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Genres */}
      <section>
        <Bone className="mb-3 h-6 w-24 rounded-lg" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Bone key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
      </section>

      {/* Title grid */}
      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Bone className="h-6 w-40 rounded-lg" />
          <Bone className="h-4 w-16" />
        </div>
        <TitleGridSkeleton count={8} />
      </section>
    </div>
  );
}
