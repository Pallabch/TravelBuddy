import { listTripsForUser } from "@travel-buddy/db";
import { AppShell } from "@/components/app-shell";
import { BoardingPass, type PassTrip } from "@/components/boarding-pass";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { createTripAction } from "./actions.ts";
import { TripForm } from "./trip-form.tsx";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/");
  }

  const today = new Date().toISOString().slice(0, 10);
  const trips: PassTrip[] = (await listTripsForUser(session.user.id)).map((item) => ({
    ...item,
    startDate: String(item.startDate).slice(0, 10),
    endDate: String(item.endDate).slice(0, 10),
  }));
  const upcoming = trips
    .filter((item) => item.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = trips.filter((item) => item.endDate < today);

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
        <p className="field-label">Your travels</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight">My trips</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          Trips you own and trips other people have added you to.
        </p>

        {trips.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-stone-300 px-6 py-10 text-center dark:border-stone-700">
            <p className="font-serif text-xl">No trips yet</p>
            <p className="mt-1 text-sm text-stone-500">Create your first one below.</p>
          </div>
        ) : null}

        <TripGroup title="Upcoming" trips={upcoming} />
        <TripGroup title="Past trips" trips={past} />

        <section className="mt-12 rounded-2xl border border-stone-200 bg-card p-6 shadow-sm dark:border-stone-800">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Plan a new trip</h2>
          <TripForm action={createTripAction} />
        </section>
      </main>
    </AppShell>
  );
}

function TripGroup({ title, trips }: { title: string; trips: PassTrip[] }) {
  if (trips.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold">
        {title} <span className="font-mono text-xs text-stone-500">· {trips.length}</span>
      </h2>
      <ul className="mt-3 grid gap-4">
        {trips.map((item) => (
          <li key={item.id}>
            <BoardingPass trip={item} href={`/trips/${item.id}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}
