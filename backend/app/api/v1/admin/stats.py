import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.database.session import get_db
from app.models.user import User
from app.models.team import Team
from app.models.task import TaskSubmission
from app.models.attendance import Attendance
from app.dependencies.auth import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/stats", tags=["Admin Statistics"])

@router.get("")
async def get_admin_dashboard_stats(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """
    Returns aggregated system statistics for the admin dashboard.
    """
    # 1. Total Students
    res_total_students = await db.execute(select(func.count(User.id)).where(User.role == "Student"))
    total_students = res_total_students.scalar() or 0

    # 2. Active Teams
    res_active_teams = await db.execute(select(func.count(Team.id)))
    active_teams = res_active_teams.scalar() or 0

    # 3. Average XP
    res_avg_xp = await db.execute(select(func.avg(User.total_points)).where(User.role == "Student"))
    average_xp = int(res_avg_xp.scalar() or 0)

    # 4. Pending Submissions
    res_pending = await db.execute(
        select(func.count(TaskSubmission.id)).where(TaskSubmission.status == "PENDING")
    )
    pending_submissions = res_pending.scalar() or 0

    # 5. Attendance Rate
    # Query total PRESENT and ABSENT records
    res_pres = await db.execute(
        select(func.count(Attendance.id)).where(Attendance.status == "PRESENT")
    )
    present_cnt = res_pres.scalar() or 0

    res_abs = await db.execute(
        select(func.count(Attendance.id)).where(Attendance.status == "ABSENT")
    )
    absent_cnt = res_abs.scalar() or 0

    total_att = present_cnt + absent_cnt
    attendance_rate = int((present_cnt / total_att) * 100) if total_att > 0 else 100

    # 6. XP Distribution (Buckets: 0-500, 501-1000, 1001-2000, 2001+)
    dist = {"0-500": 0, "501-1000": 0, "1001-2000": 0, "2000+": 0}
    res_xp = await db.execute(select(User.total_points).where(User.role == "Student"))
    all_xp = res_xp.scalars().all()
    
    for xp in all_xp:
        if xp <= 500:
            dist["0-500"] += 1
        elif xp <= 1000:
            dist["501-1000"] += 1
        elif xp <= 2000:
            dist["1001-2000"] += 1
        else:
            dist["2000+"] += 1

    xp_distribution = [
        {"range": "0-500 XP", "count": dist["0-500"]},
        {"range": "501-1000 XP", "count": dist["501-1000"]},
        {"range": "1001-2000 XP", "count": dist["1001-2000"]},
        {"range": "2000+ XP", "count": dist["2000+"]}
    ]

    # 7. Top Performers (5 students)
    res_top = await db.execute(
        select(User.id, User.full_name, User.total_points, User.team, User.photo)
        .where(User.role == "Student")
        .order_by(User.total_points.desc(), User.full_name.asc())
        .limit(5)
    )
    top_rows = res_top.all()
    top_performers = [{
        "id": str(r.id),
        "name": r.full_name,
        "points": r.total_points,
        "team": r.team or "No Team",
        "avatar": r.photo
    } for r in top_rows]

    # 8. Team Standings (5 teams)
    res_team_standings = await db.execute(
        select(User.team, func.sum(User.total_points).label("sum_pts"))
        .where(User.role == "Student")
        .where(User.team != None)
        .group_by(User.team)
        .order_by(func.sum(User.total_points).desc())
        .limit(5)
    )
    team_rows = res_team_standings.all()
    team_standings = [{
        "name": r.team,
        "points": int(r.sum_pts or 0),
        "rank": idx + 1
    } for idx, r in enumerate(team_rows)]

    return {
        "success": True,
        "stats": {
            "totalStudents": total_students,
            "activeTeams": active_teams,
            "averageXp": average_xp,
            "pendingSubmissions": pending_submissions,
            "attendanceRate": attendance_rate,
            "xpDistribution": xp_distribution,
            "topPerformers": top_performers,
            "teamStandings": team_standings
        }
    }
