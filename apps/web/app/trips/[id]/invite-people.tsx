"use client";

import { useState } from "react";
import { addMemberAction } from "./actions";

type Person = { id: string; name: string; homeCity: string };

export function InvitePeople({ tripId }: { tripId: string }) {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch(
      `/api/trips/${tripId}/people?q=${encodeURIComponent(query)}`,
    );
    const payload = (await response.json()) as { people?: Person[]; error?: string };
    if (!response.ok) {
      setPeople([]);
      setError(payload.error ?? "Search failed.");
      return;
    }
    setPeople(payload.people ?? []);
    if ((payload.people ?? []).length === 0) {
      setError("No one new matches that search.");
    }
  }

  async function add(personId: string) {
    setPendingId(personId);
    await addMemberAction(tripId, personId);
  }

  return (
    <div className="mt-4">
      <form onSubmit={search} className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or city"
          aria-label="Search people to add"
          className={field}
        />
        <button
          type="submit"
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium dark:border-stone-700"
        >
          Search
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-stone-500">{error}</p> : null}
      {people.length > 0 ? (
        <ul className="mt-3 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
          {people.map((person) => (
            <li key={person.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium">{person.name}</p>
                {person.homeCity ? (
                  <p className="text-sm text-stone-500">{person.homeCity}</p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={pendingId === person.id}
                onClick={() => add(person.id)}
                className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
              >
                {pendingId === person.id ? "Adding" : "Add"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const field =
  "w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900 dark:border-stone-700 dark:focus:border-stone-100";
