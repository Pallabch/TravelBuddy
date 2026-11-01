import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL_UNPOOLED;

if (!url) {
  throw new Error(
    "DATABASE_URL_UNPOOLED is missing. Migrations need the direct Neon connection, not the pooled one.",
  );
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
