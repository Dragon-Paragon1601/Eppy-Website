export default function ContactPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 text-white">
      <section className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-6 md:p-8">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="mt-4 text-zinc-300 leading-relaxed">
          Need help, integration advice, or business contact? Reach us through
          Discord support or email.
        </p>
        <div className="mt-5 space-y-2 text-zinc-200">
          <p>Email: support@eppy.bot</p>
          <p>Discord: Join support server via the Support page.</p>
        </div>
      </section>
    </main>
  );
}
