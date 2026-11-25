import { listTripsForUser } from "@travel-buddy/db";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BoardingPass } from "@/components/boarding-pass";
import { Landing } from "@/components/landing";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return <Landing />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const allTrips = (await listTripsForUser(session.user.id)).map((item) => ({
    ...item,
    startDate: String(item.startDate).slice(0, 10),
    endDate: String(item.endDate).slice(0, 10),
  }));
  const trips = allTrips
    .filter((item) => item.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const pastCount = allTrips.length - trips.length;
  const next = trips[0];
  const firstName = session.user.name.trim().split(/\s+/)[0] ?? session.user.name;

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="field-label">Welcome back</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight">Hi, {firstName}</h1>

        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Next trip</h2>
            {next ? (
              <p className="font-mono text-xs text-stamp">{countdown(today, next.startDate)}</p>
            ) : null}
          </div>
          <div className="mt-3">
            {next ? (
              <BoardingPass trip={next} href={`/trips/${next.id}`} />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-stone-300 px-6 py-10 text-center dark:border-stone-700">
                <p className="font-serif text-xl">
                  {pastCount > 0 ? "No upcoming trips" : "Nothing booked yet"}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {pastCount > 0
                    ? `You have ${pastCount} past ${pastCount === 1 ? "trip" : "trips"} in My trips.`
                    : "Create a trip and add the people coming with you."}
                </p>
                <Link
                  href="/trips"
                  className="mt-4 inline-flex rounded-lg bg-stamp px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong dark:text-stone-950"
                >
                  Plan a trip
                </Link>
              </div>
            )}
          </div>
          {trips.length > 1 ? (
            <p className="mt-3 text-sm text-stone-500">
              {trips.length - 1} more upcoming.{" "}
              <Link href="/trips" className="font-medium text-stone-900 underline underline-offset-4 dark:text-stone-100">
                See all trips
              </Link>
            </p>
          ) : null}
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          <Shortcut href="/trips" label="Trips" detail="Plan, invite, split costs" />
          <Shortcut href="/profile#documents" label="Your documents" detail="Passport, ID, visas" />
          <Shortcut href="/profile" label="Profile" detail="How others see you" />
        </section>
      </main>
    </AppShell>
  );
}

function Shortcut({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-stone-200 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800"
    >
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-sm text-stone-500">{detail}</p>
    </Link>
  );
}

function countdown(today: string, start: string) {
  const days = Math.round((Date.parse(start) - Date.parse(today)) / 86_400_000);
  if (days <= 0) return "Happening now";
  if (days === 1) return "Departs tomorrow";
  return `Departs in ${days} days`;
}
