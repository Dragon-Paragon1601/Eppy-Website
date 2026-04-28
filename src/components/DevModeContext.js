import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// Parsuj DEV_USER_IDS z .env (format: id1,id2,id3)
const DEV_USER_IDS = (process.env.NEXT_PUBLIC_DEV_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

console.log("[DevMode] Loaded DEV_USER_IDS:", DEV_USER_IDS);

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
    console.log("[DevMode] Session user ID:", session?.user?.id);
    console.log(
      "[DevMode] DEV_USER_IDS check:",
      session?.user?.id ? DEV_USER_IDS.includes(session.user.id) : "no user id",
    );

    if (session?.user?.id && DEV_USER_IDS.includes(session.user.id)) {
      console.log("[DevMode] User is dev user!");
      setIsDevUser(true);
    } else {
      console.log("[DevMode] User is NOT dev user");
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
