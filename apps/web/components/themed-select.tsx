"use client";

import { useEffect, useRef, useState } from "react";

const field =
  "w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900 dark:border-stone-700 dark:focus:border-stone-100";

export function ThemedSelect({
  name,
  value,
  defaultValue = "",
  options,
  onChange,
  editable = false,
  disabled = false,
  placeholder,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
  editable?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(
    () => options.find((option) => option.value === (value ?? defaultValue))?.label ?? (value ?? defaultValue),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function commit(next: string) {
    setInternal(next);
    setQuery(options.find((option) => option.value === next)?.label ?? next);
    onChange?.(next);
    setOpen(false);
  }

  const typed = query.trim().toLowerCase();
  const exact = options.some((option) => option.label.toLowerCase() === typed);
  const shown =
    editable && typed && !exact
      ? options.filter((option) => option.label.toLowerCase().includes(typed))
      : options;
  const submitted = editable ? query : selected;

  return (
    <div ref={rootRef} className="relative">
      {name ? <input type="hidden" name={name} value={submitted} /> : null}
      {editable ? (
        <>
          <input
            value={query}
            disabled={disabled}
            required
            maxLength={40}
            placeholder={placeholder}
            aria-expanded={open}
            aria-haspopup="listbox"
            onChange={(event) => {
              setQuery(event.target.value);
              setInternal(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className={`${field} pr-9`}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label="Show categories"
            disabled={disabled}
            onClick={() => setOpen((current) => !current)}
            className="absolute inset-y-0 right-0 grid w-9 place-items-center text-stone-500"
          >
            <Chevron />
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((current) => !current)}
          className={`${field} flex items-center justify-between gap-2 text-left`}
        >
          <span className="min-w-0 truncate">
            {options.find((option) => option.value === selected)?.label ?? selected}
          </span>
          <Chevron />
        </button>
      )}
      {open ? (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full min-w-40 overflow-auto rounded-xl border border-stone-200 bg-card p-1 shadow-lg dark:border-stone-700"
        >
          {shown.map((option) => {
            const active = option.value === submitted || option.label === query;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commit(editable ? option.label : option.value)}
                  className={
                    active
                      ? "w-full rounded-lg bg-stamp-soft px-3 py-2 text-left text-sm font-medium text-stamp"
                      : "w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-800"
                  }
                >
                  {option.label}
                </button>
              </li>
            );
          })}
          {editable && typed && shown.length === 0 ? (
            <li className="px-3 py-2 text-sm text-stone-500">Use “{query.trim()}”</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 shrink-0 fill-none stroke-current stroke-2">
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}
