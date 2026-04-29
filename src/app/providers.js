"use client";

import { SessionProvider } from "next-auth/react";
import { DevModeProvider } from "@/components/DevModeContext";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <DevModeProvider>{children}</DevModeProvider>
    </SessionProvider>
  );
}
