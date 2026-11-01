import { searchPeople, searchTripsForUser } from "@travel-buddy/db";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = raw?.trim() ?? "";

  const [people, trips] = query
    ? await Promise.all([
        searchPeople(query),
        searchTripsForUser(session.user.id, query),
      ])
    : [[], []];

  return (
    <AppShell query={query}>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
        {query ? (
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Results for “{query}”
          </p>
        ) : (
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Search people by name or home city, and your trips by title or
            destination.
          </p>
        )}

        {query ? (
          <div className="mt-10 grid gap-10">
            <section>
              <h2 className="text-sm font-medium tracking-wide text-stone-500">
                People
              </h2>
              {people.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">No people found.</p>
              ) : (
                <ul className="mt-3 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
                  {people.map((person) => (
                    <li key={person.id} className="py-4">
                      <p className="font-medium">{person.name}</p>
                      {person.homeCity ? (
                        <p className="mt-1 text-sm text-stone-500">
                          {person.homeCity}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2 className="text-sm font-medium tracking-wide text-stone-500">
                Trips
              </h2>
              {trips.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">No trips found.</p>
              ) : (
                <ul className="mt-3 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
                  {trips.map((item) => (
                    <li key={item.id} className="py-4">
                      <Link href={`/trips/${item.id}`} className="font-medium underline-offset-4 hover:underline">
                        {item.title}
                      </Link>
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                        {item.destination}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        {item.startDate} to {item.endDate}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
