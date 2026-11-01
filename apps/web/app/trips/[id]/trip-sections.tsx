"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addExpenseAction, addItineraryAction } from "./actions";

const field =
  "w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900 dark:border-stone-700 dark:focus:border-stone-100";

export function ItineraryForm({ tripId }: { tripId: string }) {
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    const result = await addItineraryAction(tripId, formData);
    setError(result?.error ?? null);
  }

  return (
    <form action={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">
        Day
        <input name="day" type="date" required className={field} />
      </label>
      <label className="grid gap-1 text-sm">
        Stop
        <input name="title" required placeholder="Morning market" className={field} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Note
        <input name="details" placeholder="Optional" className={field} />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className={button}>
          Add to itinerary
        </button>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    </form>
  );
}

export function TicketForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const response = await fetch(`/api/trips/${tripId}/tickets`, {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    setPending(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "The file was not saved.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-wrap items-center gap-3">
      <input
        name="file"
        type="file"
        required
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="text-sm"
      />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Uploading" : "Add ticket"}
      </button>
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

export function ExpenseForm({
  tripId,
  people,
  currentUserId,
}: {
  tripId: string;
  people: { userId: string; name: string }[];
  currentUserId: string;
}) {
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    const result = await addExpenseAction(tripId, formData);
    setError(result?.error ?? null);
  }

  return (
    <form action={submit} className="mt-4 grid gap-3 sm:grid-cols-3">
      <label className="grid gap-1 text-sm sm:col-span-3">
        What
        <input name="title" required placeholder="Dinner" className={field} />
      </label>
      <label className="grid gap-1 text-sm">
        Amount
        <input name="amount" required inputMode="decimal" placeholder="42.50" className={field} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Paid by
        <select name="paidBy" defaultValue={currentUserId} className={field}>
          {people.map((person) => (
            <option key={person.userId} value={person.userId}>
              {person.name}
            </option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-3">
        <button type="submit" className={button}>
          Add expense
        </button>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    </form>
  );
}

export function DocumentForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const response = await fetch(`/api/trips/${tripId}/documents`, {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    setPending(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "The file was not saved.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-wrap items-center gap-3">
      <input
        name="file"
        type="file"
        required
        accept="application/pdf,image/jpeg,image/png,image/webp,text/plain"
        className="text-sm"
      />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Uploading" : "Add document"}
      </button>
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

const button =
  "rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900";
