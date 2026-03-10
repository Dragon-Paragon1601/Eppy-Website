export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 text-white">
      <section className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-6 md:p-8">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-zinc-300 leading-relaxed">
          Eppy stores only the data required to provide dashboard and music
          features, including guild settings, command metadata, and playlist
          configuration. We do not sell user data.
        </p>
        <p className="mt-3 text-zinc-300 leading-relaxed">
          If you need data removal for your server, use the support channel or
          contact page and include your guild ID.
        </p>
      </section>
    </main>
  );
}
