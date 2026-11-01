if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is missing. Copy .env.example to .env and paste the Neon pooled connection string.",
  );
  process.exit(1);
}

const { databaseHost, pool } = await import("./client.ts");
const { pingDatabase } = await import("./ping-database.ts");

const host = databaseHost();
const ok = await pingDatabase();

console.log(`Neon answered from ${host}`);
console.log([{ ok }]);
await pool.end();

if (!host.includes("-pooler")) {
  console.log(
    "This host is the direct database. App queries should use the pooled host, whose name contains -pooler.",
  );
}
