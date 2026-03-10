import Link from "next/link";

const FEATURES = [
  {
    title: "Moderation",
    description:
      "Skonfiguruj ban, kick, clear i tempbany w jednym panelu. Zero chaosu przy zarzadzaniu serwerem i pelna kontrola nad uprawnieniami.",
    details: [
      "Automatyczne scenariusze reakcji na spam i naduzycia.",
      "Role, limity i uprawnienia ustawiane bez recznego wpisywania komend.",
      "Gotowe presety, ktore uruchomisz doslownie w 30 sekund.",
    ],
    cta: "Skonfiguruj moderacje",
    href: "/dashboard",
    badge: "Start w 30 sekund",
  },
  {
    title: "Music",
    description:
      "Uruchom odtwarzanie, kolejke, playlisty i smartshuffle bez przeklikiwania sie przez dziesiatki opcji oraz recznego zarzadzania stanem.",
    details: [
      "Szybki start od pierwszej piosenki do pelnej kolejki w kilka klikniec.",
      "Zarzadzanie playlistami, priorytetami i wyszukiwaniem utworow z jednego miejsca.",
      "Widok live stanu odtwarzania i kolejek zsynchronizowany z backendem.",
    ],
    cta: "Uruchom muzyke",
    href: "/music",
    badge: "Szybki setup",
  },
  {
    title: "Tools & Fun",
    description:
      "Dodaj pety, roulette i praktyczne narzedzia, by serwer byl aktywny i przyjazny dla ludzi przez cala dobe.",
    details: [
      "Moduly engagementowe, ktore podbijaja aktywnosc bez spamu.",
      "Lekkie narzedzia utility pomagajace moderatorom i zwyklym uzytkownikom.",
      "Konfiguracja krok po kroku bez potrzeby grzebania w dokumentacji.",
    ],
    cta: "Wlacz funkcje",
    href: "/dashboard",
    badge: "Gotowe preset'y",
  },
];

const CHANGELOG = [
  {
    version: "v2.4.0",
    date: "10 Mar 2026",
    items: [
      "Nowy flow konfiguracji muzyki w panelu.",
      "Lepsza obsluga kolejek i playlist.",
      "Poprawki stabilnosci panelu dashboard.",
    ],
  },
  {
    version: "v2.3.5",
    date: "03 Mar 2026",
    items: [
      "Usprawniony system tempbanow.",
      "Szybsze ladowanie ustawien serwera.",
      "Dodatkowe logi i poprawki bezpieczenstwa.",
    ],
  },
];

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Contact Us", href: "#" },
  { label: "Support", href: "#" },
  { label: "Status", href: "#" },
];

export default function Home() {
  const primaryButtonClass =
    "inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition";
  const discordButtonClass = `${primaryButtonClass} border-blue-400/50 bg-blue-600 text-white hover:bg-blue-500`;
  const secondaryButtonClass = `${primaryButtonClass} border-zinc-600 bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700`;

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 text-white app-scrollbar">
      <section className="relative overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900/70 p-7 md:p-10">
        <div
          className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full blur-3xl"
          style={{ background: "rgba(59,130,246,0.25)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-10 -bottom-20 h-44 w-44 rounded-full blur-3xl"
          style={{ background: "rgba(16,185,129,0.2)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
            Discord Bot Control Center
          </p>
          <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight text-balance">
            Eppy pomaga ogarnac moderacje, muzyke i konfiguracje serwera
            szybciej niz kiedykolwiek.
          </h1>
          <p className="mt-4 text-zinc-300 text-base md:text-lg max-w-2xl">
            Ustaw wszystko z jednego panelu, uruchom kluczowe funkcje w 30
            sekund i trzymaj porzadek bez recznego grzebania w komendach.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/signin"
              className={`${discordButtonClass} rounded-xl px-5`}
            >
              Add to Discord
            </Link>
            <a
              href="#features"
              className={`${secondaryButtonClass} rounded-xl px-5`}
            >
              See Features
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="mt-8 scroll-mt-28">
        <div className="mb-4 md:mb-5">
          <h2 className="text-2xl md:text-3xl font-bold">Features</h2>
          <p className="mt-2 text-zinc-300">
            Wybierz modul, uruchom konfiguracje i wystartuj bez zbednej
            technicznej zabawy.
          </p>
        </div>

        <div className="flex flex-col gap-5 md:gap-6">
          {FEATURES.map((feature, index) => (
            <article
              key={feature.title}
              className="feature-card group rounded-2xl border border-zinc-700 bg-zinc-900/75 p-8 md:p-12 min-h-[22rem] md:min-h-[24rem]"
              style={{ animationDelay: `${index * 110}ms` }}
            >
              <div
                className={`grid gap-6 md:items-center md:grid-cols-2 ${
                  index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div
                  className={`feature-scroll-text flex flex-col gap-3 ${
                    index % 2 === 1
                      ? "md:text-right md:items-end"
                      : "md:text-left md:items-start"
                  }`}
                >
                  <span className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
                    {feature.badge}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold">
                    {feature.title}
                  </h3>
                  <p className="text-base text-zinc-300 leading-relaxed max-w-2xl">
                    {feature.description}
                  </p>
                  <ul className="mt-1 space-y-2 text-sm text-zinc-300/95 max-w-2xl">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-300"
                          aria-hidden="true"
                        />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`feature-scroll-actions flex w-full flex-col gap-3 sm:flex-row ${
                    index % 2 === 1 ? "md:justify-start" : "md:justify-end"
                  }`}
                >
                  <Link
                    href="/auth/signin"
                    className={`${discordButtonClass} feature-action-btn w-full sm:min-w-44 sm:w-auto`}
                  >
                    Add to Discord
                  </Link>
                  <Link
                    href={feature.href}
                    className={`${secondaryButtonClass} feature-action-btn w-full sm:min-w-44 sm:w-auto`}
                  >
                    {feature.cta}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 md:mb-5">
          <h2 className="text-2xl md:text-3xl font-bold">Change Logs</h2>
          <p className="mt-2 text-zinc-300">
            Najnowsze poprawki, nowosci i aktualizacje bota.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {CHANGELOG.map((entry) => (
            <article
              key={entry.version}
              className="rounded-2xl border border-zinc-700 bg-zinc-900/75 p-5 md:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-blue-200">
                  {entry.version}
                </h3>
                <span className="text-xs uppercase tracking-wide text-zinc-400">
                  {entry.date}
                </span>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                {entry.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-10 rounded-2xl border border-zinc-700 bg-zinc-950/70 px-5 py-6 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider text-zinc-400">
              Quick links
            </p>
            <p className="mt-1 text-lg font-semibold">
              Eppy - nowoczesny bot do codziennego zarzadzania serwerem.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full border border-zinc-600 bg-zinc-800/80 px-3 py-1 text-xs font-semibold text-zinc-200 transition hover:border-blue-400/50 hover:text-blue-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
