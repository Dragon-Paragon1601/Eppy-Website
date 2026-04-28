"use client";

import { useSession } from "next-auth/react";
import { Code2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function DevModeButton() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Pobierz Dev User IDs i Dev Key z .env
  const devUserIds = process.env.NEXT_PUBLIC_DEV_USER_IDS?.split(",") || [];
  const devKey = process.env.NEXT_PUBLIC_DEV_KEY;

  // Sprawdź czy zalogowany użytkownik to dev user
  const isDevUser =
    session?.user?.id && devUserIds.includes(session.user.id.toString());

  // Przywróć stan z localStorage przy załadowaniu
  useEffect(() => {
    const savedUnlockedState = localStorage.getItem("devModeUnlocked");
    if (savedUnlockedState === "true") {
      setIsUnlocked(true);
    }
    setIsLoaded(true);
  }, []);

  // Jeśli użytkownik nie jest dev user, nie pokazuj przycisku
  if (!isDevUser || !isLoaded) {
    return null;
  }

  const handleToggle = () => {
    // Jeśli już odblokowani, po prostu toggleuj panel
    if (isUnlocked) {
      setIsOpen(!isOpen);
    } else {
      // Jeśli nie odblokowani, otwórz panel z formularzem
      setIsOpen(true);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === devKey) {
      setIsUnlocked(true);
      setError("");
      // Zapisz stan w localStorage
      localStorage.setItem("devModeUnlocked", "true");
    } else {
      setError("Błędne hasło");
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    setIsOpen(false);
    setPassword("");
    // Usuń ze localStorage
    localStorage.removeItem("devModeUnlocked");
  };

  return (
    <>
      {/* Przycisk główny */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-8 left-8 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group ${
          isUnlocked
            ? "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            : "bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        }`}
        title={isUnlocked ? "Dev Mode (Zalogowany)" : "Dev Mode"}
        aria-label="Dev Mode Button"
      >
        <Code2
          size={24}
          className="text-white group-hover:animate-pulse"
          strokeWidth={2.5}
        />
      </button>

      {/* Panel Dev Mode'u */}
      {isOpen && (
        <div className="fixed bottom-24 left-8 z-40 bg-slate-900 border border-purple-500/50 rounded-lg shadow-2xl p-6 w-80 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Code2 size={20} className="text-purple-400" />
              Dev Mode
            </h3>
            <button
              onClick={handleToggle}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {!isUnlocked ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Wpisz hasło Dev Key
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded transition-colors"
              >
                Odblokuj
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-500/20 border border-green-500/50 rounded p-3">
                <p className="text-green-300 text-sm font-semibold">
                  ✓ Dev Mode Odblokowany
                </p>
                <p className="text-green-200/70 text-xs mt-1">
                  ID: {session.user.id}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <button
                  onClick={() => {
                    // Przechodzimy do testowania funkcjonalności
                    window.location.href = "/?dev=true";
                  }}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                >
                  Test Mode
                </button>
                <button
                  onClick={() => {
                    console.log("Session:", session);
                    console.log("User ID:", session.user.id);
                  }}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                >
                  Pokaż Session
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                Wyloguj
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={handleToggle}
          aria-hidden="true"
        />
      )}
    </>
  );
}
