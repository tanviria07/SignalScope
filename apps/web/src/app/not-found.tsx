import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-surface-border bg-white p-8 text-center">
      <h1 className="text-xl font-semibold text-ink">Not found</h1>
      <p className="mt-2 text-sm text-ink-muted">That analysis may have been removed or never existed.</p>
      <Link href="/" className="mt-6 inline-block text-sm">
        Return home
      </Link>
    </div>
  );
}
