from fastapi import APIRouter
from app.api.v1 import (
    auth,
    profile,
    teams,
    projects,
    tasks,
    submissions,
    referrals,
    leaderboard,
    notifications,
    attendance,
    certificates,
    settings,
)
from app.api.v1.admin import (
    stats as admin_stats,
    students as admin_students,
    points as admin_points,
    teams as admin_teams,
    announcements as admin_announcements,
    attendance as admin_attendance,
    certificates as admin_certificates,
)

api_router = APIRouter()

# Student and common endpoints
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(teams.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
api_router.include_router(submissions.router)
api_router.include_router(referrals.router)
api_router.include_router(leaderboard.router)
api_router.include_router(notifications.router)
api_router.include_router(attendance.router)
api_router.include_router(certificates.router)
api_router.include_router(settings.router)

# Administrative endpoints
api_router.include_router(admin_stats.router)
api_router.include_router(admin_students.router)
api_router.include_router(admin_points.router)
api_router.include_router(admin_teams.router)
api_router.include_router(admin_announcements.router)
api_router.include_router(admin_attendance.router)
api_router.include_router(admin_certificates.router)
