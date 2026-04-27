"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import eppyLogo from "@/app/Eppy.png";
import { useDevMode } from "@/components/DevModeContext";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/music", label: "Music" },
];


  const { data: session } = useSession();
  const pathname = usePathname();
  const { devMode } = useDevMode();

  const handleSignIn = () => {
    signIn("discord", { callbackUrl: "/dashboard" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-700 shrink-0">
            <Image
              src={eppyLogo}
              alt="Eppy Logo"
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="truncate text-xl font-bold text-white transition-colors group-hover:text-blue-300">
            Eppy
          </span>
          {devMode && (
            <span
              title="Dev Mode aktywny"
              className="ml-2 px-2 py-0.5 rounded-lg bg-gradient-to-r from-blue-700 to-purple-700 text-xs font-semibold text-white shadow border border-blue-400 animate-pulse"
            >
              DEV
            </span>
          )}
        </Link>

        <div className="hidden md:flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <div className="hidden lg:flex items-center gap-2 min-w-0">
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user?.name || "User avatar"}
                    width={28}
                    height={28}
                    className="rounded-full border border-zinc-600"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-xs font-semibold text-zinc-200">
                    {(session.user?.name || "U")[0]}
                  </div>
                )}

                <span className="text-sm text-zinc-300 max-w-40 truncate">
                  {session.user?.name}
                </span>
              </div>
              <Button
                className="bg-zinc-800 px-3 py-1.5 text-white hover:bg-zinc-800 hover:text-red-400"
                variant="outline"
                onClick={() => signOut()}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              className="bg-zinc-800 px-3 py-1.5 text-white hover:bg-zinc-800 hover:text-blue-400"
              variant="outline"
              onClick={handleSignIn}
            >
              Login with Discord
            </Button>
          )}
        </div>
      </div>

      <div className="md:hidden border-t border-zinc-800 px-4 py-2 flex items-center gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
