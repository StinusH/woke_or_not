# Woke or Not

Woke or Not is an MVP catalog website for movies and TV shows with manual score breakdowns.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Zod validation
- Vitest + Playwright test setup

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure env vars:
   ```bash
   cp .env.example .env
   ```
3. Create database schema and client:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   ```
4. Seed data (~60 titles):
   ```bash
   npm run prisma:seed
   ```
5. Run app:
   ```bash
   npm run dev
   ```

## Routes
- `/` home
- `/movies`
- `/tv-shows`
- `/genres/[slug]`
- `/search`
- `/title/[slug]`
- `/admin`

## Public API
- `GET /api/titles`
- `GET /api/titles/:slug`
- `GET /api/genres`

## Admin API (requires `x-admin-secret` header)
- `POST /api/admin/titles`
- `PUT /api/admin/titles/:id`
- `DELETE /api/admin/titles/:id`
- `POST /api/admin/import`

## Testing
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Notes
- Scoring is manual editorial demo data only in MVP.
- The current scoring model is documented in `WOKE_SCORING.md`.
- `/admin` is intended for trusted/internal use.
