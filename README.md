# OrganizAI

**I know, Supabase is crap, I'm not an idiot, I used it simply because I didn't want to host this project on a VPS and spend money on a domain. So I did what was necessary just to fill my stomach.**

> **Personal use project.** This app was born from a real need my girlfriend and I had — organizing movies, series, date ideas, finances, and beauty products in one place, without depending on scattered spreadsheets. We publish the source code openly because we believe in sharing, but **the instance you see on GitHub Pages is ours alone**: our data, our lists, our mimos.

A couples organizer — movies, series, dates, beauty wishlist, and finances.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)

## Modules

- **Movies** — TMDB search with director and cast, Netflix-style carousels by status, personal rating, dynamic genre filters
- **Series** — Same pattern as movies + season/episode tracker
- **Dates** — Plan dates with address, weather, date/time, and Google Maps link
- **Mimos** (Beauty wishlist) — Cosmetics, skincare, accessories, piercings with "own / want / ran out" status and purchase links
- **Expenses** — Monthly financial dashboard with category pie chart and transaction list
- **Goals** — Savings goals with deposits, progress bar, and celebration on completion

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript (strict) + Vite 8 |
| UI | Tailwind CSS v4 + shadcn/ui (new-york) |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL + Auth + Row Level Security) |
| External API | TMDB (movies and series) |
| Deploy | GitHub Pages via GitHub Actions |

## Want to run your own instance?

This repository **contains no data, credentials, or databases of ours** — all private content lives in external services with Row Level Security enabled, accessible only by our personal accounts.

If you want to run your own OrganizAI instance (for yourself, your partner, your family), you must **create your own credentials**. Full step-by-step below.

### Prerequisites

- Node.js 22+
- A free [Supabase](https://supabase.com) account (create yours)
- A free [TMDB API Key](https://www.themoviedb.org/settings/api) (v3 auth — create yours)

### Local installation

```bash
# 1. Fork this repository on GitHub, then clone YOUR fork
git clone https://github.com/YOUR_USERNAME/organizai.git
cd organizai

# 2. Install dependencies
npm install

# 3. Set up your environment variables
cp .env.example .env.local
# Edit .env.local with YOUR credentials (not ours)
```

### Supabase setup (your own project)

1. Create a new project at [supabase.com](https://supabase.com/dashboard) (free tier is enough)
2. Once the project is ready, open **SQL Editor** > **New query** and paste the entire content of [`supabase/schema.sql`](supabase/schema.sql). Click **Run**. This creates all tables, RLS policies, indexes, and triggers.
3. Go to **Project Settings** > **API** and copy:
   - `Project URL` → this is your `VITE_SUPABASE_URL`
   - `anon public` key → this is your `VITE_SUPABASE_ANON_KEY`
4. Paste both into your `.env.local`
5. (Recommended) Go to **Authentication** > **Sign In / Providers** and toggle **"Allow new users to sign up"** OFF — this makes the app invite-only
6. Create user accounts manually at **Authentication** > **Users** > **Add user** (use "Auto Confirm User" to skip email verification)

### TMDB setup (your own API key)

1. Create an account at [themoviedb.org](https://www.themoviedb.org) and request an API key at [Settings > API](https://www.themoviedb.org/settings/api)
2. Copy the **API Key (v3 auth)** — the short one, not the JWT token
3. Paste it into `.env.local` as `VITE_TMDB_API_KEY`

### Run it

```bash
npm run dev
# Open http://localhost:5173/organizai/
```

Note the `/organizai/` suffix — that's the base path configured for GitHub Pages deployment. If you rename your fork, see the deploy section below.

### Environment variables

All must be set in `.env.local` (gitignored) or as GitHub Secrets for CI/CD. See [`.env.example`](.env.example).

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL of YOUR Supabase project |
| `VITE_SUPABASE_ANON_KEY` | Anon public key of YOUR Supabase project |
| `VITE_TMDB_API_KEY` | YOUR TMDB API key (v3 auth) |

### Deploy to GitHub Pages

1. Fork this repo (step already done if you followed the install)
2. Go to **Settings** > **Pages** > **Source: GitHub Actions**
3. Go to **Settings** > **Secrets and variables** > **Actions** > **New repository secret**, then add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TMDB_API_KEY`
4. **If your fork is named something other than `organizai`**, update the base path:
   - In [`vite.config.ts`](vite.config.ts): change `base: "/organizai/"` to `base: "/YOUR_REPO_NAME/"`
   - In [`src/main.tsx`](src/main.tsx): change `basename="/organizai"` to `basename="/YOUR_REPO_NAME"`
5. Push to `main` — the GitHub Actions workflow will build and deploy automatically
6. Your app will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## Contributing

Feel free to open issues or PRs with improvements, bug fixes, or new ideas. See [CONTRIBUTING.md](CONTRIBUTING.md).

**Important:** no PR should contain credentials, personal data, or references to private instances. All development should be done against your own test Supabase project.

## Scripts

```bash
npm run dev      # Dev server with HMR
npm run build    # Production build
npm run preview  # Preview the build locally
npm run lint     # ESLint
```

## Security

- **Row Level Security (RLS)** enabled on every table — each user only accesses their own data
- **No secrets in the repository** — all credentials live in `.env.local` or GitHub Secrets
- **Public sign-ups disabled** on our instance (accounts added manually by us)
- `.env.local` is gitignored from the first commit — verify with `git ls-files | grep env` before any commit

## License

[MIT](LICENSE) — use, modify, and share freely.
