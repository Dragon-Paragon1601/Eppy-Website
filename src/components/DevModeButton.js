import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function DevModeButton({ onClick, visible }) {
  if (!visible) return null;
  return (
    <div className="fixed left-4 bottom-4 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          className="bg-gradient-to-r from-blue-700 to-purple-700 text-white px-5 py-2 rounded-xl shadow-lg hover:scale-105 hover:from-blue-600 hover:to-purple-600 transition-transform"
          onClick={onClick}
        >
          Dev Mode
        </Button>
      </motion.div>
    </div>
  );
}
