"use client"; 
import Navbar from "@/components/Navbar";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react"; // Zaimportuj useEffect, żeby obsłużyć scroll

export default function RootLayout({ children }) {
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      document.getElementById("parallax-bg").style.transform = `translateY(${scrollPos * 0.2}px)`;
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <html lang="pl">
      <body className="bg-background relative">
        <SessionProvider>
          {/* Tło parallax */}
          <div
            id="parallax-bg"
            className="fixed top-0 left-0 w-screen h-screen bg-cover bg-center z-[-1] overflow-hidden"
            style={{ 
              backgroundImage: "url('/assets/galaxy.png')",  
              objectFit: 'cover', 
              objectPosition: 'center center'  
            }}
          />

          <Navbar />

          {/* Pasek na środku */}
          <div className="flex justify-center items-center h-full py-10">
            <div className="bg-indigo-900 bg-secondary-foreground w-4/5 min-h-[900px] rounded-lg shadow-lg">
              {/* Tutaj będą wyświetlane inne komponenty, np. dashboard, about */}
              {children}
            </div>
          </div>

        </SessionProvider>
      </body>
    </html>
  );
}
