"use client";

import { useActionState } from "react";
import { createTripAction } from "./actions";

export function TripForm({
  action,
}: {
  action: typeof createTripAction;
}) {
  const [state, formAction, pending] = useActionState(
    async (_state: { error?: string } | null, formData: FormData) => {
      return (await action(formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        Title
        <input
          name="title"
          required
          className="rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-stone-700"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        Destination
        <input
          name="destination"
          required
          className="rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-stone-700"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Start
        <input
          name="startDate"
          type="date"
          required
          className="rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-stone-700"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        End
        <input
          name="endDate"
          type="date"
          required
          className="rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-stone-700"
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
        >
          {pending ? "Saving" : "Create trip"}
        </button>
        {state?.error ? (
          <p className="mt-3 text-sm text-red-600">{state.error}</p>
        ) : null}
      </div>
    </form>
  );
}
