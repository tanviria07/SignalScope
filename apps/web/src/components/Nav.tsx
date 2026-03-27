import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/history", label: "History" },
  { href: "/about", label: "About" },
];

export function Nav() {
  return (
    <header className="mb-10 flex flex-col gap-4 border-b border-surface-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink no-underline">
          SignalScope
        </Link>
        <p className="text-sm text-ink-muted">Time-series inspection for engineers</p>
      </div>
      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="no-underline hover:text-ink">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
