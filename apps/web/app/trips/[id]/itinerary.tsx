"use client";

import { useState, useTransition } from "react";
import { formatDay } from "@/lib/format-day";
import { addItineraryAction, deleteItineraryAction } from "./actions";

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
  "w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900 dark:border-stone-700 dark:focus:border-stone-100";

export function TripItinerary({
  tripId,
  title,
  destination,
  startDate,
  endDate,
  stops,
  people,
  currentUserId,
}: {
  tripId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  stops: Stop[];
  people: Person[];
  currentUserId: string;
}) {
  const [addedBy, setAddedBy] = useState("anyone");
  const names = new Map(people.map((person) => [person.userId, person.name]));
  const tripDays = daysBetween(startDate, endDate);
  const visible = addedBy === "anyone" ? stops : stops.filter((stop) => stop.addedBy === addedBy);
  const days = [...new Set([...tripDays, ...visible.map((stop) => stop.day)])].sort();
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
          <label className="grid gap-1 text-xs text-stone-500">
            Added by
            <select
              value={addedBy}
              onChange={(event) => setAddedBy(event.target.value)}
              className="rounded-lg border border-stone-300 bg-transparent px-2 py-1.5 text-sm text-stone-900 outline-none dark:border-stone-700 dark:text-stone-100"
            >
              <option value="anyone">Anyone</option>
              {[...adders].map(([userId, name]) => (
                <option key={userId} value={userId}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </header>

        <ol className="mt-2">
          {days.map((day) => {
            const index = tripDays.indexOf(day);
            const dayStops = visible.filter((stop) => stop.day === day);
            return (
              <li key={day} className="border-b border-dashed border-stone-300 py-5 last:border-b-0 dark:border-stone-700">
                <h4 className="text-sm font-semibold">
                  {index >= 0 ? `Day ${index + 1} · ` : ""}
                  {weekday(day)}, {formatDay(day)}
                  {index < 0 ? (
                    <span className="ml-2 text-xs font-normal text-stone-500">Outside trip dates</span>
                  ) : null}
                </h4>
                {dayStops.length === 0 ? (
                  <p className="mt-2 text-sm text-stone-500">
                    {addedBy === "anyone" ? "Nothing planned yet." : "Nothing from this person."}
                  </p>
                ) : (
                  <ul className="mt-3 grid gap-4">
                    {dayStops.map((stop) => (
                      <StopEntry
                        key={stop.id}
                        tripId={tripId}
                        stop={stop}
                        names={names}
                        currentUserId={currentUserId}
                      />
                    ))}
                  </ul>
                )}
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
      />
    </>
  );
}

function StopEntry({
  tripId,
  stop,
  names,
  currentUserId,
}: {
  tripId: string;
  stop: Stop;
  names: Map<string, string>;
  currentUserId: string;
}) {
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
          <RemoveStop tripId={tripId} stopId={stop.id} title={stop.title} />
        </div>
        {stop.location ? (
          <p className="mt-1 flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 shrink-0 fill-none stroke-current stroke-2">
              <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {stop.location}
          </p>
        ) : null}
        {stop.details ? (
          <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-400">{stop.details}</p>
        ) : null}
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
            ) : (
              "Everyone on the trip"
            )}
          </span>
          {adder ? <span>Added by {adder}</span> : null}
        </div>
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
}: {
  tripId: string;
  defaultDay: string;
  people: Person[];
  currentUserId: string;
}) {
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    const result = await addItineraryAction(tripId, formData);
    setError(result?.error ?? null);
  }

  return (
    <form action={submit} className="mt-6 grid gap-3 sm:grid-cols-[1fr_8rem]">
      <p className="text-sm font-semibold sm:col-span-2">Add a stop</p>
      <label className="grid gap-1 text-sm">
        Day
        <input name="day" type="date" required defaultValue={defaultDay} className={field} />
      </label>
      <label className="grid gap-1 text-sm">
        Time
        <input name="startTime" type="time" className={field} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Stop
        <input name="title" required maxLength={120} placeholder="Morning market" className={field} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Place
        <input name="location" maxLength={120} placeholder="Optional, like Mercado da Ribeira" className={field} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Note
        <textarea name="details" rows={2} maxLength={500} placeholder="Optional" className={field} />
      </label>
      <fieldset className="grid gap-2 text-sm sm:col-span-2">
        <legend className="mb-1">Who is going</legend>
        <div className="flex flex-wrap gap-2">
          {people.map((person) => (
            <label
              key={person.userId}
              className="flex items-center gap-2 rounded-full border border-stone-300 px-3 py-1.5 has-[:checked]:border-stone-900 dark:border-stone-700 dark:has-[:checked]:border-stone-100"
            >
              <input type="checkbox" name="participants" value={person.userId} defaultChecked />
              {person.userId === currentUserId ? "You" : person.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="whitespace-nowrap rounded-lg bg-stamp px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong disabled:opacity-60 dark:text-stone-950"
        >
          Add to itinerary
        </button>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
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
