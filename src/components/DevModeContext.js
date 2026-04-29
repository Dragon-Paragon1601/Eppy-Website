"use client";

import { createContext, useContext, useEffect, useState } from "react";

const DevModeContext = createContext();

export function DevModeProvider({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedUnlockedState = localStorage.getItem("devModeUnlocked");
    if (savedUnlockedState === "true") {
      setIsUnlocked(true);
    }
    setIsLoaded(true);
  }, []);

  return (
    <DevModeContext.Provider value={{ isUnlocked, isLoaded }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error("useDevMode must be used within DevModeProvider");
  }
  return context;
}
