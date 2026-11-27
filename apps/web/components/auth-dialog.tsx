"use client";

import { useEffect, useRef, useState } from "react";
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
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={pending ? undefined : "auth-dialog-title"}
      aria-busy={pending}
      onClose={onClose}
      onCancel={(event) => {
        if (pending) event.preventDefault();
      }}
      onClick={(event) => {
        if (pending) return;
        if (event.target === event.currentTarget) onClose();
      }}
      className={
        pending
          ? "grid !h-dvh !w-dvw !max-h-none !max-w-none place-items-center !bg-[var(--background)]"
          : undefined
      }
    >
      {pending ? (
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
          <span
            aria-hidden="true"
            className="size-11 rounded-full border-2 border-x-stone-300 border-b-stone-300 border-t-stamp motion-safe:animate-spin dark:border-x-stone-700 dark:border-b-stone-700"
          />
          <p className="text-sm font-medium">
            {mode === "sign-in" ? "Signing in" : "Creating your account"}
          </p>
        </div>
      ) : null}
      <div
        className={`relative w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-card p-6 shadow-xl dark:border-stone-800 ${
          pending ? "hidden" : ""
        }`}
      >
        <h2 id="auth-dialog-title" className="pr-16 text-lg font-semibold tracking-tight">
          {mode === "sign-in" ? "Sign in" : "Create an account"}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {mode === "sign-in"
            ? "Use the email and password for your account."
            : "A name, an email, and a password. Then you can plan a trip."}
        </p>
        <AuthPanel
          key={mode}
          mode={mode}
          onModeChange={onModeChange}
          onPendingChange={setPending}
        />
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
