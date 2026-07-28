# CLB Charity Web App

A charity web app for a Vietnamese student club (CLB). It showcases donation
campaigns and news to the public, and provides an internal dashboard for club
members to manage campaigns, posts, and members.

> **No payments are processed here.** Donors give externally via a VietQR code
> (MB Bank) or a `thiennguyen.app` link. Admins update campaign progress
> (amount raised, donor count) manually.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Java 26, Spring Boot 4.1, Maven |
| Database | PostgreSQL + Spring Data JPA/Hibernate, Flyway migrations |
| Auth | Spring Security + JWT (access 15 min, refresh 7 days) |
| Storage | Cloudinary |
| PDF | iText 7 |
| Frontend | React 19 + TypeScript, Vite, TailwindCSS v3, Shadcn/ui |
| Data/forms | TanStack Query v5, React Hook Form + Zod, Zustand (auth) |
| Editor | Tiptap |

## Repository layout

```
charity-spring-react/
├── docker-compose.yml      # PostgreSQL (+ backend/frontend) for local dev
├── render.yaml             # Render Blueprint for the deployed backend
├── .github/workflows/      # CI, deploy (Render + Vercel), keep-alive cron
├── setup.md                # CI/CD deployment setup guide (Vercel/Render/Supabase/Cloudinary)
├── backend/                # Spring Boot + Java modular monolith
└── frontend/               # React + TypeScript (Vite)
```

The backend is a **modular monolith** (package-by-feature). Each feature owns
its own layered sub-packages and references other features by **id only** (no
cross-feature JPA relations), so a feature can later be extracted into a
microservice with minimal changes:

```
com.clb.charity/
├── common/                 # shared kernel: config, security, exception, util
│   ├── config/  security/  exception/  util/
├── campaign/               # feature module
│   ├── domain/  dto/  repository/  service/  mapper/  web/
├── post/                   # …same layout
├── member/
├── auth/
├── report/   storage/   vietqr/
└── CharityApplication.java
```

## Prerequisites

- JDK 26 (the build targets Java 26)
- Maven 3.9+ (or use IntelliJ IDEA's bundled Maven — it imports `pom.xml` directly)
- Node.js 20+
- Docker + Docker Compose

## 1. Start infrastructure

```bash
docker compose up -d
```

This starts:

| Service | Port | Notes |
|---|---|---|
| PostgreSQL | 5432 | db `clb_charity`, user/pass `postgres`/`postgres` |

Image uploads go to Cloudinary (free tier) instead of a local container — create a
free account at [cloudinary.com](https://cloudinary.com) and set the 3
`CLOUDINARY_*` env vars below (see [setup.md](setup.md) for details).

## 2. Run the backend

```bash
cd backend
cp .env.example .env          # then edit secrets (JWT_SECRET is required)
# export the vars (or use an .env loader / your IDE run config), then:
mvn spring-boot:run
```

Generate a JWT secret for `.env`:

```bash
openssl rand -base64 48
```

Build a runnable jar / run the tests:

```bash
mvn clean package             # produces target/charity-0.0.1-SNAPSHOT.jar
mvn test                      # runs the unit tests
```

- API base: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Flyway runs `V1__init_schema.sql` (tables) and `V2__seed_data.sql` (seed) on startup.

> **No Maven installed?** Open `backend/` in IntelliJ IDEA and let it import
> `pom.xml` — the bundled Maven builds and runs the app with no extra setup.
> Alternatively, `docker compose up --build backend` builds it in a container.

### Seeded admin account

| Email | Password | Role |
|---|---|---|
| `admin@clb.vn` | `Admin@123` | ADMIN |

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

- App: `http://localhost:5173`
- The Vite dev server proxies `/api` → `http://localhost:8080`.

## Environment variables (backend)

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/clb_charity` | JDBC URL |
| `DB_USER` / `DB_PASSWORD` | `postgres` / `postgres` | DB credentials |
| `JWT_SECRET` | — (**required**) | Base64 HS256 secret (≥ 32 bytes) |
| `CLOUDINARY_CLOUD_NAME` | — (**required**) | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | — (**required**) | Cloudinary API credentials |
| `CLOUDINARY_UPLOAD_FOLDER` | `clb-media` | Folder prefix for uploaded images |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origin(s) |

## User roles

| Role | Capabilities |
|---|---|
| `ADMIN` | Full access: users, campaigns, posts, settings, status/progress |
| `CONTRIBUTOR` | Create/edit campaigns & posts (admin approves publish) |
| `MEMBER` | Read-only internal dashboard & reports |
| Anonymous | Public pages only |

## API overview

Base path: `/api/v1`. Success responses return DTOs / Spring `Page` directly (no
envelope). Errors use **RFC 9457 ProblemDetail**.

### Auth
| Method | Path | Access |
|---|---|---|
| POST | `/auth/login` | public — returns access token + sets HttpOnly refresh cookie |
| POST | `/auth/refresh` | public — rotates refresh cookie, returns new access token |
| POST | `/auth/logout` | public — revokes refresh token, clears cookie |
| GET | `/auth/me` | authenticated |

### Campaigns
| Method | Path | Access |
|---|---|---|
| GET | `/campaigns` | public (filters: `status`, `category`, paging) |
| GET | `/campaigns/{slug}` | public |
| GET | `/campaigns/{slug}/qr` | public — proxied VietQR PNG |
| POST | `/campaigns` | CONTRIBUTOR, ADMIN |
| PUT | `/campaigns/{id}` | CONTRIBUTOR, ADMIN |
| PATCH | `/campaigns/{id}/status` | ADMIN |
| PATCH | `/campaigns/{id}/progress` | ADMIN |
| DELETE | `/campaigns/{id}` | ADMIN (DRAFT only) |

### Posts
| Method | Path | Access |
|---|---|---|
| GET | `/posts` | public (filter `published`) |
| GET | `/posts/{slug}` | public |
| POST | `/posts` | CONTRIBUTOR, ADMIN |
| PUT | `/posts/{id}` | CONTRIBUTOR, ADMIN |
| PATCH | `/posts/{id}/publish` | ADMIN |

### Members
| Method | Path | Access |
|---|---|---|
| GET | `/members` | ADMIN |
| GET | `/members/{id}` | MEMBER, CONTRIBUTOR, ADMIN |
| POST | `/members` | ADMIN |
| PATCH | `/members/{id}/role` | ADMIN |

### Reports & media
| Method | Path | Access |
|---|---|---|
| GET | `/reports/campaigns/{id}/pdf` | MEMBER, CONTRIBUTOR, ADMIN |
| GET | `/reports/campaigns/export` | MEMBER, CONTRIBUTOR, ADMIN (CSV) |
| POST | `/media` | CONTRIBUTOR, ADMIN (image upload, ≤ 5 MB) |

## Campaign lifecycle

```
DRAFT → ACTIVE → COMPLETED
              └→ CLOSED → ARCHIVED
```

Only ADMIN changes status; invalid transitions return `400`. Only `DRAFT`
campaigns can be deleted.

## VietQR

QR images use the free public VietQR endpoint (no API key, no merchant
registration). The backend proxies it to avoid CORS:

```
https://img.vietqr.io/image/MB-{accountNo}-compact2.png?amount={amount}&addInfo={desc}&accountName={name}
```

## Deployment & CI/CD

The app deploys as: **Frontend → Vercel**, **Backend → Render**, **Database →
Supabase (Postgres)**, **Storage → Cloudinary**. GitHub Actions
(`.github/workflows/`) drives the whole pipeline:

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` | push/PR to `main` | builds + tests backend (Maven) and frontend (npm) |
| `deploy.yml` | push to `main` | re-runs the same checks, then (only if they pass) calls the Render + Vercel deploy hooks |
| `keepalive.yml` | cron, every 14 min | pings the backend's `/actuator/health` so Render's free tier doesn't sleep it |

First-time setup (creating accounts, wiring env vars/secrets) is a one-time manual
process — see **[setup.md](setup.md)** for the full step-by-step guide.

## Notes / out of scope

- No payment gateway integration (MoMo/ZaloPay) — donations are external.
- No real-time features (WebSocket/SSE).
- `thiennguyen.app` is external — only its URL is stored on a campaign.
