"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
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

const nameField =
  "min-w-0 flex-1 rounded-lg border border-stone-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-stone-900 dark:border-stone-700 dark:focus:border-stone-100";

export function TicketCard({
  tripId,
  ticket,
  index,
}: {
  tripId: string;
  ticket: { id: string; name: string };
  index: number;
}) {
  const router = useRouter();
  const fieldId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ticket.name);
  const [label, setLabel] = useState(ticket.name);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  function save() {
    const next = draft.trim();
    if (!next || saving) return;
    startSave(async () => {
      const response = await fetch(`/api/trips/${tripId}/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? "Could not rename it.");
        return;
      }
      setLabel(next);
      setError(null);
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-card shadow-sm dark:border-stone-800">
      <div className="flex">
        <span className="flex w-16 shrink-0 flex-col items-center justify-center bg-stamp-soft py-3 font-mono text-stamp">
          <span className="text-[10px] tracking-widest">TKT</span>
          <span className="text-lg font-semibold">{String(index + 1).padStart(2, "0")}</span>
        </span>
        <div className="perforation-y min-w-0 flex-1 px-4 py-3">
          {editing ? (
            <form
              className="flex min-w-0 flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              <label className="sr-only" htmlFor={fieldId}>
                Ticket name
              </label>
              <input
                id={fieldId}
                value={draft}
                required
                maxLength={180}
                autoFocus
                onChange={(event) => setDraft(event.target.value)}
                className={nameField}
              />
              <button
                type="submit"
                disabled={saving || draft.trim().length === 0}
                className="rounded-lg bg-stamp px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong disabled:opacity-60 dark:text-stone-950"
              >
                {saving ? "Saving" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(label);
                  setError(null);
                  setEditing(false);
                }}
                className="text-sm text-stone-500"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex min-w-0 items-start justify-between gap-2">
              <a
                href={`/api/trips/${tripId}/tickets/${ticket.id}`}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate text-sm font-medium underline decoration-stone-300 underline-offset-4"
              >
                {label}
              </a>
              <button
                type="button"
                onClick={() => {
                  setDraft(label);
                  setEditing(true);
                }}
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Rename
              </button>
            </div>
          )}
          <span className="field-label mt-0.5 block">Open ticket</span>
          {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
