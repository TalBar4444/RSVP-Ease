# RSVP-Ease ✉️🎉

A mobile-first RSVP app for **Tal & Shaked’s wedding** (29.10.2026, Badolina, Ra’anana). Guests confirm over a personal invite link — no password. Admins manage the list, send WhatsApp/SMS invites, and track headcount.

Built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## 🚀 Key Features

### Guest
- **Personal invite links** (`/rsvp/<guest-uuid>`) — the UUID is the capability; no login.
- **Hebrew, mobile-first RSVP** — attending / not attending, adult and child counts, dietary needs (vegetarian, vegan, gluten-free, free-text allergies).
- **Home page** (`/`) reminds guests to use the WhatsApp link they were sent.

### Admin (`/admin`)
- **Email/password login** (Supabase Auth) with optional “remember me”. Access is limited to users listed in `admin_users`. Open admin sessions stay in sync over Realtime.
- **KPIs** — confirmed headcount, adults vs children, pending replies, dietary totals.
- **Guest list** — filter by status, edit guest details (name, phone, group, RSVP, counts, dietary) in a dialog, delete guests.
- **Add a guest** and send their invite via **WhatsApp**, **SMS**, or copied link.

### Platform
- Guests load and submit through `get_guest` / `submit_rsvp` RPCs; they cannot query the `guests` table directly.
- Excel import of names, phones, and groups for the initial list.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Router, Tailwind CSS (v4)
- **Backend-as-a-Service:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Deployment:** Vercel (SPA rewrites in `vercel.json`)

---

## 📂 Project Structure

```text
RSVP-Ease/
├── .github/workflows/ci.yml    # Lint, build, npm/Snyk audit, pgTAP
├── public/                     # Logos
├── scripts/import-guests.ts    # Excel → Supabase (service role)
├── src/
│   ├── components/
│   │   ├── admin/              # Login, dashboard, guest list, edit dialog, invites
│   │   └── guest/              # RSVP form and wedding chrome
│   ├── hooks/                  # Shared UI hooks (dialog focus trap)
│   ├── lib/                    # Supabase client, RPCs, invites, KPIs
│   ├── pages/                  # Home
│   ├── theme/                  # Colors, date, venue
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── config.toml             # Local stack (required for `supabase start`)
│   ├── seed.sql                # Synthetic guests for local reset only
│   ├── migrations/             # Canonical schema + historical markers
│   ├── tests/database/         # pgTAP RLS / RPC tests
│   └── snippets/               # Manual DEV SQL (not applied by db reset)
├── data/README.md              # Where to put guest_list.xlsx (file is git-ignored)
├── vercel.json                 # Client-route rewrites
├── .env.example                # Frontend public env
└── .env.import.example         # Import-script secret env (no VITE_ keys)
```

Git-ignored (do not commit): `.env*` except the `*.example` files, `data/guest_list.xlsx` and other spreadsheets under `data/`, `supabase/.temp/` (CLI cache and start secrets), `supabase/.branches/`, `.vercel`, `node_modules`, `dist`, and database dumps (`*.dump`, `/backups/`).

## ⚙️ Local setup

1. **Prerequisites** — Node.js 22 (matches CI). Docker Desktop if you want the local Supabase database, tests, and `db reset`.

2. **Install**

```bash
cd RSVP-Ease
npm install
```

3. **Environment** — copy `.env.example` to `.env.development` for local work against **rsvp-db-dev** (git-ignored). For production Supabase, use `.env.production` locally when running the import script only:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

Optional. Production origin for invite links (otherwise the current browser origin is used):

```
VITE_PUBLIC_SITE_URL=https://your-production-domain.com
```

For the Excel import script only, also set the service role key in the matching env file. **Never** prefix it with `VITE_` — Vite would expose it to the browser:

```
SUPABASE_SECRET_KEY=sb_secret_your-key
```

Set `VITE_*` on Vercel: **Preview** → dev Supabase; **Production** → prod Supabase. Always set `VITE_PUBLIC_SITE_URL` on Production.

4. **Dev server** — `--host` lets you open the app from a phone on the same network:

```bash
npm run dev -- --host
```

| Route | What |
|---|---|
| `/` | Home — “use your personal WhatsApp link” |
| `/rsvp/<guest-uuid>` | Guest RSVP form |
| `/rsvp/preview` | Dev-only mock form (no database) |
| `/admin` | Admin dashboard (login required) |

Other scripts: `npm run build`, `npm run preview`, `npm run lint`, `npm run security` (npm audit + Snyk), `npm run db:reset` / `db:test` / `db:lint` (local Supabase; Docker required).

## 🗄️ Database access model

Schema and policies live in `supabase/migrations/`. Apply migrations to a **new empty** Supabase project using `supabase db push`:

1. `20260903000000_rsvp_schema.sql` — canonical schema (creates `public.guests`, RLS policies, RPCs, and `public.import_guests(jsonb)`).
2. `20260827123924_access_control_admin_users.sql` — historical marker (no-op).
3. `20260831080526_guests_constraints_and_grants.sql` — historical marker (no-op).

The existing `rsvp-db-dev` project may have older migration history. For production, always run migrations via `supabase db push` (CLI workflow), not manual SQL Editor execution.

### Validating migrations locally

Before promoting any migration, verify it replays on a **local** empty database (Docker required):

```bash
npx supabase start
npx supabase db reset --local
npm run db:test
npm run db:lint
```

`db reset --local` also loads `supabase/seed.sql` (synthetic guests only). CI runs the same pgTAP tests and `db lint` after `supabase db start`. Guest `updated_at` is maintained by trigger `guests_set_updated_at` on every update (admin edits and `submit_rsvp`). Admin delete stays a confirmed hard delete.

**Never run** `supabase db reset --linked`, `supabase db reset --project-ref …`, or any remote `TRUNCATE` / `DROP TABLE` against production. `--linked` would wipe the linked cloud database.

### Local / DEV synthetic data

`supabase/seed.sql` is fake guests for local `db reset`. It is not the real invite list. The spreadsheet under `data/` remains the source of truth and stays git-ignored.

**rsvp-db-dev** currently uses that same seven-row synthetic set. The previous DEV rows were copied to `public.guests_dev_backup_20260903` (246 rows) before the replace. Do not run that replace on production. The SQL used is in `supabase/snippets/replace-dev-guests-with-synthetic.sql` (file still ends in `ROLLBACK` so it is not a one-click wipe).

Smoke-test against DEV (with `.env.development` pointing at rsvp-db-dev):

| Path | Fixture |
|---|---|
| `/rsvp/11111111-1111-4111-8111-111111111111` | pending |
| `/rsvp/22222222-2222-4222-8222-222222222222` | attending |
| `/rsvp/33333333-3333-4333-8333-333333333333` | declined |

| Who | Access |
|---|---|
| Guest (`anon`) | No direct table access. Load/submit through `get_guest` / `submit_rsvp` with the invite UUID. |
| Admin | Supabase Auth email/password. Row access only if `auth.uid()` exists in `admin_users`. |
| Import script | `SUPABASE_SECRET_KEY` in `.env.import.*` (not in any Vite env). Imports via `public.import_guests(jsonb, boolean)` RPC. |

### Production backup and recovery (when real RSVPs exist)

Supabase already takes daily backups on paid plans and point-in-time recovery (PITR) on higher plans. Treat `public.guests` and `auth.users` / `admin_users` as the restore-critical data.

Before a risky migration: `supabase db dump` (or dashboard backup) of the production project, keep the dump off-repo, then apply with `supabase db push` only after local `db reset --local` and `npm run db:test` pass.

If guests are deleted or corrupted: restore `public.guests` from the latest backup or PITR to a time before the incident. Do not re-import the spreadsheet over existing RSVP rows — import only inserts, but a preceding truncate would destroy responses. Recover deleted rows from backup, not by guessing UUIDs.

Commands that must never run against production: `supabase db reset --linked`, `DROP TABLE public.guests`, `TRUNCATE public.guests`, broad `DELETE FROM public.guests` without a reviewed `WHERE`, and `import_guests` with `--allow-non-empty` unless appending is intentional.

### Add admin users

1. In Supabase: **Authentication → Users → Add user**. Use a real email and password. Enable **Auto Confirm User**.
2. Grant dashboard access:

```sql
insert into public.admin_users (user_id)
select id from auth.users
where email in ('first-admin@example.com', 'second-admin@example.com')
on conflict (user_id) do nothing;
```

Repeat for every admin. Creating an Auth user is not enough on its own.

### Import guests

Place the Excel file at `data/guest_list.xlsx` (git-ignored).

**Every non-empty row after the header is imported.** Completely empty rows are skipped. Missing phone, name, or group values are warnings only — nothing is filtered out. You decide what to fix in the admin dashboard afterward.

Dry-run (validates the spreadsheet only — **no database connection is made**):

```bash
npm run import-guests -- --target development --project-ref <dev-project-ref>
npm run import-guests -- --target production --project-ref <prod-project-ref>
```

Execute once against an **empty** prod `guests` table (project ref is the subdomain in your Supabase URL, e.g. `abcdefghijklmnop`):

```bash
npm run import-guests -- --target production --execute --project-ref <project-ref>
```

The script stops if the target table already has rows unless you pass `--allow-non-empty` (append every spreadsheet row — use with care).

Expected columns (Hebrew or English headers): name (`שם המוזמן`), phone (`הנייד`), group (`שיוך לקבוצה`).

## Security

- The browser client uses only the publishable key (`VITE_SUPABASE_PUBLISHABLE_KEY`).
- Never put `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) in any `VITE_` variable.
- Keep separate Supabase projects for development and production.
- Guest invite UUIDs are unguessable; they are still secrets — do not publish the full guest list of links.
- Spreadsheets under `data/` contain names and phone numbers and are git-ignored.

### CI

GitHub Actions (`.github/workflows/ci.yml`) on `dev` and `main`:

- **lint-and-build** — `npm run lint`, `typecheck`, `build`, `security:audit`, `security:snyk`
- **database** — `supabase db start`, `supabase test db` (pgTAP), `supabase db lint`, `db advisors` (fails on error, not on INFO)

### Dependency scanning

Snyk authentication is **not** stored in the repository. Create a [Snyk account API token](https://docs.snyk.io/snyk-cli/authenticate-to-use-the-cli) and add it as a **repository secret** named exactly:

```text
SNYK_TOKEN
```

The workflow reads it as `${{ secrets.SNYK_TOKEN }}`. Without that secret, the Snyk CI step fails (expected). Locally, run `npx snyk auth` once, or set `SNYK_TOKEN` in your shell; do not commit the token.

Known Snyk false positives for SheetJS `xlsx@0.20.3` (CDN build) are ignored in `.snyk` until 2026-12-31.
