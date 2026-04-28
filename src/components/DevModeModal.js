import { useState } from "react";

export default function DevModeModal({ open, onClose, onLogin, error }) {
  const password = process.env.NEXT_PUBLIC_DEV_KEY;

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur animate-fadeIn">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-zinc-700 relative animate-scaleIn">
        <button
          className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xl transition-colors"
          onClick={onClose}
          aria-label="Zamknij"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-400">
          Dev Mode Login
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Developer password"
            value={password}
            autoFocus
          />
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
