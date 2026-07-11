import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.leaderboard import leaderboard_service
from app.dependencies.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("")
async def get_leaderboard(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Returns the individual student leaderboard and the team leaderboard.
    """
    leaderboard = await leaderboard_service.get_individual_leaderboard(db)
    team_leaderboard = await leaderboard_service.get_team_leaderboard(db)

    return {
        "success": True,
        "leaderboard": leaderboard,
        "teamsLeaderboard": team_leaderboard
    }
