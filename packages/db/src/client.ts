import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Neon writes the pooled connection string to .env.local.",
  );
}

const url = databaseUrl.includes("uselibpqcompat=")
  ? databaseUrl
  : `${databaseUrl}${databaseUrl.includes("?") ? "&" : "?"}uselibpqcompat=true`;

// One pool for the process. max: 1 because each Vercel function is its own
// process; Neon PgBouncer (the -pooler host) shares the real Postgres connections.
const pool = new Pool({ connectionString: url, max: 1 });

// On Vercel this keeps the function alive until idle connections close.
// Locally it does nothing.
attachDatabasePool(pool);

export { pool };

export const db = drizzle({ client: pool, schema });

export function databaseHost() {
  const afterAt = url.split("@")[1] ?? "";
  return afterAt.split("/")[0] ?? "";
}
