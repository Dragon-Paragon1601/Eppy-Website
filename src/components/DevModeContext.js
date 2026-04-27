import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// Dodaj tutaj ID Discorda uprawnionych deweloperów
const DEV_USER_IDS = [
  "123456789012345678", // Przykładowy ID, zamień na prawdziwe
  // Dodaj kolejne ID jeśli potrzeba
];

const DevModeContext = createContext({
  devMode: false,
  setDevMode: () => {},
  isDevUser: false,
});

export function useDevMode() {
  return useContext(DevModeContext);
}

export function DevModeProvider({ children }) {
  const { data: session } = useSession();
  const [devMode, setDevMode] = useState(false);
  const [isDevUser, setIsDevUser] = useState(false);

  useEffect(() => {
    if (session?.user?.id && DEV_USER_IDS.includes(session.user.id)) {
      setIsDevUser(true);
    } else {
      setIsDevUser(false);
      setDevMode(false);
    }
  }, [session]);

  return (
    <DevModeContext.Provider value={{ devMode, setDevMode, isDevUser }}>
      {children}
    </DevModeContext.Provider>
  );
}
