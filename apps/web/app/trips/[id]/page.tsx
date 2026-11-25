import {
  getTripForMember,
  getTripLedger,
  getChecklist,
  getLuggage,
  listDocuments,
  listPersonalDocuments,
  listItinerary,
  listTickets,
  listTripPeople,
} from "@travel-buddy/db";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth/server";
import { formatDay } from "@/lib/format-day";
import { notFound, redirect } from "next/navigation";
import { TripView } from "./trip-view";

export const dynamic = "force-dynamic";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/");

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const trip = await getTripForMember(session.user.id, id);
  if (!trip) notFound();

  const [people, stops, tickets, documents, personalDocuments, ledger, checklist, luggage] = await Promise.all([
    listTripPeople(id),
    listItinerary(id),
    listTickets(id),
    listDocuments(id),
    listPersonalDocuments(session.user.id),
    getTripLedger(id),
    getChecklist(session.user.id, id),
    getLuggage(session.user.id, id),
  ]);
  return (
    <AppShell>
      <TripView
        tripId={id}
        title={trip.title}
        destination={trip.destination}
        startDate={String(trip.startDate).slice(0, 10)}
        endDate={String(trip.endDate).slice(0, 10)}
        hasCover={Boolean(trip.coverKey)}
        coverVersion={trip.coverKey?.split("/").pop() ?? ""}
        currentUserId={session.user.id}
        role={trip.role}
        people={people}
        stops={stops}
        tickets={tickets.map((ticket) => ({
          id: ticket.id,
          name: ticket.name,
        }))}
        documents={documents.map((document) => ({
          id: document.id,
          name: document.name,
          category: document.category,
          uploadedBy: document.uploadedBy,
          uploaderName: document.uploaderName,
          createdAt: document.createdAt,
        }))}
        personalDocuments={personalDocuments.map((document) => ({
          id: document.id,
          name: document.name,
          category: document.category,
          createdAt: formatDay(document.createdAt.toISOString()),
        }))}
        ledger={ledger}
        today={new Date().toISOString().slice(0, 10)}
        checklist={
          checklist ?? {
            group: { updatedBy: null, updatedAt: null, names: {}, sections: [] },
            personal: { updatedBy: null, updatedAt: null, names: {}, sections: [] },
          }
        }
        luggage={luggage ?? []}
      />
    </AppShell>
  );
}
