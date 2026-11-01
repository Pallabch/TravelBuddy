import { sql } from "drizzle-orm";
import { db } from "./client.ts";

export async function pingDatabase() {
  const result = await db.execute(sql`select 1 as ok`);
  return Number(result.rows[0]?.ok ?? 0);
}
