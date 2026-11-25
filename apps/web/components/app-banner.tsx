"use client";

import { authClient } from "@/lib/auth/client";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PendingLink } from "@/components/pending-link";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function AppBanner({
  name,
  hasPhoto,
  version,
  query,
}: {
  name: string;
  hasPhoto: boolean;
  version: string;
  query: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b-2 border-dashed border-stone-300/80 bg-[var(--background)]/90 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-stone-700/80">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 sm:grid sm:h-16 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:px-6 sm:py-0">
        <PendingLink href="/" className="order-1 rounded-lg sm:justify-self-start" aria-label="Travel Buddy home">
          <Logo />
        </PendingLink>
        <div className="order-2 ml-auto flex items-center gap-1 sm:order-3 sm:ml-0 sm:justify-self-end">
          <form
            action="/search"
            className="hidden w-36 rounded-full border border-stone-300 bg-card px-3 sm:block dark:border-stone-700 dark:bg-stone-900"
          >
            <SearchField query={query} />
          </form>
          <ThemeToggle />
          <Notifications />
          <ProfileMenu
            name={name}
            hasPhoto={hasPhoto}
            version={version}
            active={pathname.startsWith("/profile")}
          />
        </div>
        <nav className="order-3 flex w-full items-center rounded-full border border-stone-200 bg-card p-1 sm:order-2 sm:w-auto sm:justify-self-center dark:border-stone-800 dark:bg-stone-900">
          <Tab href="/" active={pathname === "/"}>
            Home
          </Tab>
          <Tab href="/trips" active={pathname.startsWith("/trips")}>
            Trips
          </Tab>
        </nav>
        <form
          action="/search"
          className="order-4 w-full rounded-full border border-stone-300 bg-card px-3 sm:hidden dark:border-stone-700"
        >
          <SearchField query={query} />
        </form>
      </div>
    </header>
  );
}

function SearchField({ query }: { query: string }) {
  return (
    <input
      name="q"
      key={query}
      defaultValue={query}
      placeholder="Search"
      aria-label="Search people and trips"
      className="w-full bg-transparent py-2 text-base outline-none placeholder:text-stone-400 sm:py-1.5 sm:text-sm"
    />
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useDismiss(open, panelRef, () => setOpen(false));

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="grid size-9 place-items-center rounded-full text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-900"
      >
        <Bell />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 w-64 rounded-xl border border-stone-200 bg-card p-4 shadow-lg dark:border-stone-800">
          <p className="text-sm font-medium">Notifications</p>
          <p className="mt-2 text-sm text-stone-500">No notifications yet.</p>
        </div>
      ) : null}
    </div>
  );
}

function ProfileMenu({
  name,
  hasPhoto,
  version,
  active,
}: {
  name: string;
  hasPhoto: boolean;
  version: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useDismiss(open, panelRef, () => setOpen(false));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function signOut() {
    await authClient.signOut();
    window.location.assign("/");
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        aria-current={active ? "page" : undefined}
        onClick={() => setOpen((current) => !current)}
        className={`grid size-9 place-items-center overflow-hidden rounded-full bg-stone-200 text-xs font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-100 ${
          active
            ? "ring-2 ring-stamp ring-offset-2 ring-offset-[var(--background)]"
            : ""
        }`}
      >
        {hasPhoto ? (
          // The signed-in user's photo, served from our API.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/profile/avatar?v=${version}`}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initials(name)}</span>
        )}
      </button>
      {open ? (
        <div className="absolute right-0 top-11 w-40 rounded-xl border border-stone-200 bg-card p-1 shadow-lg dark:border-stone-800">
          <PendingLink
            href="/profile"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-900"
          >
            Profile
          </PendingLink>
          <button
            type="button"
            onClick={signOut}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-900"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function useDismiss(
  open: boolean,
  panelRef: React.RefObject<HTMLDivElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) close();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, panelRef, close]);
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <PendingLink
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "flex flex-1 items-center justify-center rounded-full bg-stone-900 px-3.5 py-2 text-sm font-medium text-stone-50 shadow-sm sm:flex-none sm:py-1.5 dark:bg-stone-100 dark:text-stone-900"
          : "flex flex-1 items-center justify-center rounded-full px-3.5 py-2 text-sm font-medium text-stone-500 hover:text-stone-900 sm:flex-none sm:py-1.5 dark:hover:text-stone-100"
      }
    >
      {children}
    </PendingLink>
  );
}

function Bell() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M9 2.5a4.2 4.2 0 0 0-4.2 4.2v2.1L3.4 11.2a1 1 0 0 0 .8 1.6h9.6a1 1 0 0 0 .8-1.6L13.2 8.8V6.7A4.2 4.2 0 0 0 9 2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 13.6a1.6 1.6 0 0 0 3.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
