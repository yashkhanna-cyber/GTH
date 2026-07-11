import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.services.redis import redis_service

logger = logging.getLogger(__name__)

class LeaderboardService:
    async def get_individual_leaderboard(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Retrieves individual student leaderboard rankings.
        Pulls from Redis cache first, falls back to Postgres.
        Response format matches frontend LeaderboardEntry interface:
        { id, rank, totalPoints, projectScore, communityScore, innovationScore, referralScore,
          student: { id, enrollmentNo, team: { name } | null, user: { name, email, avatar } } }
        """
        cache_key = "cache:leaderboard:individual"
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached

        logger.info("Leaderboard cache miss. Querying individual leaderboard from database.")
        res = await db.execute(
            select(User)
            .where(User.role == "Student")
            .order_by(User.total_points.desc(), User.full_name.asc())
        )
        students = res.scalars().all()
        
        leaderboard_data = []
        for idx, student in enumerate(students):
            leaderboard_data.append({
                "id": str(student.id),
                "rank": idx + 1,
                "totalPoints": student.total_points,
                "projectScore": student.total_points,  # All points aggregated
                "communityScore": 0,
                "innovationScore": 0,
                "referralScore": 0,
                "student": {
                    "id": str(student.id),
                    "enrollmentNo": student.enrollment_no or "",
                    "team": {"name": student.team} if student.team else None,
                    "user": {
                        "name": student.full_name,
                        "email": student.email,
                        "avatar": student.photo
                    }
                }
            })

        # Cache results in Redis
        await redis_service.set_json(cache_key, leaderboard_data, expire=3600)
        return leaderboard_data

    async def get_team_leaderboard(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Retrieves team leaderboard rankings (sum of user points).
        Response format matches frontend TeamEntry interface:
        { rank, teamName, totalPoints, memberCount, members: [{ name, avatar }] }
        """
        cache_key = "cache:leaderboard:team"
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached

        logger.info("Leaderboard cache miss. Querying team leaderboard from database.")
        
        # Get all students with teams
        res_students = await db.execute(
            select(User)
            .where(User.role == "Student")
            .where(User.team != None)
            .order_by(User.total_points.desc())
        )
        all_students = res_students.scalars().all()

        # Group by team
        teams_map: dict[str, dict] = {}
        for s in all_students:
            team_name = s.team
            if team_name not in teams_map:
                teams_map[team_name] = {"totalPoints": 0, "members": []}
            teams_map[team_name]["totalPoints"] += s.total_points
            teams_map[team_name]["members"].append({
                "name": s.full_name,
                "avatar": s.photo
            })

        # Sort by totalPoints descending
        sorted_teams = sorted(teams_map.items(), key=lambda x: x[1]["totalPoints"], reverse=True)

        team_leaderboard = []
        for idx, (team_name, data) in enumerate(sorted_teams):
            team_leaderboard.append({
                "rank": idx + 1,
                "teamName": team_name,
                "totalPoints": data["totalPoints"],
                "memberCount": len(data["members"]),
                "members": data["members"][:5]  # Limit to top 5 for display
            })

        # Cache results in Redis
        await redis_service.set_json(cache_key, team_leaderboard, expire=3600)
        return team_leaderboard

leaderboard_service = LeaderboardService()
