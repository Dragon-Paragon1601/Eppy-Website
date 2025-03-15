"use client";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const [active, setActive] = useState("/");

  const handleSignIn = () => {
    const signInWindow = window.open(
      "/auth/signin",
      "SignIn",
      "width=600,height=900"
    );

    const checkWindowClosed = setInterval(() => {
      if (signInWindow.closed) {
        clearInterval(checkWindowClosed);
        window.location.reload();
      }
    }, 1000);

    window.addEventListener("message", (event) => {
      if (event.data === "authComplete") {
        signInWindow.close();
        window.location.reload();
      }
    });
  };

  return (
    <nav className="fixed top-0 w-full flex justify-between items-center p-5 bg-zinc-950 text-cyan-400 shadow-lg z-50">
      <div className="flex items-center gap-2" style={{ width: '20%' }}>
        <Image src="/assets/Eppy.png" alt="Eppy Logo" width={40} height={40} className="rounded-full" />
        <div className="text-3xl font-bold">Eppy</div>
      </div>
      <div className="flex-grow"></div>
      <div className="flex items-center gap-4 justify-center" style={{ width: '40%' }}>
        <Button
          className={`text-2xl ${active === "/" ? "bg-cyan-700 scale-105" : "bg-zinc-900"} ${active === "/" ? "border-b-2 border-cyan-400" : ""}`}
          variant="ghost"
          asChild
          onClick={() => setActive("/")}
        >
          <Link href="/">Home</Link>
        </Button>
        <Button
          className={`text-2xl ${active === "/about" ? "bg-cyan-700 scale-105" : "bg-zinc-900"} ${active === "/about" ? "border-b-2 border-cyan-400" : ""}`}
          variant="ghost"
          asChild
          onClick={() => setActive("/about")}
        >
          <Link href="/about">About</Link>
        </Button>
        <Button
          className={`text-2xl ${active === "/dashboard" ? "bg-cyan-700 scale-105" : "bg-zinc-900"} ${active === "/dashboard" ? "border-b-2 border-cyan-400" : ""}`}
          variant="ghost"
          asChild
          onClick={() => setActive("/dashboard")}
        >
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
      <div className="flex-grow"></div>
      <div className="flex items-center gap-7 justify-end" style={{ width: '20%' }}>
        {session ? (
          <>
            <div className="text-[25px] text-white font-bold">Welcome</div>
            <span className="text-[25px] text-white font-bold">{session.user.name}</span>
            <Button className="text-2xl bg-zinc-900" variant="outline" onClick={() => signOut()}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button className="text-2xl bg-zinc-900" variant="outline" onClick={handleSignIn}>
              Login with Discord
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
