"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function TripPhoto({
  tripId,
  hasCover,
  version,
}: {
  tripId: string;
  hasCover: boolean;
  version: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function upload(file: File) {
    setError(null);
    setPending(true);
    const body = new FormData();
    body.set("photo", file);
    const response = await fetch(`/api/trips/${tripId}/photo`, { method: "POST", body });
    setPending(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "The photo was not saved.");
      return;
    }
    router.refresh();
  }

  async function remove() {
    setError(null);
    setPending(true);
    const response = await fetch(`/api/trips/${tripId}/photo`, { method: "DELETE" });
    setPending(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "The photo was not removed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="w-44 shrink-0 sm:w-56">
      <div className="relative h-28 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 sm:h-36 dark:border-stone-800 dark:bg-stone-900">
        {hasCover ? (
          // Trip members only. The API checks membership before sending the file.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/trips/${tripId}/photo?v=${version}`}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col justify-center gap-2 px-3">
            <div className="h-2.5 w-1/2 rounded-md bg-stone-200 dark:bg-stone-800" />
            <div className="h-2.5 w-2/3 rounded-md bg-stone-200/80 dark:bg-stone-800/80" />
            <div className="h-8 w-full rounded-lg bg-stone-200/70 dark:bg-stone-800/70" />
          </div>
        )}
        <div
          className={`absolute inset-x-0 bottom-0 flex items-center gap-2 p-3 ${
            hasCover ? "bg-gradient-to-t from-black/70 to-transparent" : ""
          }`}
        >
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-stone-900 shadow-sm disabled:opacity-60"
          >
            {pending ? "Saving" : hasCover ? "Change photo" : "Upload photo"}
          </button>
          {hasCover ? (
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
            >
              Remove photo
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
