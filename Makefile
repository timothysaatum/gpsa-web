.PHONY: dev-build dev-up dev-down prod-build prod-up prod-down migrate seed logs clean

# ── Development ───────────────────────────────────────────────────────────────

dev-build:
	docker compose -f docker-compose.dev.yml build

dev-up:
	docker compose -f docker-compose.dev.yml up -d

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

# ── Production ────────────────────────────────────────────────────────────────

prod-build:
	docker compose build

prod-up:
	docker compose up -d --remove-orphans

prod-down:
	docker compose down

prod-logs:
	docker compose logs -f

prod-restart:
	docker compose restart

# ── Database ──────────────────────────────────────────────────────────────────

migrate:
	docker compose run --rm migrate

seed:
	docker compose run --rm seed

migrate-new:
	cd gpsa && .venv/bin/alembic revision --autogenerate -m "$(name)"

# ── Maintenance ───────────────────────────────────────────────────────────────

clean:
	docker compose down -v
	docker image prune -f

prune:
	docker system prune -af --volumes

ps:
	docker compose ps

# ── SSL (first-time setup) ───────────────────────────────────────────────────

ssl:
	docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
		-d $(DOMAIN) --email $(EMAIL) --agree-tos --no-eff-email
