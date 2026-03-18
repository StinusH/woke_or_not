export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="container flex flex-col gap-1.5 py-6 text-sm text-fgMuted md:flex-row md:items-center md:justify-between">
        <p className="font-medium text-fg">Woke or Not</p>
        <p>Score values are editorial data for discovery and comparison, not definitive facts.</p>
      </div>
    </footer>
  );
}
