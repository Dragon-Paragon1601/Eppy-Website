import { useEffect } from "react";
import { signIn } from "next-auth/react";

export default function SignIn() {
  useEffect(() => {
    signIn("discord", { callbackUrl: "/auth/callback" });
  }, []);

  return null;
}
