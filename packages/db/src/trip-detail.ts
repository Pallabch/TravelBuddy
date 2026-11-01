import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { ExpenseInput, ItineraryInput } from "@travel-buddy/validators";
import { db } from "./client.ts";
import { trip, tripDocument, tripExpense, tripItinerary, tripMember } from "./schema.ts";

export async function setTripCover(userId: string, tripId: string, coverKey: string) {
  const tripRow = await getTripForMember(userId, tripId);
  if (!tripRow) {
    throw new Error("You are not on this trip.");
  }
  const [current] = await db
    .select({ coverKey: trip.coverKey })
    .from(trip)
    .where(eq(trip.id, tripId))
    .limit(1);
  await db.update(trip).set({ coverKey }).where(eq(trip.id, tripId));
  return current?.coverKey ?? null;
}

export async function clearTripCover(userId: string, tripId: string) {
  const tripRow = await getTripForMember(userId, tripId);
  if (!tripRow) {
    throw new Error("You are not on this trip.");
  }
  await db.update(trip).set({ coverKey: null }).where(eq(trip.id, tripId));
  return tripRow.coverKey;
}

export async function getTripForMember(userId: string, tripId: string) {
  const [row] = await db
    .select({
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      coverKey: trip.coverKey,
      role: tripMember.role,
    })
    .from(tripMember)
    .innerJoin(trip, eq(trip.id, tripMember.tripId))
    .where(and(eq(tripMember.userId, userId), eq(trip.id, tripId)))
    .limit(1);
  return row ?? null;
}

export async function listTripPeople(tripId: string) {
  const result = await db.execute<{
    user_id: string;
    role: string;
    name: string;
    home_city: string;
  }>(sql`
    SELECT m.user_id, m.role, u.name, COALESCE(p.home_city, '') AS home_city
    FROM trip_member AS m
    JOIN neon_auth."user" AS u ON u.id::text = m.user_id
    LEFT JOIN profile AS p ON p.user_id = m.user_id
    WHERE m.trip_id = ${tripId}
    ORDER BY CASE WHEN m.role = 'owner' THEN 0 ELSE 1 END, u.name
  `);
  return result.rows.map((row) => ({
    userId: row.user_id,
    role: row.role,
    name: row.name,
    homeCity: row.home_city,
  }));
}

export async function addTripMember(actorId: string, tripId: string, memberId: string) {
  const tripRow = await getTripForMember(actorId, tripId);
  if (!tripRow) {
    throw new Error("You are not on this trip.");
  }

  const found = await db.execute<{ id: string }>(sql`
    SELECT id::text AS id FROM neon_auth."user" WHERE id::text = ${memberId} LIMIT 1
  `);
  if (!found.rows[0]) {
    throw new Error("That person does not have an account.");
  }

  await db
    .insert(tripMember)
    .values({ tripId, userId: memberId, role: "member" })
    .onConflictDoNothing();
}

export async function listItinerary(tripId: string) {
  return db
    .select()
    .from(tripItinerary)
    .where(eq(tripItinerary.tripId, tripId))
    .orderBy(asc(tripItinerary.day), asc(tripItinerary.createdAt));
}

export async function addItineraryItem(
  actorId: string,
  tripId: string,
  input: ItineraryInput,
) {
  const tripRow = await getTripForMember(actorId, tripId);
  if (!tripRow) {
    throw new Error("You are not on this trip.");
  }
  await db.insert(tripItinerary).values({
    tripId,
    day: input.day,
    title: input.title,
    details: input.details,
  });
}

export async function listDocuments(tripId: string) {
  return db
    .select()
    .from(tripDocument)
    .where(eq(tripDocument.tripId, tripId))
    .orderBy(desc(tripDocument.createdAt));
}

export async function addDocument(
  actorId: string,
  tripId: string,
  input: { name: string; objectKey: string; contentType: string },
) {
  const tripRow = await getTripForMember(actorId, tripId);
  if (!tripRow) {
    throw new Error("You are not on this trip.");
  }
  const [row] = await db
    .insert(tripDocument)
    .values({
      tripId,
      name: input.name,
      objectKey: input.objectKey,
      contentType: input.contentType,
      uploadedBy: actorId,
    })
    .returning({ id: tripDocument.id });
  return row;
}

export async function getDocumentForMember(userId: string, tripId: string, documentId: string) {
  const tripRow = await getTripForMember(userId, tripId);
  if (!tripRow) return null;
  const [row] = await db
    .select()
    .from(tripDocument)
    .where(and(eq(tripDocument.id, documentId), eq(tripDocument.tripId, tripId)))
    .limit(1);
  return row ?? null;
}

export async function listExpenses(tripId: string) {
  const rows = await db
    .select()
    .from(tripExpense)
    .where(eq(tripExpense.tripId, tripId))
    .orderBy(desc(tripExpense.createdAt));
  return rows;
}

export async function addExpense(actorId: string, tripId: string, input: ExpenseInput) {
  const people = await listTripPeople(tripId);
  const allowed = await getTripForMember(actorId, tripId);
  if (!allowed) {
    throw new Error("You are not on this trip.");
  }
  if (!people.some((person) => person.userId === input.paidBy)) {
    throw new Error("Choose someone who is on the trip.");
  }
  const cents = Math.round(Number(input.amount) * 100);
  await db.insert(tripExpense).values({
    tripId,
    title: input.title,
    amountCents: cents,
    paidBy: input.paidBy,
  });
}
