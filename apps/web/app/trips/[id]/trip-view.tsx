"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { DocumentForm, ExpenseForm, ItineraryForm, TicketForm } from "./trip-sections";
import { InvitePeople } from "./invite-people";
import { TripPhoto } from "../trip-photo";
import { TripChecklist } from "./trip-checklist";
import { deleteTripAction, removeMemberAction } from "./actions";

const sections = [
  { id: "itinerary", label: "Itinerary" },
  { id: "tickets", label: "Tickets" },
  { id: "documents", label: "Documents" },
  { id: "expenses", label: "Expenses" },
  { id: "photos", label: "Photos" },
  { id: "checklist", label: "Checklist" },
] as const;

type SectionId = (typeof sections)[number]["id"];

type Person = { userId: string; name: string; homeCity: string; role: string };
type Stop = { id: string; day: string; title: string; details: string };
type Ticket = { id: string; name: string };
type DocumentItem = { id: string; name: string };
type Expense = { id: string; title: string; amountCents: number; paidBy: string };

export function TripView({
  tripId,
  title,
  destination,
  startDate,
  endDate,
  hasCover,
  coverVersion,
  currentUserId,
  role,
  people,
  stops,
  tickets,
  documents,
  expenses,
  checklist,
}: {
  tripId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  hasCover: boolean;
  coverVersion: string;
  currentUserId: string;
  role: string;
  people: Person[];
  stops: Stop[];
  tickets: Ticket[];
  documents: DocumentItem[];
  expenses: Expense[];
  checklist: string[];
}) {
  const [section, setSection] = useState<SectionId>("itinerary");
  const names = new Map(people.map((person) => [person.userId, person.name]));
  const total = expenses.reduce((sum, item) => sum + item.amountCents, 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <Link href="/trips" className="text-sm text-stone-500">
        All trips
      </Link>
      <div className="mt-3 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-lg text-stone-600 dark:text-stone-400">{destination}</p>
          <p className="mt-4 text-sm">
            {formatDay(startDate)} to {formatDay(endDate)}
          </p>
          {role === "owner" ? <DeleteTrip tripId={tripId} title={title} /> : null}
        </div>
        <TripPhoto tripId={tripId} hasCover={hasCover} version={coverVersion} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">People going</h2>
        <ul className="mt-3 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
          {people.map((person) => (
            <li key={person.userId} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{person.name}</p>
                {person.homeCity ? (
                  <p className="text-sm text-stone-500">{person.homeCity}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs uppercase tracking-wide text-stone-500">{person.role}</p>
                {role === "owner" && person.role !== "owner" ? (
                  <RemoveMember tripId={tripId} name={person.name} userId={person.userId} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        <InvitePeople tripId={tripId} />
      </section>

      <div className="mt-10 grid gap-8 md:grid-cols-[11rem_1fr]">
        <nav className="flex gap-1 md:flex-col">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={section === item.id ? "true" : undefined}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setSection(item.id)}
              className={
                section === item.id
                  ? "rounded-lg bg-stone-900 px-3 py-2 text-left text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900"
                  : "rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-900"
              }
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="min-h-[32rem] [overflow-anchor:none]">
        {section === "checklist" ? (
            <TripChecklist tripId={tripId} initialDone={checklist} />
          ) : null}

          
          {section === "itinerary" ? (
            <>
              {stops.length === 0 ? (
                <p className="text-sm text-stone-500">No stops yet.</p>
              ) : (
                <ul className="divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
                  {stops.map((stop) => (
                    <li key={stop.id} className="py-3">
                      <p className="text-xs text-stone-500">{formatDay(stop.day)}</p>
                      <p className="text-sm font-medium">{stop.title}</p>
                      {stop.details ? (
                        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                          {stop.details}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              <ItineraryForm tripId={tripId} />
            </>
          ) : null}

          {section === "tickets" ? (
            <>
              {tickets.length === 0 ? (
                <p className="text-sm text-stone-500">No tickets yet.</p>
              ) : (
                <ul className="divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
                  {tickets.map((ticket) => (
                    <li key={ticket.id} className="py-3">
                      <a
                        href={`/api/trips/${tripId}/tickets/${ticket.id}`}
                        className="text-sm font-medium underline decoration-stone-300 underline-offset-4"
                      >
                        {ticket.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <TicketForm tripId={tripId} />
            </>
          ) : null}

          {section === "documents" ? (
            <>
              {documents.length === 0 ? (
                <p className="text-sm text-stone-500">No files yet.</p>
              ) : (
                <ul className="divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
                  {documents.map((document) => (
                    <li key={document.id} className="py-3">
                      <a
                        href={`/api/trips/${tripId}/documents/${document.id}`}
                        className="text-sm font-medium underline decoration-stone-300 underline-offset-4"
                      >
                        {document.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <DocumentForm tripId={tripId} />
            </>
          ) : null}

          {section === "expenses" ? (
            <>
              <p className="text-sm text-stone-500">Total {money(total)}</p>
              {expenses.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">Nothing spent yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
                  {expenses.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-sm text-stone-500">
                          Paid by {names.get(item.paidBy) ?? "someone on the trip"}
                        </p>
                      </div>
                      <p className="text-sm">{money(item.amountCents)}</p>
                    </li>
                  ))}
                </ul>
              )}
              <ExpenseForm
                tripId={tripId}
                currentUserId={currentUserId}
                people={people.map((person) => ({
                  userId: person.userId,
                  name: person.name,
                }))}
              />
            </>
          ) : null}

          {section === "photos" ? (
            <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 dark:border-stone-700">
              <p className="text-sm font-medium">Photos</p>
              <p className="mt-1 text-sm text-stone-500">Coming soon. A shared album for this trip is not ready yet.</p>
            </div>
          ) : null}


        </section>
      </div>
    </main>
  );
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${day} ${months[(month ?? 1) - 1]} ${year}`;
}

function RemoveMember({
  tripId,
  userId,
  name,
}: {
  tripId: string;
  userId: string;
  name: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={() => dialogRef.current?.showModal()}
        className="grid size-6 place-items-center rounded-full text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      >
        ×
      </button>
      <dialog ref={dialogRef} className="rounded-2xl">
        <form
          action={removeMemberAction.bind(null, tripId, userId)}
          className="w-80 rounded-2xl border border-stone-200 bg-[var(--background)] p-5 dark:border-stone-800"
        >
          <p className="text-base font-medium">Remove {name}?</p>
          <p className="mt-2 text-sm text-stone-500">
            They will no longer see this trip.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg px-3 py-2 text-sm text-stone-600 dark:text-stone-300"
            >
              Keep
            </button>
            <button
              type="submit"
              className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900"
            >
              Remove
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function DeleteTrip({ tripId, title }: { tripId: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-4 text-sm text-stone-500 underline-offset-4 hover:underline"
      >
        Delete trip
      </button>
    );
  }
  return (
    <form action={deleteTripAction.bind(null, tripId)} className="mt-4 flex items-center gap-3">
      <p className="text-sm text-stone-500">Delete {title}?</p>
      <button type="submit" className="text-sm font-medium text-red-700 dark:text-red-400">
        Delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm text-stone-500"
      >
        Keep
      </button>
    </form>
  );
}

function money(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
