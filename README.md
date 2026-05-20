# RSVP-Ease ✉️🎉

A modern, professional, and mobile-first RSVP management system designed to simplify wedding and event guest confirmations. Built with a serverless architecture using React, TypeScript, Vite, Tailwind CSS, and Supabase.

The application allows guests to respond securely via a personalized unique link received on WhatsApp, without requiring a traditional username/password authentication flow.

## 🚀 Key Features

- **Mobile-First Design:** Tailored specifically for flawless mobile experience since 95% of guests open invitations via smartphones.
- **Personalized Access:** Secure token/ID-based access (`?id=guest-uuid`) that instantly identifies the guest and fetches their specific metadata.
- **Advanced RSVP Form:** Dynamically toggles attendance states, adult/child guest counters, and discrete dietary requirements (Vegetarian, Vegan, Gluten-Free, and custom allergies).
- **Serverless & Secure:** Direct communication with the Database handled securely via Supabase client, guarded by strict Row Level Security (RLS) policies.
- **Production-Ready Tech Stack:** TypeScript for type safety, Vite for ultra-fast bundling, and Tailwind CSS for rapid modern styling.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (v4)
- **Backend-as-a-Service:** Supabase (PostgreSQL, Row Level Security)
- **Deployment & CI/CD:** Vercel

---

## 📂 Project Structure

```text
RSVP-Ease/
├── .github/              # GitHub configurations
├── src/
│   ├── lib/              # Third-party service configurations
│   │   └── supabaseClient.ts
│   ├── App.tsx           # Main application router and RSVP form core
│   ├── index.css         # Tailwind injection point
│   └── main.tsx
├── .env.development      # Local environment secrets (Git-ignored)
├── .gitignore            # Security filters for sensitive configuration
├── index.html
├── package.json
├── postcss.config.js     # PostCSS engine configurations
└── tailwind.config.js    # Tailwind configuration mapping

## ⚙️ Local Setup Instructions
Follow these instructions to spin up the development environment on your local machine:

1. Prerequisites
Ensure you have Node.js installed (v18+ recommended).

2. Clone and Install Dependencies

# Navigate to your project root folder
cd RSVP-Ease

# Install all node framework engines
npm install

3. Setup Environment Variables
Create a file named .env.development in the root directory (the file is already declared inside .gitignore to prevent data leakage to GitHub):

VITE_SUPABASE_URL=[https://your-supabase-project-id.supabase.co](https://your-supabase-project-id.supabase.co)
VITE_SUPABASE_ANON_KEY=your-public-anon-publishable-key-here

4. Run Development Server
Run Vite with the --host flag to safely expose the server to your local network, enabling live responsive testing directly on your mobile device

npm run dev -- --host

## 🗄️ Database Schema & RLS Setup
Execute the following migration block inside the Supabase SQL Editor to establish the architecture of your data pipeline and seal its communication layer with proper RLS constraints:

-- 1. Table Blueprint Creation
create table guests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  phone text,
  status text default 'pending' not null,       -- pending, attending, declined
  guests_count integer default 0 not null,      -- total adult count
  children_count integer default 0 not null,    -- total children count
  
  -- Culinary Tag Mapping
  is_vegetarian boolean default false not null,
  is_vegan boolean default false not null,
  is_gluten_free boolean default false not null,
  
  -- Flexible text field for custom allergies/notes
  other_dietary_notes text
);

-- 2. Enable Row Level Security Protection Layer
alter table guests enable row level security;

-- 3. Security Access Protocols
create policy "Allow anonymous select by ID" 
on guests for select 
to anon 
using (true);

create policy "Allow anonymous update by ID" 
on guests for update 
to anon 
using (true)
with check (true);

##🔒 Security Best Practices
Environment Separation: Always maintain separate Supabase projects for Development (dev) and Production (prod).

Secret Keys: Never put your service_role or database direct root passwords anywhere on the client-side codebase.

Implicit Filters: Client queries must strictly filter requests by explicit conditional statements (.eq('id', guestId)) to respect individual data isolation boundaries enforced by the system layout.