import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "./client.ts";
import { trip, tripMember } from "./schema.ts";

function likePattern(query: string) {
  return `%${query.replace(/[%_]/g, "")}%`;
}

export async function searchTripsForUser(userId: string, query: string) {
  const pattern = likePattern(query);
  return db
    .select({
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
    })
    .from(tripMember)
    .innerJoin(trip, eq(trip.id, tripMember.tripId))
    .where(
      and(
        eq(tripMember.userId, userId),
        or(ilike(trip.title, pattern), ilike(trip.destination, pattern)),
      ),
    )
    .orderBy(desc(trip.startDate))
    .limit(20);
}

export async function searchPeople(query: string) {
  const pattern = likePattern(query);
  const result = await db.execute<{
    id: string;
    name: string;
    home_city: string;
  }>(sql`
    SELECT u.id::text AS id, u.name, COALESCE(p.home_city, '') AS home_city
    FROM neon_auth."user" AS u
    LEFT JOIN profile AS p ON p.user_id = u.id::text
    WHERE u.name ILIKE ${pattern}
       OR COALESCE(p.home_city, '') ILIKE ${pattern}
    ORDER BY u.name
    LIMIT 20
  `);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    homeCity: row.home_city,
  }));
}
