import {
  getTripForMember,
  listDocuments,
  listExpenses,
  listItinerary,
  listTripPeople,
} from "@travel-buddy/db";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth/server";
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

  const [people, stops, documents, expenses] = await Promise.all([
    listTripPeople(id),
    listItinerary(id),
    listDocuments(id),
    listExpenses(id),
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
        people={people}
        stops={stops.map((stop) => ({
          id: stop.id,
          day: String(stop.day).slice(0, 10),
          title: stop.title,
          details: stop.details,
        }))}
        documents={documents.map((document) => ({
          id: document.id,
          name: document.name,
        }))}
        expenses={expenses.map((item) => ({
          id: item.id,
          title: item.title,
          amountCents: item.amountCents,
          paidBy: item.paidBy,
        }))}
      />
    </AppShell>
  );
}
