"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import DevModeButton from "@/components/DevModeButton";
import DevModeModal from "@/components/DevModeModal";
import { useDevMode } from "@/components/DevModeContext";

export default function ClientRoot({ children }) {
  const { devMode, setDevMode, isDevUser } = useDevMode();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  // Simple password for demo, replace with secure check in production
  const DEV_PASSWORD = "eppydev2026";

  const handleDevButtonClick = () => {
    setModalOpen(true);
    setError("");
  };
  const handleModalClose = () => {
    setModalOpen(false);
    setError("");
  };
  const handleDevLogin = (password) => {
    if (password === DEV_PASSWORD) {
      setDevMode(true);
      setModalOpen(false);
      setError("");
    } else {
      setError("Nieprawidłowe hasło.");
    }
  };

  return (
    <>
      <Navbar />
      <DevModeButton
        onClick={handleDevButtonClick}
        visible={isDevUser && !devMode}
      />
      <DevModeModal
        open={modalOpen}
        onClose={handleModalClose}
        onLogin={handleDevLogin}
        error={error}
      />
      <main className="relative z-10 px-4 md:px-6 pt-24 md:pt-28 pb-8">
        <div className="mx-auto w-full max-w-6xl min-h-[calc(100vh-8rem)] rounded-2xl border border-zinc-700/70 bg-zinc-900/65 backdrop-blur-md shadow-2xl">
          {children}
        </div>
      </main>
    </>
  );
}
