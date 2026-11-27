"use client";

import { useState, useTransition } from "react";
import { formatDay } from "@/lib/format-day";
import { addItineraryAction, deleteItineraryAction, updateItineraryAction } from "./actions";

type Person = { userId: string; name: string };

export type Stop = {
  id: string;
  day: string;
  startTime: string | null;
  title: string;
  location: string;
  details: string;
  addedBy: string | null;
  addedByName: string | null;
  participants: string[];
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayMs = 24 * 60 * 60 * 1000;

const field =
  "w-full rounded-lg border border-stone-300 bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-stone-900 dark:border-stone-700 dark:focus:border-stone-100";

export function TripItinerary({
  tripId,
  title,
  destination,
  startDate,
  endDate,
  stops,
  people,
  currentUserId,
  solo,
}: {
  tripId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  stops: Stop[];
  people: Person[];
  currentUserId: string;
  solo: boolean;
}) {
  const names = new Map(people.map((person) => [person.userId, person.name]));
  const tripDays = daysBetween(startDate, endDate);
  const [addedBy, setAddedBy] = useState("anyone");
  const visible = addedBy === "anyone" ? stops : stops.filter((stop) => stop.addedBy === addedBy);
  const days = [...new Set([...tripDays, ...visible.map((stop) => stop.day)])].sort();
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(days.filter((day) => !stops.some((stop) => stop.day === day))),
  );
  const adders = new Map<string, string>();
  for (const stop of stops) {
    if (stop.addedBy) {
      adders.set(
        stop.addedBy,
        stop.addedBy === currentUserId ? "You" : (stop.addedByName ?? "A former member"),
      );
    }
  }

  return (
    <>
      <article className="rounded-2xl border border-stone-200 px-5 py-6 sm:px-8 dark:border-stone-800">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5 dark:border-stone-800">
          <div>
            <p className="field-label">Itinerary</p>
            <h3 className="mt-1 font-serif text-3xl font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 text-sm text-stone-500">
              {destination} · {formatDay(startDate)} to {formatDay(endDate)} · {tripDays.length}{" "}
              {tripDays.length === 1 ? "day" : "days"} · {stops.length}{" "}
              {stops.length === 1 ? "stop" : "stops"}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex rounded-full border border-stone-300 p-1 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setCollapsed(new Set())}
                className="rounded-full px-3 py-1.5 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-900"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={() => setCollapsed(new Set(days))}
                className="rounded-full px-3 py-1.5 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-900"
              >
                Collapse all
              </button>
            </div>
            <label className="grid gap-1 text-xs text-stone-500">
              Added by
              <select
                value={addedBy}
                onChange={(event) => setAddedBy(event.target.value)}
                className="rounded-lg border border-stone-300 bg-card px-2 py-1.5 text-sm text-stone-900 outline-none dark:border-stone-700 dark:text-stone-100"
              >
                <option value="anyone">Anyone</option>
                {[...adders].map(([userId, name]) => (
                  <option key={userId} value={userId}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <ol className="mt-2">
          {days.map((day) => {
            const index = tripDays.indexOf(day);
            const dayStops = visible.filter((stop) => stop.day === day);
            const open = !collapsed.has(day);
            const summary =
              dayStops.length === 0
                ? addedBy === "anyone"
                  ? "Nothing planned"
                  : "Nothing from this person"
                : `${dayStops.length} ${dayStops.length === 1 ? "stop" : "stops"}`;
            return (
              <li key={day} className="border-b border-dashed border-stone-300 last:border-b-0 dark:border-stone-700">
                <h4>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setCollapsed((current) => {
                        const next = new Set(current);
                        if (next.has(day)) next.delete(day);
                        else next.add(day);
                        return next;
                      })
                    }
                    className="flex w-full items-center gap-3 py-4 text-left"
                  >
                    <Chevron open={open} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {index >= 0 ? `Day ${index + 1} · ` : ""}
                        {weekday(day)}, {formatDay(day)}
                        {index < 0 ? (
                          <span className="ml-2 text-xs font-normal text-stone-500">Outside trip dates</span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs font-normal text-stone-500">{summary}</span>
                    </span>
                  </button>
                </h4>
                {open ? (
                  dayStops.length === 0 ? (
                    <p className="pb-4 pl-8 text-sm text-stone-500">
                      {addedBy === "anyone" ? "Nothing planned yet." : "Nothing from this person."}
                    </p>
                  ) : (
                    <ul className="grid gap-4 pb-5 pl-8">
                      {dayStops.map((stop) => (
                        <StopEntry
                          key={stop.id}
                          tripId={tripId}
                          stop={stop}
                          names={names}
                          people={people}
                          currentUserId={currentUserId}
                          solo={solo}
                        />
                      ))}
                    </ul>
                  )
                ) : null}
              </li>
            );
          })}
        </ol>
      </article>

      <ItineraryForm
        tripId={tripId}
        defaultDay={startDate}
        people={people}
        currentUserId={currentUserId}
        solo={solo}
      />
    </>
  );
}

function StopEntry({
  tripId,
  stop,
  names,
  people,
  currentUserId,
  solo,
}: {
  tripId: string;
  stop: Stop;
  names: Map<string, string>;
  people: Person[];
  currentUserId: string;
  solo: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const going =
    stop.participants.length === 0
      ? null
      : stop.participants.map((id) => {
          const name = names.get(id) ?? "Former member";
          return { id, name, label: id === currentUserId ? "You" : name };
        });
  const adder =
    stop.addedBy === currentUserId ? "you" : (stop.addedByName ?? (stop.addedBy ? "a former member" : null));

  return (
    <li className="grid grid-cols-[4.5rem_1fr] gap-3">
      <p className="pt-0.5 text-sm tabular-nums text-stone-500">{stop.startTime ?? "Any time"}</p>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{stop.title}</p>
          {editing ? null : (
            <span className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Edit
              </button>
              <RemoveStop tripId={tripId} stopId={stop.id} title={stop.title} />
            </span>
          )}
        </div>
        {editing ? (
          <ItineraryForm
            tripId={tripId}
            defaultDay={stop.day}
            people={people}
            currentUserId={currentUserId}
            solo={solo}
            stop={stop}
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
          />
        ) : null}
        {editing || !stop.location ? null : (
          <p className="mt-1 flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 shrink-0 fill-none stroke-current stroke-2">
              <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {stop.location}
          </p>
        )}
        {editing || !stop.details ? null : (
          <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-400">{stop.details}</p>
        )}
        {editing ? null : (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            {going ? (
              <>
                <span className="flex -space-x-1.5">
                  {going.slice(0, 4).map((person) => (
                    <span
                      key={person.id}
                      title={person.name}
                      className="grid size-5 place-items-center rounded-full border border-[var(--background)] bg-stone-200 text-[10px] font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-200"
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                  ))}
                </span>
                {going.map((person) => person.label).join(", ")}
              </>
            ) : solo ? null : (
              "Everyone on the trip"
            )}
          </span>
          {adder ? <span>Added by {adder}</span> : null}
        </div>
        )}
      </div>
    </li>
  );
}

function RemoveStop({
  tripId,
  stopId,
  title,
}: {
  tripId: string;
  stopId: string;
  title: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <span className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          aria-label={`Delete ${title}`}
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          className="grid size-8 place-items-center rounded-full text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          ×
        </button>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-2 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteItineraryAction(tripId, stopId);
            if (result.error) {
              setError(result.error);
              setConfirming(false);
            }
          })
        }
        className="font-medium text-red-700 dark:text-red-400"
      >
        {pending ? "Deleting" : "Delete"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="text-stone-500">
        Keep
      </button>
    </span>
  );
}

function ItineraryForm({
  tripId,
  defaultDay,
  people,
  currentUserId,
  solo,
  stop,
  onCancel,
  onSaved,
}: {
  tripId: string;
  defaultDay: string;
  people: Person[];
  currentUserId: string;
  solo: boolean;
  stop?: Stop;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const everyone = !stop || stop.participants.length === 0;

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = stop
        ? await updateItineraryAction(tripId, stop.id, formData)
        : await addItineraryAction(tripId, formData);
      setError(result?.error ?? null);
      if (stop && !result?.error) onSaved?.();
    });
  }

  return (
    <form
      action={submit}
      className={
        stop
          ? "mt-3 grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-[1fr_8rem] dark:border-stone-700 dark:bg-stone-900"
          : "mt-6 grid gap-3 rounded-2xl border border-stone-200 bg-card p-5 shadow-sm sm:grid-cols-[1fr_8rem] dark:border-stone-800"
      }
    >
      <div className="sm:col-span-2">
        <p className="field-label">{stop ? "Edit stop" : "New stop"}</p>
        <p className="mt-1 text-sm font-semibold">{stop ? "Change this plan" : "Add to the itinerary"}</p>
      </div>
      <label className="grid gap-1 text-sm">
        Day
        <input name="day" type="date" required defaultValue={stop?.day ?? defaultDay} className={field} />
      </label>
      <label className="grid gap-1 text-sm">
        Time
        <input name="startTime" type="time" defaultValue={(stop?.startTime ?? "").slice(0, 5)} className={field} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Stop
        <input
          name="title"
          required
          maxLength={120}
          placeholder="Morning market"
          defaultValue={stop?.title}
          className={field}
        />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Place
        <input
          name="location"
          maxLength={120}
          placeholder="Optional, like Mercado da Ribeira"
          defaultValue={stop?.location}
          className={field}
        />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Note
        <textarea
          name="details"
          rows={2}
          maxLength={500}
          placeholder="Optional"
          defaultValue={stop?.details}
          className={field}
        />
      </label>
      {solo ? (
        <input type="hidden" name="participants" value={currentUserId} />
      ) : (
        <fieldset className="grid gap-2 text-sm sm:col-span-2">
          <legend className="mb-1">Who is going</legend>
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <label
                key={person.userId}
                className="flex items-center gap-2 rounded-full border border-stone-300 px-3 py-1.5 has-[:checked]:border-stone-900 dark:border-stone-700 dark:has-[:checked]:border-stone-100"
              >
                <input
                  type="checkbox"
                  name="participants"
                  value={person.userId}
                  defaultChecked={everyone || Boolean(stop?.participants.includes(person.userId))}
                />
                {person.userId === currentUserId ? "You" : person.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="whitespace-nowrap rounded-lg bg-stamp px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong disabled:opacity-60 dark:text-stone-950"
        >
          {pending ? "Saving" : stop ? "Save changes" : "Add to itinerary"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="text-sm text-stone-500">
            Cancel
          </button>
        ) : null}
        {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
      </div>
    </form>
  );
}

function daysBetween(start: string, end: string) {
  const from = toUtc(start);
  const to = toUtc(end);
  const days: string[] = [];
  for (let time = from; time <= to && days.length < 60; time += dayMs) {
    days.push(new Date(time).toISOString().slice(0, 10));
  }
  return days;
}

function toUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function weekday(value: string) {
  return weekdays[new Date(toUtc(value)).getUTCDay()];
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`size-4 shrink-0 text-stone-500 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    >
      <path d="M7 4.5 13 10 7 15.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
