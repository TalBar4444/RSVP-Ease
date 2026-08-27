# RSVP-Ease ✉️🎉

A mobile-first RSVP app for **Tal & Shaked’s wedding** (29.10.2026, Badolina, Ra’anana). Guests confirm over a personal invite link — no password. Admins manage the list, send WhatsApp/SMS invites, and track headcount.

Built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## 🚀 Key Features

### Guest
- **Personal invite links** (`/rsvp/<guest-uuid>`) — the UUID is the capability; no login.
- **Hebrew, mobile-first RSVP** — attending / not attending, adult and child counts, dietary needs (vegetarian, vegan, gluten-free, free-text allergies).
- **Home page** (`/`) reminds guests to use the WhatsApp link they were sent.

### Admin (`/admin`)
- **Email/password login** (Supabase Auth) with optional “remember me”. Access is limited to users listed in `admin_users`.
- **KPIs** — confirmed headcount, adults vs children, pending replies, dietary totals.
- **Guest list** — filter by status, edit group affiliation, delete guests.
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
├── public/                     # Logos
├── scripts/import-guests.ts    # Excel → Supabase (service role)
├── src/
│   ├── components/
│   │   ├── admin/              # Login, dashboard, list, invites
│   │   └── guest/              # RSVP form and wedding chrome
│   ├── lib/                    # Supabase client, RPCs, invites, KPIs
│   ├── pages/                  # Home
│   ├── theme/                  # Colors, date, venue
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── supabase/migrations/        # Access-control SQL
├── vercel.json                 # Client-route rewrites
└── .env.example
```

## ⚙️ Local setup

1. **Prerequisites** — Node.js 18+.

2. **Install**

```bash
cd RSVP-Ease
npm install
```

3. **Environment** — copy `.env.example` to `.env.development` (git-ignored):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

Optional. Production origin for invite links (otherwise the current browser origin is used):

```
VITE_PUBLIC_SITE_URL=https://your-production-domain.com
```

For the Excel import script only, also set the service role key. **Never** prefix it with `VITE_` — Vite would expose it to the browser:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Set the same `VITE_*` variables in the Vercel project for production.

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

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

## 🗄️ Database access model

Schema and policies live in `supabase/migrations/`. The live project already has the `guests` table; access control is in `20260827_access_control.sql`.

| Who | Access |
|---|---|
| Guest (`anon`) | No direct table access. Load/submit through `get_guest` / `submit_rsvp` with the invite UUID. |
| Admin | Supabase Auth email/password. Row access only if `auth.uid()` exists in `admin_users`. |
| Import script | Service role key on your machine. Bypasses RLS to insert guests. |

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

Place the Excel file at `data/guest_list.xlsx` (git-ignored) and run:

```bash
npm run import-guests
```

Expected columns (Hebrew or English headers): name (`שם המוזמן`), phone (`הנייד`), group (`שיוך לקבוצה`).

## Security

- The browser client uses only the publishable anon key.
- Never put `service_role` or any `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_` variable.
- Keep separate Supabase projects for development and production.
- Guest invite UUIDs are unguessable; they are still secrets — do not publish the full guest list of links.
- Spreadsheets under `data/` contain names and phone numbers and are git-ignored.
