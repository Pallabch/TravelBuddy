"use client";

import { useRef, useState, useTransition } from "react";
import { DocumentForm, TicketForm } from "./trip-sections";
import { TripExpenses, type Ledger } from "./expenses";
import { TripItinerary, type Stop } from "./itinerary";
import { InvitePeople } from "./invite-people";
import { TripPhoto } from "../trip-photo";
import { TripChecklist, type Checklist } from "./trip-checklist";
import { deleteTripAction, removeMemberAction } from "./actions";
import { formatDay } from "@/lib/format-day";
import { code, dayCount, Field, PinIcon } from "@/components/boarding-pass";
import { PendingLink } from "@/components/pending-link";

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
  checklist: Checklist;
}) {
  const [section, setSection] = useState<SectionId>("itinerary");
  const [, startSection] = useTransition();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <PendingLink
        href="/trips"
        className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      >
        ← All trips
      </PendingLink>

      <div className="mt-4 grid gap-6 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-stone-200 bg-card shadow-sm lg:sticky lg:top-24 dark:border-stone-800">
          <div className="p-4">
            <TripPhoto tripId={tripId} hasCover={hasCover} version={coverVersion} compact />
            <div className="mt-4 flex items-start justify-between gap-2">
              <p className="field-label">Boarding pass · {code(destination)}</p>
              <span className="stamp-tag shrink-0">{role}</span>
            </div>
            <h1 className="mt-2 font-serif text-2xl font-semibold leading-tight tracking-tight">{title}</h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400">
              <PinIcon />
              <span className="truncate">{destination}</span>
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Depart" value={formatDay(startDate)} />
              <Field label="Return" value={formatDay(endDate)} />
              <Field label="Days" value={String(dayCount(startDate, endDate))} />
              <Field label="Travellers" value={String(people.length)} />
            </dl>
          </div>

          <div className="border-t border-dashed border-[var(--perforation)] px-4 py-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold">People</h2>
              <span className="font-mono text-xs text-stone-500">{people.length}</span>
            </div>
            <ul className="mt-3 space-y-2">
              {people.map((person) => (
                <li key={person.userId} className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-stamp-soft text-xs font-semibold text-stamp"
                  >
                    {initial(person.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {person.userId === currentUserId ? "You" : person.name}
                    </span>
                    {person.homeCity ? (
                      <span className="block truncate text-xs text-stone-500">{person.homeCity}</span>
                    ) : null}
                  </span>
                  <span className="field-label shrink-0">{person.role}</span>
                  {role === "owner" && person.role !== "owner" ? (
                    <RemoveMember tripId={tripId} name={person.name} userId={person.userId} />
                  ) : null}
                </li>
              ))}
            </ul>
            <InvitePeople tripId={tripId} />
            {role === "owner" ? <DeleteTrip tripId={tripId} title={title} /> : null}
          </div>
        </aside>

        <div className="min-w-0">
          <nav
            aria-label="Trip sections"
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={section === item.id ? "true" : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => startSection(() => setSection(item.id))}
                className={
                  section === item.id
                    ? "shrink-0 rounded-full bg-stone-900 px-3.5 py-2 text-sm font-medium text-white transition-colors dark:bg-stone-100 dark:text-stone-900"
                    : "shrink-0 rounded-full px-3.5 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-900 dark:hover:text-stone-100"
                }
              >
                {item.label}
              </button>
            ))}
          </nav>

          <section className="mt-5 min-h-[28rem] [overflow-anchor:none]">
            <div key={section} className="animate-fade-in">
              {section === "checklist" ? (
                <TripChecklist
                  tripId={tripId}
                  checklist={checklist}
                  people={people}
                  currentUserId={currentUserId}
                />
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
                              <span className="text-lg font-semibold">
                                {String(index + 1).padStart(2, "0")}
                              </span>
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
                  <p className="mt-1 text-sm text-stone-500">
                    Coming soon. A shared album for this trip is not ready yet.
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
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
        <PendingLink
          href="/profile#documents"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
        >
          Your documents →
        </PendingLink>
      </div>

      {documents.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">No files yet.</p>
      ) : (
        <div className="mt-4 grid gap-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="field-label">{category}</h3>
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
        className="grid size-6 shrink-0 place-items-center rounded-full text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      >
        ×
      </button>
      <dialog ref={dialogRef} className="rounded-2xl">
        <form
          action={removeMemberAction.bind(null, tripId, userId)}
          className="w-80 rounded-2xl border border-stone-200 bg-[var(--background)] p-5 dark:border-stone-800"
        >
          <p className="text-base font-medium">Remove {name}?</p>
          <p className="mt-2 text-sm text-stone-500">They will no longer see this trip.</p>
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
    <form action={deleteTripAction.bind(null, tripId)} className="mt-4 flex flex-wrap items-center gap-3">
      <p className="text-sm text-stone-500">Delete {title}?</p>
      <button type="submit" className="text-sm font-medium text-red-700 dark:text-red-400">
        Delete
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="text-sm text-stone-500">
        Keep
      </button>
    </form>
  );
}
