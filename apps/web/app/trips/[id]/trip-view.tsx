"use client";

import { useRef, useState, useTransition } from "react";
import { DocumentForm, TicketForm } from "./trip-sections";
import { TripExpenses, type Ledger } from "./expenses";
import { TripItinerary, type Stop } from "./itinerary";
import { InvitePeople } from "./invite-people";
import { TripPhoto } from "../trip-photo";
import { TripChecklist, type TripChecklists } from "./trip-checklist";
import { TripLuggage, type LuggageBag } from "./luggage";
import { PersonalDocuments } from "@/app/profile/personal-documents";
import { EditableDocument } from "@/components/editable-document";
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
  { id: "luggage", label: "Luggage" },
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
type PersonalDocumentItem = {
  id: string;
  name: string;
  category: string;
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
  personalDocuments,
  ledger,
  today,
  checklist,
  luggage,
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
  personalDocuments: PersonalDocumentItem[];
  ledger: Ledger;
  today: string;
  checklist: TripChecklists;
  luggage: LuggageBag[];
}) {
  const solo = people.length < 2;
  const [section, setSection] = useState<SectionId>("itinerary");
  const [detailsOpen, setDetailsOpen] = useState(false);
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
        <aside className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-card shadow-sm lg:sticky lg:top-24 dark:border-stone-800">
          <div className={`${detailsOpen ? "order-2 block" : "hidden"} px-4 pt-4 lg:order-1 lg:block`}>
            <TripPhoto tripId={tripId} hasCover={hasCover} version={coverVersion} compact />
          </div>
          <div className="order-1 p-4 lg:order-2">
            <div className="flex items-start justify-between gap-2">
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
            <button
              type="button"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((open) => !open)}
              className="mt-4 w-full rounded-lg border border-stone-300 py-2.5 text-sm font-medium lg:hidden dark:border-stone-700"
            >
              {detailsOpen ? "Hide people and photo" : "People and photo"}
            </button>
          </div>

          <div
            className={`${detailsOpen ? "order-3 block" : "hidden"} border-t border-dashed border-[var(--perforation)] px-4 py-4 lg:order-3 lg:block`}
          >
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
            className="flex flex-wrap gap-1"
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
                    ? "min-h-11 rounded-full bg-stone-900 px-3.5 py-2 text-sm font-medium text-white transition-colors dark:bg-stone-100 dark:text-stone-900"
                    : "min-h-11 rounded-full px-3.5 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-900 dark:hover:text-stone-100"
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
                  checklists={checklist}
                  people={people}
                  currentUserId={currentUserId}
                  solo={solo}
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
                  solo={solo}
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
                  personalDocuments={personalDocuments}
                  solo={solo}
                />
              ) : null}

              {section === "expenses" ? (
                <TripExpenses
                  tripId={tripId}
                  ledger={ledger}
                  people={people}
                  currentUserId={currentUserId}
                  today={today}
                  solo={solo}
                />
              ) : null}

              {section === "luggage" ? (
                <TripLuggage tripId={tripId} bags={luggage} solo={solo} />
              ) : null}

              {section === "photos" ? (
                <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 dark:border-stone-700">
                  <p className="text-sm font-medium">Photos</p>
                  <p className="mt-1 text-sm text-stone-500">
                    {solo
                      ? "Coming soon. An album for this trip is not ready yet."
                      : "Coming soon. A shared album for this trip is not ready yet."}
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
  personalDocuments,
  solo,
}: {
  tripId: string;
  currentUserId: string;
  documents: DocumentItem[];
  personalDocuments: PersonalDocumentItem[];
  solo: boolean;
}) {
  const [scope, setScope] = useState<"personal" | "group">("group");
  const groups = new Map<string, DocumentItem[]>();
  for (const document of documents) {
    groups.set(document.category, [...(groups.get(document.category) ?? []), document]);
  }
  const categories = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  const tabs = [
    { id: "personal" as const, label: "Personal" },
    { id: "group" as const, label: solo ? "This trip" : "Group" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-semibold tracking-tight">Documents</h3>
          <p className="mt-1 text-[0.95rem] text-stone-600 dark:text-stone-400">
            {solo
              ? "Personal papers stay with you. Files for this trip stay with the trip."
              : "Personal is only yours. Group is shared with everyone on the trip."}
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Document type"
          className="flex w-full rounded-full border border-stone-300 bg-stone-100 p-1 sm:w-auto dark:border-stone-700 dark:bg-stone-900"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={scope === tab.id}
              onClick={() => setScope(tab.id)}
              className={
                scope === tab.id
                  ? "min-h-11 flex-1 rounded-full bg-stone-900 px-3.5 py-1.5 text-sm font-medium text-white sm:flex-none dark:bg-stone-100 dark:text-stone-900"
                  : "min-h-11 flex-1 rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-600 sm:flex-none dark:text-stone-300"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div key={scope} className="mt-6 animate-fade-in">
        {scope === "personal" ? (
          <PersonalDocuments documents={personalDocuments} embedded />
        ) : (
          <>
            {documents.length === 0 ? (
              <p className="text-sm text-stone-500">No files yet.</p>
            ) : (
              <div className="grid gap-6">
                {categories.map((category) => (
                  <div key={category}>
                    <h3 className="stamp-tag">{category}</h3>
                    <ul className="mt-2 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
                      {groups.get(category)!.map((document) => (
                        <li key={document.id} className="py-3">
                          <EditableDocument
                            name={document.name}
                            href={`/api/trips/${tripId}/documents/${document.id}`}
                            endpoint={`/api/trips/${tripId}/documents/${document.id}`}
                          />
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
        )}
      </div>
    </div>
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
          className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-[var(--background)] p-5 dark:border-stone-800"
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
