# Blockwise

Small blocks add up. A calm productivity tracker: create reusable, color-coded categories, time your work with a stopwatch or countdown, and see your day as a timeline of colored blocks.

Built with Next.js (App Router, TypeScript, Tailwind CSS) and Supabase (Postgres + Auth), deployed on Vercel.

**Live site:** https://blockwise-three.vercel.app

## Project status

| Milestone | Status |
| --- | --- |
| 1. Setup: repo, Next.js app, Vercel, Supabase tables | Done |
| 2. Accounts | Done |
| 3. Categories | Done |
| 4. Timer | Done |
| 5. Time log | Done |
| 6. Day timeline | Done |
| 7. Polish and test | Polish done; user testing in progress |

## Local setup

Requires Node.js 20 or newer.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a free project at [supabase.com](https://supabase.com).
3. In Supabase, open **SQL Editor → New query**, and run each file in `supabase/migrations/` in order (`0001_init.sql`, `0002_countdown_seconds.sql`, then `0003_calm_focus_palette.sql`). This creates the `profiles`, `categories` and `time_entries` tables with row-level security.
4. Copy the env template and fill in your project URL and publishable key from **Project Settings → API**:

   ```bash
   cp .env.example .env.local
   ```

5. Start the dev server and open http://localhost:3000:

   ```bash
   npm run dev
   ```

Until step 4 is done the app still runs, showing a "Supabase isn't connected yet" notice.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New → Project** and import the repo. The Next.js preset needs no changes.
3. Under **Settings → Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production and Preview.
4. Every push to `main` deploys to production; every pull request gets a preview URL.
5. In Supabase **Authentication → URL Configuration**, add your Vercel domain as the Site URL so login redirects work.

## Project structure

```
src/
  app/
    page.tsx              Landing page
    login/, signup/       Log in and sign up
    auth/                 Auth server actions + email confirmation callback
    (app)/                Logged-in pages, protected by src/proxy.ts
      dashboard/          Timer: stopwatch, countdown, pause/resume
      categories/         Create, edit, archive categories
      timeline/           Day view: color-coded timeline, category totals, time log
  components/             Shared UI
  lib/
    supabase/             Browser, server and proxy Supabase clients
    types.ts              Row types matching the database
  proxy.ts                Refreshes the auth session; redirects logged-out users
supabase/migrations/      Database schema (run in the Supabase SQL Editor)
```

## Data model

- **categories**: name, description, color, archived flag.
- **time_entries**: category, `started_at`, `ended_at` (null while a timer runs), mode (`stopwatch` or `countdown`), planned seconds (countdowns), note.

The database itself blocks overlapping entries and allows only one running timer per user.
