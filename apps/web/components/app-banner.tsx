"use client";

import { authClient } from "@/lib/auth/client";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[var(--background)]/90 backdrop-blur dark:border-stone-800/80">
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        <Link href="/" className="justify-self-start" aria-label="Travel Buddy home">
          <Logo />
        </Link>
        <nav className="flex items-center rounded-full bg-stone-100 p-1 dark:bg-stone-900">
          <Tab href="/" active={pathname === "/"}>
            Home
          </Tab>
          <Tab href="/trips" active={pathname.startsWith("/trips")}>
            Trips
          </Tab>
        </nav>
        <div className="flex items-center justify-end gap-2">
          <form
            action="/search"
            className="w-24 rounded-full border border-stone-300 px-3 sm:w-36 dark:border-stone-700"
          >
            <input
              name="q"
              key={query}
              defaultValue={query}
              placeholder="Search"
              aria-label="Search people and trips"
              className="w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-stone-400"
            />
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
      </div>
    </header>
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
        <div className="absolute right-0 top-11 w-64 rounded-xl border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-800 dark:bg-stone-950">
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
            ? "ring-2 ring-stone-900 ring-offset-2 ring-offset-[var(--background)] dark:ring-stone-100"
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
        <div className="absolute right-0 top-11 w-40 rounded-xl border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-800 dark:bg-stone-950">
          <Link
            href="/profile"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-900"
          >
            Profile
          </Link>
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
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-50"
          : "rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      }
    >
      {children}
    </Link>
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
