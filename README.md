# Travel Buddy

A shared place for one trip: who is going, when, the day-by-day plan, the tickets and papers, who paid for what, and what each person still has to pack.

Group chats lose this. The dates sit in one message, the hotel PDF in another, and the argument about the taxi in a third. Travel Buddy keeps that record with the people on the trip, so anyone who was invited can open the same trip and see the current plan.

A trip is a title, one destination, and a pair of dates, plus the people on it. That is enough for a weekend away and for a shorter journey. The screen is laid out like a boarding pass on purpose: departure, return, travellers, then the sections underneath.

## What a trip holds

| Section | What it is for |
| --- | --- |
| Itinerary | One stop at a time, on a day of the trip. Days fold shut. A stop with no named people is for everyone, including people invited later. |
| Tickets | Files the group needs at the gate or the hotel. The display name can be changed. The stored file stays put. |
| Documents | Two piles. **Personal** papers belong to one account and follow that person across trips. **This trip** (called **Group** when more than one person is on the trip) is shared with everyone invited. |
| Expenses | What was paid, who paid it, and how it is split: equally, by exact amounts, by percent, or by shares. Payments between people are recorded separately from the cost of an item. |
| Checklist | Shared lists and a private list. Each person ticks their own items. |
| Luggage | A private packing list. Other people on the trip cannot read your bags. |
| Cover photo | One photo on the trip. A shared photo album is not built yet. The Photos tab says so. |

A trip with one person drops the group wording. There is no "everyone" when you are the only traveller.

## How access works

Membership is the check. If you are not on the trip, you do not see it, and you do not get its files.

Accounts come from [Neon Auth](https://neon.com/docs/auth/overview). User ids are stored as text. The app does not put a foreign key into the auth tables. When a query needs a name, it joins `neon_auth."user"` with `u.id::text`.

Some things are private even inside a trip:

- Luggage belongs to one traveller.
- Personal documents belong to one account, not to a trip.
- A personal checklist is visible only to its owner.
- Profile photos and trip covers are served by the app after it checks who is asking.

Shared files (tickets and trip documents) live in a private object-storage bucket named `assets`. The browser never receives a storage credential. The app checks membership, then streams the file.

## Stack

- [pnpm](https://pnpm.io) workspaces and [Turborepo](https://turbo.build)
- [Next.js](https://nextjs.org) App Router, React, and Tailwind CSS
- [Drizzle](https://orm.drizzle.team) and Postgres on [Neon](https://neon.com)
- Neon Auth for sign-in
- Neon object storage for photos and files, through an S3-compatible API

The site is deployed on Vercel. Server functions run in Singapore (`sin1`) because the database, auth, and files are in `ap-southeast-1`. Leaving the functions in another region makes every page wait on that round trip.

## Repository

```
apps/web              Next.js app: pages, server actions, and file routes
packages/db           Drizzle schema, SQL migrations, and queries
packages/validators   Shared validation for forms and splits
neon.ts               Neon Auth and the private assets bucket
```

The web app does not import `drizzle-orm`. It calls functions from `@travel-buddy/db`. Validation shared by the form and the server lives in `@travel-buddy/validators`.

Server actions return `{ error?: string }` when something the person did should be shown on the form. Dates travel as `YYYY-MM-DD` strings from SQL, and the UI prints them as `6 Nov 2026`.

## Requirements

- Node.js 20 or newer
- pnpm 12.16.1, pinned in `package.json` under `packageManager`
- A Neon project with Auth turned on and a private bucket named `assets`

## Local development

Clone the repository and install from the root.

```bash
git clone https://github.com/Pallabch/TravelBuddy.git
cd TravelBuddy
pnpm install
```

`pnpm install` links `apps/web/.env.local` to the root `.env.local` once that file exists. If you create `.env.local` afterwards, run `pnpm install` again so the web app can see it.

Create the environment file and fill it in. Do not commit it.

```bash
cp .env.example .env.local
```

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Pooled Neon connection string. The host name contains `-pooler`. The running app uses this. |
| `DATABASE_URL_UNPOOLED` | Direct Neon connection string, without `-pooler`. Migrations use this. |
| `NEON_AUTH_BASE_URL` | Neon Auth base URL for this project. |
| `NEON_AUTH_JWKS_URL` | Neon Auth JWKS URL for this project. |
| `NEON_AUTH_COOKIE_SECRET` | A secret you create, at least 32 characters. Neon does not issue this. `openssl rand -base64 32` is enough. |
| `AWS_ACCESS_KEY_ID` | Key for the private `assets` bucket. |
| `AWS_SECRET_ACCESS_KEY` | Secret for that bucket. |
| `AWS_ENDPOINT_URL_S3` | Neon object-storage endpoint. |
| `AWS_REGION` | Region of that endpoint. This project uses `ap-southeast-1`. |

If this folder is already linked to the Neon project, `neon deploy` applies `neon.ts` (Auth and the `assets` bucket) and writes the Neon-issued values into `.env.local`. You still set `NEON_AUTH_COOKIE_SECRET` yourself.

Apply the migrations. This command reads `DATABASE_URL_UNPOOLED`.

```bash
pnpm --filter @travel-buddy/db db:migrate
```

Start the site.

```bash
pnpm dev
```

Open http://localhost:3000. Create an account on the landing page, then open **Trips**.

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

## Contributing

Issues and pull requests are welcome.

- Keep a change inside the package that owns it. A new column is a Drizzle table in `packages/db` plus a SQL migration, applied with the unpooled URL. A form rule goes in `packages/validators` when both the page and the server need it.
- Preserve the privacy split. A feature that is personal must not become readable by the rest of the trip, and a one-person trip should not grow group copy.
- Do not commit `.env.local`, credentials, or session tokens.

## License

No license has been chosen yet. Until one is added, the copyright stays with the maintainer and reuse needs their permission.
