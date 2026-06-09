import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 grid place-items-center mb-4">
          <Compass className="w-6 h-6 text-violet-400" />
        </div>
        <p className="text-xs font-mono uppercase tracking-wider text-fg-faint mb-2">404</p>
        <h1 className="text-lg font-semibold text-fg mb-2">Page not found</h1>
        <p className="text-sm text-fg-muted mb-5">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link href="/" className="btn-primary inline-flex">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
