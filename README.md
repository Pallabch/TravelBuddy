# Travel Buddy

A shared place for a trip: the people going, dates, itinerary, documents, tickets, expenses, and a personal checklist.

The site is a Next.js app. Neon holds the Postgres database, sign-in, and private files.

## What you need

- Node.js 20 or newer
- pnpm 12.16.1 (`packageManager` in `package.json` pins this version)
- A Neon project with Auth and a private object-storage bucket named `assets`

## Setup

1. Clone the repo and install dependencies from the repository root.

   ```bash
   git clone https://github.com/Pallabch/TravelBuddy.git
   cd TravelBuddy
   pnpm install
   ```

   `pnpm install` links `apps/web/.env.local` to the root `.env.local` once that file exists. If you create `.env.local` after installing, run `pnpm install` again so the web app can see it.

2. Create the root environment file.

   ```bash
   cp .env.example .env.local
   ```

   Fill in `.env.local`. Do not commit it.

   | Variable | What it is |
   | --- | --- |
   | `DATABASE_URL` | Pooled Neon connection string. The host name contains `-pooler`. The app uses this for queries. |
   | `DATABASE_URL_UNPOOLED` | Direct Neon connection string, without `-pooler`. Migrations use this. |
   | `NEON_AUTH_BASE_URL` | Neon Auth base URL for this project. |
   | `NEON_AUTH_JWKS_URL` | Neon Auth JWKS URL for this project. |
   | `NEON_AUTH_COOKIE_SECRET` | A secret you create, at least 32 characters. Neon does not issue this. `openssl rand -base64 32` is enough. |
   | `AWS_ACCESS_KEY_ID` | Key for the private `assets` bucket. |
   | `AWS_SECRET_ACCESS_KEY` | Secret for that bucket. |
   | `AWS_ENDPOINT_URL_S3` | Neon object-storage endpoint. |
   | `AWS_REGION` | Region for that endpoint. |

   If this folder is already linked to the Neon project, `neon deploy` applies `neon.ts` (Auth and the `assets` bucket) and writes the Neon-issued values into `.env.local`. You still set `NEON_AUTH_COOKIE_SECRET` yourself.

3. Apply the database migrations. This needs `DATABASE_URL_UNPOOLED`.

   ```bash
   pnpm --filter @travel-buddy/db db:migrate
   ```

4. Start the site.

   ```bash
   pnpm --filter @travel-buddy/web dev
   ```

   Open http://localhost:3000. Create an account from the landing page, then open **Trips**.

## Layout

- `apps/web` is the Next.js app.
- `packages/db` is the Drizzle schema, queries, and SQL migrations.
- `packages/validators` is the shared form validation.
- `neon.ts` declares Neon Auth and the private `assets` bucket.

App queries go through `packages/db`. The web app does not import `drizzle-orm` itself.

## Checks

Ping the database:

```bash
pnpm db:ping
```

Typecheck the web app:

```bash
pnpm --filter @travel-buddy/web exec tsc --noEmit
```

Build for production:

```bash
pnpm build
```
