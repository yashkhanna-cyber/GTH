import logging
import uuid
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, func, or_
from fastapi import HTTPException, status
from app.models.user import User
from app.models.team import Team, TeamInvitation
from app.models.notification import Notification
from app.schemas.team import TeamCreateInput, TeamInviteActionInput
from celery_app import celery_app

logger = logging.getLogger(__name__)

class TeamService:
    async def get_team_status(self, db: AsyncSession, user: User) -> Dict[str, Any]:
        """
        Retrieves the student's team status (either details of their team or list of pending invites).
        """
        # If student has a team, fetch team details
        if user.team_id:
            # 1. Fetch team
            res_team = await db.execute(select(Team).where(Team.id == user.team_id))
            team = res_team.scalar_one_or_none()
            if not team:
                # Discrepancy check: user has team_id but team does not exist. Reset user team
                user.team_id = None
                user.team = None
                await db.commit()
                return await self.get_team_status(db, user)

            # 2. Fetch all members
            res_members = await db.execute(
                select(User).where(User.team_id == team.id)
            )
            members = res_members.scalars().all()

            formatted_members = []
            total_points = 0
            for m in members:
                pts = m.total_points or 0
                total_points += pts
                formatted_members.append({
                    "id": str(m.id),
                    "name": m.full_name,
                    "email": m.email,
                    "photo": m.photo,
                    "enrollmentNo": m.enrollment_no or "",
                    "branch": m.branch or "",
                    "batch": m.batch or "",
                    "points": pts,
                    "role": "Leader" if team.leader_id == m.id else "Member"
                })

            # Sort members: leader first, then by points descending
            formatted_members.sort(key=lambda x: (x["role"] != "Leader", -x["points"]))

            # 3. Calculate Rank dynamically
            # Query all teams and sum member points
            res_ranks = await db.execute(
                select(User.team_id, func.sum(User.total_points).label("sum_pts"))
                .where(User.team_id != None)
                .group_by(User.team_id)
                .order_by(func.sum(User.total_points).desc())
            )
            ranks = res_ranks.all()

            rank = 1
            total_teams = len(ranks)
            for idx, r in enumerate(ranks):
                if r.team_id == team.id:
                    rank = idx + 1
                    break

            return {
                "success": True,
                "inTeam": True,
                "team": {
                    "id": str(team.id),
                    "name": team.team_name,
                    "tagline": team.tagline or "",
                    "mentor": team.mentor,
                    "leaderId": str(team.leader_id) if team.leader_id else None,
                    "members": formatted_members,
                    "totalPoints": total_points,
                    "rank": rank,
                    "totalTeams": total_teams
                }
            }

        else:
            # Student has NO team: fetch invites and eligible students
            # 1. Pending invitations
            res_invites = await db.execute(
                select(TeamInvitation)
                .where(and_(TeamInvitation.student_id == user.id, TeamInvitation.status == "PENDING"))
            )
            invites = res_invites.scalars().all()

            formatted_invites = []
            for inv in invites:
                # Fetch team and team leader details
                res_t = await db.execute(select(Team).where(Team.id == inv.team_id))
                team_obj = res_t.scalar_one_or_none()
                if team_obj:
                    # Get leader name
                    leader_name = "Team Leader"
                    if team_obj.leader_id:
                        res_l = await db.execute(select(User).where(User.id == team_obj.leader_id))
                        leader = res_l.scalar_one_or_none()
                        if leader:
                            leader_name = leader.full_name

                    formatted_invites.append({
                        "id": str(inv.id),
                        "teamId": str(team_obj.id),
                        "teamName": team_obj.team_name,
                        "tagline": team_obj.tagline or "",
                        "leaderName": leader_name
                    })

            # 2. Eligible members (students with no team and not self)
            res_eligible = await db.execute(
                select(User)
                .where(and_(User.role == "Student", User.team_id == None, User.id != user.id))
            )
            eligible = res_eligible.scalars().all()

            formatted_eligible = [{
                "id": str(s.id),
                "name": s.full_name,
                "email": s.email,
                "enrollmentNo": s.enrollment_no or "",
                "branch": s.branch or "",
                "batch": s.batch or ""
            } for s in eligible]

            return {
                "success": True,
                "inTeam": False,
                "pendingInvitations": formatted_invites,
                "eligibleMembers": formatted_eligible
            }

    async def create_team(self, db: AsyncSession, user: User, data: TeamCreateInput) -> Dict[str, Any]:
        """
        Creates a new team and sends invitations to selected students.
        """
        if user.team_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already in a team"
            )

        invited_count = len(data.invitedStudentIds)
        if invited_count < 2 or invited_count > 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A team must consist of minimum 3 and maximum 5 members (including the leader)."
            )

        # Check if team name already exists
        clean_name = data.teamName.strip()
        res_exists = await db.execute(select(Team).where(Team.team_name == clean_name))
        if res_exists.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Team name already exists"
            )

        # Verify invited students are not already in a team
        res_assigned = await db.execute(
            select(User).where(and_(User.id.in_(data.invitedStudentIds), User.team_id != None))
        )
        assigned_users = res_assigned.scalars().all()
        if assigned_users:
            names = ", ".join([u.full_name for u in assigned_users])
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The following students are already in a team: {names}"
            )

        # Create the team
        new_team = Team(
            team_name=clean_name,
            tagline=data.tagline.strip(),
            leader_id=user.id
        )
        db.add(new_team)
        await db.flush()  # Generate team ID

        # Set creator's team
        user.team_id = new_team.id
        user.team = clean_name
        db.add(user)

        # Create invitations and notifications
        for student_id in data.invitedStudentIds:
            # Check for existing invitation and delete/overwrite (to clear out REJECTED ones)
            await db.execute(
                delete(TeamInvitation).where(
                    and_(TeamInvitation.team_id == new_team.id, TeamInvitation.student_id == student_id)
                )
            )
            
            invitation = TeamInvitation(
                team_id=new_team.id,
                student_id=student_id,
                status="PENDING"
            )
            db.add(invitation)

            # Notification
            notification = Notification(
                student_id=student_id,
                title="Team Invitation",
                message=f"{user.full_name} has invited you to join the team '{clean_name}'. Go to My Team page to Accept or Decline.",
                is_read=False
            )
            db.add(notification)

        await db.commit()
        
        # Async tasks
        celery_app.send_task("app.tasks.background_tasks.recalculate_leaderboard_task")
        return {"success": True, "message": "Team created successfully and invitations sent!"}

    async def process_invite_action(self, db: AsyncSession, user: User, data: TeamInviteActionInput) -> Dict[str, Any]:
        """
        Accepts or declines a team invitation.
        """
        res_invite = await db.execute(select(TeamInvitation).where(TeamInvitation.id == data.inviteId))
        invite = res_invite.scalar_one_or_none()

        if not invite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found"
            )

        if invite.student_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This invitation was not sent to you"
            )

        if invite.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation has already been handled"
            )

        # Fetch team info
        res_t = await db.execute(select(Team).where(Team.id == invite.team_id))
        team = res_t.scalar_one_or_none()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found"
            )

        if data.action == "ACCEPT":
            if user.team_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You are already in a team"
                )

            # Update invite status
            invite.status = "ACCEPTED"
            db.add(invite)

            # Join team
            user.team_id = team.id
            user.team = team.team_name
            db.add(user)

            # Send notification to leader
            if team.leader_id:
                leader_notif = Notification(
                    student_id=team.leader_id,
                    title="Invitation Accepted",
                    message=f"{user.full_name} accepted your invitation and has joined '{team.team_name}'.",
                    is_read=False
                )
                db.add(leader_notif)

        else:
            # Decline invitation
            invite.status = "REJECTED"
            db.add(invite)

            # Send notification to leader
            if team.leader_id:
                leader_notif = Notification(
                    student_id=team.leader_id,
                    title="Invitation Declined",
                    message=f"{user.full_name} declined your invitation to join '{team.team_name}'.",
                    is_read=False
                )
                db.add(leader_notif)

        await db.commit()
        
        # Async tasks
        celery_app.send_task("app.tasks.background_tasks.recalculate_leaderboard_task")
        
        action_label = "accepted" if data.action == "ACCEPT" else "declined"
        return {"success": True, "message": f"Invitation successfully {action_label}"}

team_service = TeamService()
