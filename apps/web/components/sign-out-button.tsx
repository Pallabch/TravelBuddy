"use client";

import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  async function signOut() {
    await authClient.signOut();
    window.location.assign("/");
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm dark:border-stone-700"
    >
      Sign out
    </button>
  );
}
