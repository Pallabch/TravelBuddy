"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function ProfilePhoto({
  name,
  hasPhoto,
  version,
}: {
  name: string;
  hasPhoto: boolean;
  version: string;
}) {
  const router = useRouter();
  const firstVersion = useRef(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (firstVersion.current) {
      firstVersion.current = false;
      return;
    }
    setPreview(null);
  }, [version]);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    const nextPreview = URL.createObjectURL(file);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextPreview;
    });
    setPending(true);

    const body = new FormData();
    body.set("photo", file);
    const response = await fetch("/api/profile/avatar", { method: "POST", body });
    setPending(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setPreview(null);
      setError(payload?.error ?? "The photo was not saved.");
      return;
    }

    router.refresh();
  }

  const src = preview ?? (hasPhoto ? `/api/profile/avatar?v=${version}` : null);

  return (
    <div>
      <div className="flex items-end gap-4">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-[var(--background)] bg-stone-200 text-xl font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-100">
          {src ? (
            // The photo is the signed-in user's own upload, served from our API.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="size-full object-cover" />
          ) : (
            <span aria-hidden="true">{initials(name)}</span>
          )}
        </div>
        <label className="mb-1 inline-flex cursor-pointer rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900">
          {pending ? "Uploading" : "Change photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={pending}
            onChange={onChange}
          />
        </label>
      </div>
      <p className="mt-3 text-xs text-stone-500">JPEG, PNG, or WebP. Under 2 MB.</p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}
