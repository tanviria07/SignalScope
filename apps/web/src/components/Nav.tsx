import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/history", label: "History" },
  { href: "/about", label: "About" },
];

export function Nav() {
  return (
    <header className="mb-10 flex flex-col gap-5 border-b border-surface-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="text-xl font-semibold tracking-tight text-ink no-underline">
          SignalScope
        </Link>
        <p className="mt-1 text-sm text-ink-muted">Internal signal analytics workspace</p>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm text-ink-muted">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-md px-3 py-1.5 no-underline transition hover:bg-surface-subtle hover:text-ink"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
