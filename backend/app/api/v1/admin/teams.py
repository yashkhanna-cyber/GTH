import logging
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, func
from app.database.session import get_db
from app.models.user import User
from app.models.team import Team, TeamInvitation
from app.models.points import PointsHistory
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.dependencies.auth import require_admin
import asyncio
from app.tasks import background_tasks
from pydantic import BaseModel

logger = logging.getLogger(__name__)
# Registered as prefix "/admin/teams" in master router
router = APIRouter(prefix="/admin/teams", tags=["Admin Teams"])

class AdminTeamActionPayload(BaseModel):
    action: str  # 'EDIT', 'DELETE', 'POINTS', 'APPRECIATE'
    teamId: uuid.UUID
    # Optional parameters depending on action
    teamName: Optional[str] = None
    tagline: Optional[str] = None
    mentor: Optional[str] = None
    points: Optional[int] = None
    reason: Optional[str] = None
    message: Optional[str] = None

@router.get("")
async def get_all_teams(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """
    Returns lists of all teams and members (Admin only).
    """
    # Fetch all teams
    res_teams = await db.execute(select(Team).order_by(Team.team_name.asc()))
    teams = res_teams.scalars().all()

    # Fetch all students to group them
    res_students = await db.execute(select(User).where(User.role == "Student"))
    students = res_students.scalars().all()

    students_map = {s.id: s for s in students}

    # Group students by team_id
    team_members = {}
    for s in students:
        if s.team_id:
            if s.team_id not in team_members:
                team_members[s.team_id] = []
            team_members[s.team_id].append(s)

    formatted_teams = []
    for t in teams:
        members = team_members.get(t.id, [])
        leader = students_map.get(t.leader_id) if t.leader_id else None

        formatted_members = []
        for m in members:
            formatted_members.append({
                "id": str(m.id),
                "name": m.full_name,
                "email": m.email,
                "photo": m.photo,
                "enrollmentNo": m.enrollment_no or "",
                "branch": m.branch or "",
                "batch": m.batch or "",
                "points": m.total_points or 0,
                "role": "Leader" if t.leader_id == m.id else "Member"
            })

        total_points = sum([m["points"] for m in formatted_members])

        formatted_teams.append({
            "id": str(t.id),
            "name": t.team_name,
            "tagline": t.tagline or "",
            "mentor": t.mentor or "",
            "leaderId": str(t.leader_id) if t.leader_id else None,
            "leaderName": leader.full_name if leader else "No Leader Assigned",
            "members": formatted_members,
            "totalPoints": total_points
        })

    return {"success": True, "teams": formatted_teams}

@router.post("")
async def handle_team_action(
    payload: AdminTeamActionPayload,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Performs administrative operations on teams (EDIT, DELETE, POINTS, APPRECIATE).
    """
    res_team = await db.execute(select(Team).where(Team.id == payload.teamId))
    team = res_team.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    old_team_name = team.team_name

    if payload.action == "EDIT":
        if not payload.teamName or not payload.tagline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing team name or tagline"
            )

        new_team_name = payload.teamName.strip()

        # If team name is changing, check uniqueness
        if new_team_name.lower() != old_team_name.lower():
            res_exists = await db.execute(select(Team).where(Team.team_name == new_team_name))
            if res_exists.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Team name already exists"
                )

        # Update team details
        team.team_name = new_team_name
        team.tagline = payload.tagline.strip()
        team.mentor = payload.mentor.strip() if payload.mentor else None
        db.add(team)

        # Update member team string names
        if new_team_name != old_team_name:
            await db.execute(
                update(User)
                .where(User.team_id == team.id)
                .values(team=new_team_name)
            )

        # Audit Log
        audit = AuditLog(
            user_id=admin.id,
            action="Team Edited",
            target_resource=f"team:{team.id}",
            ip_address=None,
            device_info=None
        )
        db.add(audit)

        await db.commit()
        
        asyncio.create_task(background_tasks.recalculate_leaderboard_task())
        return {"success": True, "message": "Team details updated successfully"}

    elif payload.action == "DELETE":
        # Clear members team relations
        await db.execute(
            update(User)
            .where(User.team_id == team.id)
            .values(team_id=None, team=None)
        )

        # Delete team invitations
        await db.execute(delete(TeamInvitation).where(TeamInvitation.team_id == team.id))

        # Delete team record
        await db.execute(delete(Team).where(Team.id == team.id))

        # Audit Log
        audit = AuditLog(
            user_id=admin.id,
            action="Team Deleted",
            target_resource=f"team:{team.id}",
            ip_address=None,
            device_info=None
        )
        db.add(audit)

        await db.commit()
        
        asyncio.create_task(background_tasks.recalculate_leaderboard_task())
        return {"success": True, "message": "Team deleted successfully"}

    elif payload.action == "POINTS":
        if payload.points is None or not payload.reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing points amount or reason"
            )

        # Fetch all team members
        res_m = await db.execute(select(User).where(User.team_id == team.id))
        members = res_m.scalars().all()

        if not members:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No members in this team to modify points"
            )

        # Apply points modification to each member
        for m in members:
            new_pts = max(0, (m.total_points or 0) + payload.points)
            m.total_points = new_pts
            db.add(m)

            # Log to Points History
            points_log = PointsHistory(
                student_id=m.id,
                points=payload.points,
                reason=f"Team Points Modification: {payload.reason.strip()} (Team: {old_team_name})",
                given_by=admin.id
            )
            db.add(points_log)

            # Notification
            notification = Notification(
                student_id=m.id,
                title="Team Points Received!" if payload.points >= 0 else "Team Points Deducted",
                message=f"Your team '{old_team_name}' was awarded {payload.points} points. Reason: {payload.reason.strip()}",
                is_read=False
            )
            db.add(notification)

        # Audit Log
        audit = AuditLog(
            user_id=admin.id,
            action=f"Team Points Awarded ({payload.points})",
            target_resource=f"team:{team.id}",
            ip_address=None,
            device_info=None
        )
        db.add(audit)

        await db.commit()
        
        asyncio.create_task(background_tasks.recalculate_leaderboard_task())
        return {"success": True, "message": "Points successfully applied to all team members"}

    elif payload.action == "APPRECIATE":
        if not payload.message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Appreciation message is required"
            )

        # Fetch members
        res_m = await db.execute(select(User).where(User.team_id == team.id))
        members = res_m.scalars().all()

        if not members:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No members in this team to appreciate"
            )

        # Deliver appreciation notification to all members
        for m in members:
            notification = Notification(
                student_id=m.id,
                title="🌟 Team Appreciated by Admin!",
                message=f"Congratulations! Admin appreciated your team '{old_team_name}': \"{payload.message.strip()}\"",
                is_read=False
            )
            db.add(notification)

        # Audit Log
        audit = AuditLog(
            user_id=admin.id,
            action="Team Appreciated",
            target_resource=f"team:{team.id}",
            ip_address=None,
            device_info=None
        )
        db.add(audit)

        await db.commit()
        return {"success": True, "message": "Appreciation sent to all team members"}

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action")
