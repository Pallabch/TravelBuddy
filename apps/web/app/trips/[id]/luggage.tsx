"use client";

import { useId, useRef, useState, useTransition } from "react";
import {
  addLuggageAction,
  addLuggageItemAction,
  addLuggageSectionAction,
  deleteLuggageAction,
  deleteLuggageItemAction,
  deleteLuggageSectionAction,
  moveLuggageItemsAction,
  renameLuggageAction,
  renameLuggageSectionAction,
  setLuggagePackedAction,
} from "./actions";

type Item = { id: string; label: string; packed: boolean };
type Section = { id: string; title: string; items: Item[] };

export type LuggageBag = {
  id: string;
  name: string;
  items: Item[];
  sections: Section[];
};

const field =
  "min-w-0 flex-1 rounded-lg border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900 dark:border-stone-700 dark:focus:border-stone-100";
const primary =
  "shrink-0 rounded-lg bg-stamp px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong disabled:opacity-60 dark:text-stone-950";
const quiet =
  "rounded-lg px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800";
const itemGrid =
  "grid grid-cols-[4.5rem_2rem_4.5rem_minmax(0,1fr)_auto] items-center gap-x-2";

export function TripLuggage({
  tripId,
  bags,
  solo,
}: {
  tripId: string;
  bags: LuggageBag[];
  solo: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(bags[0]?.id ?? null);
  const selected = bags.find((bag) => bag.id === selectedId) ?? bags[0] ?? null;

  return (
    <div>
      <h3 className="font-serif text-2xl font-semibold tracking-tight">Luggage</h3>
      <p className="mt-1 text-[0.95rem] text-stone-600 dark:text-stone-400">
        {solo
          ? "Only you can see this."
          : "Only you can see this. No one else on the trip can open it."}
      </p>

      <AddRow
        label="Luggage"
        placeholder="Carry-on"
        name="name"
        action={(formData) => addLuggageAction(tripId, formData)}
        onAdded={(id) => setSelectedId(id)}
        button="Add luggage"
      />

      {bags.length === 0 ? (
        <p className="mt-6 rounded-2xl border-2 border-dashed border-stone-300 px-6 py-8 text-center text-sm text-stone-500 dark:border-stone-700">
          Add a carry-on, a checked bag, or a daypack.
        </p>
      ) : (
        <>
          <ul className="mt-5 flex flex-wrap gap-2">
            {bags.map((bag) => {
              const counts = packedCount(bag);
              const active = bag.id === selected?.id;
              return (
                <li key={bag.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedId(bag.id)}
                    className={
                      active
                        ? "rounded-full bg-stone-900 px-3.5 py-2 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900"
                        : "rounded-full border border-stone-300 px-3.5 py-2 text-sm font-medium dark:border-stone-700"
                    }
                  >
                    {bag.name}
                    {counts.total > 0 ? (
                      <span className="ml-2 tabular-nums opacity-70">
                        {counts.packed}/{counts.total}
                      </span>
                    ) : null}
                  </button>
                  <Remove
                    label={`Delete ${bag.name}`}
                    action={() => deleteLuggageAction(tripId, bag.id)}
                  />
                </li>
              );
            })}
          </ul>

          {selected ? <BagDetail key={selected.id} tripId={tripId} bag={selected} /> : null}
        </>
      )}
    </div>
  );
}

function BagDetail({ tripId, bag }: { tripId: string; bag: LuggageBag }) {
  const signature = JSON.stringify(bag);
  const [seen, setSeen] = useState(signature);
  const [local, setLocal] = useState(bag);
  const [over, setOver] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  if (seen !== signature) {
    setSeen(signature);
    setLocal(bag);
    setPicked((current) => current.filter((id) => itemIds(bag).has(id)));
  }

  const pickedSet = new Set(picked);
  const pickedInSection = picked.some((id) =>
    local.sections.some((section) => section.items.some((item) => item.id === id)),
  );

  async function move(ids: string[], sectionId: string | null, beforeId: string | null) {
    const placed = placeItems(local, ids, sectionId, beforeId);
    if (!placed) return;
    setLocal(placed.bag);
    setPicked([]);
    setError(null);
    const result = await moveLuggageItemsAction(tripId, ids, sectionId, placed.index);
    if (result.error) {
      setLocal(bag);
      setError(result.error);
    }
  }

  function togglePicked(itemId: string) {
    setPicked((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  }

  return (
    <>
    <div className="mt-5 rounded-2xl border border-stone-200 bg-card p-4 shadow-sm dark:border-stone-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Rename
          value={local.name}
          name="name"
          action={(formData) => renameLuggageAction(tripId, local.id, formData)}
        />
        <Remove label={`Delete ${local.name}`} action={() => deleteLuggageAction(tripId, local.id)} />
      </div>

      <p className="mt-3 text-sm text-stone-500">
        Type an item and press Enter for the next one. Tick it once it is packed.
      </p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {picked.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-stamp-soft px-3 py-2">
          <p className="text-sm font-medium text-stamp">{picked.length} selected</p>
          <button type="button" onClick={() => setPicked([])} className="text-sm text-stone-600">
            Clear
          </button>
          {local.sections.length === 0 ? (
            <p className="text-sm text-stone-600">Add a category, then drop them in.</p>
          ) : null}
          {pickedInSection ? (
            <button
              type="button"
              onClick={() => void move(picked, null, null)}
              className="rounded-full bg-white px-3 py-1.5 text-sm font-medium shadow-sm dark:bg-stone-950"
            >
              Drop in the list
            </button>
          ) : null}
          {local.sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => void move(picked, section.id, null)}
              className="rounded-full bg-white px-3 py-1.5 text-sm font-medium shadow-sm dark:bg-stone-950"
            >
              Drop in {section.title}
            </button>
          ))}
        </div>
      ) : null}

      <div className={`${itemGrid} mt-4 px-1 text-xs text-stone-500`}>
        <span className="text-center">Select</span>
        <span />
        <span className="text-center">Packed</span>
        <span>Item</span>
      </div>

      <ItemList
        tripId={tripId}
        luggageId={local.id}
        items={local.items}
        sectionId={null}
        over={over}
        dragging={dragging}
        picked={pickedSet}
        onToggle={togglePicked}
        onOver={setOver}
        onDragging={setDragging}
        onMove={move}
        sections={local.sections}
        onCreateSection={async (title, itemId) => {
          const formData = new FormData();
          formData.set("title", title);
          const result = await addLuggageSectionAction(tripId, local.id, formData);
          if (result.error || !result.id) return result;
          const sectionId = result.id;
          setLocal((current) => {
            const withSection: LuggageBag = {
              ...current,
              sections: [
                ...current.sections.filter((section) => section.id !== sectionId),
                { id: sectionId, title, items: [] },
              ],
            };
            return placeItems(withSection, [itemId], sectionId, null)?.bag ?? withSection;
          });
          const moved = await moveLuggageItemsAction(tripId, [itemId], sectionId, 0);
          if (moved.error) setError(moved.error);
          return result;
        }}
        placeholder="Add an item"
      />
    </div>

    <section className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-card p-4 dark:border-stone-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-medium">Categories</h4>
          <p className="mt-1 text-sm text-stone-500">Clothes, toiletries, chargers. Group the list however you pack.</p>
        </div>
        <AddSection tripId={tripId} luggageId={local.id} />
      </div>

      {local.sections.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {local.sections.map((section) => {
            const hot = over === `list:${section.id}` || (dragging && over === `list:${section.id}`);
            return (
              <li
                key={section.id}
                data-drop="list"
                data-drop-key={`list:${section.id}`}
                data-section-id={section.id}
                className={
                  hot
                    ? "rounded-xl border-2 border-dashed border-stamp bg-stamp-soft p-3"
                    : "rounded-xl border border-stone-200 p-3 dark:border-stone-800"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Rename
                    value={section.title}
                    name="title"
                    action={(formData) => renameLuggageSectionAction(tripId, section.id, formData)}
                  />
                  <Remove
                    label={`Delete ${section.title}`}
                    action={() => deleteLuggageSectionAction(tripId, section.id)}
                  />
                </div>
                {picked.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => void move(picked, section.id, null)}
                    className="mt-2 w-full rounded-lg border border-dashed border-stamp py-2 text-sm font-medium text-stamp"
                  >
                    Drop {picked.length} here
                  </button>
                ) : hot ? (
                  <p className="mt-2 text-sm font-medium text-stamp">Drop here</p>
                ) : null}
                <ItemList
                  tripId={tripId}
                  luggageId={local.id}
                  items={section.items}
                  sectionId={section.id}
                  over={over}
                  dragging={dragging}
                  picked={pickedSet}
                  onToggle={togglePicked}
                  onOver={setOver}
                  onDragging={setDragging}
                  onMove={move}
                  placeholder="Add an item to this category"
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
    </>
  );
}

function ItemList({
  tripId,
  luggageId,
  items,
  sectionId,
  over,
  dragging,
  picked,
  onToggle,
  onOver,
  onDragging,
  onMove,
  sections = [],
  onCreateSection,
  placeholder,
}: {
  tripId: string;
  luggageId: string;
  items: Item[];
  sectionId: string | null;
  over: string | null;
  dragging: boolean;
  picked: Set<string>;
  onToggle: (itemId: string) => void;
  onOver: (key: string | null) => void;
  onDragging: (active: boolean) => void;
  onMove: (ids: string[], sectionId: string | null, beforeId: string | null) => void;
  sections?: Section[];
  onCreateSection?: (title: string, itemId: string) => Promise<{ error?: string; id?: string }>;
  placeholder: string;
}) {
  const [packed, setPacked] = useState<Record<string, boolean>>({});
  const listKey = `list:${sectionId ?? "loose"}`;
  const hot = dragging && over === listKey;

  async function togglePacked(item: Item) {
    const next = !(packed[item.id] ?? item.packed);
    setPacked((current) => ({ ...current, [item.id]: next }));
    const result = await setLuggagePackedAction(tripId, item.id, next);
    if (result.error) setPacked((current) => ({ ...current, [item.id]: !next }));
  }

  return (
    <ul
      data-drop="list"
      data-drop-key={listKey}
      data-section-id={sectionId ?? ""}
      className={
        hot
          ? "mt-1 grid gap-0.5 rounded-xl border border-dashed border-stamp bg-stamp-soft p-1"
          : "mt-1 grid gap-0.5"
      }
    >
      {items.map((item) => {
        const checked = packed[item.id] ?? item.packed;
        const itemKey = `item:${item.id}`;
        const selected = picked.has(item.id);
        return (
          <li
            key={item.id}
            data-drop="item"
            data-drop-key={itemKey}
            data-item-id={item.id}
            data-section-id={sectionId ?? ""}
            className={
              over === itemKey
                ? `${itemGrid} min-h-11 rounded-lg border-t-2 border-stamp bg-white px-1 dark:bg-stone-950`
                : selected
                  ? `${itemGrid} min-h-11 rounded-lg bg-stamp-soft px-1`
                  : `${itemGrid} min-h-11 rounded-lg px-1 hover:bg-stone-100 dark:hover:bg-stone-900`
            }
          >
            <span className="grid place-items-center">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggle(item.id)}
                aria-label={`Select ${item.label}`}
                className="size-4 accent-[var(--stamp)]"
              />
            </span>
            <button
              type="button"
              aria-label={`Drag ${item.label}`}
              className="grid size-8 cursor-grab touch-none place-items-center justify-self-center rounded-md text-stone-400 hover:bg-white active:cursor-grabbing dark:hover:bg-stone-800"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                const ids = selected ? [...picked] : [item.id];
                onDragging(true);
                onOver(itemKey);
                const follow = (pointer: PointerEvent) => {
                  onOver(dropKeyAt(pointer.clientX, pointer.clientY));
                };
                const finish = (pointer: PointerEvent) => {
                  window.removeEventListener("pointermove", follow);
                  window.removeEventListener("pointerup", finish);
                  window.removeEventListener("pointercancel", finish);
                  onDragging(false);
                  onOver(null);
                  if (pointer.type === "pointercancel") return;
                  const target = dropTargetAt(pointer.clientX, pointer.clientY);
                  if (target) onMove(ids, target.sectionId, target.beforeId);
                };
                window.addEventListener("pointermove", follow);
                window.addEventListener("pointerup", finish);
                window.addEventListener("pointercancel", finish);
              }}
            >
              <GripIcon />
            </button>
            <label className="grid place-items-center">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => togglePacked(item)}
                aria-label={`Packed ${item.label}`}
                className="size-5 accent-[var(--stamp)]"
              />
            </label>
            <span className={checked ? "min-w-0 flex-1 truncate text-sm text-stone-500 line-through" : "min-w-0 flex-1 truncate text-sm"}>
              {item.label}
            </span>
            <span className="flex items-center justify-end">
              {sectionId === null && onCreateSection ? (
                <FileItem
                  sections={sections}
                  onPick={(nextSectionId) => onMove([item.id], nextSectionId, null)}
                  onCreate={(title) => onCreateSection(title, item.id)}
                />
              ) : null}
              <Remove label={`Delete ${item.label}`} action={() => deleteLuggageItemAction(tripId, item.id)} />
            </span>
          </li>
        );
      })}
      <li>
        <ItemComposer
          placeholder={placeholder}
          onAdd={async (label) => {
            const formData = new FormData();
            formData.set("label", label);
            if (sectionId) formData.set("sectionId", sectionId);
            return addLuggageItemAction(tripId, luggageId, formData);
          }}
        />
      </li>
    </ul>
  );
}

function ItemComposer({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (label: string) => Promise<{ error?: string }>;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      className={`${itemGrid} min-h-11 px-1`}
      onSubmit={(event) => {
        event.preventDefault();
        const label = value.trim();
        if (!label || pending) return;
        startTransition(async () => {
          const result = await onAdd(label);
          setError(result.error ?? null);
          if (!result.error) {
            setValue((current) => (current.trim() === label ? "" : current));
            inputRef.current?.focus();
          }
        });
      }}
    >
      <span className="grid place-items-center text-lg text-stone-400" aria-hidden="true">
        +
      </span>
      <span />
      <span />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label={placeholder}
        placeholder={`${placeholder}, then Enter`}
        className="min-w-0 bg-transparent py-2 text-base outline-none placeholder:text-stone-400"
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }}
      />
      <button type="submit" disabled={pending || value.trim().length === 0} className={quiet}>
        {pending ? "Adding" : "Add"}
      </button>
      {error ? <p className="col-span-full text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

function dropKeyAt(x: number, y: number) {
  const hit = document.elementFromPoint(x, y)?.closest("[data-drop]");
  return hit instanceof HTMLElement ? (hit.dataset.dropKey ?? null) : null;
}

function dropTargetAt(x: number, y: number) {
  const hit = document.elementFromPoint(x, y)?.closest("[data-drop]");
  if (!(hit instanceof HTMLElement)) return null;
  return {
    sectionId: hit.dataset.sectionId || null,
    beforeId: hit.dataset.itemId || null,
  };
}

function itemIds(bag: LuggageBag) {
  return new Set([
    ...bag.items.map((item) => item.id),
    ...bag.sections.flatMap((section) => section.items.map((item) => item.id)),
  ]);
}

function placeItems(bag: LuggageBag, itemIdsToMove: string[], sectionId: string | null, beforeId: string | null) {
  const wanted = new Set(itemIdsToMove);
  if (beforeId && wanted.has(beforeId)) return null;
  const moving = [
    ...bag.items.filter((item) => wanted.has(item.id)),
    ...bag.sections.flatMap((section) => section.items.filter((item) => wanted.has(item.id))),
  ];
  if (moving.length === 0) return null;
  const items = bag.items.filter((item) => !wanted.has(item.id));
  const sections = bag.sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => !wanted.has(item.id)),
  }));
  const destination = sectionId ? sections.find((section) => section.id === sectionId)?.items : items;
  if (!destination) return null;
  const index = beforeId ? destination.findIndex((item) => item.id === beforeId) : destination.length;
  const at = index < 0 ? destination.length : index;
  destination.splice(at, 0, ...moving);
  return { bag: { ...bag, items, sections }, index: at };
}

function packedCount(bag: LuggageBag) {
  const items = [...bag.items, ...bag.sections.flatMap((section) => section.items)];
  return { total: items.length, packed: items.filter((item) => item.packed).length };
}

function AddRow({
  label,
  placeholder,
  name,
  button,
  action,
  onAdded,
}: {
  label: string;
  placeholder: string;
  name: string;
  button: string;
  action: (formData: FormData) => Promise<{ error?: string; id?: string }>;
  onAdded?: (id: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fieldId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const form = formData;
        startTransition(async () => {
          const result = await action(form);
          setError(result.error ?? null);
          if (!result.error) {
            formRef.current?.reset();
            if (result.id) onAdded?.(result.id);
          }
        });
      }}
      className="mt-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={fieldId}>
          {label}
        </label>
        <input id={fieldId} name={name} required placeholder={placeholder} className={field} />
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Adding" : button}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

function Rename({
  value,
  name,
  action,
}: {
  value: string;
  name: string;
  action: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <p className="truncate text-sm font-semibold">{value}</p>
        <button type="button" onClick={() => setEditing(true)} className={quiet}>
          Rename
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await action(formData);
          setError(result.error ?? null);
          if (!result.error) setEditing(false);
        })
      }
      className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
    >
      <input name={name} required defaultValue={value} className={field} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Saving" : "Save"}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-sm text-stone-500">
        Cancel
      </button>
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

function AddSection({ tripId, luggageId }: { tripId: string; luggageId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fieldId = useId();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-stone-400 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-900 dark:text-stone-200 dark:hover:border-stone-100"
      >
        <span aria-hidden="true">+</span> Category
      </button>
    );
  }

  return (
    <form
      className="flex animate-fade-in flex-wrap items-center gap-2"
      action={(formData) => {
        const form = formData;
        startTransition(async () => {
          const result = await addLuggageSectionAction(tripId, luggageId, form);
          setError(result.error ?? null);
          if (!result.error) setOpen(false);
        });
      }}
    >
      <label className="sr-only" htmlFor={fieldId}>
        Category name
      </label>
      <input
        id={fieldId}
        name="title"
        required
        autoFocus
        placeholder="Clothes"
        className={field}
      />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Adding" : "Add"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-500">
        Cancel
      </button>
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

function FileItem({
  sections,
  onPick,
  onCreate,
}: {
  sections: Section[];
  onPick: (sectionId: string) => void;
  onCreate: (title: string) => Promise<{ error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <span className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Add to a category"
        onClick={() => {
          setOpen((current) => !current);
          setNaming(false);
        }}
        className="grid size-8 place-items-center rounded-md text-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
      >
        +
      </button>
      {open ? (
        <span className="absolute right-0 z-20 mt-1 grid w-52 animate-fade-in gap-1 rounded-xl border border-stone-200 bg-card p-2 shadow-lg dark:border-stone-700">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setOpen(false);
                onPick(section.id);
              }}
              className="rounded-lg px-2 py-1.5 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              {section.title}
            </button>
          ))}
          {naming ? (
            <form
              className="grid gap-1"
              onSubmit={(event) => {
                event.preventDefault();
                const next = title.trim();
                if (!next || pending) return;
                startTransition(async () => {
                  const result = await onCreate(next);
                  setError(result.error ?? null);
                  if (!result.error) {
                    setTitle("");
                    setNaming(false);
                    setOpen(false);
                  }
                });
              }}
            >
              <input
                value={title}
                autoFocus
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Clothes"
                aria-label="Category name"
                className={field}
              />
              <span className="flex items-center gap-2">
                <button type="submit" disabled={pending || title.trim().length === 0} className={primary}>
                  {pending ? "Adding" : "Add"}
                </button>
                <button type="button" onClick={() => setNaming(false)} className="text-xs text-stone-500">
                  Cancel
                </button>
              </span>
              {error ? <p className="text-xs text-red-600">{error}</p> : null}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setNaming(true)}
              className="rounded-lg px-2 py-1.5 text-left text-sm font-medium text-stamp hover:bg-stamp-soft"
            >
              + Category
            </button>
          )}
        </span>
      ) : null}
    </span>
  );
}

function Remove({ label, action }: { label: string; action: () => Promise<{ error?: string }> }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

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
            onClick={() => startTransition(async () => void (await action()))}
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

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5 3.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0 4.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0 4.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0ZM11 3.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0 4.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0 4.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"
      />
    </svg>
  );
}
