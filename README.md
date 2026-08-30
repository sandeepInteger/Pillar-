# Pillar — Phase 1

Pillar is a construction company management platform (Phase 1: People master).

**Stack:** Next.js 15 · Supabase · Tailwind CSS

## Features (Phase 1)

- Admin & Engineer login (Supabase Auth)
- Employee records: Labour, Foreman, Engineer, Staff, Founder
- Multiple phone numbers per employee
- UPI + bank payment details for salary
- Photo upload (Supabase Storage)
- Dashboard with workforce counts
- Card-based UI inspired by construction management dashboards
- **Google Sheets sync** (optional): auto-sync employees on add/edit/delete
- **Attendance** (Phase 2): daily half / full / double shift grid with man-day totals

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project
2. Copy **Project URL** and **anon key** from Settings → API

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase URL and anon key in `.env.local`.

### 4. Run database migration

Open **Supabase SQL Editor** and run the full contents of:

```
supabase/migrations/001_phase1.sql
```

This creates tables, RLS policies, storage bucket, and triggers.

Also run (in order):

```
supabase/migrations/002_fix_profiles_rls.sql
supabase/migrations/003_attendance.sql
supabase/migrations/004_projects.sql
```

### 5. Create users

In Supabase Dashboard → **Authentication → Users → Add user**:

| User | Role setup |
|---|---|
| Founder (Admin) | After signup, run in SQL Editor: `update profiles set role = 'admin' where id = '<user-uuid>';` |
| Engineer | Default role is `engineer` on signup |

Or sign up via API with metadata:

```json
{ "role": "admin", "full_name": "Founder Name" }
```

### 6. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

## Google Sheets sync (optional)

Keep a live copy of employee data in Google Sheets for the founder to view/share.

### How it works

| Event | What happens |
|---|---|
| Add employee | New row appended to sheet |
| Edit employee | Row updated (matched by Employee Code) |
| Delete employee | Row cleared |
| **Sync to Google Sheet** button (Admin) | Full re-sync of all employees |

**Direction:** App → Google Sheet (Supabase remains the source of truth).

### Setup steps

1. **Create a Google Sheet** with a tab named exactly `Employees`

2. **Google Cloud Console** → [console.cloud.google.com](https://console.cloud.google.com)
   - Create project (or use existing)
   - Enable **Google Sheets API**
   - **IAM → Service Accounts** → Create service account
   - Keys → Add key → JSON → download

3. **Share the sheet** with the service account email (Editor access)  
   e.g. `pillar-sync@your-project.iam.gserviceaccount.com`

4. **Add to `.env.local`:**

```env
GOOGLE_SHEET_ID=abc123xyz          # from sheet URL: docs.google.com/spreadsheets/d/SHEET_ID/edit
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@....iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Copy `private_key` from JSON into `GOOGLE_PRIVATE_KEY` (keep quotes and `\n`).

5. Restart `npm run dev`. Admin will see **Sync to Google Sheet** on `/people`.

### Sheet columns (auto-created)

Employee Code, ID, Name, Type, Designation, Status, dates, address, phones, payment, emergency, PAN, notes, photo URL, updated at.

## Project structure

```
src/
├── app/
│   ├── (dashboard)/     # Protected pages
│   │   ├── page.tsx     # Dashboard
│   │   └── people/      # Employee CRUD
│   └── login/
├── components/
│   ├── layout/          # Sidebar, PageHeader
│   └── people/          # EmployeeCard, Form, PhotoUpload
├── lib/
│   ├── actions/         # Server actions
│   ├── queries/         # Data fetching
│   └── supabase/        # Client helpers
└── types/
supabase/migrations/     # SQL schema
```

## Roles

| Role | Access |
|---|---|
| **admin** | Full CRUD, delete employees |
| **engineer** | Add/edit/view employees |

## Phase 2 (next)

- Projects & site assignment
- Weekly attendance entry
- Daily rates → payroll calculation

## Scripts

```bash
npm run dev      # Development
npm run build    # Production build
npm run start    # Production server
```
