# RECO LIB — Next-Gen Library Ecosystem

A minimal, modern **library management system** built for schools, with ISBN-barcode-based book issuing, returning, and tracking. Students interact through a touch-enabled **Kiosk**, while admins manage the ecosystem from a secure **Admin Dashboard** backed by Supabase.

![Stack](https://img.shields.io/badge/React%2019-61DAFB?logo=react&logoColor=black) ![Stack](https://img.shields.io/badge/Vite%206-646CFF?logo=vite&logoColor=white) ![Stack](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Stack](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=black) ![Stack](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Environment Variables](#environment-variables)
  - [Database Setup (Supabase)](#database-setup-supabase)
- [Usage Guide](#usage-guide)
  - [Student Kiosk](#student-kiosk)
  - [Admin Panel](#admin-panel)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [How the Flows Work](#how-the-flows-work)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **QR-Code Scanning** — Issue/return books by scanning a QR label with the camera (or typing the 4-digit code manually).
- **Student Self-Service Kiosk** — Students check availability, register themselves, and issue books without staff.
- **Admin Dashboard** — Asset directory with folder-style categories, add/delete books, generate & download QR codes, pending-return approval queue, and overdue tracking.
- **Secure Admin Auth** — Protected via Supabase Auth (email + password).
- **Real-time Database** — Powered by Supabase (Postgres) with Row-Level Security policies.
- **Dark/Light mode** — Automatically follows the system preference.

---

## Architecture

```
┌───────────────────────┐        ┌──────────────────────────┐
│   Student Kiosk (/)   │        │   Admin Dashboard (/admin)│
│   React + QR Scanner  │        │   Supervised by Auth       │
└───────────┬───────────┘        └─────────────┬──────────────┘
            │                                  │
            └────────────────┬─────────────────┘
                             ▼
                    ┌──────────────────┐
                    │     Supabase     │
                    │  Postgres + RLS  │
                    │  Auth (GoTrue)   │
                    └──────────────────┘
```

- **Public Kiosk** — anonymous (anon role), allowed to read books, register students, create transactions, and flip book status.
- **Admin** — authenticated (authenticated role) with full CRUD on all tables.

---

## Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Frontend   | React 19, React Router 7, TypeScript              |
| Build      | Vite 6                                            |
| Styling    | Tailwind CSS (CDN) + custom CSS animations        |
| UI Icons   | lucide-react                                      |
| QR         | `html5-qrcode` (scanning), `qrcode.react` (generation) |
| Backend    | Supabase (PostgreSQL, Auth, RLS)                  |

---

## Getting Started

### Prerequisites

- **Node.js** v20+ (developed/tested on v26)
- **npm** or your favorite package manager
- A **Supabase** project (free tier is fine)
- A device with a **camera** for QR scanning (or just use manual entry)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/rawenergon/recolib.git
cd recolib

# 2. Install dependencies
npm install

# 3. Configure environment variables (see below)
#    Copy .env.example -> .env.local and fill in values

# 4. Start the dev server
npm run dev
```

Open **http://localhost:3000** — the kiosk loads immediately. The admin panel is at **http://localhost:3000/admin**.

### Environment Variables

Create a file named **`.env.local`** at the project root. A template with fake placeholders is provided at **`.env.example`** — never commit real secrets.

```env
# Google Gemini API key (optional placeholder)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase project URL
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

# Supabase publishable / anon key (safe for browsers)
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key_here
```

> Only variables prefixed with `VITE_` are exposed to the browser. `GEMINI_API_KEY` is injected at build time via `vite.config.ts` — if unused, a placeholder is fine.

### Database Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run `schema.sql` (included in the repo). It creates:
   - `books`, `students`, `transactions` tables
   - Indexes for lookups
   - Row-Level Security policies for both kiosk (public) and admin (authenticated) access
3. Create an **admin auth user**:
   - **Dashboard → Authentication → Users → Add user**, or
   - Use the SQL below (sets the password with a bcrypt hash):
     ```sql
     INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
       email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
       confirmation_token, recovery_token, email_change_token_new, email_change_token_current)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
       'authenticated', 'authenticated', 'admin@recolabs.system',
       crypt('YOUR_PASSWORD', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

     INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id,
       last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), (SELECT id FROM auth.users WHERE email = 'admin@recolabs.system'),
       jsonb_build_object('sub', (SELECT id::text FROM auth.users WHERE email = 'admin@recolabs.system'), 'email', 'admin@recolabs.system'),
       'email', 'admin@recolabs.system', now(), now(), now());
     ```
4. Get your project URL and publishable key from **Project Settings → API** and put them in `.env.local`.

---

## Usage Guide

### Student Kiosk

1. Landing page offers two paths: **ISSUE RESOURCE** or **RETURN RESOURCE**.
2. **ACTIVATE SCANNER** to open the camera, or type the 4-digit ID code manually.
3. **Issuing:**
   - If the book is available, the kiosk asks for a **Student ID**.
   - On a first visit, the student registers with **Name / Email / Phone**.
   - The book is marked `ISSUED` and a transaction is created (`ACTIVE`).
4. **Returning:**
   - Scanning an issued book logs the return timestamp.
   - The book moves to the admin **Review Queue** — it does *not* come back to the pool automatically.

### Admin Panel

| Tab            | Purpose                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| Asset Directory| Browse books grouped by category folder; search; add/delete books; generate & download QR labels |
| Review Queue   | Verify physically returned books and confirm returns (releases the book back to the pool) |
| Overdue Logs   | Books out for more than 10 days                                          |

Stats header shows: books currently issued, pending returns, overdue items, and total assets.

---

## Project Structure

```
recolib/
├── index.html            # HTML entry (Tailwind CDN, fonts, meta)
├── index.css             # Global styles + animation utilities
├── index.tsx             # React bootstrap
├── App.tsx               # Routing + auth session management
├── types.ts              # Shared TypeScript types
├── schema.sql            # Supabase schema + RLS policies
├── vite.config.ts        # Vite config (port 3000, env injection)
├── tsconfig.json
├── .env.example          # Environment template (placeholders only)
├── .env.local            # Your real secrets (gitignored)
├── components/
│   ├── Icons.tsx         # Icon library (lucide-react + logo)
│   └── Scanner.tsx       # Html5QrcodeScanner overlay
├── services/
│   ├── supabaseClient.ts # Supabase client bootstrap
│   └── dbService.ts      # All DB operations (books/students/transactions)
└── views/
    ├── StudentKiosk.tsx  # Public kiosk UI + flow state machine
    ├── AdminDashboard.tsx# Admin UI (directory, queue, overdue, modals)
    └── DocsPage.tsx      # In-app documentation
```

---

## Database Schema

```sql
books        (id, created_at, title, category, unique_code UNIQUE, status)
students     (id, student_id UNIQUE, name, email, phone, created_at)
transactions (id, book_id -> books, student_internal_id -> students,
              issue_date, return_date, status)
```

Statuses:
- `books.status`: `AVAILABLE` | `ISSUED`
- `transactions.status`: `ACTIVE` | `RETURNED`

---

## How the Flows Work

1. **Add book (admin)** → row in `books` (status `AVAILABLE`) → print the QR label.
2. **Issue (kiosk)** → anon key: creates `transactions` row (`ACTIVE`) → flips book to `ISSUED`.
3. **Return (kiosk)** → anon key: sets `return_date` on the active transaction (status stays `ACTIVE` — pending review).
4. **Approve (admin)** → sets transaction `RETURNED` + book back to `AVAILABLE`.
5. **Overdue** → any `ACTIVE` transaction older than 10 days with no `return_date`.

---

## Deployment

This is a static Vite SPA — deploy to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages).

```bash
npm run build   # outputs to dist/
```

Build output: `dist/` — upload it to your host. Remember to configure the same `VITE_*` env vars on the host.

---

## Troubleshooting

| Problem                          | Fix                                                              |
| -------------------------------- | ---------------------------------------------------------------- |
| `spawn ENOENT` on npm run/install| Your `ComSpec` env var is broken; set `C:\Windows\System32\cmd.exe` or `NPM_CONFIG_SHELL=cmd.exe` |
| `500: Database error querying schema` at login | The admin user in `auth.users` has a `NULL` token column; set `email_change`/token columns to `''` |
| Kiosk can't update book status   | RLS: run `schema.sql` — the public `UPDATE` policy on `books` must exist |
| Camera not opening               | HTTPS (or localhost) required + browser camera permissions; try manual code entry |
| "Code might be duplicate" when adding | `unique_code` is UNIQUE — use a different 4-digit code |

---

## License

Private / educational use — RECO LIB.