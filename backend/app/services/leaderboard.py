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
        """
        cache_key = "cache:leaderboard:individual"
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached

        logger.info("Leaderboard cache miss. Querying individual leaderboard from database.")
        res = await db.execute(
            select(User.id, User.full_name, User.enrollment_no, User.team, User.total_points)
            .where(User.role == "Student")
            .order_by(User.total_points.desc(), User.full_name.asc())
        )
        students = res.all()
        
        leaderboard_data = []
        for idx, student in enumerate(students):
            leaderboard_data.append({
                "rank": idx + 1,
                "id": str(student.id),
                "name": student.full_name,
                "enrollmentNo": student.enrollment_no or "",
                "team": student.team or "",
                "points": student.total_points
            })

        # Cache results in Redis
        await redis_service.set_json(cache_key, leaderboard_data, expire=3600)
        return leaderboard_data

    async def get_team_leaderboard(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Retrieves team leaderboard rankings (sum of user points).
        Pulls from Redis cache first, falls back to Postgres.
        """
        cache_key = "cache:leaderboard:team"
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached

        logger.info("Leaderboard cache miss. Querying team leaderboard from database.")
        res_team = await db.execute(
            select(User.team, func.sum(User.total_points).label("team_points"))
            .where(User.role == "Student")
            .where(User.team != None)
            .group_by(User.team)
            .order_by(func.sum(User.total_points).desc())
        )
        teams = res_team.all()

        team_leaderboard = []
        for idx, team in enumerate(teams):
            team_leaderboard.append({
                "rank": idx + 1,
                "name": team.team,
                "points": int(team.team_points or 0)
            })

        # Cache results in Redis
        await redis_service.set_json(cache_key, team_leaderboard, expire=3600)
        return team_leaderboard

leaderboard_service = LeaderboardService()
