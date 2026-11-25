"use client";

import { useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { BoardingPass } from "@/components/boarding-pass";
import { Logo } from "@/components/logo";
import type { AuthMode } from "@/components/auth-panel";
import { RouteAnimation } from "@/components/route-animation";
import { ThemeToggle } from "@/components/theme-toggle";

const sampleTrip = {
  id: "5f3a9c2e7b14d6a80c9e1f2b3d4a5c6e",
  title: "Lisbon weekend",
  destination: "Lisbon, Portugal",
  startDate: "2026-11-06",
  endDate: "2026-11-09",
  coverKey: null,
  role: "owner",
};

const features = [
  {
    label: "Itinerary",
    detail: "Every day of the trip with times, places, and who is going.",
  },
  {
    label: "Tickets & documents",
    detail: "Flight PDFs and hotel vouchers for the group. Passports stay private.",
  },
  {
    label: "Split expenses",
    detail: "Split equally, by amounts, by percent, or by shares, then settle up.",
  },
  {
    label: "Checklist",
    detail: "Packing and to-dos, ticked off per person.",
  },
];

export function Landing() {
  const [mode, setMode] = useState<AuthMode | null>(null);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b-2 border-dashed border-stone-300/80 bg-[var(--background)]/85 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-stone-700/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
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
              className="rounded-full bg-stamp px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong dark:text-stone-950"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 md:grid-cols-2 md:gap-16 md:py-20">
          <div>
            <p className="field-label">Trips, together</p>
            <h1 className="mt-3 max-w-md font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Plan a trip, then add <em className="font-normal text-stamp">people</em>.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-stone-600 dark:text-stone-400">
              A shared place for the dates, the destination, the plan, and the
              people coming with you.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMode("sign-up")}
                className="rounded-lg bg-stamp px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-stamp-strong dark:text-stone-950"
              >
                Create an account
              </button>
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className="rounded-lg border border-stone-300 bg-card px-5 py-3 text-sm font-semibold hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
              >
                Sign in
              </button>
            </div>
          </div>
          <div>
            <RouteAnimation />
            <div className="relative -mt-10 rotate-[-1.5deg] px-4 sm:px-8">
              <BoardingPass trip={sampleTrip} />
            </div>
          </div>
        </section>

        <section className="border-t-2 border-dashed border-stone-300/80 dark:border-stone-700/80">
          <ul className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6 sm:py-14 lg:grid-cols-4">
            {features.map((feature, index) => (
              <li
                key={feature.label}
                className="rounded-2xl border border-stone-200 bg-card p-5 shadow-sm dark:border-stone-800"
              >
                <p className="font-mono text-xs text-stamp">0{index + 1}</p>
                <p className="mt-2 font-serif text-xl font-semibold">{feature.label}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
                  {feature.detail}
                </p>
              </li>
            ))}
          </ul>
        </section>
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
