"use client";

import { useEffect, useState } from "react";

export default function StatusPage() {
  const [status, setStatus] = useState({
    online: true,
    overviewCards: [],
  });

  useEffect(() => {
    let isCancelled = false;

    const loadStatus = async () => {
      try {
        const response = await fetch("/api/home", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (isCancelled) return;
        setStatus({
          online: true,
          overviewCards: Array.isArray(payload?.overviewCards)
            ? payload.overviewCards
            : [],
        });
      } catch {
        if (isCancelled) return;
        setStatus((current) => ({ ...current, online: false }));
      }
    };

    loadStatus();
    const timer = setInterval(loadStatus, 15000);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 text-white">
      <section className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-6 md:p-8">
        <h1 className="text-3xl font-bold">Service Status</h1>
        <p className="mt-3 text-zinc-300">
          Current website status: {status.online ? "Operational" : "Limited"}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {status.overviewCards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            >
              <p className="text-xs text-zinc-400">{card.label}</p>
              <p className="text-sm font-semibold text-zinc-100">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
