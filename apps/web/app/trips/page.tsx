import { listTripsForUser } from "@travel-buddy/db";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createTripAction } from "./actions";
import { TripForm } from "./trip-form";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/");
  }

  const trips = await listTripsForUser(session.user.id);

  return (
    <AppShell>
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">My trips</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        Trips you own and trips other people have added you to.
      </p>

      {trips.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">No trips yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
          {trips.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              {item.coverKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/trips/${item.id}/photo?v=${item.coverKey.split("/").pop()}`}
                  alt=""
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="size-16 shrink-0 rounded-lg bg-stone-100 dark:bg-stone-900" />
              )}
              <div>
                <Link href={`/trips/${item.id}`} className="font-medium underline-offset-4 hover:underline">
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  {item.destination}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {item.startDate} to {item.endDate}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-12 text-lg font-semibold tracking-tight">New trip</h2>
      <TripForm action={createTripAction} />
    </main>
    </AppShell>
  );
}
