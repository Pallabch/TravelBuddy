"use client";

import { useState, useTransition } from "react";
import type { ChecklistKind } from "@travel-buddy/validators";
import { formatDay } from "@/lib/format-day";
import {
  addChecklistItemAction,
  addChecklistSectionAction,
  deleteChecklistItemAction,
  deleteChecklistSectionAction,
  setChecklistTickAction,
  updateChecklistItemAction,
  updateChecklistSectionAction,
} from "./actions";

type Item = {
  id: string;
  label: string;
  note: string;
  updatedBy: string | null;
  updatedAt: string;
  tickedBy: string[];
};

type Section = {
  id: string;
  title: string;
  detail: string;
  updatedBy: string | null;
  updatedAt: string;
  items: Item[];
};

export type Checklist = {
  updatedBy: string | null;
  updatedAt: string | null;
  names: Record<string, string>;
  sections: Section[];
};

export type TripChecklists = {
  group: Checklist;
  personal: Checklist;
};

type Person = { userId: string; name: string };

const input =
  "w-full rounded-lg border border-stone-300 bg-card px-3 py-2 text-[15px] dark:border-stone-700 dark:bg-stone-900";
const primary =
  "rounded-lg bg-stamp px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong disabled:opacity-60 dark:text-stone-950";
const quiet =
  "rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800";
const small =
  "rounded-md px-2 py-1 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800";

export function TripChecklist({
  tripId,
  checklists,
  people,
  currentUserId,
  solo,
}: {
  tripId: string;
  checklists: TripChecklists;
  people: Person[];
  currentUserId: string;
  solo: boolean;
}) {
  const [scope, setScope] = useState<ChecklistKind>("personal");
  const kind: ChecklistKind = solo ? "personal" : scope;
  const checklist = kind === "personal" ? checklists.personal : checklists.group;

  return (
    <div className="text-base leading-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-semibold tracking-tight">Checklist</h3>
          <p className="mt-1 text-[0.95rem] text-stone-600 dark:text-stone-400">
            {solo
              ? "A list for this trip."
              : "Personal is only yours. Group is shared with everyone on the trip."}
          </p>
        </div>
        {solo ? null : (
          <div
            role="tablist"
            aria-label="Checklist type"
            className="flex w-full rounded-full border border-stone-300 bg-stone-100 p-1 sm:w-auto dark:border-stone-700 dark:bg-stone-900"
          >
            {(
              [
                { id: "personal", label: "Personal" },
                { id: "group", label: "Group" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={kind === tab.id}
                onClick={() => setScope(tab.id)}
                className={
                  kind === tab.id
                    ? "min-h-11 flex-1 rounded-full bg-stone-900 px-3.5 py-1.5 text-sm font-medium text-white sm:flex-none dark:bg-stone-100 dark:text-stone-900"
                    : "min-h-11 flex-1 rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-600 sm:flex-none dark:text-stone-300"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div key={kind} className="mt-6 animate-fade-in">
        <ChecklistPane
          tripId={tripId}
          kind={kind}
          checklist={checklist}
          people={people}
          currentUserId={currentUserId}
          solo={solo}
        />
      </div>
    </div>
  );
}

function ChecklistPane({
  tripId,
  kind,
  checklist,
  people,
  currentUserId,
  solo,
}: {
  tripId: string;
  kind: ChecklistKind;
  checklist: Checklist;
  people: Person[];
  currentUserId: string;
  solo: boolean;
}) {
  const [mine, setMine] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<Set<string>>(() => {
    const first =
      checklist.sections.find((section) =>
        section.items.some((item) => !item.tickedBy.includes(currentUserId)),
      ) ?? checklist.sections[0];
    return new Set(first ? [first.id] : []);
  });
  const [editing, setEditing] = useState(false);
  const personal = kind === "personal";

  const nameOf = (id: string | null) => {
    if (!id) return "someone";
    if (id === currentUserId) return "you";
    return checklist.names[id] ?? people.find((person) => person.userId === id)?.name ?? "a former member";
  };

  const tickedBy = (item: Item) => {
    const others = item.tickedBy.filter((id) => id !== currentUserId);
    const me = mine[item.id] ?? item.tickedBy.includes(currentUserId);
    return me ? [currentUserId, ...others] : others;
  };
  const isMine = (item: Item) => mine[item.id] ?? item.tickedBy.includes(currentUserId);

  const allItems = checklist.sections.flatMap((section) => section.items);
  const total = allItems.length;
  const myCount = allItems.filter(isMine).length;
  const progress = people.map((person) => ({
    ...person,
    count: allItems.filter((item) => tickedBy(item).includes(person.userId)).length,
  }));

  async function toggle(item: Item) {
    const checked = !isMine(item);
    setMine((current) => ({ ...current, [item.id]: checked }));
    try {
      await setChecklistTickAction(tripId, item.id, checked);
    } catch {
      setMine((current) => ({ ...current, [item.id]: !checked }));
    }
  }

  function setSectionOpen(id: string, value: boolean) {
    setOpen((current) => {
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const allOpen = checklist.sections.length > 0 && checklist.sections.every((section) => open.has(section.id));

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-[0.95rem] text-stone-600 dark:text-stone-400">
          {personal
            ? checklist.updatedAt
              ? `Updated ${formatDay(checklist.updatedAt)}`
              : "Only you can see and edit this list."
            : checklist.updatedAt
              ? `Last edited by ${nameOf(checklist.updatedBy)} on ${formatDay(checklist.updatedAt)}`
              : "Anyone on the trip can add sections and items."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {checklist.sections.length > 0 ? (
            <button
              type="button"
              onClick={() =>
                setOpen(allOpen ? new Set() : new Set(checklist.sections.map((section) => section.id)))
              }
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          ) : null}
          <button
            type="button"
            aria-pressed={editing}
            onClick={() => setEditing((value) => !value)}
            className={
              editing
                ? "rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                : "rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            }
          >
            {editing ? "Done editing" : "Edit list"}
          </button>
        </div>
      </div>

      {total > 0 ? (
        <div className="mt-5 rounded-2xl border border-stone-200 bg-card p-4 shadow-sm dark:border-stone-800">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-medium">
              {personal ? "Done" : "You have ticked"} {myCount} of {total}
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {personal ? "Private to you" : "Ticks are yours alone"}
            </p>
          </div>
          <Bar value={myCount} total={total} />
          {!personal && progress.length > 1 ? (
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
              {progress
                .filter((person) => person.userId !== currentUserId)
                .map((person) => (
                  <li key={person.userId}>
                    {person.name}: {person.count}/{total}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {checklist.sections.length === 0 && !editing ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-stone-300 px-6 py-8 text-center dark:border-stone-700">
          <p className="font-serif text-xl">
            {solo ? "No list yet" : personal ? "No personal list yet" : "No group checklist yet"}
          </p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {solo
              ? "Add a section, then the items that belong in it."
              : personal
                ? "Add sections for packing, documents, or anything only you need."
                : "Start with a section like Documents or Packing, then add items to it."}
          </p>
          <button type="button" onClick={() => setEditing(true)} className={`${primary} mt-4`}>
            Start the list
          </button>
        </div>
      ) : null}

      <div className="mt-6 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
        {checklist.sections.map((section) => (
          <ChecklistSection
            key={section.id}
            tripId={tripId}
            kind={kind}
            section={section}
            expanded={open.has(section.id)}
            onExpanded={(value) => setSectionOpen(section.id, value)}
            editing={editing}
            isMine={isMine}
            tickedBy={tickedBy}
            onToggle={toggle}
            nameOf={nameOf}
            currentUserId={currentUserId}
            showOthers={!personal}
          />
        ))}
      </div>

      {editing ? (
        <div className="mt-6">
          <SectionForm tripId={tripId} kind={kind} onAdded={(id) => setSectionOpen(id, true)} />
        </div>
      ) : null}
    </>
  );
}

function ChecklistSection({
  tripId,
  kind,
  section,
  expanded,
  onExpanded,
  editing,
  isMine,
  tickedBy,
  onToggle,
  nameOf,
  currentUserId,
  showOthers,
}: {
  tripId: string;
  kind: ChecklistKind;
  section: Section;
  expanded: boolean;
  onExpanded: (value: boolean) => void;
  editing: boolean;
  isMine: (item: Item) => boolean;
  tickedBy: (item: Item) => string[];
  onToggle: (item: Item) => void;
  nameOf: (id: string | null) => string;
  currentUserId: string;
  showOthers: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const finished = section.items.filter(isMine).length;
  const complete = section.items.length > 0 && finished === section.items.length;

  return (
    <section>
      {renaming ? (
        <div className="py-4">
          <SectionForm tripId={tripId} kind={kind} section={section} onDone={() => setRenaming(false)} />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => onExpanded(!expanded)}
            className="flex min-w-0 flex-1 items-center gap-3 py-4 text-left"
          >
            <Chevron open={expanded} />
            <span className="min-w-0 flex-1">
              <span className="block text-[1.05rem] font-semibold leading-snug">{section.title}</span>
              {section.detail ? (
                <span className="mt-0.5 block text-[0.95rem] text-stone-600 dark:text-stone-400">
                  {section.detail}
                </span>
              ) : null}
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${
                complete
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
              }`}
            >
              {finished}/{section.items.length}
            </span>
          </button>
          {editing ? (
            <div className="flex shrink-0 items-center">
              <button type="button" onClick={() => setRenaming(true)} className={small}>
                Rename
              </button>
              <ConfirmDelete
                label={`Delete ${section.title}`}
                prompt={section.items.length > 0 ? `Delete with ${section.items.length} items?` : "Delete?"}
                onConfirm={() => deleteChecklistSectionAction(tripId, section.id)}
              />
            </div>
          ) : null}
        </div>
      )}

      {expanded ? (
        <div className="pb-4 pl-8">
          {section.items.length === 0 ? (
            <p className="text-sm text-stone-600 dark:text-stone-400">Nothing in this section yet.</p>
          ) : (
            <ul className="space-y-1">
              {section.items.map((item) => (
                <ChecklistItem
                  key={item.id}
                  tripId={tripId}
                  item={item}
                  checked={isMine(item)}
                  tickedBy={tickedBy(item)}
                  onToggle={() => onToggle(item)}
                  editing={editing}
                  nameOf={nameOf}
                  currentUserId={currentUserId}
                  showOthers={showOthers}
                />
              ))}
            </ul>
          )}
          {editing ? (
            <div className="mt-3">
              <ItemForm tripId={tripId} sectionId={section.id} />
            </div>
          ) : null}
          {section.updatedBy && showOthers ? (
            <p className="mt-3 text-xs text-stone-500">
              Section last edited by {nameOf(section.updatedBy)} on {formatDay(section.updatedAt)}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ChecklistItem({
  tripId,
  item,
  checked,
  tickedBy,
  onToggle,
  editing,
  nameOf,
  currentUserId,
  showOthers,
}: {
  tripId: string;
  item: Item;
  checked: boolean;
  tickedBy: string[];
  onToggle: () => void;
  editing: boolean;
  nameOf: (id: string | null) => string;
  currentUserId: string;
  showOthers: boolean;
}) {
  const [changing, setChanging] = useState(false);
  const others = tickedBy.filter((id) => id !== currentUserId);

  if (changing) {
    return (
      <li className="py-2">
        <ItemForm tripId={tripId} item={item} onDone={() => setChanging(false)} />
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-stone-100/60 dark:hover:bg-stone-900">
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--stamp)]"
        />
        <span className="min-w-0">
          <span
            className={`block text-[1.05rem] font-medium leading-snug ${
              checked ? "text-stone-500 line-through decoration-stone-400" : ""
            }`}
          >
            {item.label}
          </span>
          {item.note ? (
            <span className="mt-1 block text-[0.95rem] leading-6 text-stone-600 dark:text-stone-400">
              {item.note}
            </span>
          ) : null}
          {showOthers && others.length > 0 ? (
            <span className="mt-1.5 block text-sm text-stone-500">
              Also ticked by {others.map((id) => nameOf(id)).join(", ")}
            </span>
          ) : null}
        </span>
      </label>
      {editing ? (
        <div className="flex shrink-0 items-center">
          <button type="button" onClick={() => setChanging(true)} className={small}>
            Edit
          </button>
          <ConfirmDelete
            label={`Delete ${item.label}`}
            prompt="Delete?"
            onConfirm={() => deleteChecklistItemAction(tripId, item.id)}
          />
        </div>
      ) : null}
    </li>
  );
}

function SectionForm({
  tripId,
  kind,
  section,
  onDone,
  onAdded,
}: {
  tripId: string;
  kind: ChecklistKind;
  section?: Section;
  onDone?: () => void;
  onAdded?: (id: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        startTransition(async () => {
          if (section) {
            const result = await updateChecklistSectionAction(tripId, section.id, data);
            if (result.error) return setError(result.error);
          } else {
            const result = await addChecklistSectionAction(tripId, data);
            if (result.error) return setError(result.error);
            if (result.id) onAdded?.(result.id);
          }
          setError(null);
          form.reset();
          onDone?.();
        });
      }}
      className="grid gap-3 rounded-2xl border border-stone-200 bg-card p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end dark:border-stone-800"
    >
      <input type="hidden" name="kind" value={kind} />
      <label className="grid gap-1.5 text-sm font-medium">
        {section ? "Section name" : "New section"}
        <input
          name="title"
          required
          defaultValue={section?.title}
          placeholder={kind === "personal" ? "My packing" : "Packing"}
          className={input}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Description <span className="sr-only">(optional)</span>
        <input
          name="detail"
          defaultValue={section?.detail}
          placeholder="Optional, like “Before Dec 22”"
          className={input}
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Saving" : section ? "Save" : "Add section"}
        </button>
        {onDone ? (
          <button type="button" onClick={onDone} className={quiet}>
            Cancel
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-600 sm:col-span-3">{error}</p> : null}
    </form>
  );
}

function ItemForm({
  tripId,
  sectionId,
  item,
  onDone,
}: {
  tripId: string;
  sectionId?: string;
  item?: Item;
  onDone?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        startTransition(async () => {
          const result = item
            ? await updateChecklistItemAction(tripId, item.id, data)
            : await addChecklistItemAction(tripId, sectionId ?? "", data);
          if (result.error) {
            setError(result.error);
            return;
          }
          setError(null);
          form.reset();
          (form.elements.namedItem("label") as HTMLInputElement | null)?.focus();
          onDone?.();
        });
      }}
      className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
    >
      <input
        name="label"
        required
        defaultValue={item?.label}
        placeholder={item ? "Item" : "Add an item"}
        aria-label="Item"
        className={input}
      />
      <input
        name="note"
        defaultValue={item?.note}
        placeholder="Note (optional)"
        aria-label="Note"
        className={input}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Saving" : item ? "Save" : "Add"}
        </button>
        {onDone ? (
          <button type="button" onClick={onDone} className={quiet}>
            Cancel
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-600 sm:col-span-3">{error}</p> : null}
    </form>
  );
}

function ConfirmDelete({
  label,
  prompt,
  onConfirm,
}: {
  label: string;
  prompt: string;
  onConfirm: () => Promise<{ error?: string }>;
}) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!asking) {
    return (
      <button type="button" aria-label={label} onClick={() => setAsking(true)} className={`${small} hover:text-red-700`}>
        Delete
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm">
      <span className="text-stone-600 dark:text-stone-400">{prompt}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => void (await onConfirm()))}
        className="rounded-md px-2 py-1 font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        {pending ? "Deleting" : "Yes"}
      </button>
      <button type="button" onClick={() => setAsking(false)} className={small}>
        No
      </button>
    </span>
  );
}

function Bar({ value, total }: { value: number; total: number }) {
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
      <div
        className="h-full rounded-full bg-stamp transition-all"
        style={{ width: `${total === 0 ? 0 : Math.round((value / total) * 100)}%` }}
      />
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`size-5 shrink-0 fill-none stroke-current stroke-2 text-stone-500 transition-transform ${
        open ? "rotate-90" : ""
      }`}
    >
      <path d="m7 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
