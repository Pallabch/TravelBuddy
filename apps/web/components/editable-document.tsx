"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

const field =
  "min-w-0 flex-1 rounded-lg border border-stone-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-stone-900 dark:border-stone-700 dark:focus:border-stone-100";

export function EditableDocument({ name, href, endpoint }: { name: string; href: string; endpoint: string }) {
  const router = useRouter();
  const fieldId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  function save() {
    const next = draft.trim();
    if (!next || saving) return;
    startSave(async () => {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? "Could not rename it.");
        return;
      }
      setError(null);
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="min-w-0">
    <div className="flex min-w-0 items-start justify-between gap-2">
      {editing ? (
        <form
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <label className="sr-only" htmlFor={fieldId}>
            Document name
          </label>
          <input
            id={fieldId}
            value={draft}
            required
            maxLength={180}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            className={field}
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
              setDraft(name);
              setError(null);
              setEditing(false);
            }}
            className="text-sm text-stone-500"
          >
            Cancel
          </button>
        </form>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 truncate text-sm font-medium underline decoration-stone-300 underline-offset-4"
        >
          {name}
        </a>
      )}
      <span className="flex shrink-0 items-center">
        {editing ? null : (
          <button
            type="button"
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
            className="rounded-lg px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Rename
          </button>
        )}
        <Remove
          label={`Delete ${name}`}
          pending={deleting}
          onConfirm={() =>
            startDelete(async () => {
              const response = await fetch(endpoint, { method: "DELETE" });
              const payload = (await response.json().catch(() => null)) as { error?: string } | null;
              if (!response.ok) {
                setError(payload?.error ?? "Could not delete it.");
                return;
              }
              setError(null);
              router.refresh();
            })
          }
        />
      </span>
      </div>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function Remove({
  label,
  pending,
  onConfirm,
}: {
  label: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <span
      className={
        confirming
          ? "inline-grid grid-cols-[auto_1fr] items-center rounded-lg bg-red-50 transition-[grid-template-columns,background-color] duration-200 ease-out dark:bg-red-950/50"
          : "inline-grid grid-cols-[auto_0fr] items-center rounded-lg transition-[grid-template-columns,background-color] duration-200 ease-out"
      }
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={confirming}
        onClick={() => setConfirming(true)}
        className={
          confirming
            ? "grid size-8 place-items-center text-red-700 dark:text-red-400"
            : "grid size-8 place-items-center text-stone-400 hover:text-red-700 dark:hover:text-red-400"
        }
      >
        <TrashIcon open={confirming} />
      </button>
      <span className="overflow-hidden" inert={confirming ? undefined : true} aria-hidden={!confirming}>
        <span className="flex items-center gap-1 pr-1">
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="rounded-md bg-red-700 px-2 py-1 text-xs font-medium whitespace-nowrap text-white disabled:opacity-60"
          >
            {pending ? "Deleting" : "Delete"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-md px-2 py-1 text-xs whitespace-nowrap text-stone-600 hover:bg-white dark:text-stone-300 dark:hover:bg-stone-900"
          >
            Cancel
          </button>
        </span>
      </span>
    </span>
  );
}

function TrashIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <g
        className={
          open
            ? "origin-[4px_7px] -rotate-[24deg] transition-transform duration-200 ease-out"
            : "origin-[4px_7px] transition-transform duration-200 ease-out"
        }
      >
        <path
          d="M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path d="M4 7h16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </g>
      <path
        d="M6.5 9.2 7.4 19a1.6 1.6 0 0 0 1.6 1.4h6a1.6 1.6 0 0 0 1.6-1.4l.9-9.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10 12.2v5.2M14 12.2v5.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
