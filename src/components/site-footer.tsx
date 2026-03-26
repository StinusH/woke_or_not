export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="container flex flex-col gap-2 py-6 text-sm text-fgMuted md:flex-row md:items-center md:justify-between">
        <p className="font-medium text-fg">Woke or Not</p>
        <div className="flex max-w-2xl flex-col gap-1.5 md:items-end">
          <p>Score values are manual editorial estimates meant to help viewers avoid more woke titles.</p>
          <a
            href="https://x.com/isitwokeornot"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-fg underline-offset-4 transition hover:underline"
          >
            Follow @isitwokeornot on X
          </a>
        </div>
      </div>
    </footer>
  );
}
