# OrganizAI

> Personal project. Published openly because I like the idea of leaving my work
> readable in public, not because I'm looking for contributions. The live
> instance on GitHub Pages is mine — my data, my account. Feel free to read
> the code, fork it, learn from it, build your own version if it helps.

A couples organizer my girlfriend and I use every day: movies, series, date
ideas, photo murals, love letters, beauty wishlist, expenses and savings
goals — all in one app instead of scattered spreadsheets.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)

## What's inside

- **Movies / Series** — TMDB search with director and cast, Netflix-style
  carousels by status, personal rating, dynamic genre filters. Series have
  season / episode tracking.
- **Dates** — Ideas with address, scheduled date/time, weather, Google Maps
  link, and status lifecycle (idea → scheduled → done).
- **Mimos** — beauty / skincare / accessory wishlist with "own / want / ran
  out" status, product photos uploaded from the phone, user-defined categories.
- **Gallery** — photo murals with four layouts (masonry, asymmetric mosaic,
  Polaroid collage, uniform grid), cover picker, drag-to-reorder, full-screen
  lightbox.
- **Letters** — cartinhas with moods (declaration, saudade, apology, etc.),
  reader/composer flow in serif editorial type.
- **Expenses / Goals** — monthly dashboard with category pie chart; savings
  goals with a deposit timeline and trash-to-undo per deposit.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript (strict) + Vite 8 |
| UI | Tailwind CSS v4 + shadcn/ui, Framer Motion, Fraunces + Inter |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Proxy | Cloudflare Worker (optional, used only when a network blocks `*.supabase.co`) |
| External API | TMDB |
| Hosting | GitHub Pages via GitHub Actions |

## Running your own instance

This repo **contains no private data, no credentials, no databases**. The
only identifying surface left is what Vite bakes into the public bundle at
build time — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — which are
public by design on the Supabase model (security comes from RLS, not from
hiding these values).

If you want to spin up a version for yourself:

1. Fork and clone the repo.
2. `cp .env.example .env.local` and fill in **your** credentials.
3. Create a free Supabase project, open SQL Editor, paste the content of
   [`supabase/schema.sql`](supabase/schema.sql) and run it. It will create
   all tables, RLS policies, indexes, triggers, and the `mimos-photos` +
   `gallery-photos` storage buckets with their policies.
4. In Supabase → **Authentication** → **Sign In / Providers**, turn off
   "Allow new users to sign up" — this app is invite-only. Add your users
   manually under **Authentication → Users → Add user**.
5. Create a free [TMDB](https://www.themoviedb.org/settings/api) API key
   (v3 auth) and paste it into `.env.local` as `VITE_TMDB_API_KEY`.
6. `npm install && npm run dev`.

### Deploying to GitHub Pages (your fork)

1. In your fork → **Settings** → **Pages** → source: GitHub Actions.
2. **Settings → Secrets and variables → Actions**, add three secrets:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TMDB_API_KEY`.
3. If your fork isn't named `organizai`, update the base path in
   [`vite.config.ts`](vite.config.ts) and [`src/main.tsx`](src/main.tsx).
4. Push — Actions builds and deploys. App goes live at
   `https://YOUR_USER.github.io/YOUR_REPO/`.

### Optional: Cloudflare Worker proxy

Some mobile carriers / routers silently drop traffic to `*.supabase.co`.
The [cloudflare-worker/](cloudflare-worker/) folder has a proxy Worker you
can deploy in 10 minutes to route around that — see the README there.

## Security notes

- **RLS** is on for every user-facing table; each row is scoped by
  `auth.uid() = user_id`.
- **Sign-ups are disabled** on the live instance. The app is invite-only.
- **No secret material in this repository.** `.env.local` is gitignored
  from the first commit; verify with `git ls-files | grep env`. The values
  that end up in the public JS bundle (`VITE_SUPABASE_URL` and the anon
  key) are intentionally public — they're safe as long as RLS is active.
- **Storage buckets** are public-read but per-user-write: every upload
  goes under `{user_id}/...` and the insert/update/delete policies check
  `auth.uid()::text = (storage.foldername(name))[1]`.
- **Auto-recovery** on the login side: if the client's refresh token is
  invalid/expired, a global fetch interceptor clears local auth and sends
  the user to `/login` instead of showing an empty account.

## Scripts

```bash
npm run dev      # dev server with HMR
npm run build    # production build
npm run preview  # preview the build locally
npm run lint     # eslint
```

## License

[MIT](LICENSE) — use, modify, and share freely.
