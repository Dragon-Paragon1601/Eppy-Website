import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// Parsuj DEV_USER_IDS z .env (format: id1,id2,id3)
const DEV_USER_IDS = (process.env.DEV_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

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
