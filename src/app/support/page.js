import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 text-white">
      <section className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-6 md:p-8">
        <h1 className="text-3xl font-bold">Support</h1>
        <p className="mt-4 text-zinc-300 leading-relaxed">
          For setup issues, permission errors, or music bridge problems, use one
          of the support channels below.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-700"
          >
            Open Dashboard
          </Link>
          <Link
            href="/music"
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-700"
          >
            Open Music Panel
          </Link>
        </div>
      </section>
    </main>
  );
}
