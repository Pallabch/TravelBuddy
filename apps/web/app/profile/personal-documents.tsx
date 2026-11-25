"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditableDocument } from "@/components/editable-document";
import { ThemedSelect } from "@/components/themed-select";

const suggestions = [
  "Passport",
  "National ID",
  "Driving licence",
  "Visa",
  "Travel insurance",
  "Vaccination record",
];

const button =
  "whitespace-nowrap rounded-lg bg-stamp px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong disabled:opacity-60 dark:text-stone-950";

type PersonalDocument = { id: string; name: string; category: string; createdAt: string };

export function PersonalDocuments({
  documents,
  embedded = false,
}: {
  documents: PersonalDocument[];
  embedded?: boolean;
}) {
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

  const body = (
    <>
      {documents.length === 0 ? (
        <p className="mt-5 text-sm text-stone-500">No documents yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
          {documents.map((document) => (
            <li key={document.id} className="py-3">
              <EditableDocument
                name={document.name}
                href={`/api/profile/documents/${document.id}`}
                endpoint={`/api/profile/documents/${document.id}`}
              />
              <p className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                <CategoryTag>{document.category}</CategoryTag>
                Added {document.createdAt}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
        <label className="grid gap-1 text-sm">
          Category
          <ThemedSelect
            name="category"
            editable
            defaultValue="Passport"
            placeholder="Passport"
            options={categories.map((category) => ({ value: category, label: category }))}
          />
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
    </>
  );

  if (embedded) return body;

  return (
    <section
      id="documents"
      className="mt-8 scroll-mt-24 rounded-3xl border border-stone-200 px-6 py-8 sm:px-8 dark:border-stone-800"
    >
      <h2 className="font-serif text-2xl font-semibold tracking-tight">Your documents</h2>
      <p className="mt-1 text-sm text-stone-500">
        Passport, ID, and other personal papers. Only you can see these, even on shared trips.
      </p>
      {body}
    </section>
  );
}

function CategoryTag({ children }: { children: React.ReactNode }) {
  return <span className="stamp-tag">{children}</span>;
}
