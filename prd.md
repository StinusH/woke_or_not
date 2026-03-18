# Woke or Not - Product Requirements Document (MVP)

## 1. Product overview
### Problem statement
Viewers want a quick way to evaluate perceived "wokeness" in movies and TV shows before deciding what to watch.

### Audience
- Users seeking content with stronger social or identity themes.
- Users trying to avoid content with stronger social or identity themes.

### Value proposition
A searchable, filterable catalog with transparent score breakdowns and title metadata.

## 2. MVP goals and non-goals
### Goals
- Browse by `Movies` and `TV Shows`.
- Filter by subcategories/genres (Children, Action, Comedy, etc.).
- View title detail pages with release info, cast, director/crew, trailer embed, and external links.
- Display manual score and structured score factors.
- Provide internal admin CRUD for title data management.

### Non-goals
- Automated NLP scoring.
- User accounts and personalization.
- Community comments, ratings, or moderation.
- Recommendation engine.

## 3. Information architecture
### Top-level categories
- Movies
- TV Shows

### Subcategories
- Children
- Action
- Comedy
- Extensible taxonomy for additional genres.

### Key pages
- Home (`/`)
- Category listing (`/movies`, `/tv-shows`)
- Genre listing (`/genres/[slug]`)
- Search/filter (`/search`)
- Title detail (`/title/[slug]`)
- Internal admin (`/admin`)

## 4. Functional requirements
- Listing pages support filtering, sorting, and pagination.
- Title detail pages show:
  - Release date
  - Main cast
  - Director + crew
  - Trailer (YouTube embed)
  - IMDb, Rotten Tomatoes, Amazon links
  - Woke score and score factors
- Internal admin supports create/update/delete/import of titles.
- SEO metadata for route pages and title pages.

## 5. Data model
### Core entities
- `Title`
- `Genre`
- `Person`
- `TitleCast`
- `TitleCrew`
- `WokeFactor`

### Title fields
- Identity: `id`, `slug`, `name`, `type`
- Metadata: `releaseDate`, `runtimeMinutes`, `synopsis`, `posterUrl`
- External links: `trailerYoutubeUrl`, `imdbUrl`, `rottenTomatoesUrl`, `amazonUrl`
- Scoring: `wokeScore`, `wokeSummary`, `wokeFactors`
- Lifecycle: `status`, timestamps

## 6. APIs and interfaces
### Public read APIs
- `GET /api/titles` with `type`, `genre`, `score_min`, `score_max`, `sort`, `page`, `limit`, `q`
- `GET /api/titles/:slug`
- `GET /api/genres`

### Admin write APIs
- `POST /api/admin/titles`
- `PUT /api/admin/titles/:id`
- `DELETE /api/admin/titles/:id`
- `POST /api/admin/import`

### Interface contracts
- Zod-validated payloads and query params.
- Consistent JSON error shape (`{ error: string }`).
- Pagination response contract includes `page`, `limit`, `total`, `totalPages`.

## 7. UX and design direction
- Neutral editorial tone.
- Distinct visual style with warm palette and expressive typography.
- Mobile-first responsive layout.
- Keyboard accessible controls and semantic document structure.
- Clear disclosure that scores are editorial and manual in MVP.

## 8. Quality and acceptance criteria
### Baselines
- Core pages load and render complete data.
- Filtering and pagination behave consistently.
- Public API contracts are stable and validated.
- Admin mutation endpoints enforce shared-secret protection.

### Test coverage expectations
- Unit tests for query parsing and where-clause generation.
- Integration tests for API route contract behavior.
- E2E smoke tests for browsing and detail navigation.

## 9. Deployment and operations
### Platform
- Render web service + managed PostgreSQL.

### Required env vars
- `DATABASE_URL`
- `ADMIN_SECRET`
- `NEXT_PUBLIC_SITE_URL`

### Runtime operations
- Prisma migrations for schema changes.
- Seed script for initial data.
- Health endpoint at `/api/health`.

## 10. Launch checklist
- [ ] Seeded data (~60 titles across Movies + TV Shows)
- [ ] Public pages smoke-tested
- [ ] Admin CRUD tested with shared secret
- [ ] Legal/editorial disclaimer present
- [ ] Render deployment successful
- [ ] Basic analytics integration planned or configured
