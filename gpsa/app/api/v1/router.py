from fastapi import APIRouter

from app.api.v1.routes.about import router as about_router
from app.api.v1.routes.admin import router as admin_router
from app.api.v1.routes.academic_resources import router as resources_router
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.certificates import router as certs_router
from app.api.v1.routes.events import router as events_router
from app.api.v1.routes.feedback import router as feedback_router
from app.api.v1.routes.gallery import router as gallery_router
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.hero import router as hero_router
from app.api.v1.routes.leadership import router as leadership_router
from app.api.v1.routes.stats import router as stats_router
from app.api.v1.routes.news import router as news_router
from app.api.v1.routes.notifications import router as notifs_router
from app.api.v1.routes.opportunities import router as opps_router
from app.api.v1.routes.users import router as users_router
from app.api.v1.routes.welfare import router as welfare_router

api_router = APIRouter()

# ── Infrastructure ────────────────────────────────────────────────────────────
api_router.include_router(health_router)
api_router.include_router(stats_router)
api_router.include_router(about_router, prefix="/about")
api_router.include_router(admin_router, prefix="/admin")

# ── Auth & Users ──────────────────────────────────────────────────────────────
api_router.include_router(auth_router,  prefix="/auth")
api_router.include_router(users_router, prefix="/users")

# ── Domain ────────────────────────────────────────────────────────────────────
api_router.include_router(resources_router, prefix="/academic-resources")
api_router.include_router(events_router,    prefix="/events")
api_router.include_router(welfare_router,   prefix="/welfare")
api_router.include_router(opps_router,      prefix="/opportunities")
api_router.include_router(news_router,      prefix="/news")
api_router.include_router(notifs_router,    prefix="/notifications")
api_router.include_router(certs_router,     prefix="/certificates")
api_router.include_router(feedback_router,  prefix="/feedback")
api_router.include_router(gallery_router,   prefix="/gallery")
api_router.include_router(hero_router,      prefix="/hero")
api_router.include_router(leadership_router, prefix="/leadership")
