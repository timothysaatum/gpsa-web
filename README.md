# GPSA-UDS Website — Backend API

REST API for the Ghana Pharmaceutical Students' Association,
University for Development Studies departmental website.

Built with **FastAPI 0.115**, **SQLAlchemy 2.0 async**, **PostgreSQL**, **Pydantic v2**.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.115 + Uvicorn |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 16 + asyncpg |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Auth | PyJWT + argon2 |
| Storage | Cloudflare R2 (S3-compatible) |
| Email | Resend |
| Scheduler | APScheduler |
| Logging | structlog (JSON in prod) |
| Testing | pytest-asyncio + httpx |

---

## Project Structure

```
app/
├── api/v1/routes/      # One file per domain — thin, delegates to services
├── core/               # Config, security, dependencies, permissions, logging
├── db/                 # Base, session, mixins
├── middleware/         # Request ID, audit context, rate limiting
├── models/             # SQLAlchemy ORM models
├── repositories/       # All DB queries — never in services or routes
├── schemas/            # Pydantic v2 request/response models
├── services/           # Business logic — coordinates repos, email, storage
├── utils/              # Pagination, file validation, date helpers, slug
└── workers/            # APScheduler jobs and background tasks
```

---

## Local Setup

### Prerequisites
- Python 3.12+
- PostgreSQL 16 running locally
- libmagic (`brew install libmagic` / `apt install libmagic1`)

### 1. Clone and install

```bash
git clone <repo>
cd gpsaudswebsite

python -m venv .venv
source .venv/bin/activate

pip install -e ".[dev]"
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET_KEY, storage + email credentials
```

### 3. Create database

```bash
createdb gpsaudswebsite
```

### 4. Run migrations

```bash
alembic upgrade head
```

### 5. Bootstrap admin user

```bash
python scripts/create_admin.py
```

### 6. Seed development data (optional)

```bash
python scripts/seed_db.py
```

### 7. Start the server

```bash
fastapi dev app/main.py
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

---

## Running Tests

```bash
# All tests
pytest

# Unit tests only (no DB)
pytest tests/unit/

# Integration tests
pytest tests/integration/

# With coverage report
pytest --cov=app --cov-report=html
```

> Integration tests use an in-memory SQLite database — no Postgres required for CI.

---

## API Overview

All routes are prefixed `/api/v1`.

| Prefix | Description |
|---|---|
| `/auth` | Register, login, refresh, logout, verify email, password reset |
| `/users` | Profile management, admin user controls |
| `/academic-resources` | Upload, list, filter, publish resources + course management |
| `/events` | CRUD, registration, listing |
| `/welfare` | PharmaCare report submission and admin resolution |
| `/opportunities` | Internships, scholarships, jobs — CRUD + publish |
| `/news` | Posts, draft/publish workflow, strip announcements |
| `/notifications` | In-app inbox — list and mark read |
| `/certificates` | Issue, verify (public), download |
| `/feedback` | Ratings and comments on events/resources |
| `/health` | Service health check |

---

## Background Jobs

Managed by APScheduler, started via the FastAPI lifespan:

| Job | Schedule | Action |
|---|---|---|
| `expire_opportunities` | Daily 00:05 | Set `is_active=false` on past-deadline opps |
| `update_event_statuses` | Every hour | Transition events upcoming → ongoing → past |
| `prune_old_notifications` | Weekly Sunday 02:00 | Hard-delete notifications older than 90 days |
| `event_reminders_24h` | Daily 08:00 | Notify + email all registrants 24h before event |

---

## Security

- **Passwords**: argon2 with random salt
- **JWT**: HS256 access tokens (30 min) + refresh tokens (30 days) with rotation
- **Token storage**: Only SHA-256 hashes stored in DB — raw tokens never persisted
- **Brute force**: Account lockout after 5 failed logins, IP-level rate limiting
- **Confidential welfare**: No user FK, IP/user-agent stripped at service layer
- **File uploads**: Magic-byte MIME validation before R2 upload
- **Audit log**: Immutable append-only record of all mutations

---

## Migrations

```bash
# Generate a new migration after model changes
alembic revision --autogenerate -m "describe_change"

# Apply all pending migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1

# Check for pending changes (use in CI)
alembic check
```

---

## Deployment Checklist

- [ ] Set `ENVIRONMENT=production` in env
- [ ] Rotate `JWT_SECRET_KEY` to a strong 64-char random string
- [ ] Set real `DATABASE_URL` pointing to managed Postgres
- [ ] Configure R2 bucket with correct CORS policy
- [ ] Set `RESEND_API_KEY` and verify sending domain
- [ ] Run `alembic upgrade head` before starting new instances
- [ ] Run `python scripts/create_admin.py` once on first deploy
- [ ] Docs/OpenAPI disabled automatically in production (`ENVIRONMENT=production`)
