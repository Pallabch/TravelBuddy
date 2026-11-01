"use client";

import { authClient } from "@/lib/auth/client";
import { useState } from "react";

export type AuthMode = "sign-in" | "sign-up";

export function AuthPanel({
  mode,
  onModeChange,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const signingIn = mode === "sign-in";

  async function submit(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const result = signingIn
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({
          name: String(formData.get("name") ?? ""),
          email,
          password,
        });

    if (result.error) {
      setError(result.error.message ?? "Something went wrong");
      return;
    }
    window.location.assign("/profile");
  }

  return (
    <form action={submit} className="mt-6 flex flex-col gap-4">
      {signingIn ? null : (
        <Field
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Ada Traveler"
          autoFocus
        />
      )}
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        autoFocus={signingIn}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={signingIn ? "current-password" : "new-password"}
        minLength={signingIn ? undefined : 8}
        placeholder={signingIn ? "Your password" : "At least 8 characters"}
      />
      <button
        type="submit"
        className="mt-1 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900"
      >
        {signingIn ? "Sign in" : "Create account"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-center text-sm text-stone-500">
        {signingIn ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => onModeChange("sign-up")}
              className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-900 dark:text-stone-100 dark:decoration-stone-600 dark:hover:decoration-stone-100"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => onModeChange("sign-in")}
              className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-900 dark:text-stone-100 dark:decoration-stone-600 dark:hover:decoration-stone-100"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  minLength,
  placeholder,
  autoFocus,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  minLength?: number;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label}
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 outline-none placeholder:text-stone-400 focus:border-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-100"
      />
    </label>
  );
}
