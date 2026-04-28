import Navbar from "@/components/Navbar";
import DevModeButton from "@/components/DevModeButton";
import Providers from "./providers";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen text-white overflow-x-hidden">
        <div className="app-background" aria-hidden="true" />
        <div className="app-overlay" aria-hidden="true" />

        <Providers>
          <Navbar />
          <DevModeButton />

          <main className="relative z-10 px-4 md:px-6 pt-24 md:pt-28 pb-8">
            <div className="mx-auto w-full max-w-6xl min-h-[calc(100vh-8rem)] rounded-2xl border border-zinc-700/70 bg-zinc-900/65 backdrop-blur-md shadow-2xl">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
