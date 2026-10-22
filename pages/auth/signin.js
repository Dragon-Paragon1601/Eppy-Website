import { useRouter } from "next/router";
import { signIn } from "next-auth/react";

export default function SignIn() {
  const router = useRouter();
  const hasError = Boolean(router.query.error);

  const handleSignIn = () => {
    signIn("discord", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-white">Sign in with Discord</h1>
      {hasError && (
        <p className="text-sm text-red-300" role="alert">
          Discord sign-in failed. Check the OAuth configuration and try again.
        </p>
      )}
      <button
        type="button"
        onClick={handleSignIn}
        className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-500"
      >
        Continue with Discord
      </button>
    </div>
  );
}
