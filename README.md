# Mint Deck

An NFT mint discovery board for **Arc**: upcoming drops laid out as a
prediction-market-style tile grid.

## Stack

Next.js 16 (App Router) · React 19 · Prisma 5 + **Postgres** · plain CSS design
system in [app/globals.css](app/globals.css). No UI or icon dependencies.

Everything runs on a read-only filesystem, so it deploys to a serverless host
(Vercel) without a persistent disk: images live in the database, not on disk.

## Getting started

```bash
npm install
# DATABASE_URL must be a Postgres connection string — see .env
npm run db:deploy   # apply migrations
npm run db:seed     # optional: load demo collections
npm run dev
```

The schema lives in `prisma/migrations`, not in `prisma db push`. Change
`prisma/schema.prisma`, then run `npm run db:migrate` to record a migration —
that way a column whose type changes is rewritten explicitly, instead of SQLite
silently keeping values the new type cannot read.

> **After pulling a schema change, restart `next dev`.** A running dev server
> caches the generated Prisma client, and a stale one reads the new tables with
> the old column layout — which surfaces as
> `Inconsistent column data` at request time even though the database is fine.

Then open http://localhost:3000, and the admin at http://localhost:3000/admin.

### Environment

`.env` holds the four values the app reads:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file location |
| `ADMIN_USERNAME` | Admin login (defaults to `admin`) |
| `ADMIN_PASSWORD` | Admin login — **change before deploying** |
| `ADMIN_SESSION_SECRET` | HMAC key for the admin session cookie |

## What's here

**Public**

- `/` — category tabs, a sort row, the tile grid, and the submission box.
  The page lands on **Just In**, newest listing first. Each tile shows the mint date/time, collection supply and
  price, and links out to the collection's website, X, Discord, Telegram and
  OpenSea. Clicking a tile records a trending click and opens the collection's
  site (falling back to X, then OpenSea); the icons open their own targets.
- `/past` — the archive table.
- A **love** button on every tile, so you can see which upcoming mints people
  love most. One love per browser per collection, so the number is how many
  people love that mint rather than how many clicks it got; clicking again
  takes it back. Counts also show in the archive and in both admin tables.
- Light and dark themes, toggled in the header and remembered per browser;
  with no stored choice the site follows the OS setting.

**Admin** (password-protected, guarded by [proxy.ts](proxy.ts) *and* re-checked
inside every server action)

- `/admin` — visitor counts (today / 7d / 30d / all-time), online-now, per-chain
  totals, the pending queue, and the trending control with live click counts.
- `/admin/collections` — add, edit, archive and delete collections; logo upload
  or image URL.

## How a few things work

**Upcoming → Past is automatic.** `syncMintStatuses()` in
[lib/queries.ts](lib/queries.ts) runs on every read: exact-time mints archive at
their mint time, date-only mints at the end of their day, and `mintAt = null`
(TBA) never archives. No cron job.

**Tabs and sorting.** Five tabs, defined in [lib/constants.ts](lib/constants.ts):

| Tab | What it shows |
| --- | --- |
| Trending | everything, ranked by pins + clicks (its own order, so the sort row is hidden) |
| Just In | everything, newest listing first — the landing tab |
| GameFi / PFP / Art | the collections filed under that category |

The sort row under the tabs has `Latest added` (default), `Mint date` (soonest
first, undated mints last) and `TBA`, which also narrows the list to collections
with no confirmed date. Categories are content types, not chains — Arc is the
only chain, so it is a constant rather than a per-collection field.

**Trending order.** `orderTrending()` in [lib/format.ts](lib/format.ts) seats
pinned collections in their 1-based slot and fills every remaining slot by click
count. Duplicate or out-of-range pins cascade to the next free slot rather than
dropping a collection.

**Visitor stats.** The homepage pings `/api/ping`, which upserts one `Visitor`
row per browser cookie. "Online now" is a `lastSeen` window of five minutes.

**Logos from X.** If a collection is saved with an X handle but no logo, that
account's profile picture is used. Two resolvers are tried in order:

1. **X API v2** (`GET /2/users/by/username`), when `X_BEARER_TOKEN` is set.
   App-only Bearer Token — the consumer key/secret only mint that token and are
   never sent by the app. Needs an X plan whose access level includes that
   endpoint; a 401/403 is logged with that hint.
2. **[unavatar.io](https://unavatar.io)**, which needs no key but allows only 25
   anonymous requests per day per IP.

[lib/x-avatar.ts](lib/x-avatar.ts) therefore keeps a persistent memory of every
lookup in the `XAvatar` table:

| Remembered | Behaviour |
| --- | --- |
| hit | image written to `public/uploads/x` once, served locally forever after |
| miss | remembered for 7 days, so a handle with no avatar cannot re-spend the daily quota on every page view |
| rate-limited / network error | **not** remembered — these are transient, and retry once the quota resets |

Either resolver feeds the same memory. Both the admin preview and the save path
read through `/api/x-avatar/<handle>`,
so a handle costs **at most one upstream request for the life of the app**, the
browser never talks to the resolver directly, and a tile keeps working if the
resolver is down. Set `UNAVATAR_API_KEY` (an unavatar.io key sent as the
`x-api-key` header — *not* an X/Twitter credential) to raise the limit, or swap
the resolver in that one file. If a lookup does fail, the admin form says why —
rate-limited vs. no such avatar — rather than failing silently.

**Images live in the database.** A serverless host unpacks the app read-only —
there is no disk to write to at runtime — so uploaded logos and cached X avatars
are stored as rows in the `Asset` table by [lib/assets.ts](lib/assets.ts) and
served by `/api/asset/[id]`. Ids are random and bytes never change, so responses
are `immutable` and the CDN answers almost every request. Logos are capped at
2 MB.

## Deploying

`npm run build` runs `prisma generate && prisma migrate deploy && next build`.

- **`migrate deploy`, never `db push`.** `db push` force-matches the database to
  the schema and will drop columns and data to do it — on every deploy.
  `migrate deploy` applies only pending migrations and never destroys data.
- **`generate` is explicit** because `node_modules` is cached between builds, so
  a schema change would otherwise ship against a stale client.

**Adopting migrations on a database created with `db push`:** that database has
no `_prisma_migrations` table, so `migrate deploy` will try to create tables that
already exist and fail. Once, against an empty database:

```bash
DATABASE_URL="<your production url>" npm run db:baseline
```

That drops and recreates the schema through the migration history. It is
destructive — only run it while the database has no data you care about.
