"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const suggestions = [
  "Passport",
  "National ID",
  "Driving licence",
  "Visa",
  "Travel insurance",
  "Vaccination record",
];

const field =
  "w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900 dark:border-stone-700 dark:focus:border-stone-100";

const button =
  "whitespace-nowrap rounded-lg bg-stamp px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong disabled:opacity-60 dark:text-stone-950";

type PersonalDocument = { id: string; name: string; category: string; createdAt: string };

export function PersonalDocuments({ documents }: { documents: PersonalDocument[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const categories = [...new Set([...suggestions, ...documents.map((item) => item.category)])];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setPending(true);
    const response = await fetch("/api/profile/documents", {
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
    <section
      id="documents"
      className="mt-8 scroll-mt-24 rounded-3xl border border-stone-200 px-6 py-8 sm:px-8 dark:border-stone-800"
    >
      <h2 className="font-serif text-2xl font-semibold tracking-tight">Your documents</h2>
      <p className="mt-1 text-sm text-stone-500">
        Passport, ID, and other personal papers. Only you can see these, even on shared trips.
      </p>

      {documents.length === 0 ? (
        <p className="mt-5 text-sm text-stone-500">No documents yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <a
                  href={`/api/profile/documents/${document.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm font-medium underline decoration-stone-300 underline-offset-4"
                >
                  {document.name}
                </a>
                <p className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                  <CategoryTag>{document.category}</CategoryTag>
                  Added {document.createdAt}
                </p>
              </div>
              <RemoveDocument id={document.id} name={document.name} />
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
        <label className="grid gap-1 text-sm">
          Category
          <input
            name="category"
            required
            list="personal-document-categories"
            placeholder="Passport"
            maxLength={40}
            className={field}
          />
          <datalist id="personal-document-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
        <label className="grid gap-1 text-sm">
          File
          <input
            name="file"
            type="file"
            required
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="py-1.5 text-sm"
          />
        </label>
        <button type="submit" disabled={pending} className={button}>
          {pending ? "Uploading" : "Add document"}
        </button>
        {error ? <p className="text-sm text-red-600 sm:col-span-3">{error}</p> : null}
      </form>
    </section>
  );
}

function CategoryTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
      {children}
    </span>
  );
}

function RemoveDocument({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    await fetch(`/api/profile/documents/${id}`, { method: "DELETE" });
    setPending(false);
    dialogRef.current?.close();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={() => dialogRef.current?.showModal()}
        className="grid size-6 shrink-0 place-items-center rounded-full text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      >
        ×
      </button>
      <dialog ref={dialogRef} className="rounded-2xl">
        <div className="w-80 rounded-2xl border border-stone-200 bg-[var(--background)] p-5 dark:border-stone-800">
          <p className="text-base font-medium">Remove {name}?</p>
          <p className="mt-2 text-sm text-stone-500">The file is deleted for good.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg px-3 py-2 text-sm text-stone-600 dark:text-stone-300"
            >
              Keep
            </button>
            <button type="button" disabled={pending} onClick={remove} className={button}>
              {pending ? "Removing" : "Remove"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
