import { desc, eq } from "drizzle-orm";
import type { CreateTripInput } from "@travel-buddy/validators";
import { db } from "./client.ts";
import { trip, tripMember } from "./schema.ts";

export async function listTripsForUser(userId: string) {
  return db
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
    .where(eq(tripMember.userId, userId))
    .orderBy(desc(trip.startDate));
}

export async function createTripForUser(input: CreateTripInput, userId: string) {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(trip)
      .values({
        ownerId: userId,
        title: input.title,
        destination: input.destination,
        startDate: input.startDate,
        endDate: input.endDate,
      })
      .returning({ id: trip.id });

    if (!created) {
      throw new Error("The trip was not created.");
    }

    await tx.insert(tripMember).values({
      tripId: created.id,
      userId,
      role: "owner",
    });

    return created;
  });
}
