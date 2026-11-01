"use client";

import { useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { Logo } from "@/components/logo";
import type { AuthMode } from "@/components/auth-panel";
import { RouteAnimation } from "@/components/route-animation";
import { ThemeToggle } from "@/components/theme-toggle";

export function Landing() {
  const [mode, setMode] = useState<AuthMode | null>(null);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[var(--background)]/85 backdrop-blur dark:border-stone-800/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-900"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className="rounded-full bg-stone-900 px-3.5 py-2 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 py-14 md:grid-cols-2 md:gap-16 md:py-20">
        <div>
          <p className="text-sm font-medium tracking-wide text-stone-500">
            Trips, together
          </p>
          <h1 className="mt-3 max-w-md text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.08]">
            Plan a trip, then add people.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-stone-600 dark:text-stone-400">
            A shared place for the dates, the destination, and the people
            coming with you.
          </p>
          <p className="mt-6 text-sm text-stone-500">
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-900 dark:text-stone-100 dark:decoration-stone-600 dark:hover:decoration-stone-100"
            >
              Sign in
            </button>{" "}
            if you already have an account, or{" "}
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-900 dark:text-stone-100 dark:decoration-stone-600 dark:hover:decoration-stone-100"
            >
              create one
            </button>
            .
          </p>
        </div>
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-stone-200/80 blur-3xl dark:bg-stone-800"
          />
          <RouteAnimation />
        </div>
      </main>

      {mode ? (
        <AuthDialog
          mode={mode}
          onModeChange={setMode}
          onClose={() => setMode(null)}
        />
      ) : null}
    </div>
  );
}

