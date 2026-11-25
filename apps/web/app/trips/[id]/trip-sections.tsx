"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemedSelect } from "@/components/themed-select";

export function TicketForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setPending(true);
    const response = await fetch(`/api/trips/${tripId}/tickets`, {
      method: "POST",
      body: new FormData(form),
    });
    setPending(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "The file was not saved.");
      return;
    }
    form.reset();
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

const documentSuggestions = [
  "Flight ticket",
  "Hotel voucher",
  "Train ticket",
  "Car rental",
  "Visa",
  "Travel insurance",
  "Activity booking",
  "Other",
];

export function DocumentForm({ tripId, categories }: { tripId: string; categories: string[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const options = [...new Set([...documentSuggestions, ...categories])];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setPending(true);
    const response = await fetch(`/api/trips/${tripId}/documents`, {
      method: "POST",
      body: new FormData(form),
    });
    setPending(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "The file was not saved.");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
      <label className="grid gap-1 text-sm">
        Category
        <ThemedSelect
          name="category"
          editable
          defaultValue="Flight ticket"
          placeholder="Hotel voucher"
          options={options.map((option) => ({ value: option, label: option }))}
        />
      </label>
      <label className="grid gap-1 text-sm">
        File
        <input
          name="file"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png,image/webp,text/plain"
          className="py-1.5 text-sm"
        />
      </label>
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Uploading" : "Add document"}
      </button>
      {error ? <p className="text-sm text-red-600 sm:col-span-3">{error}</p> : null}
    </form>
  );
}

const button =
  "whitespace-nowrap rounded-lg bg-stamp px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong disabled:opacity-60 dark:text-stone-950";
