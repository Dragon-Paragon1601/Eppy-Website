"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const FEATURES = [
  {
    key: "moderation",
    title: "Moderation",
    description:
      "Configure ban, kick, clear, and temp bans from one place. Fast, clear, and without manually digging through commands.",
    details: [
      "Automatic reactions to spam and flood attempts.",
      "Clear role and permission management.",
      "Go from zero to a complete setup in 30 seconds.",
    ],
    cta: "Configure moderation",
    href: "/dashboard",
    badge: "Start in 30 seconds",
  },
  {
    key: "music",
    title: "Music",
    description:
      "Launch playback, queues, and playlists in a few clicks while Eppy handles the heavy lifting.",
    details: [
      "Priority queueing and fast search.",
      "Public and private playlists in one view.",
      "Live playback status synced with the backend.",
    ],
    cta: "Open music controls",
    href: "/music",
    badge: "Quick setup",
  },
  {
    key: "tools",
    title: "Tools & Fun",
    description:
      "Add pets, roulette, and utility tools to keep your server active and welcoming without forced engagement.",
    details: [
      "Fun and engagement modules ready right after enabling.",
      "A lightweight utility toolkit for your community.",
      "Step-by-step setup without digging through long docs.",
    ],
    cta: "Enable features",
    href: "/dashboard",
    badge: "Ready presets",
  },
];

const DEFAULT_CHANGELOG = [
  {
    version: "v2.4.0",
    date: "10 Mar 2026",
    items: [
      "New music configuration flow in the dashboard.",
      "Improved queue and playlist handling.",
      "Dashboard stability improvements.",
    ],
  },
  {
    version: "v2.3.5",
    date: "03 Mar 2026",
    items: [
      "Enhanced temp-ban system.",
      "Faster server settings loading.",
      "Extra logging and security fixes.",
    ],
  },
];

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact Us", href: "/contact" },
  { label: "Support", href: "/support" },
  { label: "Status", href: "/status" },
];

const DEFAULT_HOME_DATA = {
  heroStats: ["500+ communities", "99.9% uptime", "Setup in 30 seconds"],
  overviewCards: [
    { label: "Moderation", value: "Active", tone: "neutral" },
    { label: "Music Queue", value: "Ready", tone: "neutral" },
    { label: "AutoMod Rules", value: "Enabled", tone: "neutral" },
    { label: "Bot Health", value: "Stable", tone: "good" },
  ],
  featurePanels: {
    moderation: {
      title: "AutoMod Rules",
      items: ["Link spam", "Mention flood", "Raid protection"],
    },
    music: {
      title: "Now Playing",
      items: ["Queue available", "Smart shuffle ready", "Live controls"],
    },
    tools: {
      title: "Community Pulse",
      items: ["Fun modules enabled", "Roulette events", "Daily quests"],
    },
  },
  changelog: DEFAULT_CHANGELOG,
};

export default function Home() {
  const featuresContainerRef = useRef(null);
  const [homeData, setHomeData] = useState(DEFAULT_HOME_DATA);
  const botInviteUrl =
    process.env.NEXT_PUBLIC_DISCORD_BOT_INVITE_URL || "/auth/signin";

  const primaryButtonClass =
    "inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition";
  const discordButtonClass = `${primaryButtonClass} border-blue-400/50 bg-blue-600 text-white hover:bg-blue-500`;
  const secondaryButtonClass = `${primaryButtonClass} border-zinc-600 bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700`;

  useEffect(() => {
    let isCancelled = false;

    const loadHomeData = async () => {
      try {
        const response = await fetch("/api/home", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (isCancelled || !payload || typeof payload !== "object") return;

        setHomeData((current) => ({
          ...current,
          ...payload,
          heroStats: Array.isArray(payload.heroStats)
            ? payload.heroStats
            : current.heroStats,
          overviewCards: Array.isArray(payload.overviewCards)
            ? payload.overviewCards
            : current.overviewCards,
          changelog: Array.isArray(payload.changelog)
            ? payload.changelog
            : current.changelog,
          featurePanels:
            payload.featurePanels && typeof payload.featurePanels === "object"
              ? payload.featurePanels
              : current.featurePanels,
        }));
      } catch {
        // Keep defaults when API is unavailable.
      }
    };

    loadHomeData();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = featuresContainerRef.current;
    if (!container) return;

    const cards = Array.from(container.querySelectorAll(".feature-card"));
    let rafId = null;

    const updateFocusState = () => {
      const viewportCenter = window.innerHeight / 2;
      const maxDistance = window.innerHeight * 0.55;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        const ratio = Math.min(distance / maxDistance, 1);

        // Keep center cards crisp and only softly dim/blur near edges.
        const deadZone = 0.2;
        const adjustedRatio = Math.max(0, (ratio - deadZone) / (1 - deadZone));
        const opacity = 1 - adjustedRatio * 0.2;
        const blur = adjustedRatio * 1.2;
        const scale = 1 - adjustedRatio * 0.012;

        card.style.setProperty("--focus-opacity", opacity.toFixed(3));
        card.style.setProperty("--focus-blur", `${blur.toFixed(2)}px`);
        card.style.setProperty("--focus-scale", scale.toFixed(3));
      });

      rafId = null;
    };

    const requestUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateFocusState);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const heroStats = homeData.heroStats || DEFAULT_HOME_DATA.heroStats;
  const overviewCards =
    homeData.overviewCards || DEFAULT_HOME_DATA.overviewCards;
  const changelog = homeData.changelog || DEFAULT_HOME_DATA.changelog;

  const featurePanels = useMemo(() => {
    const source = homeData.featurePanels || {};
    return {
      moderation:
        source.moderation || DEFAULT_HOME_DATA.featurePanels.moderation,
      music: source.music || DEFAULT_HOME_DATA.featurePanels.music,
      tools: source.tools || DEFAULT_HOME_DATA.featurePanels.tools,
    };
  }, [homeData.featurePanels]);

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

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
              Discord Bot Control Center
            </p>
            <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight text-balance">
              Manage your Discord server like a pro, your own way.
            </h1>
            <p className="mt-4 text-zinc-300 text-base md:text-lg max-w-2xl">
              Eppy combines moderation, music, and community tools into one fast
              control panel. Join, configure, and go live.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={botInviteUrl}
                className={`${discordButtonClass} rounded-xl px-5`}
                target="_blank"
                rel="noreferrer"
              >
                Add to Discord
              </a>
              <a
                href="#features"
                className={`${secondaryButtonClass} rounded-xl px-5`}
              >
                See Features
              </a>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {heroStats.map((stat) => (
                <span
                  key={stat}
                  className="rounded-full border border-zinc-600 bg-zinc-800/80 px-3 py-1 text-xs font-semibold text-zinc-200"
                >
                  {stat}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-4 md:p-5">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/65 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">
                Server Overview
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {overviewCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
                  >
                    <p className="text-xs text-zinc-400">{card.label}</p>
                    <p
                      className={`text-sm font-semibold ${
                        card.tone === "good"
                          ? "text-emerald-300"
                          : "text-zinc-100"
                      }`}
                    >
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mt-8 scroll-mt-28">
        <div className="mb-4 md:mb-5">
          <h2 className="text-2xl md:text-3xl font-bold">Features</h2>
          <p className="mt-2 text-zinc-300">
            Pick a module, run setup, and launch fast without technical hassle.
          </p>
        </div>

        <div
          ref={featuresContainerRef}
          className="flex flex-col gap-5 md:gap-6"
        >
          {FEATURES.map((feature, index) =>
            (() => {
              const panel = featurePanels[feature.key];
              return (
                <article
                  key={feature.title}
                  className="feature-card group rounded-2xl border border-zinc-700 bg-zinc-900/75 p-8 md:p-12 min-h-[22rem] md:min-h-[24rem]"
                  style={{ animationDelay: `${index * 110}ms` }}
                >
                  <div
                    className={`grid gap-7 md:items-center md:grid-cols-2 ${
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
                      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-950/80 p-4">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">
                          {panel.title}
                        </p>
                        <div className="mt-3 space-y-2">
                          {panel.items.map((item) => (
                            <div
                              key={item}
                              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row">
                          <a
                            href={botInviteUrl}
                            className={`${discordButtonClass} feature-action-btn w-full sm:min-w-44 sm:w-auto`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Add to Discord
                          </a>
                          <Link
                            href={feature.href}
                            className={`${secondaryButtonClass} feature-action-btn w-full sm:min-w-44 sm:w-auto`}
                          >
                            {feature.cta}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })(),
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 md:mb-5">
          <h2 className="text-2xl md:text-3xl font-bold">Change Logs</h2>
          <p className="mt-2 text-zinc-300">
            Latest fixes, improvements, and updates.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {changelog.map((entry) => (
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
              Eppy - a modern bot for everyday server management.
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
