"use client";

import { useEffect, useRef } from "react";
import { AuthPanel, type AuthMode } from "@/components/auth-panel";

export function AuthDialog({
  mode,
  onModeChange,
  onClose,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-800 dark:bg-stone-950">
        <h2 id="auth-dialog-title" className="pr-16 text-lg font-semibold tracking-tight">
          {mode === "sign-in" ? "Sign in" : "Create an account"}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {mode === "sign-in"
            ? "Use the email and password for your account."
            : "A name, an email, and a password. Then you can plan a trip."}
        </p>
        <AuthPanel key={mode} mode={mode} onModeChange={onModeChange} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full px-2 py-1 text-sm text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-900"
        >
          Close
        </button>
      </div>
    </dialog>
  );
}
