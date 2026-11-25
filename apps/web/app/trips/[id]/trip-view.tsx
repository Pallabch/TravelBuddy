"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { DocumentForm, TicketForm } from "./trip-sections";
import { TripExpenses, type Ledger } from "./expenses";
import { TripItinerary, type Stop } from "./itinerary";
import { InvitePeople } from "./invite-people";
import { TripPhoto } from "../trip-photo";
import { TripChecklist } from "./trip-checklist";
import { deleteTripAction, removeMemberAction } from "./actions";
import { formatDay } from "@/lib/format-day";
import { code, dayCount, Field, PinIcon } from "@/components/boarding-pass";

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
type Ticket = { id: string; name: string };
type DocumentItem = {
  id: string;
  name: string;
  category: string;
  uploadedBy: string;
  uploaderName: string | null;
  createdAt: string;
};
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
  ledger,
  today,
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
  ledger: Ledger;
  today: string;
  checklist: string[];
}) {
  const [section, setSection] = useState<SectionId>("itinerary");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <Link href="/trips" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
        ← All trips
      </Link>
      <div className="mt-3 flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-card shadow-sm sm:flex-row dark:border-stone-800">
        <div className="min-w-0 flex-1 p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="field-label">Boarding pass · {code(destination)}</p>
            <span className="stamp-tag -rotate-3">{role}</span>
          </div>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-lg text-stone-600 dark:text-stone-400">
            <PinIcon />
            {destination}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Depart" value={formatDay(startDate)} />
            <Field label="Return" value={formatDay(endDate)} />
            <Field label="Days" value={String(dayCount(startDate, endDate))} />
            <Field label="Travellers" value={String(people.length)} />
          </dl>
          {role === "owner" ? <DeleteTrip tripId={tripId} title={title} /> : null}
        </div>
        <div className="flex shrink-0 items-center justify-center border-t-2 border-dashed border-[var(--perforation)] p-6 sm:perforation-y sm:border-t-0">
          <TripPhoto tripId={tripId} hasCover={hasCover} version={coverVersion} />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold tracking-tight">People going</h2>
        <ul className="mt-3 divide-y divide-dashed divide-stone-300 border-y border-stone-200 dark:divide-stone-700 dark:border-stone-800">
          {people.map((person) => (
            <li key={person.userId} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{person.name}</p>
                {person.homeCity ? (
                  <p className="text-sm text-stone-500">{person.homeCity}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <p className="field-label">{person.role}</p>
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
            <TripItinerary
              tripId={tripId}
              title={title}
              destination={destination}
              startDate={startDate}
              endDate={endDate}
              stops={stops}
              people={people}
              currentUserId={currentUserId}
            />
          ) : null}

          {section === "tickets" ? (
            <>
              {tickets.length === 0 ? (
                <p className="text-sm text-stone-500">No tickets yet.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {tickets.map((ticket, index) => (
                    <li key={ticket.id}>
                      <a
                        href={`/api/trips/${tripId}/tickets/${ticket.id}`}
                        className="flex overflow-hidden rounded-xl border border-stone-200 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800"
                      >
                        <span className="flex w-16 shrink-0 flex-col items-center justify-center bg-stamp-soft py-3 font-mono text-stamp">
                          <span className="text-[10px] tracking-widest">TKT</span>
                          <span className="text-lg font-semibold">{String(index + 1).padStart(2, "0")}</span>
                        </span>
                        <span className="perforation-y min-w-0 flex-1 px-4 py-3">
                          <span className="block truncate text-sm font-medium">{ticket.name}</span>
                          <span className="field-label mt-0.5 block">Open ticket</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <TicketForm tripId={tripId} />
            </>
          ) : null}

          {section === "documents" ? (
            <TripDocuments
              tripId={tripId}
              currentUserId={currentUserId}
              documents={documents}
            />
          ) : null}

          {section === "expenses" ? (
            <TripExpenses
              tripId={tripId}
              ledger={ledger}
              people={people}
              currentUserId={currentUserId}
              today={today}
            />
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

function TripDocuments({
  tripId,
  currentUserId,
  documents,
}: {
  tripId: string;
  currentUserId: string;
  documents: DocumentItem[];
}) {
  const groups = new Map<string, DocumentItem[]>();
  for (const document of documents) {
    groups.set(document.category, [...(groups.get(document.category) ?? []), document]);
  }
  const categories = [...groups.keys()].sort((a, b) => a.localeCompare(b));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">Everyone on this trip can open these.</p>
        <Link
          href="/profile#documents"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
        >
          Your documents →
        </Link>
      </div>

      {documents.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">No files yet.</p>
      ) : (
        <div className="mt-4 grid gap-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="field-label">
                {category}
              </h3>
              <ul className="mt-2 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
                {groups.get(category)!.map((document) => (
                  <li key={document.id} className="py-3">
                    <a
                      href={`/api/trips/${tripId}/documents/${document.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium underline decoration-stone-300 underline-offset-4"
                    >
                      {document.name}
                    </a>
                    <p className="mt-1 text-xs text-stone-500">
                      Uploaded by{" "}
                      {document.uploadedBy === currentUserId
                        ? "you"
                        : (document.uploaderName ?? "a former member")}{" "}
                      on {formatDay(document.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <DocumentForm tripId={tripId} categories={categories} />
    </>
  );
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
              className="rounded-lg bg-stamp px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong dark:text-stone-950"
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
