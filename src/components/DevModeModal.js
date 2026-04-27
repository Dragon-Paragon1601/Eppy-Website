import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DevModeModal({ open, onClose, onLogin, error }) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-zinc-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-zinc-700 relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xl"
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
                onChange={(e) => setPassword(e.target.value)}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
